// ==UserScript==
// @name        Enhanced Input for React Site
// @namespace   Violentmonkey Scripts
// @match       *://*/*
// @grant       none
// @version     4.2
// @author      AI Assistant
// @description Enhances input experience on a React-based website with custom UI and auto-fill features.
// @run-at      document-idle
// ==/UserScript==

(function () {
    'use strict';

    // =========================================================================
    // 0. Logger Implementation
    // =========================================================================
    const Logger = {
        _log: function (level, module, message, ...args) {
            const timestamp = new Date().toISOString();
            console[level](`[${timestamp}] 【${module}】${message}`, ...args);
        },
        log: function (module, message, ...args) { this._log('log', module, message, ...args); },
        warn: function (module, message, ...args) { this._log('warn', module, message, ...args); },
        error: function (module, message, ...args) { this._log('error', module, message, ...args); },
        debug: function (module, message, ...args) { this._log('debug', module, message, ...args); } // Added for more verbose logging
    };

    Logger.log('ScriptInit', 'Enhanced Input Script starting...');

    // =========================================================================
    // 1. 常量定义 (Config Module)
    // =========================================================================
    const Config = {
        // 保持省略状态 - 用户提供
        YOUR_CUSTOM_HTML: `
        <div class="ai-input-container" id="aiInputContainer">
        <div class="input-section">
            <div class="toolbar">
                <div class="toolbar-group">
                    <!-- 移除了 title 属性，使用 span 作为 tooltip -->
                    <button class="btn comments" id="commentsBtn">
                        <i class="fas fa-comment-alt"></i>
                        <span class="tooltip-text">评论</span> <!-- 添加了 tooltip-text 类 -->
                    </button>
                    <button class="btn scroll" id="scrollBtn">
                        <i class="fas fa-arrow-down"></i>
                        <span class="tooltip-text">滚动到底部</span>
                    </button>
                    <button class="btn" id="streamModeBtn">
                        <i class="fas fa-water"></i>
                        <span class="tooltip-text" id="streamModeTooltip">输出模式: 流式</span>
                    </button>
                </div>
                <div class="paginator-container" id="paginator-container">
                    <!-- 分页器将被挂载在这里 -->
                </div>
                <div class="toolbar-group">
                    <button class="btn toggle" id="toggleBtn">
                        <i class="fas fa-sync-alt"></i>
                        <span class="tooltip-text">模式: <span class="toggle-state" id="toggleState"></span></span>
                    </button>
                    <button class="btn" id="switchBtn">
                        <i class="fas fa-toggle-off"></i>
                        <span class="tooltip-text">瑟瑟增强<span id="switchBtnState"></span></span>
                    </button>
                    <button class="btn" id="actionBtn">
                        <i class="fa-solid fa-wand-magic"></i>
                        <span class="tooltip-text">简化回复</span>
                    </button>
                    <button class="btn" id="pinBtn">
                        <i class="fas fa-thumbtack"></i>
                        <span class="tooltip-text" id="pinBtnTooltip">点击固定</span> <!-- 给这个span一个ID方便JS修改 -->
                    </button>
                </div>
            </div>

            <div class="input-area" id="inputArea">
                <textarea id="messageInput" placeholder="输入您的问题或消息..." rows="1"></textarea> <!-- rows="1" 配合JS自适应高度 -->
                <button class="send-btn" id="sendBtn">
                    <i class="fas fa-paper-plane"></i>
                </button>
            </div>
        </div>
    </div>
    <!-- 通知元素，用于显示操作反馈 -->
    <div class="notification" id="notification"></div>
    `, // 内容由用户提供
        YOUR_CUSTOM_CSS: `
        :root {
            /* 定义颜色和样式变量 */
            --ai-input-primary: #4a6cf7;
            --ai-input-primary-hover: #3451d4;
            --ai-input-secondary: #6c757d;
            --ai-input-success: #10b981;
            --ai-input-danger: #ef4444;
            --ai-input-bg: #ffffff;
            --ai-input-border: #e2e8f0;
            --ai-input-shadow: 0 0.25em 1.25em rgba(0, 0, 0, 0.08);
            --ai-input-radius: 1em;
            --ai-input-transition: transform 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275), background-color 0.3s ease-in-out, color 0.3s ease-in-out, box-shadow 0.3s ease-in-out;
            /* 添加 box-shadow 过渡 */
        }

        .ai-input-container {
            width: 100%;
            background: var(--ai-input-bg);
            border-radius: var(--ai-input-radius) var(--ai-input-radius) 0 0;
            /* 底部圆角移除，如果贴底 */
            box-shadow: var(--ai-input-shadow);
            border: 0.0625em solid var(--ai-input-border);
            transition: var(--ai-input-transition);
            margin: 0;
            position: fixed;
            /* 修改为 fixed，使其固定在底部 */
            bottom: 0;
        }

        .input-section {
            padding: 0.8em;
            border-top: 0.0625em solid var(--ai-input-border);
            background: white;
        }

        .toolbar {
            display: flex;
            justify-content: space-between;
            align-items: center;
            /* 垂直居中对齐按钮组 */
            gap: 0.625em;
            flex-wrap: wrap;
            /* 允许换行 */
        }

        .toolbar-group {
            display: flex;
            gap: 0.625em;
            flex-wrap: wrap;
            /* 允许组内按钮换行 */
        }

        .btn,
        .paginator-page-number,
        .paginator-main {
            display: flex;
            align-items: center;
            justify-content: center;
            padding: 0.625em 1em;
            border-radius: 0.75em;
            font-weight: 600;
            font-size: 0.8rem;
            cursor: pointer;
            transition: var(--ai-input-transition);
            border: none;
            background: #f1f5f9;
            color: #475569;
            position: relative;
            /* 为 span 提示框定位 */
            overflow: visible;
            /* 允许 span 提示框溢出显示 */
        }

        .btn:hover,
        .paginator-page-number:hover,
        .paginator-main:hover {
            background: #e2e8f0;
            transform: translateY(-0.125em);
            box-shadow: 0 0.125em 0.25em rgba(0, 0, 0, 0.1);
            /* 添加轻微阴影 */
        }

        .btn:active,
        .paginator-page-number:active {
            transform: translateY(0);
        }

        .btn i {
            font-size: 1rem;
            /* 稍微调整图标大小 */
        }

        /* 特定按钮样式 */
        .btn.comments {
            background: rgba(74, 108, 247, 0.1);
            color: var(--ai-input-primary);
        }

        .btn.comments:hover {
            background: rgba(74, 108, 247, 0.2);
        }

        .btn.scroll {
            background: rgba(16, 185, 129, 0.1);
            color: var(--ai-input-success);
        }

        .btn.scroll:hover {
            background: rgba(16, 185, 129, 0.2);
        }

        .btn.pinned {
            background: rgba(74, 108, 247, 0.2);
            /* 固定时更明显的背景 */
            color: var(--ai-input-primary);
        }

        .btn.pinned i {
            color: var(--ai-input-primary);
        }

        /* 自定义提示框 span 的样式 */
        .btn span.tooltip-text {
            /* 使用更明确的类名 */
            visibility: hidden;
            opacity: 0;
            width: max-content;
            max-width: 150px;
            background-color: #333;
            color: #fff;
            text-align: center;
            border-radius: 6px;
            padding: 8px 12px;
            position: absolute;
            z-index: 1001;
            /* 比父元素高一点 */
            bottom: 130%;
            /* 调整位置，确保在按钮上方 */
            left: 50%;
            transform: translateX(-50%);
            transition: opacity 0.2s ease, visibility 0s linear 0.2s;
            /* 优化过渡效果 */
            font-size: 0.75rem;
            /* 调整字体大小 */
            white-space: nowrap;
            pointer-events: none;
            /* 避免提示框自身捕获鼠标事件 */
        }

        /* 提示框的小三角 */
        .btn span.tooltip-text::after {
            content: "";
            position: absolute;
            top: 100%;
            left: 50%;
            margin-left: -5px;
            border-width: 5px;
            border-style: solid;
            border-color: #333 transparent transparent transparent;
        }

        /* 鼠标悬停在按钮上时显示提示框 */
        .btn:hover span.tooltip-text {
            visibility: visible;
            opacity: 1;
            transition: opacity 0.2s ease;
            /* 优化过渡效果 */
        }

        .toggle-state {
            margin-left: 0.5em;
            font-weight: 700;
        }

        .input-area {
            display: flex;
            gap: 0.75em;
            align-items: flex-end;
            /* 文本域和发送按钮底部对齐 */
            max-height: 0;
            transform: translateY(100%);
            /* 初始时隐藏在视口下方 */
            transition: max-height 0.3s ease-out, padding 0.3s ease-out, opacity 0.2s ease-out, transform 0.3s ease-out;
            /* 添加 padding 和 opacity 过渡 */
            overflow: hidden;
            opacity: 0;
            /* 初始时透明 */
            /* transform: translateY(100%); 这个在 max-height 为 0 时意义不大，且可能导致动画复杂 */
        }

        .input-area.expanded {
            max-height: 10em;
            /* 一个合适的展开高度，JS中会动态计算 */
            opacity: 1;
            /* 展开时完全不透明 */
            padding-top: 0.5em;
            /* 展开时可以加一点上边距 */
            transform: translateY(0);
            /* 展开时回到正常位置 */
            margin-top: 0.5em;
        }

        /* 移除了 input-area > * 的 opacity 控制，改为控制 input-area 本身的 opacity */

        textarea#messageInput {
            min-height: 1em;
            max-height: 8em;
            padding: 0.75em 1em;
            border-radius: 0.8em;
            border: 0.0625em solid var(--ai-input-border);
            flex: 1;
            line-height: 1.2;
            font-size: 1rem;
            resize: none;
            transition: var(--ai-input-transition);
            background: #f8fafc;
            overflow-y: auto;
        }

        textarea#messageInput:focus {
            outline: none;
            border-color: var(--ai-input-primary);
            box-shadow: 0 0 0 0.1875em rgba(74, 108, 247, 0.2);
        }

        .send-btn {
            display: flex;
            align-items: center;
            justify-content: center;
            width: 2.8em;
            /* 稍微增大 */
            height: 2.8em;
            /* 稍微增大 */
            border-radius: 0.8em;
            /* 调整圆角 */
            background: var(--ai-input-primary);
            color: white;
            border: none;
            cursor: pointer;
            transition: var(--ai-input-transition);
            font-size: 1.1rem;
            /* 调整图标大小 */
            align-self: flex-end;
            /* 确保按钮与文本域底部对齐 */
        }

        .send-btn:hover {
            background: var(--ai-input-primary-hover);
            transform: translateY(-0.125em) scale(1.05);
            /* 微调动画 */
            box-shadow: 0 0.3em 0.8em rgba(74, 108, 247, 0.3);
            /* 微调阴影 */
        }

        .send-btn:active {
            transform: translateY(0) scale(1);
        }

        .notification {
            position: fixed;
            /* 相对于视口定位 */
            bottom: 8em;
            /* 距离底部的位置 */
            transform: translateX(50%) translateY(100%);
            /* 初始在屏幕外下方，并水平居中 */
            background: var(--ai-input-success);
            color: white;
            padding: 0.875em 1.5em;
            border-radius: 0.75em;
            font-weight: 500;
            box-shadow: 0 0.375em 1.25em rgba(0, 0, 0, 0.15);
            transition: transform 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.4s ease-in-out;
            z-index: 1100;
            opacity: 0;
            min-width: 12.5em;
            text-align: center;
            pointer-events: none;
            /* 通知不应捕获鼠标事件 */
        }

        .notification.show {
            transform: translateX(50%) translateY(0);
            /* 移动到预定位置 */
            opacity: 1;
        }

        /* .notification.error, .notification.info 颜色已通过JS动态设置背景实现 */

        /* --- 聊天分页器样式 --- */

        /* 分页器主容器 */
        .chat-paginator {
            position: relative;
            /* 禁止文本选择 */
        }

        /* 分页器主按钮 */
        .chat-paginator .paginator-main {}

        /* 分页器详情视图 */
        .chat-paginator .paginator-detail {
            visibility: hidden;
            opacity: 0;
            position: absolute;
            /* 比父元素高一点 */
            bottom: 130%;
            /* 调整位置，确保在按钮上方 */
            left: 50%;
            transform: translateX(-50%);
            display: flex;
            flex-direction: row;
            gap: 0.5em;
            pointer-events: none;
            transition: opacity 0.2s ease, visibility 0s linear 0.2s;
        }

        .chat-paginator .paginator-detail.active {
            visibility: visible;
            opacity: 1;
            transition: opacity 0.2s ease;
            pointer-events: auto;
        }

        /* 突出当前页码 */
        .paginator-page-number-active {
            background: var(--ai-input-primary);
            color: white;
            box-shadow: 0 0.125em 0.25em rgba(0, 0, 0, 0.1);
        }

        .paginator-page-number-active:hover {
            background: var(--ai-input-primary-hover);
            transform: translateY(-0.125em);
            box-shadow: 0 0.25em 0.5em rgba(0, 0, 0, 0.1);
        }


        @media (max-width: 600px) {

            /* 在小屏幕时调整 toolbar 左对齐*/
            .toolbar {
                flex-direction: row;
                align-items: flex-start;
                justify-content: flex-start;
            }
        }
        `,   // 内容由用户提供

        // 原始页面元素的选择器
        ORIGINAL_UI_CONTAINER_SELECTOR: '.bg-gradient-to-t.from-white.via-white.to-transparent.absolute.w-full.bottom-0.left-0.right-0.pb-4',
        ORIGINAL_INPUT_SELECTOR: '#ai-chat-input',
        ORIGINAL_SEND_BUTTON_SELECTOR: '#ai-send-button',
        INSERT_HTML_AFTER_SELECTOR: '#installedBuiltInCss',
        WIDTH_SYNC_TARGET_SELECTOR: '.grow.overflow-hidden',

        // 自定义UI中元素的ID
        INPUT_CONTAINER_ID: 'aiInputContainer',
        COMMENTS_BTN_ID: 'commentsBtn',
        SCROLL_BTN_ID: 'scrollBtn',
        TOGGLE_BTN_ID: 'toggleBtn',
        SWITCH_BTN_ID: 'switchBtn',
        ACTION_BTN_ID: 'actionBtn',
        SEND_BTN_ID: 'sendBtn',
        MESSAGE_INPUT_ID: 'messageInput',
        NOTIFICATION_DIV_ID: 'notification',
        TOGGLE_STATE_ID: 'toggleState',
        INPUT_AREA_ID: 'inputArea',
        PIN_BUTTON_ID: 'pinBtn',
        PIN_BUTTON_TOOLTIP_ID: 'pinBtnTooltip',
        STREAM_MODE_BTN_ID: 'streamModeBtn',
        STREAM_MODE_TOOLTIP_ID: 'streamModeTooltip',
        PAGINATOR_CONTAINER_ID: 'paginator-container',

        // 需要监控的原始按钮的文本内容
        NATIVE_BUTTON_TEXTS: {
            STREAM: ['流式', '非流式'],
            COMMENT: '评论',
            SCROLL_TO_BOTTOM: '回到底部'
        },
        ORIGINAL_BUTTONS_CONTAINER_SELECTOR: '.flex.items-center.gap-2.pb-2',

        // 选项自动填充相关选择器
        OPTIONS_PARENT_SELECTOR: 'div.markdown-body main opt',
        OPTIONS_AREA_SELECTOR: 'div.markdown-body main opt > div',
        OPTION_ITEM_SELECTOR: 'ol > li',

        // 样式ID
        CUSTOM_STYLE_ID: 'custom-input-ui-styles',

        // 等待元素超时
        ELEMENT_WAIT_TIMEOUT: 10000,
    };

    // =========================================================================
    // 2. 状态管理 (State Module)
    // =========================================================================
    const State = {
        isAdvancedMode: false,
        currentMode: '小说模式', // Default mode
        isInputAreaExpanded: false,
        isStreamMode: true, // Default stream mode
        isPinned: false,
        notificationTimeout: null,
        paginatorInstance: null,
        listenedOptElements: new Set(), // For OptionAutoFill: To track elements we've already attached listeners to
    };

    // =========================================================================
    // 3. 辅助函数 (Utilities Module)
    // =========================================================================
    const Utilities = {
        /**
         * 等待指定元素加载完成
         */
        waitForElement: function (selector, timeout = Config.ELEMENT_WAIT_TIMEOUT, context = document) {
            const MODULE_NAME = 'Utilities.waitForElement';
            return new Promise((resolve) => {
                const intervalTime = 100;
                let elapsedTime = 0;
                const timer = setInterval(() => {
                    const element = context.querySelector(selector);
                    if (element) {
                        clearInterval(timer);
                        Logger.debug(MODULE_NAME, `元素 "${selector}" 已找到。`);
                        resolve(element);
                    } else {
                        elapsedTime += intervalTime;
                        if (elapsedTime >= timeout) {
                            clearInterval(timer);
                            Logger.warn(MODULE_NAME, `等待元素 "${selector}" 超时。`);
                            resolve(null);
                        }
                    }
                }, intervalTime);
            });
        },

        /**
         * 注入CSS到页面
         */
        injectCSS: function (cssString, styleId = Config.CUSTOM_STYLE_ID) {
            const MODULE_NAME = 'Utilities.injectCSS';
            if (document.getElementById(styleId)) {
                Logger.warn(MODULE_NAME, `ID为 "${styleId}" 的样式表已存在，不再重复注入。`);
                return;
            }
            const styleElement = document.createElement('style');
            styleElement.id = styleId;
            styleElement.textContent = cssString;
            document.head.appendChild(styleElement);
            Logger.log(MODULE_NAME, `自定义CSS (ID: ${styleId}) 已注入。`);
        }
    };

    // =========================================================================
    // 4. 原生页面交互 (NativeBridge Module)
    // =========================================================================
    const NativeBridge = {
        /**
         * 获取当前选中的页码 (MUI specific)
         */
        getCurrentPage: function () {
            const MODULE_NAME = 'NativeBridge.getCurrentPage';
            const paginationNav = document.querySelector('nav.MuiPagination-root[aria-label="pagination navigation"], div.MuiPagination-root[aria-label="pagination navigation"]');
            if (!paginationNav) {
                Logger.warn(MODULE_NAME, '未找到 MUI 分页导航根元素。尝试备用选择器...');
                const selectedItemGeneric = document.querySelector('.MuiPaginationItem-root.Mui-selected[aria-current="page"], .MuiPaginationItem-root.Mui-selected.MuiPaginationItem-page');
                if (selectedItemGeneric) {
                    const pageText = selectedItemGeneric.textContent;
                    if (pageText && !isNaN(parseInt(pageText, 10))) {
                        Logger.log(MODULE_NAME, `通过备用选择器找到当前页: ${pageText}`);
                        return parseInt(pageText, 10);
                    }
                }
                Logger.warn(MODULE_NAME, '使用备用选择器未能找到当前页元素。');
                return null;
            }

            const currentPageElement = paginationNav.querySelector('button.MuiPaginationItem-page[aria-current="page"], button.MuiPaginationItem-page.Mui-selected');
            if (currentPageElement) {
                const pageText = currentPageElement.textContent;
                if (pageText) {
                    const pageNumber = parseInt(pageText, 10);
                    if (!isNaN(pageNumber)) {
                        Logger.log(MODULE_NAME, `当前页: ${pageNumber}`);
                        return pageNumber;
                    }
                    Logger.warn(MODULE_NAME, `找到当前页元素，但无法解析页码: ${pageText}`);
                } else {
                    Logger.warn(MODULE_NAME, '找到当前页元素，但无文本内容。');
                }
            } else {
                Logger.warn(MODULE_NAME, '在分页导航中未能找到当前页元素。');
            }
            return null;
        },

        /**
         * 获取总页码数 (MUI specific)
         */
        getTotalPages: function () {
            const MODULE_NAME = 'NativeBridge.getTotalPages';
            let jumpInputElement = null;
            const paginationNav = document.querySelector('nav.MuiPagination-root[aria-label="pagination navigation"], div.MuiPagination-root[aria-label="pagination navigation"]');

            if (paginationNav) {
                jumpInputElement = paginationNav.querySelector('input.MuiInputBase-input[type="text"][max]');
                if (!jumpInputElement && paginationNav.nextElementSibling && paginationNav.nextElementSibling.classList.contains('MuiStack-root')) {
                    jumpInputElement = paginationNav.nextElementSibling.querySelector('input.MuiInputBase-input[type="text"][max]');
                }
            }

            if (!jumpInputElement) {
                const allJumpInputs = document.querySelectorAll('input.MuiInputBase-input[type="text"][min][max]');
                if (allJumpInputs.length === 1) {
                    jumpInputElement = allJumpInputs[0];
                } else if (allJumpInputs.length > 1) {
                    for (let input of allJumpInputs) {
                        if (input.closest('nav.MuiPagination-root, div.MuiPagination-root')) {
                            jumpInputElement = input; break;
                        }
                        const parentText = input.parentElement?.parentElement?.textContent || "";
                        if (parentText.includes("跳至") || parentText.includes("页") || parentText.includes("Go to page")) {
                            jumpInputElement = input; break;
                        }
                    }
                    if (!jumpInputElement) {
                        Logger.warn(MODULE_NAME, '找到多个 "跳至" 输入框候选项，无法可靠确定。将使用第一个。');
                        jumpInputElement = allJumpInputs[0];
                    }
                }
            }

            if (jumpInputElement) {
                const maxAttribute = jumpInputElement.getAttribute('max');
                if (maxAttribute) {
                    const totalPages = parseInt(maxAttribute, 10);
                    if (!isNaN(totalPages)) {
                        Logger.log(MODULE_NAME, `通过 "跳至" 输入框找到总页数: ${totalPages}`);
                        return totalPages;
                    }
                    Logger.warn(MODULE_NAME, `找到 "跳至" 输入框的 "max" 属性，但无法解析: ${maxAttribute}`);
                } else {
                    Logger.warn(MODULE_NAME, '找到 "跳至" 输入框，但缺少 "max" 属性。');
                }
            } else {
                Logger.warn(MODULE_NAME, '未能找到 "跳至" 输入框。尝试从页码按钮推断。');
                const pageButtons = document.querySelectorAll(
                    'nav.MuiPagination-root .MuiPaginationItem-page:not(.MuiPaginationItem-ellipsis):not([aria-label*="previous"]):not([aria-label*="next"]):not([aria-label*="Previous"]):not([aria-label*="Next"]), div.MuiPagination-root .MuiPaginationItem-page:not(.MuiPaginationItem-ellipsis):not([aria-label*="previous"]):not([aria-label*="next"]):not([aria-label*="Previous"]):not([aria-label*="Next"])'
                );
                if (pageButtons.length > 0) {
                    const lastPageButton = pageButtons[pageButtons.length - 1];
                    const pageText = lastPageButton.textContent;
                    if (pageText && !isNaN(parseInt(pageText, 10))) {
                        const total = parseInt(pageText, 10);
                        Logger.log(MODULE_NAME, `通过最后一个页码按钮推断总页数为: ${total}`);
                        return total;
                    }
                }
                Logger.warn(MODULE_NAME, '无法通过 "跳至" 输入框或页码按钮确定总页数。');
            }
            return null;
        },

        /**
         * 跳转到指定页码 (MUI specific)
         */
        jumpToPage: function (pageNumber) {
            const MODULE_NAME = 'NativeBridge.jumpToPage';
            if (typeof pageNumber !== 'number' || !Number.isInteger(pageNumber)) {
                Logger.warn(MODULE_NAME, `无效的页码类型。期望整数，但得到: ${pageNumber} (类型: ${typeof pageNumber})`);
                return false;
            }
            const totalPages = this.getTotalPages();
            if (totalPages === null) {
                Logger.warn(MODULE_NAME, '无法确定总页数。中止跳转操作。');
                return false;
            }
            if (pageNumber < 1 || pageNumber > totalPages) {
                Logger.warn(MODULE_NAME, `无效的页码 ${pageNumber}。必须是 1 到 ${totalPages} 之间的整数。`);
                return false;
            }

            let jumpInputElement = null;
            const paginationNav = document.querySelector('nav.MuiPagination-root[aria-label="pagination navigation"], div.MuiPagination-root[aria-label="pagination navigation"]');
            if (paginationNav) {
                jumpInputElement = paginationNav.querySelector('input.MuiInputBase-input[type="text"][max]');
                if (!jumpInputElement && paginationNav.nextElementSibling && paginationNav.nextElementSibling.classList.contains('MuiStack-root')) {
                    jumpInputElement = paginationNav.nextElementSibling.querySelector('input.MuiInputBase-input[type="text"][max]');
                }
            }
            if (!jumpInputElement) {
                const allJumpInputs = document.querySelectorAll('input.MuiInputBase-input[type="text"][min][max]');
                if (allJumpInputs.length > 0) {
                    for (let input of allJumpInputs) {
                        const grandParentElement = input.parentElement?.parentElement;
                        const grandParentText = grandParentElement?.textContent || "";
                        if (input.closest('nav.MuiPagination-root, div.MuiPagination-root') ||
                            grandParentText.includes("跳至") || grandParentText.includes("页") ||
                            grandParentText.includes("Go to page")) {
                            jumpInputElement = input; break;
                        }
                    }
                    if (!jumpInputElement && allJumpInputs.length > 0) {
                        Logger.warn(MODULE_NAME, '找到多个 "跳至" 输入框候选，无法精确匹配，将使用第一个。');
                        jumpInputElement = allJumpInputs[0];
                    }
                }
            }

            if (!jumpInputElement) {
                Logger.error(MODULE_NAME, '未能找到 "跳至" 输入框以设置页码。');
                return false;
            }
            if (!(jumpInputElement instanceof HTMLInputElement)) {
                Logger.error(MODULE_NAME, `"jumpInputElement" 不是 HTMLInputElement 实例。构造函数: ${jumpInputElement?.constructor?.name}, 标签名: ${jumpInputElement?.tagName}`);
                return false;
            }

            Logger.log(MODULE_NAME, `准备跳转到页面: ${pageNumber}。找到的目标输入框:`, jumpInputElement);

            try {
                jumpInputElement.focus();
                const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
                if (nativeInputValueSetter) {
                    nativeInputValueSetter.call(jumpInputElement, pageNumber.toString());
                } else {
                    Logger.warn(MODULE_NAME, '未能获取 HTMLInputElement 原生 value setter。直接赋值。');
                    jumpInputElement.value = pageNumber.toString();
                }

                jumpInputElement.dispatchEvent(new Event('input', { bubbles: true, cancelable: true }));
                jumpInputElement.dispatchEvent(new Event('change', { bubbles: true, cancelable: true }));

                setTimeout(() => {
                    Logger.debug(MODULE_NAME, `(延迟后) 派发 "keydown" (Enter) 事件到:`, jumpInputElement);
                    const enterKeyDownEvent = new KeyboardEvent('keydown', {
                        key: 'Enter', code: 'Enter', keyCode: 13, which: 13, bubbles: true, cancelable: true
                    });
                    jumpInputElement.dispatchEvent(enterKeyDownEvent);
                    Logger.log(MODULE_NAME, `已尝试将页码设为 "${pageNumber}" 并模拟回车。`);
                }, 50);
                return true;
            } catch (e) {
                Logger.error(MODULE_NAME, "设置输入框值或派发事件时发生异常:", e);
                if (e instanceof TypeError && e.message.toLowerCase().includes('illegal invocation')) {
                    Logger.error(MODULE_NAME, "捕获到 'Illegal invocation' 错误。通常意味着原生 setter 未在正确的元素上下文 (this) 中调用。");
                }
                return false;
            }
        },

        /**
         * 查找原生按钮
         */
        findNativeButton: function (textOrTextArray, selector = 'button', containerSelector = Config.ORIGINAL_BUTTONS_CONTAINER_SELECTOR) {
            const MODULE_NAME = 'NativeBridge.findNativeButton';
            const container = document.querySelector(containerSelector);
            if (!container) {
                Logger.warn(MODULE_NAME, `未找到原生按钮的容器: ${containerSelector}`);
                return null;
            }

            const buttons = Array.from(container.querySelectorAll(selector));
            const foundButton = buttons.find(btn => {
                const btnText = btn.textContent?.trim() || '';
                const ariaLabel = btn.getAttribute('aria-label')?.trim() || '';
                if (Array.isArray(textOrTextArray)) {
                    return textOrTextArray.some(text => btnText.includes(text) || ariaLabel.includes(text));
                }
                return btnText.includes(textOrTextArray) || ariaLabel.includes(textOrTextArray);
            });

            if (foundButton) {
                Logger.debug(MODULE_NAME, `找到原生按钮: "${Array.isArray(textOrTextArray) ? textOrTextArray.join('/') : textOrTextArray}"`, foundButton);
            } else {
                Logger.warn(MODULE_NAME, `未找到原生按钮: "${Array.isArray(textOrTextArray) ? textOrTextArray.join('/') : textOrTextArray}" 于容器 ${containerSelector}`);
            }
            return foundButton;
        },

        /**
         * 填充原生输入框并触发React更新
         */
        fillInputAndTriggerUpdate: async function (textToFill, targetSelector = Config.ORIGINAL_INPUT_SELECTOR) {
            const MODULE_NAME = 'NativeBridge.fillInputAndTriggerUpdate';
            const inputElement = await Utilities.waitForElement(targetSelector);
            if (!inputElement) {
                Logger.error(MODULE_NAME, `未能找到目标输入框 "${targetSelector}"`);
                return;
            }

            Logger.log(MODULE_NAME, `找到输入框，准备填充内容: "${textToFill.substring(0, 50)}..."`);

            let setterToUse = null;
            if (inputElement instanceof HTMLTextAreaElement) {
                setterToUse = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set;
            } else if (inputElement instanceof HTMLInputElement) {
                setterToUse = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;
            }

            if (setterToUse) {
                setterToUse.call(inputElement, textToFill);
                Logger.debug(MODULE_NAME, "已调用原生 value setter 设置值。");
            } else {
                inputElement.value = textToFill;
                Logger.warn(MODULE_NAME, "使用标准 .value 赋值 (原生setter未找到或类型不匹配)。");
            }

            const inputEvent = new Event('input', { bubbles: true, cancelable: true });
            inputElement.dispatchEvent(inputEvent);
            Logger.debug(MODULE_NAME, "已派发 'input' 事件。");
            // const changeEvent = new Event('change', { bubbles: true, cancelable: true });
            // inputElement.dispatchEvent(changeEvent);
            // Logger.debug(MODULE_NAME, "已派发 'change' 事件。");

            Logger.log(MODULE_NAME, "内容填充及事件派发完成。");
        }
    };

    // =========================================================================
    // 5. UI管理器 (UIManager Module)
    // =========================================================================
    const UIManager = {
        elements: {}, // To store references to custom UI elements

        /**
         * 初始化DOM元素，注入HTML和CSS
         */
        initializeDOM: async function () {
            const MODULE_NAME = 'UIManager.initializeDOM';
            Logger.log(MODULE_NAME, '开始初始化DOM...');

            // 0. 等待关键原始元素
            const originalInputElement = await Utilities.waitForElement(Config.ORIGINAL_INPUT_SELECTOR);
            const originalSendButtonElement = await Utilities.waitForElement(Config.ORIGINAL_SEND_BUTTON_SELECTOR);
            const originalUiContainer = document.querySelector(Config.ORIGINAL_UI_CONTAINER_SELECTOR);

            if (!originalInputElement || !originalSendButtonElement) {
                Logger.error(MODULE_NAME, '一个或多个关键原始UI元素未找到，自定义UI初始化失败。');
                return false;
            }
            Logger.log(MODULE_NAME, '关键原始UI元素已找到。');

            // 1. 隐藏原始UI容器
            if (originalUiContainer) {
                originalUiContainer.style.opacity = '0';
                originalUiContainer.style.pointerEvents = 'none';
                originalUiContainer.style.zIndex = '-100';
                Logger.log(MODULE_NAME, `原始UI容器已隐藏: ${Config.ORIGINAL_UI_CONTAINER_SELECTOR}`);
            } else {
                Logger.warn(MODULE_NAME, `未找到原始UI容器 ${Config.ORIGINAL_UI_CONTAINER_SELECTOR}. 尝试隐藏输入框和发送按钮本身.`);
                if (originalInputElement.parentElement !== originalUiContainer) originalInputElement.style.display = 'none';
                if (originalSendButtonElement.parentElement !== originalUiContainer) originalSendButtonElement.style.display = 'none';
            }

            // 2. 注入自定义HTML
            const insertAfterElement = await Utilities.waitForElement(Config.INSERT_HTML_AFTER_SELECTOR);
            if (Config.YOUR_CUSTOM_HTML.trim() !== "" && Config.YOUR_CUSTOM_HTML.trim() !== "已经写好了，不重要，请忽略") {
                if (insertAfterElement) {
                    insertAfterElement.insertAdjacentHTML('afterend', Config.YOUR_CUSTOM_HTML);
                    Logger.log(MODULE_NAME, `自定义HTML已插入到 "${Config.INSERT_HTML_AFTER_SELECTOR}" 之后。`);
                } else {
                    Logger.warn(MODULE_NAME, `未找到HTML插入点 "${Config.INSERT_HTML_AFTER_SELECTOR}". 追加到 body 末尾。`);
                    document.body.insertAdjacentHTML('beforeend', Config.YOUR_CUSTOM_HTML);
                }
            } else {
                Logger.log(MODULE_NAME, 'YOUR_CUSTOM_HTML 为空或占位符，跳过HTML注入。');
            }


            // 3. 注入自定义CSS
            if (Config.YOUR_CUSTOM_CSS.trim() !== "" && Config.YOUR_CUSTOM_CSS.trim() !== "已经写好了，不重要，请忽略") {
                Utilities.injectCSS(Config.YOUR_CUSTOM_CSS, Config.CUSTOM_STYLE_ID);
            } else {
                Logger.log(MODULE_NAME, 'YOUR_CUSTOM_CSS 为空或占位符，跳过CSS注入。');
            }


            // 缓存自定义UI元素
            this.elements.aiInputContainer = document.getElementById(Config.INPUT_CONTAINER_ID);
            this.elements.commentsBtn = document.getElementById(Config.COMMENTS_BTN_ID);
            this.elements.scrollBtn = document.getElementById(Config.SCROLL_BTN_ID);
            this.elements.toggleBtn = document.getElementById(Config.TOGGLE_BTN_ID);
            this.elements.switchBtn = document.getElementById(Config.SWITCH_BTN_ID);
            this.elements.actionBtn = document.getElementById(Config.ACTION_BTN_ID);
            this.elements.sendBtn = document.getElementById(Config.SEND_BTN_ID);
            this.elements.messageInput = document.getElementById(Config.MESSAGE_INPUT_ID);
            this.elements.notificationDiv = document.getElementById(Config.NOTIFICATION_DIV_ID);
            this.elements.toggleState = document.getElementById(Config.TOGGLE_STATE_ID);
            this.elements.inputArea = document.getElementById(Config.INPUT_AREA_ID);
            this.elements.pinButton = document.getElementById(Config.PIN_BUTTON_ID);
            this.elements.pinButtonTooltip = document.getElementById(Config.PIN_BUTTON_TOOLTIP_ID);
            this.elements.streamModeBtn = document.getElementById(Config.STREAM_MODE_BTN_ID);
            this.elements.streamModeTooltip = document.getElementById(Config.STREAM_MODE_TOOLTIP_ID);

            if (!this.elements.aiInputContainer || !this.elements.messageInput || !this.elements.sendBtn) {
                if (Config.YOUR_CUSTOM_HTML.trim() !== "" && Config.YOUR_CUSTOM_HTML.trim() !== "已经写好了，不重要，请忽略") {
                    Logger.error(MODULE_NAME, '缺少关键自定义UI元素 (aiInputContainer, messageInput, or sendBtn)。请检查HTML和ID。');
                    // return false; // 如果HTML被用户忽略，这里不应该报错
                } else {
                    Logger.log(MODULE_NAME, '自定义HTML被忽略，因此不查找自定义UI元素。')
                }
            }

            // 4. 同步布局
            this.syncLayout(originalUiContainer);
            return true;
        },

        /**
         * 同步宽度、高度和通知位置
         */
        syncLayout: function (originalUiContainer) {
            const MODULE_NAME = 'UIManager.syncLayout';
            const { aiInputContainer, notificationDiv } = this.elements;
            const growOverflowElement = document.querySelector(Config.WIDTH_SYNC_TARGET_SELECTOR);

            // 宽度同步
            if (growOverflowElement && aiInputContainer) {
                const syncWidth = () => {
                    if (!document.body.contains(growOverflowElement) || !document.body.contains(aiInputContainer)) return;
                    const rect = growOverflowElement.getBoundingClientRect();
                    aiInputContainer.style.width = `${rect.width}px`;
                };
                syncWidth();
                window.addEventListener('resize', syncWidth);
                if (window.ResizeObserver) new ResizeObserver(syncWidth).observe(growOverflowElement);
                Logger.log(MODULE_NAME, '宽度同步已设置。');
            } else {
                Logger.warn(MODULE_NAME, `宽度同步目标 (${Config.WIDTH_SYNC_TARGET_SELECTOR}) 或自定义容器 (${Config.INPUT_CONTAINER_ID}) 未找到。`);
            }

            // 通知位置同步
            if (growOverflowElement && notificationDiv) {
                const syncNotificationRight = () => {
                    if (!document.body.contains(growOverflowElement) || !document.body.contains(notificationDiv)) return;
                    const rect = growOverflowElement.getBoundingClientRect();
                    notificationDiv.style.right = `${0.5 * rect.width}px`;
                };
                syncNotificationRight();
                window.addEventListener('resize', syncNotificationRight);
                if (window.ResizeObserver) new ResizeObserver(syncNotificationRight).observe(growOverflowElement);
                Logger.log(MODULE_NAME, '通知位置同步已设置。');
            } else {
                if (notificationDiv) Logger.warn(MODULE_NAME, `通知位置同步目标 (${Config.WIDTH_SYNC_TARGET_SELECTOR}) 未找到。`);
                // else: notificationDiv本身未找到，已在initializeDOM记录
            }

            // 高度同步
            if (originalUiContainer && aiInputContainer) {
                const syncOriginalUiHeight = () => {
                    if (!document.body.contains(originalUiContainer) || !document.body.contains(aiInputContainer)) return;
                    const aiRect = aiInputContainer.getBoundingClientRect();
                    originalUiContainer.style.height = `${aiRect.height}px`;
                    originalUiContainer.style.minHeight = `${aiRect.height}px`;
                };
                syncOriginalUiHeight();
                window.addEventListener('resize', syncOriginalUiHeight);
                if (window.ResizeObserver) new ResizeObserver(syncOriginalUiHeight).observe(aiInputContainer);
                Logger.log(MODULE_NAME, '原始UI与自定义UI高度同步已设置。');
            } else {
                if (originalUiContainer && !aiInputContainer) Logger.warn(MODULE_NAME, `自定义输入容器 (${Config.INPUT_CONTAINER_ID}) 未找到，无法同步高度。`);
                // else if (!originalUiContainer && aiInputContainer) // 原始容器未找到已在initializeDOM记录
            }
        },

        /**
         * 显示通知
         */
        showNotification: function (text, type = 'success', duration = 2000) {
            const MODULE_NAME = 'UIManager.showNotification';
            const { notificationDiv } = this.elements;
            if (!notificationDiv) {
                Logger.warn(MODULE_NAME, `通知元素 ("${Config.NOTIFICATION_DIV_ID}") 未找到! Fallback to alert: ${text}`);
                alert(text);
                return;
            }
            notificationDiv.textContent = text;
            notificationDiv.className = 'notification'; // Reset

            let bgColorVar = 'var(--ai-input-success, #4caf50)';
            if (type === 'error') {
                bgColorVar = 'var(--ai-input-danger, #f44336)';
                notificationDiv.classList.add('error');
            } else if (type === 'info') {
                bgColorVar = 'var(--ai-input-secondary, #2196f3)';
                notificationDiv.classList.add('info');
            }
            notificationDiv.style.backgroundColor = bgColorVar;
            notificationDiv.classList.add('show');

            clearTimeout(State.notificationTimeout);
            State.notificationTimeout = setTimeout(() => {
                if (document.body.contains(notificationDiv)) { // Check if still in DOM
                    notificationDiv.classList.remove('show');
                }
            }, duration);
            Logger.log(MODULE_NAME, `显示通知: "${text}", 类型: ${type}`);
        },

        /**
         * 更新固定按钮视觉效果
         */
        updatePinButtonVisuals: function () {
            const MODULE_NAME = 'UIManager.updatePinButtonVisuals';
            const { pinButton, pinButtonTooltip } = this.elements;
            if (!pinButton || !pinButtonTooltip) {
                // Logger.debug(MODULE_NAME, '固定按钮或其提示未找到，跳过视觉更新。');
                return;
            }
            if (State.isPinned) {
                pinButton.classList.add('pinned');
                pinButtonTooltip.textContent = '已固定';
            } else {
                pinButton.classList.remove('pinned');
                pinButtonTooltip.textContent = '点击固定';
            }
            Logger.debug(MODULE_NAME, `固定按钮视觉已更新，固定状态: ${State.isPinned}`);
        },

        /**
         * 展开输入区域
         */
        expandInputArea: function () {
            const MODULE_NAME = 'UIManager.expandInputArea';
            const { inputArea } = this.elements;
            if (!inputArea) { /* Logger.debug(MODULE_NAME, '输入区域未找到，无法展开。'); */ return; }

            if (!State.isInputAreaExpanded) {
                Logger.debug(MODULE_NAME, '尝试展开输入区域...');
                inputArea.style.maxHeight = 'none'; // Temporarily remove constraint to measure scrollHeight
                const scrollHeight = inputArea.scrollHeight;
                inputArea.style.maxHeight = '0px'; // Reset for transition
                requestAnimationFrame(() => {
                    if (!document.body.contains(inputArea)) return; // Re-check
                    inputArea.style.maxHeight = scrollHeight + 'px';
                    inputArea.classList.add('expanded');
                    State.isInputAreaExpanded = true;
                    this.updatePinButtonVisuals();
                    Logger.log(MODULE_NAME, `输入区域已展开至 ${scrollHeight}px。`);
                });
            }
        },

        /**
         * 折叠输入区域
         */
        collapseInputArea: function () {
            const MODULE_NAME = 'UIManager.collapseInputArea';
            const { inputArea } = this.elements;
            if (!inputArea) { /* Logger.debug(MODULE_NAME, '输入区域未找到，无法折叠。'); */ return; }

            if (State.isInputAreaExpanded && !State.isPinned) {
                Logger.debug(MODULE_NAME, '尝试折叠输入区域...');
                inputArea.style.maxHeight = '0px';
                inputArea.classList.remove('expanded');
                State.isInputAreaExpanded = false;
                this.updatePinButtonVisuals();
                Logger.log(MODULE_NAME, '输入区域已折叠。');
            }
        },

        /**
         * 自动调整文本域高度
         */
        autoResizeTextarea: function () {
            const MODULE_NAME = 'UIManager.autoResizeTextarea';
            const { messageInput, inputArea } = this.elements;
            if (!messageInput) { /* Logger.debug(MODULE_NAME, '消息输入框未找到，无法自动调整大小。'); */ return; }

            messageInput.style.height = 'auto';
            let newHeight = messageInput.scrollHeight;
            const maxHeightStyle = getComputedStyle(messageInput).maxHeight;
            const maxHeight = maxHeightStyle && maxHeightStyle !== 'none' ? parseFloat(maxHeightStyle) : Infinity;

            if (newHeight > maxHeight) {
                newHeight = maxHeight;
                messageInput.style.overflowY = 'auto';
            } else {
                messageInput.style.overflowY = 'hidden';
            }
            messageInput.style.height = newHeight + 'px';
            // Logger.debug(MODULE_NAME, `文本域高度已调整为: ${newHeight}px`);

            if (State.isInputAreaExpanded && inputArea) {
                requestAnimationFrame(() => { // Ensure recalculation after DOM update
                    if (!document.body.contains(inputArea) || !document.body.contains(messageInput)) return;
                    inputArea.style.maxHeight = 'none'; // Allow it to grow
                    const requiredHeight = inputArea.scrollHeight;
                    inputArea.style.maxHeight = requiredHeight + 'px';
                    // Logger.debug(MODULE_NAME, `输入区域整体高度已调整为: ${requiredHeight}px`);
                });
            }
        },

        /**
         * 更新模式切换按钮的显示
         */
        updateModeButtonDisplay: function () {
            const MODULE_NAME = 'UIManager.updateModeButtonDisplay';
            const { toggleBtn, toggleState } = this.elements;
            if (!toggleBtn || !toggleState) {
                Logger.warn(MODULE_NAME, '模式切换按钮或状态显示元素未找到。');
                return;
            }
            const icon = toggleBtn.querySelector('i');
            if (!icon) {
                Logger.warn(MODULE_NAME, '模式切换按钮图标未找到。');
                return;
            }

            if (State.currentMode === '角色扮演模式') {
                icon.className = 'fas fa-feather-alt'; // Or theater-masks, adjust based on initial
            } else if (State.currentMode === '小说模式') {
                icon.className = 'fas fa-theater-masks'; // Or feather-alt
            }
            toggleState.textContent = State.currentMode;
            Logger.log(MODULE_NAME, `模式按钮显示已更新为: ${State.currentMode}`);
        }
    };

    // =========================================================================
    // 6. 自定义控件逻辑 (CustomControls Module)
    // =========================================================================
    const CustomControls = {
        initialize: function () {
            const MODULE_NAME = 'CustomControls.initialize';
            Logger.log(MODULE_NAME, '开始初始化自定义控件事件监听器...');
            const elements = UIManager.elements;

            // 输入区域展开/折叠逻辑
            if (elements.aiInputContainer) {
                elements.aiInputContainer.addEventListener('mouseenter', () => {
                    if (!State.isPinned) UIManager.expandInputArea();
                });
                elements.aiInputContainer.addEventListener('mouseleave', () => {
                    if (!State.isPinned && elements.messageInput && !elements.messageInput.matches(':focus')) {
                        UIManager.collapseInputArea();
                    }
                });
            } else { Logger.warn(MODULE_NAME, `aiInputContainer (${Config.INPUT_CONTAINER_ID}) 未找到，相关交互受限。`); }

            if (elements.messageInput) {
                elements.messageInput.addEventListener('focus', () => {
                    if (!State.isPinned) UIManager.expandInputArea();
                });
                elements.messageInput.addEventListener('blur', () => {
                    if (!State.isPinned && elements.aiInputContainer && !elements.aiInputContainer.matches(':hover')) {
                        UIManager.collapseInputArea();
                    }
                });
                elements.messageInput.addEventListener('input', UIManager.autoResizeTextarea.bind(UIManager));
                UIManager.autoResizeTextarea(); // Initial call
            } else { Logger.warn(MODULE_NAME, `messageInput (${Config.MESSAGE_INPUT_ID}) 未找到，相关交互受限。`); }

            // 固定按钮
            if (elements.pinButton) {
                elements.pinButton.addEventListener('click', this.handlePinToggle.bind(this));
                UIManager.updatePinButtonVisuals(); // Initial call
                if (State.isPinned) UIManager.expandInputArea();
            } else { Logger.warn(MODULE_NAME, `pinButton (${Config.PIN_BUTTON_ID}) 未找到。`); }

            // 评论按钮
            if (elements.commentsBtn) {
                elements.commentsBtn.addEventListener('click', this.handleCommentsClick.bind(this));
            } else { Logger.warn(MODULE_NAME, `commentsBtn (${Config.COMMENTS_BTN_ID}) 未找到。`); }

            // 滚动按钮
            if (elements.scrollBtn) {
                elements.scrollBtn.addEventListener('click', this.handleScrollClick.bind(this));
            } else { Logger.warn(MODULE_NAME, `scrollBtn (${Config.SCROLL_BTN_ID}) 未找到。`); }

            // 流式模式按钮
            if (elements.streamModeBtn && elements.streamModeTooltip) {
                elements.streamModeBtn.addEventListener('click', this.handleStreamModeToggle.bind(this));
                this._updateStreamModeVisuals(); // Initial call
            } else { Logger.warn(MODULE_NAME, `streamModeBtn (${Config.STREAM_MODE_BTN_ID}) 或其 Tooltip 未找到。`); }

            // 模式切换按钮 (小说/角色扮演)
            if (elements.toggleBtn && elements.toggleState) {
                elements.toggleBtn.addEventListener('click', this.handleModeToggle.bind(this));
                UIManager.updateModeButtonDisplay(); // Initial call to set correct icon and text
            } else { Logger.warn(MODULE_NAME, `toggleBtn (${Config.TOGGLE_BTN_ID}) 或 toggleState (${Config.TOGGLE_STATE_ID}) 未找到。`); }

            // 瑟瑟增强开关
            if (elements.switchBtn) {
                elements.switchBtn.addEventListener('click', this.handleAdvancedModeToggle.bind(this));
                this._updateAdvancedModeVisuals(); // Initial
            } else { Logger.warn(MODULE_NAME, `switchBtn (${Config.SWITCH_BTN_ID}) 未找到。`); }

            // 优化按钮
            if (elements.actionBtn) {
                elements.actionBtn.addEventListener('click', this.handleActionClick.bind(this));
            } else { Logger.warn(MODULE_NAME, `actionBtn (${Config.ACTION_BTN_ID}) 未找到。`); }

            // 发送按钮
            if (elements.sendBtn && elements.messageInput) {
                elements.sendBtn.addEventListener('click', this.handleSendClick.bind(this));
            } else { Logger.warn(MODULE_NAME, `sendBtn (${Config.SEND_BTN_ID}) 或 messageInput (${Config.MESSAGE_INPUT_ID}) 未找到，发送功能受限。`); }

            // 输入框键盘事件
            if (elements.messageInput) {
                elements.messageInput.addEventListener('keydown', this.handleKeyDown.bind(this));
            } else { Logger.warn(MODULE_NAME, `messageInput (${Config.MESSAGE_INPUT_ID}) 未找到，键盘事件监听未绑定。`); }

            Logger.log(MODULE_NAME, '自定义控件事件监听器初始化完成。');
        },

        setMode: function (newMode) { // Exposed as window.setMode
            const MODULE_NAME = 'CustomControls.setMode';
            if (newMode === '角色扮演模式' || newMode === '小说模式') {
                State.currentMode = newMode;
                UIManager.updateModeButtonDisplay();
                Logger.log(MODULE_NAME, `模式已设置为: ${State.currentMode}`);
            } else {
                Logger.warn(MODULE_NAME, `尝试设置无效模式: ${newMode}`);
            }
        },

        getCurrentModeComment: function () { // Exposed as window.getCurrentMode
            return `<!-- ${State.currentMode};瑟瑟状态: ${State.isStreamMode ? '开启' : '关闭'} -->`;
        },

        handlePinToggle: function () {
            State.isPinned = !State.isPinned;
            if (State.isPinned) {
                UIManager.expandInputArea();
            } else {
                // If not hovering and not focused, collapse
                if (UIManager.elements.aiInputContainer && !UIManager.elements.aiInputContainer.matches(':hover') &&
                    UIManager.elements.messageInput && !UIManager.elements.messageInput.matches(':focus')) {
                    UIManager.collapseInputArea();
                }
            }
            UIManager.updatePinButtonVisuals();
            UIManager.showNotification(State.isPinned ? '输入面板已固定' : '输入面板已取消固定');
        },

        handleCommentsClick: function () {
            const MODULE_NAME = 'CustomControls.handleCommentsClick';
            const nativeCommentButton = NativeBridge.findNativeButton(Config.NATIVE_BUTTON_TEXTS.COMMENT);
            if (nativeCommentButton) {
                Logger.log(MODULE_NAME, '触发原生评论按钮。');
                nativeCommentButton.click();
                UIManager.showNotification('已触发原生评论功能。');
            } else {
                UIManager.showNotification('“评论”功能待实现或未找到原生按钮。', 'info');
            }
        },

        handleScrollClick: function () {
            const MODULE_NAME = 'CustomControls.handleScrollClick';
            const nativeScrollButton = NativeBridge.findNativeButton(Config.NATIVE_BUTTON_TEXTS.SCROLL_TO_BOTTOM);
            if (nativeScrollButton) {
                Logger.log(MODULE_NAME, '触发原生滚动到底部按钮。');
                nativeScrollButton.click();
                UIManager.showNotification('已触发原生滚动到底部功能。');
            } else {
                window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
                UIManager.showNotification('已滚动到页面底部 (原生按钮未找到)。', 'info');
            }
        },

        _updateStreamModeVisuals: function () {
            const MODULE_NAME = 'CustomControls._updateStreamModeVisuals';
            const { streamModeBtn, streamModeTooltip } = UIManager.elements;
            if (!streamModeBtn || !streamModeTooltip) return;
            const icon = streamModeBtn.querySelector('i');
            if (!icon) { Logger.warn(MODULE_NAME, '流式模式按钮图标未找到。'); return; }

            if (State.isStreamMode) {
                icon.className = 'fas fa-water';
                streamModeBtn.style.backgroundColor = 'rgba(74, 108, 247, 0.1)';
                streamModeBtn.style.color = 'var(--ai-input-primary, #4A6CF7)';
                streamModeTooltip.textContent = '输出模式: 流式';
            } else {
                icon.className = 'fas fa-stop';
                streamModeBtn.style.backgroundColor = 'rgba(108, 117, 125, 0.1)';
                streamModeBtn.style.color = 'var(--ai-input-secondary, #6C757D)';
                streamModeTooltip.textContent = '输出模式: 非流式';
            }
            Logger.debug(MODULE_NAME, `流式模式视觉已更新，状态: ${State.isStreamMode ? '流式' : '非流式'}`);
        },

        handleStreamModeToggle: function () {
            const MODULE_NAME = 'CustomControls.handleStreamModeToggle';
            State.isStreamMode = !State.isStreamMode;
            this._updateStreamModeVisuals();
            UIManager.showNotification(`已切换为 ${State.isStreamMode ? '流式' : '非流式'}输出模式`);

            const nativeStreamButton = NativeBridge.findNativeButton(Config.NATIVE_BUTTON_TEXTS.STREAM);
            if (nativeStreamButton) {
                nativeStreamButton.click();
                Logger.log(MODULE_NAME, '已同步点击原生(非)流式切换按钮。');
                UIManager.showNotification(`已同步切换原生输出模式`, 'info');
            } else {
                UIManager.showNotification(`未找到原生(非)流式切换按钮。`, 'info');
            }
        },

        handleModeToggle: function () {
            const MODULE_NAME = 'CustomControls.handleModeToggle';
            if (State.currentMode === '小说模式') {
                this.setMode('角色扮演模式');
                UIManager.showNotification('已切换到角色扮演模式');
            } else {
                this.setMode('小说模式');
                UIManager.showNotification('已切换到小说模式');
            }
            Logger.log(MODULE_NAME, `模式切换按钮点击，当前模式: ${State.currentMode}`);
        },

        _updateAdvancedModeVisuals: function () {
            const MODULE_NAME = 'CustomControls._updateAdvancedModeVisuals';
            const { switchBtn } = UIManager.elements;
            if (!switchBtn) return;

            const icon = switchBtn.querySelector('i');
            const tooltipSpan = switchBtn.querySelector('.tooltip-text');
            // const switchBtnStateSpan = switchBtn.querySelector('#switchBtnState'); // This ID was not in your example HTML

            if (icon) icon.className = State.isAdvancedMode ? 'fas fa-toggle-on' : 'fas fa-toggle-off';
            if (State.isAdvancedMode) {
                switchBtn.style.backgroundColor = 'rgba(16, 185, 129, 0.1)';
                switchBtn.style.color = 'var(--ai-input-success, #10B981)';
                if (tooltipSpan) tooltipSpan.textContent = '瑟瑟增强 (已开启)';
            } else {
                switchBtn.style.backgroundColor = ''; // Reset to default
                switchBtn.style.color = ''; // Reset to default
                if (tooltipSpan) tooltipSpan.textContent = '瑟瑟增强 (已关闭)';
            }
            // if (switchBtnStateSpan) switchBtnStateSpan.textContent = State.isAdvancedMode ? ' (已开启)' : ' (已关闭)';
            Logger.debug(MODULE_NAME, `高级模式视觉已更新，状态: ${State.isAdvancedMode ? '开启' : '关闭'}`);
        },

        handleAdvancedModeToggle: function () {
            State.isAdvancedMode = !State.isAdvancedMode;
            this._updateAdvancedModeVisuals();
            UIManager.showNotification(`瑟瑟增强已${State.isAdvancedMode ? '开启' : '关闭'}`);
        },

        handleActionClick: function () {
            const MODULE_NAME = 'CustomControls.handleActionClick';
            const { actionBtn } = UIManager.elements;
            if (!actionBtn) return;

            if (typeof actionBtn.animate === 'function') {
                actionBtn.animate([
                    { transform: 'scale(1) rotate(0deg)', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0.4)' },
                    { transform: 'scale(1.1) rotate(10deg) ', boxShadow: '0 0 0 10px rgba(59, 130, 246, 0)' },
                    { transform: 'scale(1) rotate(0deg) ', boxShadow: '0 0 0 0 rgba(59, 130, 246, 0)' }
                ], { duration: 600, easing: 'cubic-bezier(0.175, 0.885, 0.32, 1.275)', iterations: 1 });
            }

            let count = 0;
            UIManager.showNotification('开始优化...', 'info');
            const intervalId = setInterval(() => {
                count++;
                if (count <= 3) {
                    UIManager.showNotification(`内容已优化 (${count}/3)`, 'info', 1000);
                }
                if (count >= 3) {
                    clearInterval(intervalId);
                    setTimeout(() => UIManager.showNotification('内容优化完成！', 'success'), 300);
                    Logger.log(MODULE_NAME, '内容优化动画完成。');
                }
            }, 700);
        },

        handleSendClick: async function () {
            const MODULE_NAME = 'CustomControls.handleSendClick';
            const { messageInput } = UIManager.elements;
            const originalSendButtonElement = await Utilities.waitForElement(Config.ORIGINAL_SEND_BUTTON_SELECTOR);

            if (!messageInput || !originalSendButtonElement) {
                Logger.error(MODULE_NAME, `发送功能所需元素 (输入框或原生发送按钮) 未找到。`);
                UIManager.showNotification('发送失败：内部错误。', 'error');
                return;
            }

            const message = messageInput.value.trim();
            if (message) {
                UIManager.showNotification(`消息发送中...`, 'info');
                await NativeBridge.fillInputAndTriggerUpdate(message, Config.ORIGINAL_INPUT_SELECTOR);

                if (originalSendButtonElement.disabled) {
                    Logger.warn(MODULE_NAME, '原生发送按钮当前被禁用。');
                    UIManager.showNotification('发送失败：原生按钮被禁用。', 'error');
                    return;
                }
                originalSendButtonElement.click();
                Logger.log(MODULE_NAME, '已点击原生发送按钮。');

                setTimeout(() => {
                    UIManager.showNotification(`消息: "${message.substring(0, 20)}${message.length > 20 ? '...' : ''}" 已发送`, 'success');
                    if (document.body.contains(messageInput)) { // Check if still in DOM
                        messageInput.value = '';
                        UIManager.autoResizeTextarea();
                        if (!State.isPinned && UIManager.elements.aiInputContainer && !UIManager.elements.aiInputContainer.matches(':hover')) {
                            UIManager.collapseInputArea();
                        }
                    }
                }, 300);
            } else {
                UIManager.showNotification('请输入消息内容！', 'error');
                if (document.body.contains(messageInput)) messageInput.focus();
            }
        },

        handleKeyDown: function (event) {
            // Enter (发送)
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                this.handleSendClick();
                return;
            }

            // Shift+Enter (换行)
            if (event.key === 'Enter' && event.shiftKey) {
                // 允许换行，自动调整高度
                setTimeout(() => UIManager.autoResizeTextarea(), 0);
            }
        }
    };

    // =========================================================================
    // 7. 选项自动填充 (OptionAutoFill Module)
    // =========================================================================
    const OptionAutoFill = {
        initialize: function () {
            const MODULE_NAME = 'OptionAutoFill.initialize';
            Logger.log(MODULE_NAME, '初始化选项自动填充监控...');

            if (!window.DOMWatcherService) {
                Logger.error(MODULE_NAME, 'DOMWatcherService 未找到，选项自动填充功能无法启动。');
                return;
            }
            if (!window.DOMWatcherService.register || typeof window.DOMWatcherService.register !== 'function') {
                Logger.error(MODULE_NAME, 'DOMWatcherService.register 不是一个函数或未定义，选项自动填充功能无法启动。');
                return;
            }

            try {
                window.DOMWatcherService.register({
                    selector: Config.OPTIONS_PARENT_SELECTOR,
                    id: 'customUI-optionsParentWatcher',
                    eventTypes: ['added'],
                    once: false,
                    callback: this.handleOptElement.bind(this)
                });
                Logger.log(MODULE_NAME, `已注册 DOMWatcherService 监听 "${Config.OPTIONS_PARENT_SELECTOR}"。`);
            } catch (e) {
                Logger.error(MODULE_NAME, "注册 DOMWatcherService 时发生错误:", e);
            }
        },

        handleOptElement: function (optionsParentElement, eventType) {
            const MODULE_NAME = 'OptionAutoFill.handleOptElement';
            Logger.debug(MODULE_NAME, `选项父容器 <opt> ("${Config.OPTIONS_PARENT_SELECTOR}") 已 ${eventType}:`, optionsParentElement);

            if (!State.listenedOptElements.has(optionsParentElement)) {
                optionsParentElement.addEventListener('click', this.activeOptionClickListener.bind(this));
                State.listenedOptElements.add(optionsParentElement);
                Logger.log(MODULE_NAME, '选项点击监听器已附加到新发现的 <opt>:', optionsParentElement);
            } else {
                Logger.debug(MODULE_NAME, '选项点击监听器已存在于 <opt>:', optionsParentElement);
            }
        },

        activeOptionClickListener: function (event) {
            const MODULE_NAME = 'OptionAutoFill.activeOptionClickListener';
            const clickedLiElement = event.target.closest(Config.OPTION_ITEM_SELECTOR);

            if (!clickedLiElement) {
                Logger.debug(MODULE_NAME, '点击事件未命中有效选项条目。');
                return;
            }
            Logger.debug(MODULE_NAME, '有效选项条目被点击:', clickedLiElement);


            const specificOptionsArea = clickedLiElement.closest(Config.OPTIONS_AREA_SELECTOR);
            if (!specificOptionsArea) {
                Logger.warn(MODULE_NAME, `找到了 li，但未能找到其所属的选项区 (${Config.OPTIONS_AREA_SELECTOR})。`, clickedLiElement);
                return;
            }

            const currentOptParent = clickedLiElement.closest(Config.OPTIONS_PARENT_SELECTOR);
            if (!currentOptParent) {
                Logger.warn(MODULE_NAME, `找到了 li，但未能找到其所属的父级 <opt> (${Config.OPTIONS_PARENT_SELECTOR})。`);
                return;
            }

            const allOptParentsInDom = Array.from(document.querySelectorAll(Config.OPTIONS_PARENT_SELECTOR));
            const isLastOptParent = allOptParentsInDom.length > 0 && allOptParentsInDom[allOptParentsInDom.length - 1] === currentOptParent;
            Logger.debug(MODULE_NAME, `<opt> 被点击 (是否为最后一个: ${isLastOptParent}). 目标 li: "${clickedLiElement.textContent?.trim()}"`);

            const optionsInThisArea = Array.from(specificOptionsArea.querySelectorAll(Config.OPTION_ITEM_SELECTOR));
            if (optionsInThisArea.length === 0) {
                Logger.warn(MODULE_NAME, `在当前选项区 (${Config.OPTIONS_AREA_SELECTOR}) 内未找到任何选项元素。`);
                return;
            }

            const clickedIndexInThisArea = optionsInThisArea.indexOf(clickedLiElement);

            if (isLastOptParent && optionsInThisArea.length === 4) {
                if (clickedIndexInThisArea === 0 || clickedIndexInThisArea === 1) {
                    CustomControls.setMode('角色扮演模式');
                    Logger.log(MODULE_NAME, '[最后一个选项区] 模式因选项点击切换为: 角色扮演模式');
                } else if (clickedIndexInThisArea === 2 || clickedIndexInThisArea === 3) {
                    CustomControls.setMode('小说模式');
                    Logger.log(MODULE_NAME, '[最后一个选项区] 模式因选项点击切换为: 小说模式');
                }
            } else if (optionsInThisArea.length === 4) {
                Logger.debug(MODULE_NAME, `当前选项区 (非最后一个，有4个选项) 被点击。点击索引: ${clickedIndexInThisArea}。未执行 "最后一个选项区特定" 模式切换。`);
            } else {
                Logger.debug(MODULE_NAME, `当前选项区有 ${optionsInThisArea.length} 个选项 (期望4个进行模式切换)。未执行模式切换。`);
            }

            const optionText = clickedLiElement.textContent?.trim();
            const messageInput = UIManager.elements.messageInput; // Get from UIManager cache

            if (messageInput && optionText !== undefined && optionText !== null) {
                Logger.log(MODULE_NAME, `准备填充输入框: "${optionText}"`);
                messageInput.value = optionText;
                UIManager.autoResizeTextarea(); // Adjust height

                // Crucial for React: Dispatch an input event
                const inputEvent = new Event('input', { bubbles: true, cancelable: true });
                messageInput.dispatchEvent(inputEvent);
                Logger.log(MODULE_NAME, `已填充输入框并派发 'input' 事件: "${optionText}"`);

                // Optionally focus, though user click might handle this
                // messageInput.focus();

            } else {
                if (!messageInput) Logger.error(MODULE_NAME, `自定义输入框 (${Config.MESSAGE_INPUT_ID}) 未找到，无法填充选项文本。`);
                if (optionText === undefined || optionText === null) Logger.warn(MODULE_NAME, '提取到的选项文本为空或无效。');
            }
        }
    };

    // =========================================================================
    // 8. 分页器模块 (PaginatorModule) - 逻辑保持相对不变，集成日志
    // =========================================================================
    const PaginatorModule = {
        createChatPaginator: function (containerId, totalPages, initialPage = 1, onPageChangeCallback) {
            const MODULE_NAME = 'PaginatorModule.createChatPaginator';
            const containerElement = document.getElementById(containerId);
            if (!containerElement) {
                Logger.error(MODULE_NAME, `未找到ID为 "${containerId}" 的分页器容器。`);
                return null;
            }

            let currentPage = Math.max(1, Math.min(initialPage, totalPages || 1)); // Ensure totalPages is at least 1
            totalPages = Math.max(1, totalPages || 1); // Ensure totalPages is at least 1

            Logger.log(MODULE_NAME, `创建分页器: container=${containerId}, total=${totalPages}, initial=${currentPage}`);

            containerElement.innerHTML = ''; // Clear container

            const paginatorDiv = document.createElement('div');
            paginatorDiv.className = 'chat-paginator';

            const paginatorMain = document.createElement('button');
            paginatorMain.className = 'paginator-main';
            paginatorMain.setAttribute('type', 'button');
            paginatorMain.setAttribute('aria-label', '切换页码导航');

            const paginatorDetail = document.createElement('div');
            paginatorDetail.className = 'paginator-detail';

            paginatorDiv.appendChild(paginatorMain);
            paginatorDiv.appendChild(paginatorDetail);
            containerElement.appendChild(paginatorDiv);

            const renderPaginatorMain = () => {
                paginatorMain.innerHTML = `<span> ${currentPage} / ${totalPages} </span>`;
            };

            const renderPaginatorDetail = () => {
                paginatorDetail.innerHTML = '';
                if (totalPages <= 1) {
                    paginatorDetail.classList.remove('active');
                    return;
                }
                for (let i = 1; i <= totalPages; i++) {
                    const pageButton = document.createElement('button');
                    pageButton.className = 'paginator-page-number';
                    pageButton.setAttribute('type', 'button');
                    pageButton.textContent = i;
                    pageButton.dataset.page = String(i);
                    if (i === currentPage) {
                        pageButton.classList.add('paginator-page-number-active');
                        pageButton.setAttribute('aria-current', 'page');
                    }
                    pageButton.addEventListener('click', (event) => {
                        event.stopPropagation();
                        const selectedPage = parseInt(event.currentTarget.dataset.page, 10);
                        if (selectedPage !== currentPage) {
                            Logger.log(MODULE_NAME, `分页器页码点击: ${selectedPage}`);
                            currentPage = selectedPage;
                            NativeBridge.jumpToPage(currentPage); // Use NativeBridge for MUI interaction
                            if (typeof onPageChangeCallback === 'function') {
                                onPageChangeCallback(currentPage);
                            }
                        }
                        renderPaginatorMain();
                        paginatorDetail.classList.remove('active');
                    });
                    paginatorDetail.appendChild(pageButton);
                }
            };

            paginatorMain.addEventListener('click', () => {
                if (totalPages > 1) {
                    paginatorDetail.classList.toggle('active');
                    if (paginatorDetail.classList.contains('active')) {
                        Logger.debug(MODULE_NAME, '分页器详情展开。');
                        renderPaginatorDetail();
                    } else {
                        Logger.debug(MODULE_NAME, '分页器详情折叠。');
                    }
                }
            });

            const initializePaginatorView = () => {
                renderPaginatorMain();
            };
            initializePaginatorView();

            return {
                destroy: () => {
                    // Proper removal of event listeners is complex with anonymous functions.
                    // Re-creating the element or using named functions is better.
                    // For simplicity here, just removing the element.
                    if (containerElement && paginatorDiv.parentNode === containerElement) {
                        containerElement.removeChild(paginatorDiv);
                    }
                    Logger.log(MODULE_NAME, '分页器已销毁。');
                },
                updatePages: (newTotalPages, newCurrentPage) => {
                    newTotalPages = Math.max(1, newTotalPages || 1);
                    totalPages = newTotalPages;
                    if (newCurrentPage !== undefined) {
                        currentPage = Math.max(1, Math.min(newCurrentPage, totalPages));
                    } else {
                        currentPage = Math.max(1, Math.min(currentPage, totalPages));
                    }
                    paginatorDetail.classList.remove('active');
                    initializePaginatorView();
                    Logger.log(MODULE_NAME, `分页器已更新: total=${totalPages}, current=${currentPage}`);
                    if (totalPages > 0 && typeof onPageChangeCallback === 'function' && newCurrentPage !== undefined) {
                        onPageChangeCallback(currentPage);
                    }
                }
            };
        },

        initialize: function () {
            const MODULE_NAME = 'PaginatorModule.initialize';
            // Only initialize if HTML for it exists and was injected
            if (!(Config.YOUR_CUSTOM_HTML.trim() !== "" && Config.YOUR_CUSTOM_HTML.trim() !== "已经写好了，不重要，请忽略" && Config.YOUR_CUSTOM_HTML.includes(Config.PAGINATOR_CONTAINER_ID))) {
                Logger.log(MODULE_NAME, '分页器容器HTML未提供或未注入，跳过分页器初始化。');
                return;
            }

            const container = document.getElementById(Config.PAGINATOR_CONTAINER_ID);
            if (!container) {
                Logger.warn(MODULE_NAME, `分页器容器 #${Config.PAGINATOR_CONTAINER_ID} 未在DOM中找到，即使HTML可能包含它。`);
                return;
            }

            Logger.log(MODULE_NAME, '初始化分页器功能...');
            const currentPage = NativeBridge.getCurrentPage() || 1;
            const totalPages = NativeBridge.getTotalPages() || 1;

            if (State.paginatorInstance && typeof State.paginatorInstance.destroy === 'function') {
                State.paginatorInstance.destroy();
            }
            State.paginatorInstance = this.createChatPaginator(
                Config.PAGINATOR_CONTAINER_ID,
                totalPages,
                currentPage,
                (newPage) => {
                    Logger.log(MODULE_NAME, `Paginator: Page changed to ${newPage} via callback.`);
                    // Potentially update internal state or re-fetch data if needed
                }
            );
            if (!State.paginatorInstance) {
                Logger.warn(MODULE_NAME, '分页器实例未能创建。');
            } else {
                Logger.log(MODULE_NAME, '分页器功能初始化完成。');
            }
        }
    };

    // =========================================================================
    // 主初始化函数 (Main Initialization)
    // =========================================================================
    async function initializeScript() {
        const MODULE_NAME = 'MainInitialization';
        Logger.log(MODULE_NAME, '脚本主初始化流程开始...');

        const domInitialized = await UIManager.initializeDOM();
        if (!domInitialized && Config.YOUR_CUSTOM_HTML.trim() !== "" && Config.YOUR_CUSTOM_HTML.trim() !== "已经写好了，不重要，请忽略") { // Check if HTML was supposed to be there
            Logger.error(MODULE_NAME, 'DOM初始化失败，中止后续脚本加载。');
            return;
        }

        // The following initializations depend on UIManager.elements, which are populated if custom HTML is used.
        // If custom HTML is ignored, these might log warnings but shouldn't break if elements are not found.
        CustomControls.initialize();
        OptionAutoFill.initialize();
        PaginatorModule.initialize(); // Initialize Paginator after other UI elements are set up

        // Expose functions to global scope as per requirements
        window.setMode = CustomControls.setMode.bind(CustomControls);
        window.getCurrentMode = CustomControls.getCurrentModeComment.bind(CustomControls);
        window.showNotification = UIManager.showNotification.bind(UIManager);
        Logger.log(MODULE_NAME, 'setMode 和 getCurrentMode 已暴露到 window 对象。');

        Logger.log(MODULE_NAME, '脚本主初始化流程结束。');
    }

    // =========================================================================
    // 脚本启动点
    // =========================================================================
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initializeScript);
    } else {
        initializeScript();
    }

})();