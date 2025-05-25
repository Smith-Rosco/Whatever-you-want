(function() {
    // 1. 定义唯一的ID (可以自定义这些ID，但要确保它们在目标页面中是唯一的)
    const sidebarId = 'myInjectedSidebar_1A2B3C';
    const toggleBtnId = 'myInjectedSidebarToggleBtn_1A2B3C';
    const statusTabId = 'myInjectedStatusTab_1A2B3C'; // 状态栏标签页内容区的 ID
    const memoryTabId = 'myInjectedMemoryTab_1A2B3C'; // 记忆区标签页内容区的 ID
    const styleElementId = 'myInjectedSidebarStyles_1A2B3C';
    const scriptElementId = 'myInjectedSidebarScript_1A2B3C';
    const keyframesAnimationName = 'myInjectedSidebarFadeIn_1A2B3C';

    // --- AI消息监控相关配置 (沿用监控消息脚本的定义) ---
    // 选择器中的反斜杠需要双反斜杠转义，且建议用CSS.escape或更通用的写法
    // 推荐只保留必要的类名，避免因顺序或响应式类导致选择器失效
    const AI_CHAT_AREA_SELECTOR = 'div.mx-auto.pt-24.w-full.px-1.relative';
    const AI_MESSAGE_BLOCK_SELECTOR = 'div#ai-chat-answer'; // AI消息块的选择器
    const AI_CONTENT_INSIDE_BLOCK_SELECTOR = '.markdown-body'; // AI消息块内部实际内容区域的选择器

    // --- AI内容提取标签名 (可配置) ---
    // 您可以修改这里的 'status' 和 'memory' 为您实际使用的HTML标签名
    const AI_STATUS_TAG_NAME = 'sts';
    const AI_MEMORY_TAG_NAME = 'mem';

    // --- DOMWatcherService 注册ID ---
    const AI_BLOCK_WATCHER_ID = 'sidebar_ai_message_block_watcher_1A2B3C';

    // --- 清理函数 ---
    window.removeInjectedSidebar_1A2B3C = function() {
        // 尝试注销 DOMWatcherService 监听器
        if (window.DOMWatcherService && typeof window.DOMWatcherService.unregister === 'function') {
            window.DOMWatcherService.unregister(AI_BLOCK_WATCHER_ID);
            console.log(`DOMWatcherService listener '${AI_BLOCK_WATCHER_ID}' unregistered.`);
        }

        // 尝试断开内部的 MutationObserver (如果存在于注入的脚本实例中)
        // 这个需要从注入脚本的上下文中正确调用，或者通过其他方式通知注入脚本停止
        // 对于本结构，更简单的方式是在移除script标签时，脚本的上下文会丢失，其内部observer也会停止
        // 但为了更明确，如果注入脚本暴露了停止函数，可以在这里调用

        const elementsToRemove = [
            document.getElementById(sidebarId),
            document.getElementById(toggleBtnId),
            document.getElementById(styleElementId),
            document.getElementById(scriptElementId) // 移除脚本标签会停止其执行和内部观察者
        ];
        elementsToRemove.forEach(el => {
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });

        // 清理 window.MySidebar 对象和初始化函数
        if (window.MySidebar && window.MySidebar.isInitialized === sidebarId) {
            delete window.MySidebar.init;
            delete window.MySidebar.isInitialized;
            // 可以选择性地删除整个 MySidebar 对象，如果它没有其他用途
            // delete window.MySidebar;
        }
        console.log('Injected sidebar elements removed.');
        delete window.removeInjectedSidebar_1A2B3C;
    };


    // 定义 MySidebar 对象（如果尚不存在）
    if (typeof window.MySidebar === 'undefined') {
        window.MySidebar = {};
    }

    // --- 核心初始化函数 ---
    window.MySidebar.init = function() {
        if (window.MySidebar.isInitialized === sidebarId && document.getElementById(sidebarId)) {
            console.log("侧边栏已由此实例初始化，无需重复操作。");
            return;
        }
        console.log("正在初始化侧边栏...");

        // --- 检查是否已注入旧实例，如果已注入则先移除 ---
        if (document.getElementById(sidebarId)) {
            console.log("检测到已存在的注入侧边栏，将先移除旧的...");
            window.removeInjectedSidebar_1A2B3C(); // 调用清理函数
        }


        // 2. 准备HTML字符串
        const htmlString = `
            <aside class="sidebar" id="${sidebarId}">
                <div class="sidebar-header">
                    <button class="tab-button active" data-tab="${statusTabId}">状态栏</button>
                    <button class="tab-button" data-tab="${memoryTabId}">记忆区</button>
                </div>
                <div class="sidebar-content">
                    <div id="${statusTabId}" class="tab-pane active">
                        <div class="ai-content-area placeholder-content">
                            等待 AI 状态信息...
                        </div>
                    </div>
                    <div id="${memoryTabId}" class="tab-pane">
                        <div class="ai-content-area placeholder-content">
                            等待 AI 记忆信息...
                        </div>
                    </div>
                </div>
            </aside>
            <button id="${toggleBtnId}" aria-label="打开/关闭侧边栏" aria-expanded="false">
                <span class="icon-menu">☰</span>
                <span class="icon-close" style="display: none;">✕</span>
            </button>
        `;

        // 3. 准备CSS字符串 (与原脚本基本一致，增加了 .ai-content-area 的一些基础样式)
        const cssString = `
            #${sidebarId} {
                /* ... (与原CSS大部分相同，为简洁省略，实际应包含所有原CSS) ... */
                --inj-primary-color: #007bff;
                --inj-primary-hover-color: #0056b3;
                --inj-sidebar-bg: #ffffff;
                --inj-text-color: #333;
                --inj-border-color: #dee2e6;
                --inj-shadow-color: rgba(0, 0, 0, 0.1);
                --inj-active-tab-color: var(--inj-primary-color);
                --inj-inactive-tab-color: #6c757d;
                --inj-sidebar-width: 350px; /* 稍微加宽一点以容纳可能的较长内容 */
                --inj-transition-speed: 0.35s;

                position: fixed;
                top: 0;
                right: calc(-1 * var(--inj-sidebar-width));
                width: var(--inj-sidebar-width);
                height: 100vh;
                background-color: var(--inj-sidebar-bg);
                box-shadow: -5px 0 15px var(--inj-shadow-color);
                display: flex;
                flex-direction: column;
                transition: right var(--inj-transition-speed) ease-in-out;
                z-index: 2147483646;
                font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
                color: var(--inj-text-color);
                box-sizing: border-box;
            }
            #${sidebarId} *, #${sidebarId} *::before, #${sidebarId} *::after {
                 box-sizing: inherit;
            }
            #${sidebarId}.open { right: 0; }
            #${sidebarId} .sidebar-header {
                display: flex; border-bottom: 1px solid var(--inj-border-color);
                background-color: #fdfdfd; flex-shrink: 0;
            }
            #${sidebarId} .tab-button {
                flex: 1; padding: 15px 10px; background-color: transparent;
                border: none; border-bottom: 3px solid transparent; cursor: pointer;
                font-size: 16px; font-weight: 500; color: var(--inj-inactive-tab-color);
                outline: none; transition: color var(--inj-transition-speed) ease, border-bottom-color var(--inj-transition-speed) ease;
                text-align: center; font-family: inherit;
            }
            #${sidebarId} .tab-button:hover { color: var(--inj-primary-color); }
            #${sidebarId} .tab-button.active {
                color: var(--inj-active-tab-color);
                border-bottom-color: var(--inj-active-tab-color);
                font-weight: 600;
            }
            #${sidebarId} .sidebar-content { flex-grow: 1; overflow-y: auto; padding: 20px; }
            #${sidebarId} .tab-pane { display: none; animation: ${keyframesAnimationName} var(--inj-transition-speed) ease-in-out; }
            #${sidebarId} .tab-pane.active { display: block; }
            #${sidebarId} .placeholder-content { /* 用于初始占位 */
                border: 2px dashed var(--inj-border-color); padding: 20px;
                text-align: center; color: var(--inj-inactive-tab-color);
                border-radius: 8px; min-height: 100px;
                display: flex; align-items: center; justify-content: center;
            }
            #${sidebarId} .ai-content-area { /* AI内容实际显示的区域 */
                padding: 10px;
                border-radius: 4px;
                background-color: #f9f9f9;
                min-height: 100px; /* 保证有最小高度 */
                word-wrap: break-word; /* 允许长单词换行 */
                white-space: pre-wrap; /* 保留空白符序列，但允许正常换行 */
                overflow-y: auto; /* 如果内容过多，允许滚动 */
                max-height: calc(100vh - 250px); /* 限制最大高度，避免撑爆侧边栏 */
            }
             #${sidebarId} .ai-content-area.placeholder-content { /* 当ai-content-area同时也是placeholder时 */
                background-color: transparent;
                border: 2px dashed var(--inj-border-color);
            }

            @keyframes ${keyframesAnimationName} {
                from { opacity: 0; transform: translateY(10px); }
                to { opacity: 1; transform: translateY(0); }
            }

            #${toggleBtnId} {
                /* ... (与原CSS大部分相同，为简洁省略，实际应包含所有原CSS) ... */
                position: fixed; bottom: 30px; right: 30px; width: 60px; height: 60px;
                background-color: var(--inj-primary-color); color: white; border: none;
                border-radius: 50%; font-size: 24px; cursor: pointer;
                box-shadow: 0 4px 10px var(--inj-shadow-color); display: flex;
                align-items: center; justify-content: center; z-index: 2147483647;
                transition: background-color 0.35s ease, transform 0.2s ease-out, box-shadow 0.2s ease;
                outline: none; font-family: inherit; box-sizing: border-box;
            }
            #${toggleBtnId} *, #${toggleBtnId} *::before, #${toggleBtnId} *::after {
                box-sizing: inherit;
            }
            #${toggleBtnId}:hover {
                background-color: var(--inj-primary-hover-color);
                box-shadow: 0 6px 15px rgba(0,0,0,0.15); transform: translateY(-2px);
            }
            #${toggleBtnId}:active { transform: translateY(0px) scale(0.95); box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
            #${toggleBtnId} .icon-menu, #${toggleBtnId} .icon-close { transition: transform 0.35s ease-in-out, opacity 0.35s ease-in-out; }
        `;

        // 4. 准备JavaScript字符串 (IIFE, 将被注入页面执行)
        const jsString = `
        (function() {
            const sidebar = document.getElementById('${sidebarId}');
            const toggleBtn = document.getElementById('${toggleBtnId}');
            const statusContentArea = document.getElementById('${statusTabId}').querySelector('.ai-content-area');
            const memoryContentArea = document.getElementById('${memoryTabId}').querySelector('.ai-content-area');

            // --- AI消息监控相关配置 (从外部传入或在此处硬编码，确保与外部一致) ---
            const AI_CHAT_AREA_SELECTOR_JS = '${AI_CHAT_AREA_SELECTOR}';
            const AI_MESSAGE_BLOCK_SELECTOR_JS = '${AI_MESSAGE_BLOCK_SELECTOR}';
            const AI_CONTENT_INSIDE_BLOCK_SELECTOR_JS = '${AI_CONTENT_INSIDE_BLOCK_SELECTOR}';
            const AI_STATUS_TAG_NAME_JS = '${AI_STATUS_TAG_NAME}';
            const AI_MEMORY_TAG_NAME_JS = '${AI_MEMORY_TAG_NAME}';
            const AI_BLOCK_WATCHER_ID_JS = '${AI_BLOCK_WATCHER_ID}';


            if (!sidebar || !toggleBtn || !statusContentArea || !memoryContentArea) {
                console.error('Error: Sidebar core elements (sidebar, toggle, status/memory areas) not found. HTML might not have been injected correctly.');
                return;
            }
            if (sidebar.dataset.injectedSidebarInitialized === 'true') {
                console.log('Injected sidebar script (JS part) already initialized.');
                return;
            }
            sidebar.dataset.injectedSidebarInitialized = 'true';

            const tabButtons = sidebar.querySelectorAll('.tab-button');
            const iconMenu = toggleBtn.querySelector('.icon-menu');
            const iconClose = toggleBtn.querySelector('.icon-close');

            if (!iconMenu || !iconClose) {
                console.error('Error: Icon elements (.icon-menu, .icon-close) not found within toggle button.');
                // 不return，基础功能仍可工作
            }

            // --- 侧边栏基本交互 ---
            toggleBtn.addEventListener('click', function() {
                const isOpen = sidebar.classList.toggle('open');
                toggleBtn.setAttribute('aria-expanded', isOpen.toString());
                if (iconMenu && iconClose) {
                    iconMenu.style.display = isOpen ? 'none' : 'inline';
                    iconClose.style.display = isOpen ? 'inline' : 'none';
                }
            });

            tabButtons.forEach(button => {
                button.addEventListener('click', function() {
                    sidebar.querySelectorAll('.tab-button').forEach(btn => btn.classList.remove('active'));
                    this.classList.add('active');
                    sidebar.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
                    const tabId = this.getAttribute('data-tab');
                    const targetPane = document.getElementById(tabId);
                    if (targetPane) {
                        targetPane.classList.add('active');
                    }
                });
            });

            // --- AI消息处理逻辑 ---
            let currentObservingAiContentElement = null;
            let aiContentStreamObserver = null; // 用于观察特定AI消息内部的流式内容变化

            function updateSidebarPanes(htmlContent) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlContent; // 解析包含<status>和<memory>的完整HTML

                const statusElement = tempDiv.querySelector(AI_STATUS_TAG_NAME_JS);
                const memoryElement = tempDiv.querySelector(AI_MEMORY_TAG_NAME_JS);

                if (statusElement && statusElement.innerHTML.trim()) {
                    statusContentArea.innerHTML = statusElement.innerHTML;
                    statusContentArea.classList.remove('placeholder-content');
                } else if (!htmlContent || htmlContent.trim() === '') { // 如果原始AI内容为空
                     statusContentArea.innerHTML = 'AI 状态信息为空。';
                     statusContentArea.classList.add('placeholder-content');
                } else if (!statusElement) { // 如果有AI内容但没有status标签
                     statusContentArea.innerHTML = 'AI 状态信息（未找到 ' + AI_STATUS_TAG_NAME_JS +' 标签）。';
                     statusContentArea.classList.add('placeholder-content');
                }


                if (memoryElement && memoryElement.innerHTML.trim()) {
                    memoryContentArea.innerHTML = memoryElement.innerHTML;
                    memoryContentArea.classList.remove('placeholder-content');
                } else if (!htmlContent || htmlContent.trim() === '') {
                     memoryContentArea.innerHTML = 'AI 记忆信息为空。';
                     memoryContentArea.classList.add('placeholder-content');
                } else if (!memoryElement) {
                     memoryContentArea.innerHTML = 'AI 记忆信息（未找到 ' + AI_MEMORY_TAG_NAME_JS +' 标签）。';
                     memoryContentArea.classList.add('placeholder-content');
                }
                
                // 自动滚动到底部
                statusContentArea.scrollTop = statusContentArea.scrollHeight;
                memoryContentArea.scrollTop = memoryContentArea.scrollHeight;
            }

            function observeSpecificAIContent(aiContentElement) {
                if (aiContentStreamObserver) {
                    aiContentStreamObserver.disconnect();
                }
                currentObservingAiContentElement = aiContentElement;

                aiContentStreamObserver = new MutationObserver(() => {
                    if (currentObservingAiContentElement) {
                        updateSidebarPanes(currentObservingAiContentElement.innerHTML);
                    }
                });

                aiContentStreamObserver.observe(aiContentElement, {
                    childList: true,
                    subtree: true,
                    characterData: true
                });
                // 初始更新一次
                updateSidebarPanes(aiContentElement.innerHTML);
            }

            function processLatestAIMessage() {
                // console.log('Sidebar: processLatestAIMessage triggered');
                const chatAreaNode = document.querySelector(AI_CHAT_AREA_SELECTOR_JS);
                const allAiMessageBlocks = document.querySelectorAll(AI_MESSAGE_BLOCK_SELECTOR_JS);
                let latestAiMessageBlock = null;

                if (allAiMessageBlocks.length === 0) {
                    if (currentObservingAiContentElement) { // 如果之前有内容但现在没了
                        updateSidebarPanes('AI 消息消失或已清除。'); // 清空或提示
                        if (aiContentStreamObserver) aiContentStreamObserver.disconnect();
                        currentObservingAiContentElement = null;
                    } else {
                         // 保持占位符内容 "等待 AI 信息..."
                    }
                    return;
                }
                
                // 优先从 CHAT_AREA_SELECTOR 内部查找最新的AI消息
                if (chatAreaNode) {
                    const blocksInChatArea = Array.from(allAiMessageBlocks).filter(block => chatAreaNode.contains(block));
                    if (blocksInChatArea.length > 0) {
                        latestAiMessageBlock = blocksInChatArea[blocksInChatArea.length - 1];
                    }
                }
                
                // 如果聊天区没找到，或者没有聊天区选择器，则用全局最后一个 (作为备选)
                if (!latestAiMessageBlock) {
                    latestAiMessageBlock = allAiMessageBlocks[allAiMessageBlocks.length - 1];
                }

                if (latestAiMessageBlock) {
                    const aiContentElement = latestAiMessageBlock.querySelector(AI_CONTENT_INSIDE_BLOCK_SELECTOR_JS);
                    if (aiContentElement) {
                        if (aiContentElement !== currentObservingAiContentElement) {
                            // console.log('Sidebar: New AI content element found, starting observation.', aiContentElement);
                            observeSpecificAIContent(aiContentElement);
                        } else {
                            // 内容可能被整个替换，即使是同一个元素，也强制刷新一次
                            updateSidebarPanes(aiContentElement.innerHTML);
                        }
                    } else {
                        if (currentObservingAiContentElement) {
                            updateSidebarPanes('AI 消息中未找到内容区域 ('+ AI_CONTENT_INSIDE_BLOCK_SELECTOR_JS +')。');
                            if (aiContentStreamObserver) aiContentStreamObserver.disconnect();
                            currentObservingAiContentElement = null;
                        }
                    }
                } else {
                    // 此情况理论上被 allAiMessageBlocks.length === 0 覆盖
                     updateSidebarPanes('未能定位到AI消息块 ('+ AI_MESSAGE_BLOCK_SELECTOR_JS +')。');
                }
            }

            // --- 初始化与 DOMWatcherService 的集成 ---
            function initializeAIWatcher() {
                if (window.DOMWatcherService && typeof window.DOMWatcherService.register === 'function') {
                    console.log('Sidebar: DOMWatcherService found. Registering AI message block listener.');
                    
                    window.DOMWatcherService.register({
                        id: AI_BLOCK_WATCHER_ID_JS,
                        selector: AI_MESSAGE_BLOCK_SELECTOR_JS,
                        eventTypes: ['added', 'removed'], // 监听添加和移除
                        callback: function(element, eventType) {
                            // console.log(\`Sidebar: DOMWatcherService reported '\${eventType}' for \${AI_MESSAGE_BLOCK_SELECTOR_JS}\`);
                            // 当AI消息块添加或移除时，都重新评估最新的AI消息
                            // processLatestAIMessage 会找到当前所有消息块中的最后一个
                            processLatestAIMessage(); 
                        }
                    });
                    
                    // DOMWatcherService注册时会检查现有元素，所以通常会自动处理初始AI消息
                    // 但为了确保，可以延迟调用一次，以防DOMWatcherService内部异步导致未立即处理
                    setTimeout(processLatestAIMessage, 200); 

                } else {
                    console.warn('Sidebar: DOMWatcherService not found or not ready. AI message watching will be delayed. Retrying...');
                    statusContentArea.innerHTML = '<span style="color:orange;">AI监控服务加载中...</span>';
                    memoryContentArea.innerHTML = '<span style="color:orange;">AI监控服务加载中...</span>';
                    setTimeout(initializeAIWatcher, 1000); // 1秒后重试
                }
            }

            // 启动AI监控
            initializeAIWatcher();

            console.log('Injected sidebar script (JS part) initialized successfully with AI watcher setup.');

            // 清理函数，当脚本本身被移除时，尝试清理内部资源
            // 注意：这个清理主要用于aiContentStreamObserver，DOMWatcherService的监听器应由外部的removeInjectedSidebar_1A2B3C处理
            window.addEventListener('beforeunload', () => {
                if (aiContentStreamObserver) {
                    aiContentStreamObserver.disconnect();
                    aiContentStreamObserver = null;
                }
            });


        })(); // End of injected IIFE
        `;

        // 5. 执行注入
        // Inject CSS
        const styleTag = document.createElement('style');
        styleTag.id = styleElementId;
        styleTag.textContent = cssString;
        document.head.appendChild(styleTag);

        // Inject HTML
        const tempWrapper = document.createElement('div');
        tempWrapper.innerHTML = htmlString;
        while (tempWrapper.firstChild) {
            document.body.appendChild(tempWrapper.firstChild);
        }

        // Inject and run JS
        const scriptTag = document.createElement('script');
        scriptTag.id = scriptElementId;
        scriptTag.textContent = jsString; // 将jsString作为文本内容
        document.body.appendChild(scriptTag);

        window.MySidebar.isInitialized = sidebarId; // 标记此实例已初始化
        console.log('Sidebar injection process completed. Look for the button in the bottom-right corner.');
        console.log("侧边栏已准备注入。如果需要移除，请在控制台执行: removeInjectedSidebar_1A2B3C()");
    }; // End of window.MySidebar.init

    // 可选：自动初始化 (如果需要，取消注释下一行)
    // if (document.readyState === 'complete' || document.readyState === 'interactive') {
    //     window.MySidebar.init();
    // } else {
    //     document.addEventListener('DOMContentLoaded', window.MySidebar.init);
    // }
    console.log("侧边栏脚本已加载。请调用 window.MySidebar.init() 来注入和启动侧边栏。");
    console.log("若要移除，请调用 window.removeInjectedSidebar_1A2B3C()");


})();
window.MySidebar.init(); // 直接调用初始化函数，注入侧边栏