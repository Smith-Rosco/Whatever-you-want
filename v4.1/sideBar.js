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
                    <button id="refreshBtn" class="sidebar-control-btn" title="手动刷新">
                        <i class="fas fa-sync-alt"></i>
                    </button>
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
    const sidebarCss = `
    /* 热区样式 */
        .hot-zone {
            position: fixed;
            top: 20%;
            right: 0;
            width: 15%;
            height: 60%;
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

    // --- 5. 注入CSS (和 Font Awesome if needed) ---
    const styleEl = document.createElement('style');
    styleEl.id = stylesId;
    styleEl.textContent = sidebarCss;
    document.head.appendChild(styleEl);

    // Example of adding Font Awesome if not already present
    if (!document.querySelector('link[href*="fontawesome"]')) {
        const faLink = document.createElement('link');
        faLink.rel = 'stylesheet';
        faLink.href = 'https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css';
        document.head.appendChild(faLink);
    }


    // --- 6. 定义并初始化全局侧边栏交互 ---
    function initializeGlobalSidebarInteractions() {
        const triggerBtn = document.getElementById('triggerBtn');
        const customSidebar = document.getElementById('customSidebar');
        const closeBtn = document.getElementById('closeBtn');
        const pinBtn = document.getElementById('pinBtn');
        const dynamicContentDiv = document.getElementById(dynamicContentContainerId);
        const refreshBtn = document.getElementById('refreshBtn'); // 获取手动刷新按钮

        let isPinned = false;

        if (!triggerBtn || !customSidebar || !closeBtn || !pinBtn || !dynamicContentDiv) {
            console.warn('Essential sidebar elements (trigger, sidebar, close, pin, dynamic content area) might be missing. Some interactions may not work.');
            // 不直接返回，因为手动刷新按钮可能仍然存在且可以独立工作
        }

        if (triggerBtn && customSidebar) {
            triggerBtn.addEventListener('click', function (event) {
                event.stopPropagation();
                customSidebar.classList.toggle('active');
            });
        } else {
            console.warn('[Sidebar] Trigger button or custom sidebar element not found. Toggle functionality will be affected.');
        }

        if (closeBtn && customSidebar) {
            closeBtn.addEventListener('click', function () {
                customSidebar.classList.remove('active');
                if (isPinned) { // If pinned, unpin on close
                    isPinned = false;
                    if (pinBtn) pinBtn.classList.remove('active');
                    // No need to remove 'pinned' class from customSidebar as it's not directly used for CSS state
                }
            });
        } else {
            console.warn('[Sidebar] Close button not found. Close functionality will be affected.');
        }

        if (pinBtn) {
            pinBtn.addEventListener('click', function () {
                isPinned = !isPinned;
                pinBtn.classList.toggle('active', isPinned);
                // No 'pinned' class on sidebar itself, logic handled by `isPinned` flag
            });
        } else {
            console.warn('[Sidebar] Pin button not found. Pin functionality will be affected.');
        }

        // --- START: 手动刷新按钮逻辑 ---
        if (refreshBtn) {
            refreshBtn.addEventListener('click', function() {
                console.log('[Sidebar] Manual refresh triggered.');

                // 1. 停止自动监测 (如果函数存在)
                if (typeof cleanupMonitoringState === 'function') {
                    cleanupMonitoringState();
                    console.log('[Sidebar] Called cleanupMonitoringState for manual refresh.');
                } else {
                    console.warn('[Sidebar] cleanupMonitoringState function not found. Automatic monitoring might not be stopped properly before manual refresh.');
                }

                // 2. 定位目标内容
                // AI_MESSAGE_BLOCK_SELECTOR 和 AI_CONTENT_INSIDE_BLOCK_SELECTOR 在 'extractChatContent.js' 部分定义
                // 确保它们在调用时是可访问的 (由于JS的闭包和执行顺序，它们应该是可访问的)
                const aiMessageBlocks = document.querySelectorAll(AI_MESSAGE_BLOCK_SELECTOR);
                let sourceHtmlForRender = null; // 将用于renderSidebar的源HTML字符串
                let foundContentForRender = false;

                if (aiMessageBlocks.length > 0) {
                    const latestAiBlock = aiMessageBlocks[aiMessageBlocks.length - 1]; // 获取最后一个AI消息块
                    const contentElement = latestAiBlock.querySelector(AI_CONTENT_INSIDE_BLOCK_SELECTOR);
                    if (contentElement) {
                        sourceHtmlForRender = contentElement.innerHTML; // 使用 .markdown-body 的 innerHTML
                        foundContentForRender = true;
                        console.log('[Sidebar] Found latest AI content for manual refresh from:', contentElement);
                    } else {
                        console.warn(`[Sidebar] Latest AI block found, but no content element ("${AI_CONTENT_INSIDE_BLOCK_SELECTOR}") within it. Block:`, latestAiBlock);
                    }
                } else {
                    console.warn(`[Sidebar] No AI message blocks ("${AI_MESSAGE_BLOCK_SELECTOR}") found on the page for manual refresh.`);
                }

                const targetDynamicContentDiv = document.getElementById(dynamicContentContainerId);
                if (!targetDynamicContentDiv) {
                    console.error(`[Sidebar] Dynamic content container (id: ${dynamicContentContainerId}) not found for manual refresh output. Cannot display content or message.`);
                    return; // 无法显示任何内容
                }

                // 3. 处理无内容可刷新的情况 (即未找到 .markdown-body)
                if (!foundContentForRender) {
                    targetDynamicContentDiv.innerHTML = '<p style="padding: 15px; text-align: center; color: #888;">未找到可刷新的AI内容。</p>';
                    console.log('[Sidebar] Displayed "no content" message in sidebar for manual refresh.');
                    return; // 不调用 renderSidebar
                }

                // 4. 提取并渲染内容 (如果函数存在)
                if (typeof renderSidebar === 'function') {
                    console.log('[Sidebar] Calling renderSidebar with manually extracted content.');
                    renderSidebar(sourceHtmlForRender, `#${dynamicContentContainerId}`);
                    // renderSidebar 内部会处理 sourceHtmlForRender 中没有 sts/mem 标签的情况
                    // 例如，显示 "没有状态信息。" 等。
                } else {
                    console.error('[Sidebar] renderSidebar function not defined. Cannot render manually extracted content.');
                    targetDynamicContentDiv.innerHTML = '<p style="padding: 15px; text-align: center; color: #cc0000;">错误：渲染功能缺失，无法显示内容。</p>';
                }
            });
            console.log('[Sidebar] Manual refresh button event listener added.');
        } else {
            console.warn('[Sidebar] Manual refresh button (id: refreshBtn) not found in the DOM. Manual refresh feature will be unavailable. Please ensure it is added to sidebarHtml.');
        }
        // 初始化时，先手动触发一次刷新
        if (typeof refreshBtn !== 'undefined') {
            refreshBtn.click();
            console.log('[Sidebar] Initial manual refresh triggered on sidebar load.');
        }
        // --- END: 手动刷新按钮逻辑 ---

        if (customSidebar) {
            document.addEventListener('click', function (event) {
                if (!customSidebar.classList.contains('active') || isPinned) {
                    return;
                }
                const isClickInsideSidebar = customSidebar.contains(event.target);
                const isClickOnTrigger = triggerBtn ? triggerBtn.contains(event.target) : false;

                if (!isClickInsideSidebar && !isClickOnTrigger) {
                    customSidebar.classList.remove('active');
                }
            });
        } else {
            // 如果 customSidebar 未找到，点击外部关闭的功能会受影响。
            // triggerBtn 的检查已在前面完成。
        }


        // Tab and Accordion interactions (delegated to dynamicContentDiv)
        if (dynamicContentDiv) {
            dynamicContentDiv.addEventListener('click', function (event) {
                // Tab switching logic
                const tabBtn = event.target.closest(`#${dynamicContentContainerId} .tab-btn`);
                if (tabBtn) {
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
                    return; // Processed tab click, exit
                }

                // Accordion toggle logic
                const accordionHeader = event.target.closest(`#${dynamicContentContainerId} .accordion-header`);
                if (accordionHeader) {
                    const accordion = accordionHeader.parentElement;
                    if (!accordion || !accordion.classList.contains('accordion')) return;
                    accordion.classList.toggle('active');
                    return; // Processed accordion click, exit
                }
            });
        } else {
             console.warn('[Sidebar] Dynamic content area not found for tab/accordion setup.');
        }
        console.log('[Sidebar] Global interactions initialized (or attempted).');
    }

    setTimeout(initializeGlobalSidebarInteractions, 0); // Ensure DOM is ready for querySelectors

    // --- START OF renderSidebar.js CONTENT (函数定义) ---
    function renderSidebar(sourceHTMLString, targetElementSelector) {
        const parser = new DOMParser();
        const sourceDoc = parser.parseFromString(sourceHTMLString, "text/html");

        const newSidebarContentContainer = document.createElement('div');

        // Create Tabs
        const tabsDiv = document.createElement('div');
        tabsDiv.className = 'tabs';
        const statusTabBtn = document.createElement('div');
        statusTabBtn.className = 'tab-btn active'; // Status tab active by default
        statusTabBtn.dataset.tab = 'status';
        statusTabBtn.innerHTML = '<i class="fas fa-user"></i><span>状态</span>';
        tabsDiv.appendChild(statusTabBtn);

        const memoryTabBtn = document.createElement('div');
        memoryTabBtn.className = 'tab-btn';
        memoryTabBtn.dataset.tab = 'memory';
        memoryTabBtn.innerHTML = '<i class="fas fa-brain"></i><span>记忆</span>';
        tabsDiv.appendChild(memoryTabBtn);
        newSidebarContentContainer.appendChild(tabsDiv);

        // Create Tab Content Panes
        const tabContentDiv = document.createElement('div');
        tabContentDiv.className = 'tab-content';
        let isFirstAccordionOverall = true; // To make the very first accordion panel active

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
            bodyDiv.innerHTML = contentHTML; // Content is directly set here
            accordionContentWrapperDiv.appendChild(bodyDiv);
            accordionDiv.appendChild(accordionContentWrapperDiv);

            return accordionDiv;
        };

        // Status Tab Pane
        const statusTabPane = document.createElement('div');
        statusTabPane.className = 'tab-pane active'; // Active by default
        statusTabPane.id = 'statusTab';
        const stsElement = sourceDoc.querySelector('sts');
        if (stsElement) {
            stsElement.querySelectorAll('sti').forEach(sti => {
                const h1 = sti.querySelector('h1');
                const titleText = h1 ? h1.textContent.trim() : '无标题';
                const stiContentSourceDiv = sti.querySelector('div'); // Assuming content is within a <div> inside <sti>
                const contentHTML = stiContentSourceDiv ? stiContentSourceDiv.innerHTML : '';

                let currentPanelShouldBeActive = false;
                if (isFirstAccordionOverall) {
                    currentPanelShouldBeActive = true;
                    isFirstAccordionOverall = false; // Only the very first accordion in any tab is active by default
                }
                statusTabPane.appendChild(createAccordionPanel(titleText, contentHTML, 'fas fa-info-circle', currentPanelShouldBeActive));
            });
        } else {
            statusTabPane.innerHTML = '<p>没有状态信息。</p>';
        }
        tabContentDiv.appendChild(statusTabPane);

        // Memory Tab Pane
        const memoryTabPane = document.createElement('div');
        memoryTabPane.className = 'tab-pane';
        memoryTabPane.id = 'memoryTab';
        const memElement = sourceDoc.querySelector('mem');
        if (memElement) {
            const memContentSourceDiv = memElement.querySelector('div'); // Assuming content is within a <div> inside <mem>
            let memoryContentAdded = false;
            if (memContentSourceDiv) {
                // Short-term memory
                const shortTermH2 = Array.from(memContentSourceDiv.querySelectorAll('h2')).find(h => h.textContent.trim() === '短期记忆');
                if (shortTermH2) {
                    const shortTermOl = shortTermH2.nextElementSibling;
                    if (shortTermOl && shortTermOl.tagName === 'OL') {
                        let currentPanelShouldBeActive = false;
                        if (isFirstAccordionOverall) { // Check if this can be the first active accordion
                            currentPanelShouldBeActive = true;
                            isFirstAccordionOverall = false;
                        }
                        memoryTabPane.appendChild(createAccordionPanel('短期记忆', shortTermOl.outerHTML, 'fas fa-history', currentPanelShouldBeActive));
                        memoryContentAdded = true;
                    }
                }
                // Long-term memory
                const longTermH2 = Array.from(memContentSourceDiv.querySelectorAll('h2')).find(h => h.textContent.trim() === '长期记忆');
                if (longTermH2) {
                    const longTermContentElement = longTermH2.nextElementSibling; // Could be <ol>, <ul>, <p>, <div> etc.
                    if (longTermContentElement) {
                        let currentPanelShouldBeActive = false;
                        if (isFirstAccordionOverall) { // Check if this can be the first active accordion
                            currentPanelShouldBeActive = true;
                            isFirstAccordionOverall = false;
                        }
                        memoryTabPane.appendChild(createAccordionPanel('长期记忆', longTermContentElement.outerHTML, 'fas fa-archive', currentPanelShouldBeActive));
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

        const targetElement = document.querySelector(targetElementSelector);
        if (targetElement) {
            targetElement.innerHTML = ''; // Clear previous content
            targetElement.appendChild(newSidebarContentContainer);
            console.log(`[RenderSidebar] Sidebar content rendered into ${targetElementSelector}`);
        } else {
            console.error(`[RenderSidebar] Error: Target element "${targetElementSelector}" not found.`);
        }
    }
    // --- END OF renderSidebar.js CONTENT ---

    // --- START OF extractChatContent.js CONTENT ---
    const AI_MESSAGE_BLOCK_SELECTOR = 'div#ai-chat-answer'; // Selector for the AI's entire message block
    const AI_CONTENT_INSIDE_BLOCK_SELECTOR = '.markdown-body'; // Selector for the content area within the AI block
    const AI_REPLY_COMPLETION_CLASSES = 'flex items-center gap-2 text-purple-500 my-3 text-xs'; // Classes of the completion marker
    const AI_REPLY_COMPLETION_CLASS_SELECTOR = '.' + AI_REPLY_COMPLETION_CLASSES.trim().replace(/\s+/g, '.');
    // DOMWatcherService will look for the completion marker *within* an AI message block
    const TARGET_SELECTOR_FOR_DOMWATCHER = `${AI_MESSAGE_BLOCK_SELECTOR} ${AI_REPLY_COMPLETION_CLASS_SELECTOR}`;

    const AI_STATUS_TAG_NAME = 'sts';
    const AI_MEMORY_TAG_NAME = 'mem';
    const CUSTOM_EVENT_NAME = 'aiReplyProcessed';

    // Configurable timeouts for content stability detection
    const INITIAL_SILENCE_TIMEOUT_MS = 5000; // 5 seconds
    const CONTENT_STABILITY_TIMEOUT_MS = 1500; // 1.5 seconds

    let debounceTimerForAiReply = null; // Debouncer for the initial DOMWatcher callback

    // State for current content monitoring session
    let currentMutationObserver = null;
    let initialSilenceTimerId = null;
    let contentStabilityTimerId = null;
    let currentMonitoredContentElement = null; // The .markdown-body element being watched
    let currentAssociatedAiBlock = null;    // The parent div#ai-chat-answer of the monitored content
    let hasContentActuallyChanged = false;   // Flag to track if any mutation occurred

    function extractCustomTagContents(htmlString, tagName) {
        if (!htmlString || !tagName) return null;
        const tempDiv = document.createElement('div');
        tempDiv.innerHTML = htmlString;
        const elements = tempDiv.getElementsByTagName(tagName);
        if (elements.length === 0) return null;
        return Array.from(elements).map(el => el.innerHTML);
    }

    function cleanupMonitoringState() {
        if (currentMutationObserver) {
            currentMutationObserver.disconnect();
            currentMutationObserver = null;
            // console.log("[AI Content Monitor] MutationObserver disconnected.");
        }
        if (initialSilenceTimerId) {
            clearTimeout(initialSilenceTimerId);
            initialSilenceTimerId = null;
            // console.log("[AI Content Monitor] Initial silence timer cleared.");
        }
        if (contentStabilityTimerId) {
            clearTimeout(contentStabilityTimerId);
            contentStabilityTimerId = null;
            // console.log("[AI Content Monitor] Content stability timer cleared.");
        }
        currentMonitoredContentElement = null;
        currentAssociatedAiBlock = null;
        hasContentActuallyChanged = false;
        // console.log("[AI Content Monitor] Monitoring state fully cleaned up.");
    }

    function onContentStable() {
        console.log(`[AI Content Monitor] Content stability timeout (${CONTENT_STABILITY_TIMEOUT_MS}ms) reached. Assuming AI reply is complete.`);
        contentStabilityTimerId = null; // Clear timer ID

        if (!currentMonitoredContentElement || !currentAssociatedAiBlock) {
            console.error("[AI Content Monitor] Error: Monitored element or AI block is null when trying to process stable content.");
            cleanupMonitoringState();
            return;
        }

        const extractedInnerHtml = currentMonitoredContentElement.innerHTML;
        const statusElementsHtml = extractCustomTagContents(extractedInnerHtml, AI_STATUS_TAG_NAME);
        const memoryElementsHtml = extractCustomTagContents(extractedInnerHtml, AI_MEMORY_TAG_NAME);

        const eventData = {
            fullHtml: extractedInnerHtml,
            statusElementsHtml: statusElementsHtml,
            memoryElementsHtml: memoryElementsHtml,
            sourceElement: currentMonitoredContentElement, // The .markdown-body element
            aiBlockElement: currentAssociatedAiBlock      // The parent div#ai-chat-answer
        };

        try {
            document.dispatchEvent(new CustomEvent(CUSTOM_EVENT_NAME, { detail: eventData, bubbles: true, composed: true }));
            console.log(`[AI Content Monitor] Dispatched '${CUSTOM_EVENT_NAME}' event with data from stable content.`, eventData);
        } catch (e) {
            console.error(`[AI Content Monitor] Error dispatching custom event '${CUSTOM_EVENT_NAME}':`, e);
        }

        cleanupMonitoringState(); // Clean up after successful processing
    }

    function onInitialSilenceTimeout() {
        initialSilenceTimerId = null; // Clear timer ID
        // This timeout means that from the moment we started watching,
        // no content change was detected within INITIAL_SILENCE_TIMEOUT_MS.
        if (!hasContentActuallyChanged) { // Double check, though handleContentMutation should prevent this path if it ran
            console.warn(`[AI Content Monitor] Initial silence timeout (${INITIAL_SILENCE_TIMEOUT_MS}ms) reached. No content activity detected in:`, currentMonitoredContentElement, ". AI might not have output anything useful this time. Aborting sidebar update for this response.");
            cleanupMonitoringState(); // Clean up, don't dispatch event.
        } else {
            // This case should ideally not happen if handleContentMutation correctly clears initialSilenceTimerId.
            // It implies that content did change, but the initial timer still fired.
            // We will rely on the contentStabilityTimer which should be active.
            console.log('[AI Content Monitor] Initial silence timer fired, but content HAD changed. This is unexpected. Relying on stability timer if active.');
        }
    }

    function handleContentMutation(mutationsList, observer) {
        // We only care that *something* changed in the content.
        // console.log("[AI Content Monitor] Content mutated in:", currentMonitoredContentElement);

        if (!hasContentActuallyChanged) {
            hasContentActuallyChanged = true; // Mark that content has indeed changed at least once
            console.log("[AI Content Monitor] First content change detected.");
        }

        // Clear any existing content stability timer, as content is changing again
        if (contentStabilityTimerId) {
            clearTimeout(contentStabilityTimerId);
            contentStabilityTimerId = null;
        }

        // If the initial silence timer is still active, it means this is the first
        // (or among the first) signs of content activity. Clear it.
        if (initialSilenceTimerId) {
            clearTimeout(initialSilenceTimerId);
            initialSilenceTimerId = null;
            console.log("[AI Content Monitor] Initial silence timer cleared due to content activity.");
        }

        // (Re)start the content stability timer
        // console.log(`[AI Content Monitor] Content changed. Resetting content stability timer (${CONTENT_STABILITY_TIMEOUT_MS}ms).`);
        contentStabilityTimerId = setTimeout(onContentStable, CONTENT_STABILITY_TIMEOUT_MS);
    }

    // Called by DOMWatcherService when a new completion marker is added to the DOM
    function aiReplyCompletedCallback(completionMarkerElement, eventType) {
        console.log(`[AI Reply Watcher] Event: ${eventType}. Completion marker initially reported by DOMWatcher:`, completionMarkerElement);

        clearTimeout(debounceTimerForAiReply); // Debounce the handler

        debounceTimerForAiReply = setTimeout(() => {
            console.log('[AI Reply Watcher] Debounced: Attempting to start content monitoring for a new AI reply.');
            
            // IMPORTANT: Cleanup any previous/stale monitoring session.
            // This handles cases where AI replies come in quick succession or DOMWatcher fires multiple times.
            cleanupMonitoringState();

            // 1. Identify the AI message block and its content area associated with this marker
            const aiBlock = completionMarkerElement.closest(AI_MESSAGE_BLOCK_SELECTOR);
            if (!aiBlock) {
                console.warn('[AI Reply Watcher] Could not find parent AI message block (', AI_MESSAGE_BLOCK_SELECTOR, ') for the completion marker:', completionMarkerElement);
                return;
            }
            // console.log('[AI Reply Watcher] Identified AI message block for monitoring:', aiBlock);

            const contentElement = aiBlock.querySelector(AI_CONTENT_INSIDE_BLOCK_SELECTOR);
            if (!contentElement) {
                console.warn('[AI Reply Watcher] Could not find AI content element (', AI_CONTENT_INSIDE_BLOCK_SELECTOR, ') inside the AI block:', aiBlock);
                return;
            }
            // console.log('[AI Reply Watcher] Identified content element to monitor:', contentElement);

            // 2. Setup state for the new monitoring session
            currentMonitoredContentElement = contentElement;
            currentAssociatedAiBlock = aiBlock;
            hasContentActuallyChanged = false; // Reset for this new session

            // 3. Create and start MutationObserver for the content_element
            currentMutationObserver = new MutationObserver(handleContentMutation);
            currentMutationObserver.observe(currentMonitoredContentElement, {
                childList: true,     // Watch for direct children changes (nodes added/removed)
                subtree: true,       // Watch for all descendants changes
                characterData: true, // Watch for text content changes in nodes
                // attributes: false, // Typically not needed for text content, unless styling changes affect perceived content
            });
            console.log(`[AI Content Monitor] Started observing content in:`, currentMonitoredContentElement);

            // 4. Start the initial silence timer
            // If no mutations occur within this period, we assume AI didn't output anything.
            console.log(`[AI Content Monitor] Starting initial silence timer (${INITIAL_SILENCE_TIMEOUT_MS}ms).`);
            initialSilenceTimerId = setTimeout(onInitialSilenceTimeout, INITIAL_SILENCE_TIMEOUT_MS);

        }, 300); // 300ms debounce to handle rapid/multiple DOMWatcher triggers for the same logical event
    }

    function initializeWatcher() {
        if (typeof window.DOMWatcherService === 'undefined' || !window.DOMWatcherService) {
            console.error("[AI Reply Watcher] DOMWatcherService not loaded! Retrying in 2s...");
            setTimeout(initializeWatcher, 2000);
            return;
        }
        console.log("[AI Reply Watcher] DOMWatcherService found. Registering listener for elements matching:", TARGET_SELECTOR_FOR_DOMWATCHER);
        try {
            const registrationId = window.DOMWatcherService.register({
                selector: TARGET_SELECTOR_FOR_DOMWATCHER, // Watch for the completion marker's appearance
                callback: aiReplyCompletedCallback,
                eventTypes: ['added'], // Trigger when the completion marker is added to the DOM
                once: false // Keep watching for new AI replies
            });
            if (registrationId) {
                console.log(`[AI Reply Watcher] Registered with DOMWatcherService (ID: ${registrationId}). Watching for AI reply completion markers to initiate content monitoring.`);
            } else {
                console.error("[AI Reply Watcher] Failed to register with DOMWatcherService (registration returned falsy).");
            }
        } catch (e) {
            console.error("[AI Reply Watcher] Error during DOMWatcherService registration:", e);
        }
    }

    // Initialize the watcher once the DOM is ready, or immediately if already loaded.
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
            // Ensure renderSidebar function is available
            if (typeof renderSidebar === 'function') {
                renderSidebar(fullHtml, `#${dynamicContentContainerId}`);
                const dynamicContentElement = document.getElementById(dynamicContentContainerId);
                if (!dynamicContentElement || dynamicContentElement.innerHTML.trim() === '') {
                    // This could be normal if the AI legitimately produced no sts/mem tags or content for them
                    console.log('[Integration] Sidebar dynamic content might be empty (or target not found). This is okay if AI response was minimal or lacked expected tags.');
                }
            } else {
                console.error('[Integration] renderSidebar function is not defined in the current scope.');
            }
        } else {
            console.warn(`[Integration] Event '${CUSTOM_EVENT_NAME}' missing fullHtml in detail or detail is not an object.`);
        }
    });
    // --- END OF INTEGRATION GLUE CODE ---

    console.log('DeepSeek Sidebar injected and initialized successfully with new AI reply detection logic and manual refresh capability (if button is present).');
})();