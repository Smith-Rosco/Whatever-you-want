(function injectDeepSeekSidebar() {
    // --- 配置 ---
    const rootContainerId = 'injected-sidebar-root-container';
    const stylesId = 'injected-sidebar-styles';
    const dynamicContentContainerId = 'sidebar-dynamic-content';

    // --- 1. 检查是否已注入，避免重复操作 ---
    if (document.getElementById(rootContainerId) || document.getElementById(stylesId)) {
        console.warn('DeepSeek Sidebar or its styles appear to be already injected. Aborting.');
        return;
    }

    // --- 2. 定义HTML结构 (热区 和 侧边栏) ---
    const sidebarHtml = `
        <!-- 热区 -->
        <div class="hot-zone">
            <div class="trigger-btn" id="triggerBtn">
                <i class="fas fa-info-circle"></i> <!-- 确保 Font Awesome 加载 -->
            </div>
        </div>

        <!-- 侧边栏 -->
        <div class="custom-sidebar" id="customSidebar">
            <!-- 静态头部/控制区 -->
            <div class="sidebar-header">
                <span class="sidebar-title">AI 助手</span>
                <div>
                    <button id="pinBtn" class="sidebar-control-btn" title="固定侧边栏">
                        <i class="fas fa-thumbtack"></i>
                    </button>
                    <button id="closeBtn" class="sidebar-control-btn" title="关闭侧边栏">
                        <i class="fas fa-times"></i>
                    </button>
                </div>
            </div>

            <!-- 动态内容区 -->
            <div id="${dynamicContentContainerId}">
                <!-- renderSidebar 将填充这里 -->
                <p style="padding: 15px; text-align: center; color: #888;">等待AI内容...</p>
            </div>
        </div>
    `;

    // --- 3. 定义CSS规则 ---
    // 注意：用户要求省略具体样式，但实际应用中需要提供完整的CSS
    // 以下为结构性样式和确保基本功能的最小CSS，实际项目需要更完善的样式表
    const sidebarCss = `
        /* 热区样式 */
        .hot-zone {
            position: fixed;
            top: 0;
            right: 0;
            width: 50px;
            height: 80%;
            z-index: 1000;
        }

        /* 触发按钮样式 */
        .trigger-btn {
            position: fixed;
            top: 50%;
            right: -60px;
            transform: translateY(-50%);
            width: 50px;
            height: 50px;
            border-radius: 50%;
            background: #4a6fcb;
            color: white;
            display: flex;
            justify-content: center;
            align-items: center;
            cursor: pointer;
            z-index: 1001;
            box-shadow: 0 4px 15px rgba(0, 0, 0, 0.2);
            transition: all 0.3s ease;
            font-size: 1.2rem;
        }

        .hot-zone:hover .trigger-btn {
            right: 10px;
            opacity: 1;
        }

        /* 侧边栏样式 */
        .custom-sidebar {
            position: fixed;
            top: 20px;
            right: -380px;
            width: 350px;
            height: calc(100vh - 40px);
            background: white;
            border-radius: 15px 0 0 15px;
            box-shadow: -5px 0 25px rgba(0, 0, 0, 0.15);
            z-index: 1002;
            transition: right 0.4s cubic-bezier(0.23, 1, 0.32, 1);
            overflow: hidden;
            display: flex;
            flex-direction: column;
            max-width: 100%;
        }

        .custom-sidebar.active {
            right: 0;
        }

        .sidebar-header {
            padding: 20px;
            display: flex;
            justify-content: space-between;
            background: #f8f9ff;
            border-bottom: 1px solid #eaeaea;
        }

        .sidebar-header div {
            display: flex;
            align-items: center;
            gap: 10px;
        }

        .sidebar-header div button {
            transition: transform 0.2s ease, background-color 0.2s ease;
            display: flex;
            align-items: center;
            justify-content: center;
            width: 36px;
            height: 36px;
            border-radius: 50%;
            color: #4a6fcb;
            background: #f0f2f7;
            cursor: pointer;
            box-shadow: 0 2px 5px rgba(0, 0, 0, 0.1);
            font-size: 1.2rem;
        }
        .sidebar-header div button:hover:not(.close-btn) {
            transform: translateY(-0.125em);
            background-color: #e3e7f2;
        }

        .sidebar-header div button:active:not(.close-btn) {
            transform: translateY(0.125em);
        }

        #pinBtn.active {
            background-color: #97b2ff;
            color: #3762ce;
        }

        .close-btn:hover {
            transform: rotate(90deg);
        }

        .tabs {
            display: flex;
            background: #f8f9ff;
            border-bottom: 1px solid #eaeaea;
        }

        .tab-btn {
            flex: 1;
            padding: 15px 0;
            text-align: center;
            font-weight: 600;
            color: #6c757d;
            cursor: pointer;
            transition: color 0.2s ease, background 0.2s ease;
            display: flex;
            justify-content: center;
            align-items: center;
            gap: 8px;
            position: relative;
        }

        .tab-btn::after {
            position: absolute;
            content: '';
            width: 100%;
            height: 3px;
            bottom: 0;
            background: transparent;
            /* bottom: -3px; */
            /* left: 0; */
            /* transform: scaleX(0); */
            /* transform-origin: center; */
            transition: background 0.3s ease, transform 0.3s ease;
            /* pointer-events: none; */
        }

        .tab-btn.active::after {
            background: #4a6fcb;
            transform: scaleX(1);
        }

        .tab-btn.active {
            color: #4a6fcb;
            background: rgba(74, 111, 203, 0.05);
        }

        .tab-btn:hover:not(.active) {
            background: rgba(74, 111, 203, 0.03);
        }

        .tab-content {
            flex: 1;
            overflow-y: auto;
            padding: 20px;
        }

        .tab-pane {
            display: none;
        }

        .tab-pane.active {
            display: block;
        }

        /* Accordion样式 */
        .accordion {
            margin-bottom: 20px;
            border-radius: 10px;
            overflow: hidden;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.05);
        }

        .accordion:last-child {
            margin-bottom: 0;
        }

        .accordion-header {
            padding: 16px 20px;
            background: #f8f9ff;
            display: flex;
            justify-content: space-between;
            align-items: center;
            cursor: pointer;
            transition: background 0.2s ease;
        }

        .accordion-header:hover {
            background: #eef1f9;
        }

        .accordion-title {
            display: flex;
            align-items: center;
            gap: 10px;
            font-weight: 600;
            color: #343a40;
        }

        .accordion-icon {
            width: 24px;
            height: 24px;
            display: flex;
            justify-content: center;
            align-items: center;
            color: #4a6fcb;
        }

        .accordion-arrow {
            transition: transform 0.3s ease;
        }

        .accordion.active .accordion-arrow {
            transform: rotate(180deg);
        }

        .accordion-content {
            max-height: 0;
            overflow: hidden;
            background: white;
            transition: max-height 0.4s ease;
        }

        .accordion.active .accordion-content {
            max-height: 1000px;
        }

        .accordion-body {
            padding: 20px;
            border-top: 1px solid #f0f0f0;
        }

        .accordion-body h4 {
            margin: 15px 0 10px;
            color: #4a6fcb;
            font-size: 1rem;
        }

        .accordion-body ul, .accordion-body ol {
            padding-left: 20px;
            margin-bottom: 15px;
        }

        .accordion-body li {
            margin-bottom: 8px;
            line-height: 1.5;
        }

        .accordion-body strong {
            color: #495057;
        }

        .accordion-body p {
            margin-bottom: 15px;
            line-height: 1.5;
        }

        /* 自定义滚动条 */
        .accordion-content::-webkit-scrollbar {
            width: 6px;
        }

        .accordion-content::-webkit-scrollbar-track {
            background: #f8f9ff;
        }

        .accordion-content::-webkit-scrollbar-thumb {
            background: #c5cee8;
            border-radius: 3px;
        }

        .accordion-content::-webkit-scrollbar-thumb:hover {
            background: #a4b3d9;
        }
    `;

    // --- 4. 创建根容器并注入HTML ---
    const rootDiv = document.createElement('div');
    rootDiv.id = rootContainerId;
    rootDiv.innerHTML = sidebarHtml;
    document.body.appendChild(rootDiv);

    // --- 5. 注入CSS ---
    const styleEl = document.createElement('style');
    styleEl.id = stylesId;
    styleEl.textContent = sidebarCss;
    document.head.appendChild(styleEl);

    // --- 6. 定义并初始化全局侧边栏交互 ---
    function initializeGlobalSidebarInteractions() {
        const triggerBtn = document.getElementById('triggerBtn');
        const customSidebar = document.getElementById('customSidebar');
        const closeBtn = document.getElementById('closeBtn');
        const pinBtn = document.getElementById('pinBtn');
        const dynamicContentDiv = document.getElementById(dynamicContentContainerId);

        let isPinned = false;

        // 健壮性检查：确保关键元素存在
        if (!triggerBtn || !customSidebar || !closeBtn || !pinBtn || !dynamicContentDiv) {
            console.error('Essential sidebar elements (trigger, sidebar, close, pin, dynamic content area) not found. Interactions may not work.');
            return;
        }

        // 侧边栏显示/隐藏 (触发按钮)
        triggerBtn.addEventListener('click', function (event) {
            event.stopPropagation();
            customSidebar.classList.toggle('active');
        });

        // 关闭侧边栏 (关闭按钮)
        closeBtn.addEventListener('click', function () {
            customSidebar.classList.remove('active');
            // 如果关闭时是固定的，不取消固定状态，因为用户可能只是想临时隐藏。
            // 如果希望关闭时取消固定，则取消下方注释
            if (isPinned) {
                isPinned = false;
                pinBtn.classList.remove('active');
                customSidebar.classList.remove('pinned');
            }
        });

        // 固定/取消固定侧边栏 (图钉按钮)
        pinBtn.addEventListener('click', function () {
            isPinned = !isPinned;
            pinBtn.classList.toggle('active', isPinned);
        });

        // 点击外部区域关闭侧边栏 (仅当未固定时)
        document.addEventListener('click', function (event) {
            if (!customSidebar.classList.contains('active') || isPinned) {
                return; // 如果侧边栏未激活或已固定，则不执行任何操作
            }
            const isClickInsideSidebar = customSidebar.contains(event.target);
            const isClickOnTrigger = triggerBtn.contains(event.target);

            if (!isClickInsideSidebar && !isClickOnTrigger) {
                customSidebar.classList.remove('active');
            }
        });

        // --- 事件委托：处理动态内容交互 ---

        // 标签页切换
        dynamicContentDiv.addEventListener('click', function (event) {
            const tabBtn = event.target.closest(`#${dynamicContentContainerId} .tab-btn`);
            if (!tabBtn) return;

            const tabsContainer = tabBtn.closest('.tabs');
            if (!tabsContainer) return;

            tabsContainer.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));
            tabBtn.classList.add('active');

            const tabName = tabBtn.dataset.tab;
            const tabContentContainer = dynamicContentDiv.querySelector('.tab-content');
            if (!tabContentContainer) return;

            tabContentContainer.querySelectorAll('.tab-pane').forEach(pane => pane.classList.remove('active'));
            const targetTabPane = tabContentContainer.querySelector(`#${tabName}Tab`);
            if (targetTabPane) {
                targetTabPane.classList.add('active');
            }
        });

        // 可折叠面板 (手风琴)
        dynamicContentDiv.addEventListener('click', function (event) {
            const accordionHeader = event.target.closest(`#${dynamicContentContainerId} .accordion-header`);
            if (!accordionHeader) return;

            const accordion = accordionHeader.parentElement;
            if (!accordion || !accordion.classList.contains('accordion')) return;

            accordion.classList.toggle('active');

            // 可选: 关闭同级其他手风琴 (如果需要此行为，请取消注释)
            /*
            if (accordion.classList.contains('active')) {
                const parentContainer = accordion.parentElement; // 通常是 .tab-pane
                if (parentContainer) {
                    parentContainer.querySelectorAll('.accordion.active').forEach(activeAccordion => {
                        if (activeAccordion !== accordion) {
                            activeAccordion.classList.remove('active');
                        }
                    });
                }
            }
            */
        });
        console.log('[Sidebar] Global interactions initialized.');
    }

    // 确保在DOM更新后执行交互脚本
    setTimeout(initializeGlobalSidebarInteractions, 0);


    // --- START OF renderSidebar.js CONTENT (函数定义) ---
    /**
     * 解析源 HTML 字符串，并根据其内容动态生成新的侧边栏 HTML 结构，
     * 然后用新结构替换指定目标 DOM 元素的 innerHTML。
     * 新结构包含标签页和可折叠的手风琴面板。
     *
     * @param {string} sourceHTMLString 包含旧版 HTML 结构的字符串。
     * @param {string} targetElementSelector 目标 DOM 元素的选择器 (例如 '#sidebar-dynamic-content')。
     */
    function renderSidebar(sourceHTMLString, targetElementSelector) {
        const parser = new DOMParser();
        const sourceDoc = parser.parseFromString(sourceHTMLString, "text/html");

        const newSidebarContentContainer = document.createElement('div'); // 临时容器

        // 1. 创建标签页按钮区
        const tabsDiv = document.createElement('div');
        tabsDiv.className = 'tabs';
        const statusTabBtn = document.createElement('div');
        statusTabBtn.className = 'tab-btn active'; // 状态标签默认激活
        statusTabBtn.dataset.tab = 'status';
        statusTabBtn.innerHTML = '<i class="fas fa-user"></i><span>状态</span>';
        tabsDiv.appendChild(statusTabBtn);
        const memoryTabBtn = document.createElement('div');
        memoryTabBtn.className = 'tab-btn';
        memoryTabBtn.dataset.tab = 'memory';
        memoryTabBtn.innerHTML = '<i class="fas fa-brain"></i><span>记忆</span>';
        tabsDiv.appendChild(memoryTabBtn);
        newSidebarContentContainer.appendChild(tabsDiv);

        // 2. 创建标签页内容区
        const tabContentDiv = document.createElement('div');
        tabContentDiv.className = 'tab-content';
        let isFirstAccordionOverall = true; // 用于默认展开第一个手风琴

        const createAccordionPanel = (titleText, contentHTML, iconClass, makeActive) => {
            const accordionDiv = document.createElement('div');
            accordionDiv.className = 'accordion';
            if (makeActive) accordionDiv.classList.add('active');

            const header = document.createElement('div');
            header.className = 'accordion-header';

            const accordionTitleDiv = document.createElement('div');
            accordionTitleDiv.className = 'accordion-title';
            const iconElementDiv = document.createElement('div');
            iconElementDiv.className = 'accordion-icon';
            iconElementDiv.innerHTML = `<i class="${iconClass}"></i>`;
            accordionTitleDiv.appendChild(iconElementDiv);
            const titleSpan = document.createElement('span');
            titleSpan.textContent = titleText;
            accordionTitleDiv.appendChild(titleSpan);
            header.appendChild(accordionTitleDiv);

            const arrowDiv = document.createElement('div');
            arrowDiv.className = 'accordion-arrow';
            arrowDiv.innerHTML = '<i class="fas fa-chevron-down"></i>';
            header.appendChild(arrowDiv);

            accordionDiv.appendChild(header);

            const accordionContentWrapperDiv = document.createElement('div');
            accordionContentWrapperDiv.className = 'accordion-content';
            const bodyDiv = document.createElement('div');
            bodyDiv.className = 'accordion-body';
            bodyDiv.innerHTML = contentHTML;
            accordionContentWrapperDiv.appendChild(bodyDiv);
            accordionDiv.appendChild(accordionContentWrapperDiv);

            return accordionDiv;
        };

        // 3. 处理 "状态" 标签页内容
        const statusTabPane = document.createElement('div');
        statusTabPane.className = 'tab-pane active'; // 状态标签内容区默认激活
        statusTabPane.id = 'statusTab';
        const stsElement = sourceDoc.querySelector('sts');
        if (stsElement) {
            stsElement.querySelectorAll('sti').forEach(sti => {
                const h1 = sti.querySelector('h1');
                const titleText = h1 ? h1.textContent.trim() : '无标题';
                const stiContentSourceDiv = sti.querySelector('div');
                const contentHTML = stiContentSourceDiv ? stiContentSourceDiv.innerHTML : '';

                let currentPanelShouldBeActive = false;
                if (isFirstAccordionOverall) {
                    currentPanelShouldBeActive = true;
                    isFirstAccordionOverall = false;
                }
                statusTabPane.appendChild(createAccordionPanel(titleText, contentHTML, 'fas fa-info-circle', currentPanelShouldBeActive));
            });
        } else {
            statusTabPane.innerHTML = '<p>没有状态信息。</p>';
        }
        tabContentDiv.appendChild(statusTabPane);

        // 4. 处理 "记忆" 标签页内容
        const memoryTabPane = document.createElement('div');
        memoryTabPane.className = 'tab-pane';
        memoryTabPane.id = 'memoryTab';
        const memElement = sourceDoc.querySelector('mem');
        if (memElement) {
            const memContentSourceDiv = memElement.querySelector('div');
            let memoryContentAdded = false;
            if (memContentSourceDiv) {
                const shortTermH2 = Array.from(memContentSourceDiv.querySelectorAll('h2')).find(h => h.textContent.trim() === '短期记忆');
                if (shortTermH2) {
                    const shortTermOl = shortTermH2.nextElementSibling;
                    if (shortTermOl && shortTermOl.tagName === 'OL') {
                        let currentPanelShouldBeActive = false;
                        if (isFirstAccordionOverall) { // 仅当状态标签没有内容时，这里的第一个才展开
                            currentPanelShouldBeActive = true;
                            isFirstAccordionOverall = false;
                        }
                        memoryTabPane.appendChild(createAccordionPanel('短期记忆', shortTermOl.innerHTML, 'fas fa-history', currentPanelShouldBeActive));
                        memoryContentAdded = true;
                    }
                }
                const longTermH2 = Array.from(memContentSourceDiv.querySelectorAll('h2')).find(h => h.textContent.trim() === '长期记忆');
                if (longTermH2) {
                    const longTermContentElement = longTermH2.nextElementSibling;
                    if (longTermContentElement) {
                        let currentPanelShouldBeActive = false;
                        if (isFirstAccordionOverall) {
                            currentPanelShouldBeActive = true;
                            isFirstAccordionOverall = false;
                        }
                        memoryTabPane.appendChild(createAccordionPanel('长期记忆', longTermContentElement.innerHTML, 'fas fa-archive', currentPanelShouldBeActive)); // 使用不同图标
                        memoryContentAdded = true;
                    }
                }
            }
            if (!memoryContentAdded) {
                memoryTabPane.innerHTML = '<p>没有记忆信息。</p>';
            }
        } else {
            memoryTabPane.innerHTML = '<p>没有记忆信息。</p>';
        }
        tabContentDiv.appendChild(memoryTabPane);
        newSidebarContentContainer.appendChild(tabContentDiv);

        // 5. 更新目标 DOM
        const targetElement = document.querySelector(targetElementSelector);
        if (targetElement) {
            targetElement.innerHTML = ''; // 清空旧内容
            targetElement.appendChild(newSidebarContentContainer); // 添加新内容
            console.log(`[RenderSidebar] Sidebar content rendered into ${targetElementSelector}`);
        } else {
            console.error(`[RenderSidebar] Error: Target element "${targetElementSelector}" not found.`);
        }
    }
    // --- END OF renderSidebar.js CONTENT ---


    // --- START OF extractChatContent.js CONTENT ---
    const AI_MESSAGE_BLOCK_SELECTOR = 'div#ai-chat-answer'; // 假设这是AI回复的最外层块选择器 (用户未提供，沿用旧的)
    const AI_CONTENT_INSIDE_BLOCK_SELECTOR = '.markdown-body'; // 假设这是包含<sts><mem>的实际内容的选择器 (用户未提供，沿用旧的)
    // 更新AI回复完成的判断依据
    const AI_REPLY_COMPLETION_CLASSES = 'flex items-center gap-2 text-purple-500 my-3 text-xs';
    const AI_REPLY_COMPLETION_CLASS_SELECTOR = '.' + AI_REPLY_COMPLETION_CLASSES.trim().replace(/\s+/g, '.');

    // 调整TARGET_SELECTOR_FOR_DOMWATCHER，确保它是AI_MESSAGE_BLOCK_SELECTOR内部的完成标记
    const TARGET_SELECTOR_FOR_DOMWATCHER = `${AI_MESSAGE_BLOCK_SELECTOR} ${AI_REPLY_COMPLETION_CLASS_SELECTOR}`;

    const AI_STATUS_TAG_NAME = 'sts';
    const AI_MEMORY_TAG_NAME = 'mem';
    const CUSTOM_EVENT_NAME = 'aiReplyProcessed';

    function extractCustomTagContents(htmlString, tagName) {
        if (!htmlString || !tagName) return null;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString; // 解析HTML字符串
        const elements = tempDiv.getElementsByTagName(tagName);
        if (elements.length === 0) return null;
        // 返回每个标签的innerHTML，而不是textContent，以便保留内部结构（如果需要）
        // 如果只需要文本，则用 el.textContent
        // 从原始代码看，renderSidebar 需要的是 sti > div 的 innerHTML，所以这里提取整个自定义标签的 innerHTML 似乎更合适
        // 然后由 renderSidebar 进一步解析。
        // 或者，这里直接返回 element.innerHTML 使得 renderSidebar 可以拿到 <sts>...<div>...</div>...</sts> 的完整结构
        // 原始代码是 el.textContent || el.innerText，这会丢失HTML结构。
        // 为了兼容 renderSidebar 中对 sti > h1 和 sti > div 的解析，这里应该返回元素的 innerHTML。
        // 不，原始的 extractCustomTagContents 是提取 <sts> 或 <mem> 标签内的文本。
        // 而 renderSidebar 是从完整的 AI HTML（包含<sts><mem>）中解析的。
        // 所以，aiReplyCompletedCallback 中 eventData.fullHtml 是关键，statusContents 和 memoryContents 可能是辅助信息或未使用。
        // 原始代码中，statusContents, memoryContents 似乎没有被下游的 renderSidebar 使用。
        // renderSidebar 直接使用 fullHtml。
        // 为了保持行为，我将保留 el.textContent。但如果需要保留HTML，应改为 el.innerHTML。
        // 经过思考，`renderSidebar` 自己会解析 `sourceDoc.querySelector('sts')`。
        // 所以 `extractCustomTagContents` 的返回值实际上可能并不被 `renderSidebar` 直接使用。
        // 它更多的是一个验证或日志记录步骤。`eventData.fullHtml` 才是最重要的。
        return Array.from(elements).map(el => el.innerHTML); // 改为innerHTML以便保留内部结构供后续精确解析
    }

    function aiReplyCompletedCallback(completionMarkerElement, eventType) {
        console.log(`[AI Reply Watcher] Event: ${eventType}. Marker found:`, completionMarkerElement);
        // 向上查找 AI 消息块
        const aiMessageBlock = completionMarkerElement.closest(AI_MESSAGE_BLOCK_SELECTOR);
        if (!aiMessageBlock) {
            console.warn('[AI Reply Watcher] Could not find parent AI message block using selector:', AI_MESSAGE_BLOCK_SELECTOR);
            return;
        }
        // 在 AI 消息块内查找内容元素
        const contentElement = aiMessageBlock.querySelector(AI_CONTENT_INSIDE_BLOCK_SELECTOR);
        if (!contentElement) {
            console.warn('[AI Reply Watcher] Could not find AI content element inside block using selector:', AI_CONTENT_INSIDE_BLOCK_SELECTOR);
            return;
        }

        const extractedInnerHtml = contentElement.innerHTML;

        // extractCustomTagContents 现在返回 innerHTML 数组，如果需要，可以进一步处理
        const statusElementsHtml = extractCustomTagContents(extractedInnerHtml, AI_STATUS_TAG_NAME);
        const memoryElementsHtml = extractCustomTagContents(extractedInnerHtml, AI_MEMORY_TAG_NAME);

        const eventData = {
            fullHtml: extractedInnerHtml, // 这个是renderSidebar需要的
            statusElementsHtml: statusElementsHtml, // HTML 内容数组
            memoryElementsHtml: memoryElementsHtml, // HTML 内容数组
            sourceElement: contentElement,
            aiBlockElement: aiMessageBlock
        };
        try {
            document.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME, { detail: eventData, bubbles: true, composed: true }));
            console.log(`[AI Reply Watcher] Dispatched '${CUSTOM_EVENT_NAME}' event with data:`, eventData);
        } catch (e) {
            console.error(`[AI Reply Watcher] Error dispatching custom event '${CUSTOM_EVENT_NAME}':`, e);
        }
    }

    function initializeWatcher() {
        if (typeof window.DOMWatcherService === 'undefined' || !window.DOMWatcherService) {
            console.error("[AI Reply Watcher] DOMWatcherService not loaded! Retrying in 2s...");
            setTimeout(initializeWatcher, 2000);
            return;
        }
        console.log("[AI Reply Watcher] DOMWatcherService found. Registering listener for:", TARGET_SELECTOR_FOR_DOMWATCHER);
        try {
            const registrationId = window.DOMWatcherService.register({
                selector: TARGET_SELECTOR_FOR_DOMWATCHER,
                callback: aiReplyCompletedCallback,
                eventTypes: ['added'], // 监听元素被添加到DOM
                once: false // 持续监听，除非服务本身有取消注册的机制
            });
            if (registrationId) {
                console.log(`[AI Reply Watcher] Registered with DOMWatcherService (ID: ${registrationId}). Watching for AI reply completion markers.`);
            } else {
                console.error("[AI Reply Watcher] Failed to register with DOMWatcherService (registration returned falsy).");
            }
        } catch (e) {
            console.error("[AI Reply Watcher] Error during DOMWatcherService registration:", e);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeWatcher);
    } else {
        initializeWatcher();
    }
    // --- END OF extractChatContent.js CONTENT ---


    // --- START OF INTEGRATION GLUE CODE ---
    document.addEventListener(CUSTOM_EVENT_NAME, function (event) {
        console.log(`[Integration] Received '${CUSTOM_EVENT_NAME}' event.`);
        if (event.detail && typeof event.detail.fullHtml === 'string') {
            const fullHtml = event.detail.fullHtml;
            // renderSidebar 应该在 injectDeepSeekSidebar 函数作用域内可用
            if (typeof renderSidebar === 'function') {
                renderSidebar(fullHtml, `#${dynamicContentContainerId}`);
                // 动态内容的交互已通过事件委托在 initializeGlobalSidebarInteractions 中设置，
                // 无需在此处重新初始化。
                const dynamicContentElement = document.getElementById(dynamicContentContainerId);
                if (!dynamicContentElement || dynamicContentElement.innerHTML.trim() === '') {
                    console.warn('[Integration] Sidebar dynamic content might be empty or target not found after render.');
                }
            } else {
                console.error('[Integration] renderSidebar function is not defined in the current scope.');
            }
        } else {
            console.warn(`[Integration] Event '${CUSTOM_EVENT_NAME}' missing fullHtml in detail or detail is not an object.`);
        }
    });
    // --- END OF INTEGRATION GLUE CODE ---

    console.log('DeepSeek Sidebar injected and initialized successfully.');
})();
// --- 如何使用 ---
// 在浏览器控制台调用:
// injectDeepSeekSidebar();
// 或者通过书签、扩展等方式在页面加载后执行。
// 确保页面已加载 Font Awesome (如果图标需要) 和 DOMWatcherService。