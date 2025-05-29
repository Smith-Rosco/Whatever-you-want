(function() {
    // 防止重复加载
    if (window.DOMWatcherService) {
        console.warn('DOMWatcherService 已存在，不会重复加载。');
        return;
    }

    const registrations = []; // 存储注册信息
    let observer = null;
    let observerOptions = { // 基础观察选项
        childList: true,
        subtree: true
    };
    let isObserving = false;
    const domReadyPromise = new Promise(resolve => {
        if (document.readyState === 'loading' || document.readyState === 'interactive') {
            document.addEventListener('DOMContentLoaded', resolve, { once: true });
        } else {
            resolve(); // DOM is already fully loaded
        }
    });

    function generateId() {
        return 'dom_reg_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }

    // 检查是否需要更新观察者配置 (例如，首次需要观察属性时)
    function checkAndUpdateObserverConfig(needsAttributes) {
        let configChanged = false;
        if (needsAttributes && !observerOptions.attributes) {
            observerOptions.attributes = true;
            observerOptions.attributeOldValue = true; // 获取旧属性值
            // observerOptions.attributeFilter = ...; // 可以考虑支持全局 filter，但通常每个注册自己判断更灵活
            configChanged = true;
        }
        // 如果未来有其他需要动态调整的配置，可在此处添加

        if (configChanged && observer && isObserving) {
            console.log('DOMWatcherService: 观察者配置已更改，将重新启动观察。', observerOptions);
            observer.disconnect();
            observer.observe(document.documentElement || document.body, observerOptions);
        } else if (configChanged && !observer) {
            // 配置已更改，但观察者尚未初始化，将在 initializeObserver 中使用新配置
        }
    }

    // 当DOM变化时，检查匹配的注册
    function handleMutations(mutationsList) {
        if (!isObserving) return; // 如果服务已停止，则不处理

        for (const mutation of mutationsList) {
            if (mutation.type === 'childList') {
                mutation.addedNodes.forEach(node => processNode(node, 'added'));
                mutation.removedNodes.forEach(node => processNode(node, 'removed'));
            } else if (mutation.type === 'attributes') {
                processNode(mutation.target, 'attributes', {
                    attributeName: mutation.attributeName,
                    oldValue: mutation.oldValue
                });
            }
        }
    }

    // 处理单个节点或属性变化，看是否匹配任何注册
    function processNode(node, eventType, details = null) {
        if (node.nodeType !== Node.ELEMENT_NODE) return;

        for (let i = registrations.length - 1; i >= 0; i--) { // 反向遍历以便安全删除
            const reg = registrations[i];
            if (!reg.eventTypes.includes(eventType)) continue;

            // 检查属性相关的注册
            if (eventType === 'attributes') {
                if (!reg.observeAttributes) continue; // 此注册不关心属性
                if (reg.attributeFilter && !reg.attributeFilter.includes(details.attributeName)) {
                    continue; // 属性名不匹配过滤器
                }
            }

            let matchedElements = [];

            if (eventType === 'removed') { // 对于移除，只检查节点本身
                if (node.matches(reg.selector)) {
                    matchedElements.push(node);
                }
            } else { // 对于 'added' 和 'attributes'
                // 1. 检查节点本身
                if (node.matches(reg.selector)) {
                    matchedElements.push(node);
                }
                // 2. 如果是 'added' 事件，并且节点是容器，检查其子孙节点
                if (eventType === 'added' && typeof node.querySelectorAll === 'function') {
                    try {
                        const children = node.querySelectorAll(reg.selector);
                        children.forEach(child => {
                            if (!matchedElements.includes(child)) {
                                matchedElements.push(child);
                            }
                        });
                    } catch (e) {
                        // console.warn(`DOMWatcherService: querySelectorAll 错误 (selector: "${reg.selector}").`, e);
                    }
                }
            }
            
            matchedElements.forEach(element => {
                try {
                    reg.callback(element, eventType, details);
                } catch (e) {
                    console.error(`DOMWatcherService: 回调执行错误 (ID: ${reg.id}, Selector: ${reg.selector}).`, e);
                }
                if (reg.once) {
                    unregister(reg.id); // 如果是一次性注册，执行后移除
                }
            });
        }
    }
    
    // 检查当前DOM中已存在的匹配项 (用于新注册或服务初始化时)
    async function checkExistingDOM(registration) {
        await domReadyPromise;
        if (!registration.eventTypes.includes('added')) return;

        try {
            document.querySelectorAll(registration.selector).forEach(element => {
                // 再次确认注册仍然存在 (可能在异步等待期间被注销了)
                if (!registrations.find(r => r.id === registration.id)) return;

                try {
                    registration.callback(element, 'added', null);
                } catch (e) {
                    console.error(`DOMWatcherService: 初始检查回调错误 (ID: ${registration.id}, Selector: ${registration.selector}).`, e);
                }
                if (registration.once) {
                    unregister(registration.id);
                }
            });
        } catch (e) {
            console.error(`DOMWatcherService: 初始 querySelectorAll 错误 (Selector: "${registration.selector}").`, e);
        }
    }

    // 初始化 MutationObserver
    async function initializeObserver() {
        if (observer && isObserving) return; // 已经初始化并正在观察
        await domReadyPromise;

        if (!observer) {
            observer = new MutationObserver(handleMutations);
        }
        observer.observe(document.documentElement || document.body, observerOptions);
        isObserving = true;
        console.log('DOMWatcherService: 观察者已启动。配置:', observerOptions);

        // 为所有已注册项（尤其是那些在 observer 启动前注册的）检查一次当前DOM
        registrations.forEach(reg => {
            // 确保只为新注册的或尚未处理初始检查的条目进行检查
            // 这里简单起见，再次检查所有，checkExistingDOM 内部会处理 once 逻辑
             checkExistingDOM(reg);
        });
    }

    function unregister(id) {
        const index = registrations.findIndex(reg => reg.id === id);
        if (index > -1) {
            registrations.splice(index, 1);
            // console.log(`DOMWatcherService: 已注销 ID: ${id}`);

            // 检查是否还需要观察属性
            if (observerOptions.attributes) {
                const stillNeedsAttributes = registrations.some(r => r.observeAttributes && r.eventTypes.includes('attributes'));
                if (!stillNeedsAttributes) {
                    observerOptions.attributes = false;
                    delete observerOptions.attributeOldValue;
                    // delete observerOptions.attributeFilter; // 如果曾设置全局filter
                    if (observer && isObserving) {
                        console.log('DOMWatcherService: 不再需要观察属性，更新观察者配置。');
                        observer.disconnect();
                        observer.observe(document.documentElement || document.body, observerOptions);
                    }
                }
            }
            return true;
        }
        return false;
    }

    // 公开API
    window.DOMWatcherService = {
        register: function(options) {
            if (!options || !options.selector || typeof options.callback !== 'function') {
                console.error('DOMWatcherService.register: 必须提供 selector (string) 和 callback (function)。');
                return null;
            }

            const registration = {
                id: options.id || generateId(),
                selector: options.selector,
                callback: options.callback,
                eventTypes: Array.isArray(options.eventTypes) && options.eventTypes.length > 0 ? options.eventTypes : ['added'],
                once: !!options.once,
                observeAttributes: !!options.observeAttributes,
                attributeFilter: Array.isArray(options.attributeFilter) ? options.attributeFilter : null
            };

            if (registrations.find(r => r.id === registration.id)) {
                console.warn(`DOMWatcherService: ID为 '${registration.id}' 的注册已存在。将被替换。`);
                this.unregister(registration.id);
            }
            registrations.push(registration);

            // 如果注册需要观察属性，确保观察者配置支持
            if (registration.observeAttributes && registration.eventTypes.includes('attributes')) {
                checkAndUpdateObserverConfig(true);
            }
            
            // 如果观察者还未启动，则启动它
            if (!isObserving) {
                initializeObserver(); // initializeObserver 内部会等待 DOM Ready
            } else {
                // 如果观察者已运行，新注册项也需要检查当前 DOM
                 checkExistingDOM(registration);
            }
            
            return registration.id;
        },

        unregister: unregister,

        stop: function() {
            if (observer && isObserving) {
                observer.disconnect();
                isObserving = false;
                console.log('DOMWatcherService: 观察者已停止。');
            }
        },

        start: function() {
            if (observer && !isObserving) {
                observer.observe(document.documentElement || document.body, observerOptions);
                isObserving = true;
                console.log('DOMWatcherService: 观察者已重新启动。');
            } else if (!observer) {
                initializeObserver(); // 如果从未初始化过
            }
        },

        // 调试用
        _getServiceStatus: function() {
            return {
                isObserving: isObserving,
                observerOptions: JSON.parse(JSON.stringify(observerOptions)), // 返回副本
                registrationsCount: registrations.length,
                // registrations: JSON.parse(JSON.stringify(registrations.map(r => ({id: r.id, selector: r.selector, eventTypes: r.eventTypes})))) // 避免暴露回调
            };
        }
    };

    // 默认情况下，服务在加载后不会立即启动观察者，
    // 而是在第一个注册请求到来时启动。
    // 如果希望服务一加载就立即开始观察（即使没有注册项），可以取消下面这行的注释：
    // initializeObserver(); 

    console.log('DOMWatcherService.js 已加载。通过 DOMWatcherService.register() 进行注册。');
})();