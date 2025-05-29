(function() {
    // 1. 定义唯一的ID
    const sidebarId = 'myInjectedSidebar_1A2B3C';
    const toggleBtnId = 'myInjectedSidebarToggleBtn_1A2B3C';
    const statusTabId = 'myInjectedStatusTab_1A2B3C';
    const memoryTabId = 'myInjectedMemoryTab_1A2B3C';
    const styleElementId = 'myInjectedSidebarStyles_1A2B3C';
    const scriptElementId = 'myInjectedSidebarScript_1A2B3C';
    const keyframesAnimationName = 'myInjectedSidebarFadeIn_1A2B3C';
    const iconSwitchAnimationName = 'myInjectedIconSwitch_1A2B3C'; // 新增按钮图标切换动画名

    // --- AI消息监控相关配置 ---
    const AI_CHAT_AREA_SELECTOR = 'div.mx-auto.pt-24.w-full.px-1.relative';
    const AI_MESSAGE_BLOCK_SELECTOR = 'div#ai-chat-answer';
    const AI_CONTENT_INSIDE_BLOCK_SELECTOR = '.markdown-body';

    // --- AI内容提取标签名 ---
    const AI_STATUS_TAG_NAME = 'sts'; // 假设AI返回的内容会用 <sts>...</sts> 包裹状态信息
    const AI_MEMORY_TAG_NAME = 'mem'; // 假设AI返回的内容会用 <mem>...</mem> 包裹记忆信息

    // --- DOMWatcherService 注册ID ---
    const AI_BLOCK_WATCHER_ID = 'sidebar_ai_message_block_watcher_1A2B3C';

    // --- 清理函数 ---
    window.removeInjectedSidebar_1A2B3C = function() {
        if (window.DOMWatcherService && typeof window.DOMWatcherService.unregister === 'function') {
            window.DOMWatcherService.unregister(AI_BLOCK_WATCHER_ID);
            console.log(`DOMWatcherService listener '${AI_BLOCK_WATCHER_ID}' unregistered.`);
        }
        const elementsToRemove = [
            document.getElementById(sidebarId),
            document.getElementById(toggleBtnId),
            document.getElementById(styleElementId),
            document.getElementById(scriptElementId)
        ];
        elementsToRemove.forEach(el => {
            if (el && el.parentNode) {
                el.parentNode.removeChild(el);
            }
        });
        if (window.MySidebar && window.MySidebar.isInitialized === sidebarId) {
            delete window.MySidebar.init;
            delete window.MySidebar.isInitialized;
        }
        console.log('Injected sidebar elements removed.');
        delete window.removeInjectedSidebar_1A2B3C;
    };

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

        if (document.getElementById(sidebarId)) {
            console.log("检测到已存在的注入侧边栏，将先移除旧的...");
            if(typeof window.removeInjectedSidebar_1A2B3C === 'function') {
                window.removeInjectedSidebar_1A2B3C();
            } else { // Fallback if specific remover is gone somehow
                const oldSidebar = document.getElementById(sidebarId);
                if (oldSidebar) oldSidebar.parentNode.removeChild(oldSidebar);
                const oldBtn = document.getElementById(toggleBtnId);
                if (oldBtn) oldBtn.parentNode.removeChild(oldBtn);
                const oldStyle = document.getElementById(styleElementId);
                if (oldStyle) oldStyle.parentNode.removeChild(oldStyle);
                 const oldScript = document.getElementById(scriptElementId);
                if (oldScript) oldScript.parentNode.removeChild(oldScript);
            }
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
                            <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px; opacity:0.6;"><path d="M12 8V8.01"></path><path d="M12 12V12.01"></path><path d="M12 16V16.01"></path><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path><path d="M7.5 15.5s1.5-1 4.5-1 4.5 1 4.5 1"></path><path d="m8.5 9.5 1.5 1.5L11.5 8"></path><path d="m12.5 9.5 1.5 1.5L15.5 8"></path></svg>
                            等待 AI 状态信息...
                        </div>
                    </div>
                    <div id="${memoryTabId}" class="tab-pane">
                        <div class="ai-content-area placeholder-content">
                             <svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px; opacity:0.6;"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path><path d="M2 2v20"></path></svg>
                            等待 AI 记忆信息...
                        </div>
                    </div>
                </div>
            </aside>
            <button id="${toggleBtnId}" aria-label="打开/关闭侧边栏" aria-expanded="false">
                <span class="icon-wrapper">
                    <span class="icon-menu">☰</span>
                    <span class="icon-close">✕</span>
                </span>
            </button>
        `;

        // 3. 准备CSS字符串
        const cssString = `
            :root {
                --inj-primary-color: #4A90E2; /* 现代蓝色 */
                --inj-primary-hover-color: #357ABD; /* 深一点的蓝色 */
                --inj-sidebar-bg: #FDFDFE; /* 非常浅的灰白，接近白色但更柔和 */
                --inj-text-color: #333333; /* 深灰色，易读 */
                --inj-text-light-color: #555555; /* 稍浅的文本颜色 */
                --inj-border-color: #EAECEF; /* 浅灰色边框 */
                --inj-shadow-color: rgba(74, 144, 226, 0.12); /* 基于主色的柔和阴影 */
                --inj-shadow-strong-color: rgba(74, 144, 226, 0.20);
                --inj-active-tab-color: var(--inj-primary-color);
                --inj-inactive-tab-color: #777777; /* 中灰色 */
                --inj-sidebar-width: 380px; /* 侧边栏宽度 */
                --inj-transition-speed: 0.35s;
                --inj-transition-speed-fast: 0.2s;
                --inj-border-radius-md: 8px; /* 中等圆角 */
                --inj-border-radius-lg: 12px; /* 大圆角 */
                --inj-card-bg: #FFFFFF;
                --inj-card-border-color: var(--inj-border-color);
                --inj-card-border-radius: var(--inj-border-radius-md);
                --inj-font-sans: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
            }

            #${sidebarId}, #${sidebarId} *, #${sidebarId} *::before, #${sidebarId} *::after,
            #${toggleBtnId}, #${toggleBtnId} *, #${toggleBtnId} *::before, #${toggleBtnId} *::after {
                 box-sizing: border-box;
            }

            #${sidebarId} {
                position: fixed;
                top: 5vh; /* 距离顶部一些距离 */
                right: calc(-1 * var(--inj-sidebar-width) - 20px); /* 初始完全隐藏，并为阴影留出空间 */
                width: var(--inj-sidebar-width);
                height: 80vh; /* 占据视口高度的90% */
                background-color: var(--inj-sidebar-bg);
                box-shadow: -8px 0 25px var(--inj-shadow-color);
                display: flex;
                flex-direction: column;
                transition: right var(--inj-transition-speed) cubic-bezier(0.25, 0.8, 0.25, 1); /* 更平滑的动画曲线 */
                z-index: 2147483646;
                font-family: var(--inj-font-sans);
                color: var(--inj-text-color);
                border-radius: var(--inj-border-radius-lg) 0 0 var(--inj-border-radius-lg); /* 左侧圆角 */
                overflow: hidden; /* 确保子元素不会溢出圆角 */
            }
            #${sidebarId}.open {
                right: 0;
            }

            #${sidebarId} .sidebar-header {
                display: flex;
                border-bottom: 1px solid var(--inj-border-color);
                background-color: rgba(255,255,255,0.7); /* 轻微透明感 */
                backdrop-filter: blur(5px); /* 毛玻璃效果 (如果支持) */
                flex-shrink: 0;
                padding: 5px; /* 给按钮一点空间 */
                border-radius: var(--inj-border-radius-lg) 0 0 0; /* 匹配父元素左上圆角 */
            }

            #${sidebarId} .tab-button {
                flex: 1;
                padding: 14px 10px; /* 增加垂直padding */
                background-color: transparent;
                border: none;
                border-bottom: 3px solid transparent;
                cursor: pointer;
                font-size: 15px; /* 略微减小字体 */
                font-weight: 500;
                color: var(--inj-inactive-tab-color);
                outline: none;
                transition: color var(--inj-transition-speed-fast) ease, border-bottom-color var(--inj-transition-speed-fast) ease, background-color var(--inj-transition-speed-fast) ease;
                text-align: center;
                font-family: inherit;
                position: relative;
                border-radius: var(--inj-border-radius-md); /* 给按钮本身也加圆角 */
                margin: 0 2px; /* 按钮间细微间隔 */
            }
            #${sidebarId} .tab-button:hover {
                color: var(--inj-primary-color);
                background-color: rgba(var(--inj-primary-color-rgb, 74, 144, 226), 0.05); /* 主色的浅背景 */
            }
            #${sidebarId} .tab-button.active {
                color: var(--inj-active-tab-color);
                border-bottom-color: var(--inj-active-tab-color);
                font-weight: 600;
                background-color: rgba(var(--inj-primary-color-rgb, 74, 144, 226), 0.1); /* 主色的更深一点的背景 */
            }

            #${sidebarId} .sidebar-content {
                flex-grow: 1;
                overflow-y: auto;
                padding: 20px;
                background-color: var(--inj-sidebar-bg); /* 确保内容区背景 */
            }
             /* 美化滚动条 (Webkit) */
            #${sidebarId} .sidebar-content::-webkit-scrollbar,
            #${sidebarId} .ai-content-area::-webkit-scrollbar {
                width: 8px;
            }
            #${sidebarId} .sidebar-content::-webkit-scrollbar-track,
            #${sidebarId} .ai-content-area::-webkit-scrollbar-track {
                background: transparent; /* 透明轨道 */
                border-radius: 10px;
            }
            #${sidebarId} .sidebar-content::-webkit-scrollbar-thumb,
            #${sidebarId} .ai-content-area::-webkit-scrollbar-thumb {
                background: var(--inj-border-color); /* 用边框色作为滚动条颜色 */
                border-radius: 10px;
                border: 2px solid var(--inj-sidebar-bg); /* 制造内边距效果 */
            }
            #${sidebarId} .sidebar-content::-webkit-scrollbar-thumb:hover,
            #${sidebarId} .ai-content-area::-webkit-scrollbar-thumb:hover {
                background: #B0B0B0; /* 悬停时深一点 */
            }


            #${sidebarId} .tab-pane {
                display: none;
                animation: ${keyframesAnimationName} var(--inj-transition-speed) ease-out; /* 使用更平滑的 ease-out */
            }
            #${sidebarId} .tab-pane.active {
                display: block;
            }

            #${sidebarId} .placeholder-content {
                border: 2px dashed var(--inj-border-color);
                padding: 30px 20px;
                text-align: center;
                color: var(--inj-inactive-tab-color);
                border-radius: var(--inj-card-border-radius);
                min-height: 180px;
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                font-style: italic;
                font-size: 14px;
                background-color: rgba(0,0,0,0.015);
                line-height: 1.5;
            }

            #${sidebarId} .ai-content-area {
                padding: 5px; /* 轻微的内边距，主要由卡片提供 */
                border-radius: var(--inj-border-radius-md);
                min-height: 100px;
                word-wrap: break-word;
                white-space: pre-wrap;
                overflow-y: auto; /* 如果单个卡片内容过多 */
                max-height: calc(90vh - 150px); /* 动态计算，避免撑爆 */
                font-size: 14px; /* 统一内容区字体大小 */
            }
             #${sidebarId} .ai-content-area.placeholder-content { /* 当ai-content-area同时也是placeholder时 */
                background-color: transparent; /* 覆盖上面的padding，让placeholder自己控制 */
                border: 2px dashed var(--inj-border-color);
                padding: 30px 20px;
            }

            /* 针对AI内容的样式 */
            #${sidebarId} .ai-content-area sti, /* 假设 sti 是AI内容中的卡片元素 */
            #${sidebarId} .ai-content-area .content-card /* 或者使用一个通用类名 */
             {
                display: block;
                background-color: var(--inj-card-bg);
                border: 1px solid var(--inj-card-border-color);
                border-radius: var(--inj-card-border-radius);
                padding: 18px 22px;
                margin-bottom: 18px;
                box-shadow: 0 3px 8px rgba(0,0,0,0.03);
                transition: box-shadow var(--inj-transition-speed-fast) ease, transform var(--inj-transition-speed-fast) ease;
            }
            #${sidebarId} .ai-content-area sti:last-child { margin-bottom: 0; }
            #${sidebarId} .ai-content-area sti:hover {
                box-shadow: 0 5px 15px rgba(0,0,0,0.06);
                transform: translateY(-2px);
            }

            #${sidebarId} .ai-content-area h1 {
                font-size: 1.3em; /* 18.2px approx */
                color: var(--inj-primary-color);
                margin: 0 0 15px 0;
                padding-bottom: 12px;
                border-bottom: 1px solid var(--inj-border-color);
                font-weight: 600;
            }
            #${sidebarId} .ai-content-area h2 {
                font-size: 1.15em; /* 16.1px approx */
                color: var(--inj-text-light-color);
                margin-top: 18px;
                margin-bottom: 10px;
                font-weight: 600;
            }
             #${sidebarId} .ai-content-area sti > div > h2:first-child { /* 如果h2是卡片内第一个标题 */
                 margin-top: 0;
             }

            #${sidebarId} .ai-content-area ul {
                list-style-type: none;
                padding-left: 5px; /* 微调，因为自定义项目符号会占空间 */
                margin-bottom: 15px;
            }
            #${sidebarId} .ai-content-area ul li {
                margin-bottom: 10px;
                line-height: 1.65;
                position: relative;
                padding-left: 22px; /* 为自定义项目符号留出空间 */
                color: var(--inj-text-color);
            }
            #${sidebarId} .ai-content-area ul li::before {
                content: ''; /* 使用背景图片或SVG作为项目符号 */
                position: absolute;
                left: 0;
                top: 7px; /* 微调垂直对齐 */
                width: 10px;
                height: 10px;
                background-color: var(--inj-primary-color);
                border-radius: 50%;
                opacity: 0.7;
                /* 或者用SVG: content: url("data:image/svg+xml,..."); */
            }
            #${sidebarId} .ai-content-area p {
                line-height: 1.65;
                margin-bottom: 12px;
                color: var(--inj-text-color);
            }
            #${sidebarId} .ai-content-area strong {
                font-weight: 600;
                color: var(--inj-text-color); /* 保持和正文一致，但加粗 */
            }

            @keyframes ${keyframesAnimationName} {
                from { opacity: 0; transform: translateY(15px) scale(0.98); } /* 更细致的入场动画 */
                to { opacity: 1; transform: translateY(0) scale(1); }
            }

            #${toggleBtnId} {
                position: fixed;
                bottom: 25px; /* 调整位置 */
                right: 25px;
                width: 56px; /* 略微调整大小 */
                height: 56px;
                background-color: var(--inj-primary-color);
                color: white;
                border: none;
                border-radius: 50%;
                font-size: 22px; /* 调整图标大小 */
                cursor: pointer;
                box-shadow: 0 5px 15px var(--inj-shadow-color);
                display: flex;
                align-items: center;
                justify-content: center;
                z-index: 2147483647;
                transition: background-color var(--inj-transition-speed-fast) ease,
                            transform var(--inj-transition-speed-fast) cubic-bezier(0.34, 1.56, 0.64, 1), /* 回弹效果 */
                            box-shadow var(--inj-transition-speed-fast) ease;
                outline: none;
            }
            #${toggleBtnId}:hover {
                background-color: var(--inj-primary-hover-color);
                box-shadow: 0 8px 20px var(--inj-shadow-strong-color);
                transform: translateY(-3px) scale(1.05); /* 悬停时轻微放大上浮 */
            }
            #${toggleBtnId}:active {
                transform: translateY(-1px) scale(0.95); /* 点击时按下效果 */
                box-shadow: 0 2px 8px var(--inj-shadow-color);
            }

            #${toggleBtnId} .icon-wrapper {
                position: relative;
                width: 24px; /* 图标容器大小 */
                height: 24px;
                display: flex;
                align-items: center;
                justify-content: center;
            }
            #${toggleBtnId} .icon-menu, #${toggleBtnId} .icon-close {
                position: absolute;
                transition: opacity var(--inj-transition-speed) ease-in-out, transform var(--inj-transition-speed) ease-in-out;
                line-height: 1; /* 确保图标垂直居中 */
            }
            #${toggleBtnId} .icon-menu { opacity: 1; transform: rotate(0deg) scale(1); }
            #${toggleBtnId} .icon-close { opacity: 0; transform: rotate(-180deg) scale(0); }

            #${toggleBtnId}[aria-expanded="true"] .icon-menu { opacity: 0; transform: rotate(180deg) scale(0); }
            #${toggleBtnId}[aria-expanded="true"] .icon-close { opacity: 1; transform: rotate(0deg) scale(1); }
        `;

        // 4. 准备JavaScript字符串 (IIFE)
        const jsString = `
        (function() {
            const sidebar = document.getElementById('${sidebarId}');
            const toggleBtn = document.getElementById('${toggleBtnId}');
            const statusContentArea = document.getElementById('${statusTabId}').querySelector('.ai-content-area');
            const memoryContentArea = document.getElementById('${memoryTabId}').querySelector('.ai-content-area');

            const AI_CHAT_AREA_SELECTOR_JS = '${AI_CHAT_AREA_SELECTOR}';
            const AI_MESSAGE_BLOCK_SELECTOR_JS = '${AI_MESSAGE_BLOCK_SELECTOR}';
            const AI_CONTENT_INSIDE_BLOCK_SELECTOR_JS = '${AI_CONTENT_INSIDE_BLOCK_SELECTOR}';
            const AI_STATUS_TAG_NAME_JS = '${AI_STATUS_TAG_NAME}';
            const AI_MEMORY_TAG_NAME_JS = '${AI_MEMORY_TAG_NAME}';
            const AI_BLOCK_WATCHER_ID_JS = '${AI_BLOCK_WATCHER_ID}';

            if (!sidebar || !toggleBtn || !statusContentArea || !memoryContentArea) {
                console.error('Error: Sidebar core elements not found.');
                return;
            }
            if (sidebar.dataset.injectedSidebarInitialized === 'true') {
                console.log('Injected sidebar script (JS part) already initialized.');
                return;
            }
            sidebar.dataset.injectedSidebarInitialized = 'true';

            const tabButtons = sidebar.querySelectorAll('.tab-button');
            // 图标的引用不再需要，CSS会处理基于aria-expanded的切换

            toggleBtn.addEventListener('click', function() {
                const isOpen = sidebar.classList.toggle('open');
                toggleBtn.setAttribute('aria-expanded', isOpen.toString());
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

            let currentObservingAiContentElement = null;
            let aiContentStreamObserver = null;

            function updateSidebarPanes(htmlContent) {
                const tempDiv = document.createElement('div');
                tempDiv.innerHTML = htmlContent;

                const statusElement = tempDiv.querySelector(AI_STATUS_TAG_NAME_JS);
                const memoryElement = tempDiv.querySelector(AI_MEMORY_TAG_NAME_JS);

                const placeholderStatusSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px; opacity:0.6;"><path d="M12 8V8.01"></path><path d="M12 12V12.01"></path><path d="M12 16V16.01"></path><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path><path d="M7.5 15.5s1.5-1 4.5-1 4.5 1 4.5 1"></path><path d="m8.5 9.5 1.5 1.5L11.5 8"></path><path d="m12.5 9.5 1.5 1.5L15.5 8"></path></svg>';
                const placeholderMemorySVG = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px; opacity:0.6;"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path><path d="M2 2v20"></path></svg>';


                if (statusElement && statusElement.innerHTML.trim()) {
                    statusContentArea.innerHTML = statusElement.innerHTML;
                    statusContentArea.classList.remove('placeholder-content');
                } else {
                    let statusMsg = 'AI 状态信息为空。';
                    if (!htmlContent || htmlContent.trim() === '') {
                         // 保持默认空信息
                    } else if (!statusElement) {
                         statusMsg = 'AI 状态信息（未找到 '+ AI_STATUS_TAG_NAME_JS +' 标签）。';
                    }
                    statusContentArea.innerHTML = placeholderStatusSVG + statusMsg;
                    statusContentArea.classList.add('placeholder-content');
                }

                if (memoryElement && memoryElement.innerHTML.trim()) {
                    memoryContentArea.innerHTML = memoryElement.innerHTML;
                    memoryContentArea.classList.remove('placeholder-content');
                } else {
                    let memoryMsg = 'AI 记忆信息为空。';
                     if (!htmlContent || htmlContent.trim() === '') {
                        // 保持默认空信息
                    } else if (!memoryElement) {
                        memoryMsg = 'AI 记忆信息（未找到 '+ AI_MEMORY_TAG_NAME_JS +' 标签）。';
                    }
                    memoryContentArea.innerHTML = placeholderMemorySVG + memoryMsg;
                    memoryContentArea.classList.add('placeholder-content');
                }
                
                statusContentArea.scrollTop = 0; // 更新内容后滚动到顶部
                memoryContentArea.scrollTop = 0;
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
                    childList: true, subtree: true, characterData: true
                });
                updateSidebarPanes(aiContentElement.innerHTML); // Initial update
            }

            function processLatestAIMessage() {
                const chatAreaNode = document.querySelector(AI_CHAT_AREA_SELECTOR_JS);
                const allAiMessageBlocks = document.querySelectorAll(AI_MESSAGE_BLOCK_SELECTOR_JS);
                let latestAiMessageBlock = null;
                
                const placeholderStatusSVG = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px; opacity:0.6;"><path d="M12 8V8.01"></path><path d="M12 12V12.01"></path><path d="M12 16V16.01"></path><path d="M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0Z"></path><path d="M7.5 15.5s1.5-1 4.5-1 4.5 1 4.5 1"></path><path d="m8.5 9.5 1.5 1.5L11.5 8"></path><path d="m12.5 9.5 1.5 1.5L15.5 8"></path></svg>';
                const placeholderMemorySVG = '<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:10px; opacity:0.6;"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path><path d="M2 2v20"></path></svg>';


                if (allAiMessageBlocks.length === 0) {
                    if (currentObservingAiContentElement) {
                        statusContentArea.innerHTML = placeholderStatusSVG + 'AI 消息消失或已清除。';
                        statusContentArea.classList.add('placeholder-content');
                        memoryContentArea.innerHTML = placeholderMemorySVG + 'AI 消息消失或已清除。';
                        memoryContentArea.classList.add('placeholder-content');
                        if (aiContentStreamObserver) aiContentStreamObserver.disconnect();
                        currentObservingAiContentElement = null;
                    }
                    // If no messages and never observed, placeholders remain
                    return;
                }
                
                if (chatAreaNode) {
                    const blocksInChatArea = Array.from(allAiMessageBlocks).filter(block => chatAreaNode.contains(block));
                    if (blocksInChatArea.length > 0) {
                        latestAiMessageBlock = blocksInChatArea[blocksInChatArea.length - 1];
                    }
                }
                
                if (!latestAiMessageBlock) {
                    latestAiMessageBlock = allAiMessageBlocks[allAiMessageBlocks.length - 1];
                }

                if (latestAiMessageBlock) {
                    const aiContentElement = latestAiMessageBlock.querySelector(AI_CONTENT_INSIDE_BLOCK_SELECTOR_JS);
                    if (aiContentElement) {
                        if (aiContentElement !== currentObservingAiContentElement) {
                            observeSpecificAIContent(aiContentElement);
                        } else {
                            updateSidebarPanes(aiContentElement.innerHTML); // Force update
                        }
                    } else {
                        if (currentObservingAiContentElement) { // Was observing, but content area gone
                            statusContentArea.innerHTML = placeholderStatusSVG + 'AI 消息中未找到内容区域 ('+ AI_CONTENT_INSIDE_BLOCK_SELECTOR_JS +')。';
                            statusContentArea.classList.add('placeholder-content');
                            memoryContentArea.innerHTML = placeholderMemorySVG + 'AI 消息中未找到内容区域 ('+ AI_CONTENT_INSIDE_BLOCK_SELECTOR_JS +')。';
                            memoryContentArea.classList.add('placeholder-content');
                            if (aiContentStreamObserver) aiContentStreamObserver.disconnect();
                            currentObservingAiContentElement = null;
                        }
                    }
                } else {
                     statusContentArea.innerHTML = placeholderStatusSVG + '未能定位到AI消息块 ('+ AI_MESSAGE_BLOCK_SELECTOR_JS +')。';
                     statusContentArea.classList.add('placeholder-content');
                     memoryContentArea.innerHTML = placeholderMemorySVG + '未能定位到AI消息块 ('+ AI_MESSAGE_BLOCK_SELECTOR_JS +')。';
                     memoryContentArea.classList.add('placeholder-content');
                }
            }

            function initializeAIWatcher() {
                if (window.DOMWatcherService && typeof window.DOMWatcherService.register === 'function') {
                    console.log('Sidebar: DOMWatcherService found. Registering AI message block listener.');
                    window.DOMWatcherService.register({
                        id: AI_BLOCK_WATCHER_ID_JS,
                        selector: AI_MESSAGE_BLOCK_SELECTOR_JS,
                        eventTypes: ['added', 'removed', 'mutated'], // Listen to mutations on the block itself too
                        callback: function(element, eventType) {
                            processLatestAIMessage(); 
                        }
                    });
                    setTimeout(processLatestAIMessage, 250); // Initial check
                } else {
                    console.warn('Sidebar: DOMWatcherService not found. Retrying...');
                    const warningMsg = '<span style="color:#e67e22; display:flex; flex-direction:column; align-items:center; justify-content:center; height:100%;"><svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" style="margin-bottom:8px;"><circle cx="12" cy="12" r="10"></circle><line x1="12" y1="8" x2="12" y2="12"></line><line x1="12" y1="16" x2="12.01" y2="16"></line></svg>AI监控服务加载中...</span>';
                    if (!statusContentArea.classList.contains('placeholder-content')) statusContentArea.classList.add('placeholder-content');
                    if (!memoryContentArea.classList.contains('placeholder-content')) memoryContentArea.classList.add('placeholder-content');
                    statusContentArea.innerHTML = warningMsg;
                    memoryContentArea.innerHTML = warningMsg;
                    setTimeout(initializeAIWatcher, 1000);
                }
            }
            initializeAIWatcher();
            console.log('Injected sidebar script (JS part) initialized successfully.');
            window.addEventListener('beforeunload', () => {
                if (aiContentStreamObserver) {
                    aiContentStreamObserver.disconnect();
                    aiContentStreamObserver = null;
                }
            });
        })();
        `;

        // 5. 执行注入
        const styleTag = document.createElement('style');
        styleTag.id = styleElementId;
        // Add primary color RGB values for RGBA usage in CSS
        const primaryColorRgb = getComputedStyle(document.documentElement).getPropertyValue('--inj-primary-color') || '#4A90E2';
        const rgbValues = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(primaryColorRgb.trim());
        let finalCssString = cssString;
        if (rgbValues) {
            const r = parseInt(rgbValues[1], 16);
            const g = parseInt(rgbValues[2], 16);
            const b = parseInt(rgbValues[3], 16);
            finalCssString = `:root { --inj-primary-color-rgb: ${r}, ${g}, ${b}; }\n` + cssString;
        }
        styleTag.textContent = finalCssString;
        document.head.appendChild(styleTag);


        const tempWrapper = document.createElement('div');
        tempWrapper.innerHTML = htmlString;
        while (tempWrapper.firstChild) {
            document.body.appendChild(tempWrapper.firstChild);
        }

        const scriptTag = document.createElement('script');
        scriptTag.id = scriptElementId;
        scriptTag.textContent = jsString;
        document.body.appendChild(scriptTag);

        window.MySidebar.isInitialized = sidebarId;
        console.log('Sidebar injection process completed. Look for the button in the bottom-right corner.');
        console.log("侧边栏已准备注入。如果需要移除，请在控制台执行: removeInjectedSidebar_1A2B3C()");
    };

    // --- 自动初始化 ---
    if (document.readyState === 'complete' || document.readyState === 'interactive') {
        // Delay slightly to ensure DOMWatcherService might be ready if loaded async
        setTimeout(window.MySidebar.init, 100); 
    } else {
        document.addEventListener('DOMContentLoaded', () => setTimeout(window.MySidebar.init, 100));
    }
    console.log("侧边栏脚本 (v1.1 Enhanced) 已加载。将自动初始化。");
    console.log("若要移除，请调用 window.removeInjectedSidebar_1A2B3C()");

})();
// window.MySidebar.init(); // Removed direct call, will auto-init