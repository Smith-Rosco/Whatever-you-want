// --- START OF FILE simplify_v3_adapted_for_new_structure.js --- (假设文件名再次更改以反映适配)

(function () {
    'use strict';
    // --- 配置 ---
    const BUTTON_ID = 'simplify-ai-button-v3'; // 按钮的唯一 ID (版本号更新)
    const BUTTON_TEXT_IDLE = '简化回复';
    const BUTTON_TEXT_PROCESSING = '处理中...';
    const BUTTON_TEXT_SUCCESS = '简化成功';
    const BUTTON_TEXT_ERROR = '简化失败';
    const BUTTON_TEXT_NO_REPLIES = '无回复';
    const BUTTON_TEXT_API_ERROR = 'API错误';
    const LOCALSTORAGE_TOKEN_KEY = 'console_token';
    const LOCALSTORAGE_CONVERSATION_MAP_KEY = 'conversationIdInfo';
    const AI_REPLY_SELECTOR = 'div#ai-chat-answer'; // AI 回复的容器选择器 (最外层，例如每个消息卡片)
    const CONTENT_CONTAINER_SELECTOR = '.undefined.markdown-body'; // AI 回复内容实际所在的容器 (Markdown 渲染体)
    const BUTTON_AREA_SELECTOR = 'div.flex.items-center.gap-2.pb-2'; // 按钮期望被移入的目标容器

    // 新的简化规则，针对 <main> 标签下的子元素
    // 最新回复: 保留 txt, sts, mem。移除 thk, opt。
    const SELECTORS_TO_REMOVE_LATEST = 'main > thk, main > opt';
    // 次新回复: 保留 txt。移除 thk, sts, mem, opt。
    const SELECTORS_TO_REMOVE_SECOND_LATEST = 'main > thk, main > sts, main > mem, main > opt';

    const API_BASE_URL = 'https://aifuck.cc/console/api/installed-apps/';
    const TARGET_CONTAINER_SELECTOR = 'div.flex.items-center.gap-2.pb-2'; // 按钮期望被移入的目标容器

    // --- 状态变量 ---
    let simplifyButton = null; // 按钮元素的引用 (全局)
    let buttonResetTimeout = null; // 按钮状态重置的定时器

    // --- 辅助函数 ---
    const SCRIPT_VERSION = 'v3.0 (New Structure)'; // 脚本版本，用于日志和按钮标题
    function logDebug(...args) { console.log(`[简化脚本 ${SCRIPT_VERSION} DEBUG]`, ...args); }
    function logInfo(...args) { console.log(`[简化脚本 ${SCRIPT_VERSION} INFO]`, ...args); }
    function logError(...args) { console.error(`[简化脚本 ${SCRIPT_VERSION} ERROR]`, ...args); }

    function addGlobalStyle(cssRules) {
        const styleElement = document.createElement('style');
        styleElement.textContent = cssRules;
        document.head.appendChild(styleElement);
        logDebug('全局样式已添加。');
    }

    function updateButtonState(state, detail = '') {
        if (!simplifyButton) {
            return;
        }
        if (buttonResetTimeout) {
            clearTimeout(buttonResetTimeout);
            buttonResetTimeout = null;
        }
        let text = '';
        simplifyButton.disabled = false;
        const initialBgColor = simplifyButton.dataset.initialBgColor || '#007bff'; // 默认一个蓝色
        simplifyButton.style.backgroundColor = ''; // 清除直接设置的背景色，以便class生效
        simplifyButton.style.cursor = 'pointer';
        simplifyButton.style.opacity = '1';

        switch (state) {
            case 'processing':
                text = detail ? `${BUTTON_TEXT_PROCESSING} (${detail})` : BUTTON_TEXT_PROCESSING;
                simplifyButton.disabled = true;
                simplifyButton.style.backgroundColor = '#9ca3af'; // Tailwind gray-400
                simplifyButton.style.cursor = 'not-allowed';
                simplifyButton.style.opacity = '0.7';
                break;
            case 'success':
                text = detail ? `${BUTTON_TEXT_SUCCESS} (${detail})` : BUTTON_TEXT_SUCCESS;
                simplifyButton.style.backgroundColor = '#10b981'; // Tailwind green-500
                buttonResetTimeout = setTimeout(() => updateButtonState('idle'), 3000);
                break;
            case 'error':
            case 'api_error':
                text = detail ? `${BUTTON_TEXT_ERROR} (${detail})` : (state === 'api_error' ? BUTTON_TEXT_API_ERROR : BUTTON_TEXT_ERROR);
                simplifyButton.style.backgroundColor = '#ef4444'; // Tailwind red-500
                buttonResetTimeout = setTimeout(() => updateButtonState('idle'), 5000);
                break;
            case 'no_replies':
                text = BUTTON_TEXT_NO_REPLIES;
                simplifyButton.style.backgroundColor = '#60a5fa'; // Tailwind blue-400
                buttonResetTimeout = setTimeout(() => updateButtonState('idle'), 3000);
                break;
            case 'idle':
            default:
                text = BUTTON_TEXT_IDLE;
                if (!simplifyButton.className && initialBgColor) {
                    simplifyButton.style.backgroundColor = initialBgColor;
                } else if (simplifyButton.className) {
                    simplifyButton.style.backgroundColor = ''; // 由class控制
                }
                else {
                    simplifyButton.style.backgroundColor = '#007bff'; // 默认蓝色
                }
                break;
        }
        simplifyButton.textContent = text;
    }

    // --- 核心逻辑 ---
    function getAuthToken() {
        const token = localStorage.getItem(LOCALSTORAGE_TOKEN_KEY);
        if (!token) { logError('未找到 Token:', LOCALSTORAGE_TOKEN_KEY); return null; }
        return token.startsWith('Bearer ') ? token : `Bearer ${token}`;
    }

    function getAppId() {
        const match = window.location.pathname.match(/\/explore\/installed\/([a-f0-9-]+)/);
        if (match && match[1]) { logDebug('找到 App ID:', match[1]); return match[1]; }
        logError('在 URL 中未找到 App ID:', window.location.href); return null;
    }

    function getConversationId(appId) {
        if (!appId) return null;
        const mapString = localStorage.getItem(LOCALSTORAGE_CONVERSATION_MAP_KEY);
        if (!mapString) { logError('未找到会话 ID 映射:', LOCALSTORAGE_CONVERSATION_MAP_KEY); return null; }
        try {
            const map = JSON.parse(mapString);
            const convId = map[appId];
            if (!convId) { logError('未找到此 App ID 的会话 ID:', appId); return null; }
            logDebug('找到会话 ID:', convId); return convId;
        } catch (e) { logError('解析会话 ID 映射失败:', e); return null; }
    }

    function fetchMessages(appId, conversationId, authToken) {
        return new Promise((resolve, reject) => {
            if (!appId || !conversationId || !authToken) {
                logError('获取消息列表缺少参数', { appId, conversationId: !!conversationId, authToken: !!authToken });
                return reject('获取消息列表缺少参数');
            }
            const url = `${API_BASE_URL}${appId}/messages?conversation_id=${conversationId}&limit=100`;
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                logError('获取消息超时 (15s).');
                reject('超时');
            }, 15000);

            fetch(url, {
                method: "GET",
                headers: { "Authorization": authToken, "Accept": "application/json" },
                signal: controller.signal
            })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (response.ok) {
                        return response.json();
                    } else {
                        return response.text().then(text => {
                            logError('获取消息失败:', response.status, response.statusText, text);
                            throw new Error(`获取失败: ${response.status} - ${text}`);
                        });
                    }
                })
                .then(data => {
                    const aiMessages = data.data.filter(msg => msg.hasOwnProperty('answer'));
                    aiMessages.sort((a, b) => a.created_at - b.created_at);
                    logInfo(`获取了 ${aiMessages.length} 条有效的 AI 消息 (包含 'answer' 字段)。`);
                    resolve(aiMessages);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    if (error.name === 'AbortError') {
                        // 超时已被处理
                    } else {
                        logError('获取消息网络错误或解析失败:', error);
                        reject(error.message || '网络错误');
                    }
                });
        });
    }

    function updateMessageApi(appId, messageId, newContent, authToken) {
        return new Promise((resolve, reject) => {
            if (!appId || !messageId || newContent === null || newContent === undefined || !authToken) {
                logError('更新消息 API 缺少参数', { appId, messageId, newContent: typeof newContent, authToken: !!authToken });
                return reject('更新消息 API 缺少参数');
            }
            const url = `${API_BASE_URL}${appId}/messages/${messageId}`;
            const payload = JSON.stringify({ answer: newContent });
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                logError(`更新消息 ${messageId} 超时 (15s).`);
                reject('超时');
            }, 15000);

            fetch(url, {
                method: "PATCH",
                headers: { "Authorization": authToken, "Content-Type": "application/json", "Accept": "*/*" },
                body: payload,
                signal: controller.signal
            })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (response.ok) {
                        logInfo(`通过 API 成功更新消息 ${messageId}。`);
                        return response.text();
                    } else {
                        return response.text().then(text => {
                            logError(`通过 API 更新消息 ${messageId} 失败:`, response.status, response.statusText, text);
                            throw new Error(`API 更新失败: ${response.status} - ${text}`);
                        });
                    }
                })
                .then(responseText => {
                    resolve(responseText);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    if (error.name === 'AbortError') {
                        // 超时已被处理
                    } else {
                        logError(`更新消息 ${messageId} 时网络错误或API问题:`, error);
                        reject(error.message || '网络错误');
                    }
                });
        });
    }

    /**
     * 从给定的 DOM 元素 (通常是一个代表消息内容的容器，其 innerHTML 包含 <main>...</main>) 中提取并清理内容。
     * @param {HTMLElement} sourceElement - 包含原始HTML内容的 DOM 元素。其 innerHTML 应为目标结构。
     * @param {string} selectorsToRemove - 要从此内容中移除的元素的选择器字符串 (例如 "main > thk, main > opt")。
     * @returns {string|null} 清理后的 HTML 字符串 (例如 "<main><txt>...</txt>...</main>"), 如果出错或源元素无效则返回 null。
     */
    function extractSimplifiedContent(sourceElement, selectorsToRemove) {
        if (!sourceElement || typeof sourceElement.cloneNode !== 'function') {
            logError("    - extractSimplifiedContent: sourceElement 无效或非 DOM 元素。无法处理。", sourceElement);
            return null;
        }
        try {
            // 克隆源元素。sourceElement 本身是 .markdown-body，其内部的 <main> 才是我们要操作的。
            // 但这里我们期望 sourceElement.innerHTML 已经是 <main>...</main> 的形式，所以直接操作。
            const clonedElement = sourceElement.cloneNode(true);

            // 确保 selectorsToRemove 是针对 clonedElement 内部的元素
            // 例如，如果 clonedElement.innerHTML 是 "<main><thk></thk><txt></txt></main>"
            // 且 selectorsToRemove 是 "main > thk"，则应该移除 clonedElement 下的 main > thk
            // 如果 clonedElement 本身就是 <main>，则 selectorsToRemove 应该是 "> thk"
            // 当前设计是 sourceElement 是一个临时 div，其 innerHTML 被设为 apiMessage.answer (即 <main>...</main>)
            // 所以 clonedElement.querySelectorAll(selectorsToRemove) 应该能正确工作。
            if (selectorsToRemove && selectorsToRemove.trim() !== "") {
                const elementsToRemove = clonedElement.querySelectorAll(selectorsToRemove);
                elementsToRemove.forEach(el => el.remove());
                logDebug(`    - 从克隆内容中移除了 ${elementsToRemove.length} 个元素，基于选择器: ${selectorsToRemove}`);
            }
            return clonedElement.innerHTML.trim(); // 返回清理后元素的内部 HTML (应为处理过的 <main>...</main>)
        } catch (error) {
            logError("    - 内容提取/清理过程中出错:", error, "源元素:", sourceElement);
            return null;
        }
    }

    function updatePageElementVisuals(pageReplyElement, simplifiedHtmlForDisplay) {
        if (!pageReplyElement || simplifiedHtmlForDisplay === null) {
            logError("    - updatePageElementVisuals: pageReplyElement 或 simplifiedHtmlForDisplay 为空，无法更新视觉。");
            return false;
        }
        // CONTENT_CONTAINER_SELECTOR 是 .undefined.markdown-body
        const contentContainer = pageReplyElement.querySelector(CONTENT_CONTAINER_SELECTOR);
        if (contentContainer) {
            logDebug(`    - 正在更新页面元素 (ID: ${pageReplyElement.id}, 内容容器 class: ${contentContainer.className}) 的视觉效果...`);
            // simplifiedHtmlForDisplay 应该是包含 <main>...</main> 的字符串
            contentContainer.innerHTML = simplifiedHtmlForDisplay;

            const existingMarks = pageReplyElement.querySelectorAll('.script-simplified-mark');
            existingMarks.forEach(em => em.remove());

            const mark = document.createElement('div');
            mark.className = 'script-simplified-mark';
            mark.textContent = '(已由脚本简化)';

            // 标记应该加在 markdown-body 之后，作为其兄弟节点，而不是内部
            // 但如果 pageReplyElement 就是 markdown-body，那就加在它内部末尾
            // 当前结构: div#ai-chat-answer > ... > div.undefined.markdown-body
            // 所以 contentContainer.parentNode 是存在的。
            if (contentContainer.parentNode) {
                contentContainer.parentNode.insertBefore(mark, contentContainer.nextSibling);
            } else {
                pageReplyElement.appendChild(mark); // 备用
                logError("    - contentContainer 没有父节点，简化标记附加到 pageReplyElement。");
            }

            logInfo(`    - 成功更新页面元素 (ID: ${pageReplyElement.id}) 视觉效果。`);
            return true;
        } else {
            logError(`    - 在 pageReplyElement (ID: ${pageReplyElement.id}) 中找不到用于更新视觉效果的内容容器 (${CONTENT_CONTAINER_SELECTOR})。视觉更新失败。`);
            return false;
        }
    }

    async function processLastTwoReplies() {
        if (!simplifyButton || simplifyButton.disabled) {
            logInfo('正在处理中或按钮无效，请稍候...');
            return;
        }
        logInfo(`按钮点击: ${simplifyButton.textContent}`);
        updateButtonState('processing');

        const authToken = getAuthToken();
        const appId = getAppId();
        const conversationId = getConversationId(appId);

        if (!authToken || !appId || !conversationId) {
            logError('缺少必要信息 (Token, App ID, 或会话 ID). 中止操作。');
            updateButtonState('api_error', '缺少信息');
            return;
        }

        try {
            logInfo('正在获取消息列表...');
            const apiMessages = await fetchMessages(appId, conversationId, authToken);
            const pageReplyElements = document.querySelectorAll(AI_REPLY_SELECTOR);
            logInfo(`从 API 获取了 ${apiMessages.length} 条消息，在页面上找到 ${pageReplyElements.length} 个 AI 回复元素。`);

            const numApiMessages = apiMessages.length;
            const numPageReplies = pageReplyElements.length;

            if (numPageReplies === 0) {
                logInfo('页面上未找到 AI 回复。无需操作。');
                updateButtonState('no_replies');
                return;
            }

            if (numApiMessages !== numPageReplies) {
                logError(`警告: API 消息数量 (${numApiMessages}) 与页面元素数量 (${numPageReplies}) 不同。将以页面元素为基准定位对应的API消息。`);
            }

            let successCount = 0;
            let failCount = 0;
            const repliesToProcess = [];

            const lastPageIndex = numPageReplies - 1;
            if (lastPageIndex >= 0) {
                const latestPageElement = pageReplyElements[lastPageIndex];
                const latestApiMessage = (lastPageIndex < numApiMessages) ? apiMessages[lastPageIndex] : null;
                if (latestApiMessage && latestApiMessage.answer !== undefined) {
                    repliesToProcess.push({
                        index: lastPageIndex,
                        pageElement: latestPageElement,
                        apiMessage: latestApiMessage,
                        selectorsToRemove: SELECTORS_TO_REMOVE_LATEST,
                        label: "最新"
                    });
                } else {
                    logError(`无法为最新的页面元素 (索引 ${lastPageIndex}) 找到匹配的 API 消息或其 'answer' 字段无效。跳过处理最新消息。`);
                    if (latestPageElement) failCount++;
                }
            }

            const secondLastPageIndex = numPageReplies - 2;
            if (secondLastPageIndex >= 0) {
                const secondLatestPageElement = pageReplyElements[secondLastPageIndex];
                const secondLatestApiMessage = (secondLastPageIndex < numApiMessages) ? apiMessages[secondLastPageIndex] : null;
                if (secondLatestApiMessage && secondLatestApiMessage.answer !== undefined) {
                    repliesToProcess.push({
                        index: secondLastPageIndex,
                        pageElement: secondLatestPageElement,
                        apiMessage: secondLatestApiMessage,
                        selectorsToRemove: SELECTORS_TO_REMOVE_SECOND_LATEST,
                        label: "次新"
                    });
                } else {
                    if (numPageReplies > 1) {
                        logError(`无法为次新的页面元素 (索引 ${secondLastPageIndex}) 找到匹配的 API 消息或其 'answer' 字段无效。跳过处理次新消息。`);
                    }
                }
            }

            if (repliesToProcess.length === 0) {
                if (failCount > 0 && numPageReplies > 0) {
                    logError("API消息与页面元素严重不匹配，或目标消息无内容，无法执行简化操作。");
                    updateButtonState('error', '数据不匹配');
                } else if (numPageReplies > 0) {
                    logInfo("没有符合条件的消息进行处理。");
                    updateButtonState('idle');
                } else {
                    updateButtonState('no_replies');
                }
                return;
            }

            repliesToProcess.sort((a, b) => a.index - b.index);
            logInfo(`计划处理 ${repliesToProcess.length} 条回复。`);

            for (const target of repliesToProcess) {
                logInfo(`--- 开始处理 ${target.label} 回复 (页面索引: ${target.index}, API ID: ${target.apiMessage.id}) ---`);
                updateButtonState('processing', target.label);

                const { pageElement, apiMessage, selectorsToRemove } = target;

                let simplifiedContentForApi = null;
                if (apiMessage.answer && typeof apiMessage.answer === 'string') {
                    const tempDivForApiAnswer = document.createElement('div');
                    // apiMessage.answer 应该是 <main>...</main> 这种形式的字符串
                    tempDivForApiAnswer.innerHTML = apiMessage.answer;
                    simplifiedContentForApi = extractSimplifiedContent(tempDivForApiAnswer, selectorsToRemove);
                } else {
                    logError(`  - ${target.label} 回复的 API 消息 (ID: ${apiMessage.id}) 中 'answer' 字段为空或非字符串。无法为API提取内容。`);
                }

                if (simplifiedContentForApi === null) {
                    logError(`  - 未能为 ${target.label} 回复 (ID: ${apiMessage.id}) 从 API 原始内容提取有效内容用于 API 更新。跳过此回复。`);
                    failCount++;
                    continue;
                }
                logDebug(`  - 为 ${target.label} 回复 (ID: ${apiMessage.id}) 从 API 原始内容提取的待更新内容长度: ${simplifiedContentForApi.length}`);
                logDebug(`  - 内容片段 (API): ${simplifiedContentForApi.substring(0,100)}...`);


                if (target.label === "最新") {
                    // --- START OF MODIFICATION ---
                    let currentModeText = null;
                    if (typeof window.getCurrentSelectedModeText === 'function') {
                        try {
                            currentModeText = window.getCurrentSelectedModeText();
                            logDebug(`  - (API内容) 调用 window.getCurrentSelectedModeText() 获取模式文本: "${currentModeText}"`);
                        } catch (e) {
                            logError(`  - (API内容) 调用 window.getCurrentSelectedModeText() 时发生错误:`, e);
                            currentModeText = null; // 确保出错时为 null
                        }
                    } else {
                        logDebug("  - (API内容) window.getCurrentSelectedModeText 不是一个函数或未定义。");
                    }

                    if (currentModeText) { // 确保有模式文本才添加
                    // --- END OF MODIFICATION ---
                        // 追加模式区域到 simplifiedContentForApi。
                        // simplifiedContentForApi 此时应该是 "<main>...</main>"
                        // 我们需要把 modeAreaHtml 插入到 <main> 标签内部的末尾。
                        const tempContainer = document.createElement('div');
                        tempContainer.innerHTML = simplifiedContentForApi; // 解析 "<main>...</main>"
                        const mainElement = tempContainer.querySelector('main');
                        if (mainElement) {
                            const modeAreaHtml = `<div class="mode-area">${currentModeText}</div>`; // \n 可选
                            mainElement.insertAdjacentHTML('beforeend', modeAreaHtml);
                            simplifiedContentForApi = tempContainer.innerHTML; // 获取回包含 mode-area 的 <main>
                            logDebug(`  - (API内容) 已为最新回复追加模式区域。`);
                        } else {
                            logError(`  - (API内容) 最新回复的简化内容中未找到 <main> 标签，无法追加模式区域。内容: ${simplifiedContentForApi}`);
                        }
                    } else {
                        logDebug(`  - (API内容) 最新回复无模式文本可追加 (从全局获取失败或为空)。`);
                    }
                } else if (target.label === "次新") {
                    const tempContainer = document.createElement('div');
                    tempContainer.innerHTML = simplifiedContentForApi; // 解析 "<main>...</main>"
                    const mainElement = tempContainer.querySelector('main');
                    if (mainElement) {
                        const modeAreaElement = mainElement.querySelector('div.mode-area');
                        if (modeAreaElement) {
                            modeAreaElement.remove();
                            simplifiedContentForApi = tempContainer.innerHTML; // 获取回不含 mode-area 的 <main>
                            logDebug(`  - (API内容) 已从次新回复移除模式区域。`);
                        } else {
                            logDebug(`  - (API内容) 次新回复中未找到模式区域可移除。`);
                        }
                    } else {
                         logError(`  - (API内容) 次新回复的简化内容中未找到 <main> 标签，无法移除模式区域。内容: ${simplifiedContentForApi}`);
                    }
                }

                let apiUpdateSuccessful = false;
                try {
                    await updateMessageApi(appId, apiMessage.id, simplifiedContentForApi, authToken);
                    logInfo(`  - ${target.label} 回复 (ID: ${apiMessage.id}) 的 API 消息已成功更新。`);
                    apiUpdateSuccessful = true;
                } catch (apiUpdateError) {
                    logError(`  - 更新 ${target.label} 回复 (ID: ${apiMessage.id}) 的 API 消息失败:`, apiUpdateError);
                    failCount++;
                    continue;
                }

                if (apiUpdateSuccessful) {
                    // 为页面视觉更新准备内容：从当前页面元素的 .markdown-body 提取和简化
                    // pageElement 是 div#ai-chat-answer
                    const currentMarkdownBody = pageElement.querySelector(CONTENT_CONTAINER_SELECTOR);
                    if (currentMarkdownBody) {
                        // currentMarkdownBody.innerHTML 应该是 <main>...</main>
                        // extractSimplifiedContent 需要一个元素，所以我们用 currentMarkdownBody 本身
                        // (它内部会克隆，所以不会修改原始DOM)
                        // 或者更安全：
                        const tempDivForPageContent = document.createElement('div');
                        tempDivForPageContent.innerHTML = currentMarkdownBody.innerHTML; // 把 <main>...</main> 放到临时div里

                        const simplifiedHtmlForPageDisplay = extractSimplifiedContent(tempDivForPageContent, selectorsToRemove);

                        if (simplifiedHtmlForPageDisplay !== null) {
                            logDebug(`  - 为 ${target.label} 回复 (ID: ${apiMessage.id}) 从页面元素提取的待显示内容长度: ${simplifiedHtmlForPageDisplay.length}`);
                            logDebug(`  - 内容片段 (页面): ${simplifiedHtmlForPageDisplay.substring(0,100)}...`);

                            if (updatePageElementVisuals(pageElement, simplifiedHtmlForPageDisplay)) {
                                successCount++;
                            } else {
                                logError(`  - 更新 ${target.label} 回复 (ID: ${apiMessage.id}) 的页面视觉效果失败，尽管 API 已更新。`);
                                failCount++;
                            }
                        } else {
                            logError(`  - 未能为 ${target.label} 回复 (ID: ${apiMessage.id}) 从页面元素提取有效内容用于视觉更新。API 可能已更新。`);
                            failCount++;
                        }
                    } else {
                        logError(`  - 在 ${target.label} 回复 (ID: ${apiMessage.id}) 的页面元素中找不到内容容器 (${CONTENT_CONTAINER_SELECTOR})。无法更新视觉。API 可能已更新。`);
                        failCount++;
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 100));
            }

            const totalTargets = repliesToProcess.length;
            logInfo(`--- 处理完成 --- 成功: ${successCount}, 失败: ${failCount} (共 ${totalTargets} 个目标)`);

            if (failCount > 0 && successCount > 0) {
                updateButtonState('error', `${successCount}/${totalTargets} 成功`);
            } else if (failCount > 0) {
                updateButtonState('error', `0/${totalTargets} 成功`);
            } else if (successCount > 0) {
                updateButtonState('success', `${successCount}/${totalTargets}`);
            } else {
                if (totalTargets === 0 && numPageReplies > 0) {
                    updateButtonState('no_replies', '无适用目标');
                } else if (numPageReplies === 0) {
                    updateButtonState('no_replies');
                } else {
                    updateButtonState('idle');
                }
            }

        } catch (error) {
            logError('处理过程中发生整体错误:', error);
            if (error.message && error.message.includes("获取失败")) {
                updateButtonState('api_error', '获取消息失败');
            } else {
                updateButtonState('error', '意外错误');
            }
        }
    }

    function setupUI() {
    addGlobalStyle(`
        .script-simplified-mark { 
            font-size: 10px; color: grey; margin-top: 5px; 
            margin-bottom: 5px; font-style: italic; display: block;
        }
        #${BUTTON_ID} {
            /* 初始可以设置为 fixed，如果希望在移动前它可见且位于固定位置 */
            position: fixed; 
            z-index: 1000;/* 示例：确保在顶层 */
            cursor: pointer;
        }
        #${BUTTON_ID}[data-moved="true"] { 
            /* 当按钮被移动到目标容器后，这些样式会使其融入容器 */
            position: static; 
            right: auto; bottom: auto; z-index: auto;
            /* 清除或调整可能与容器内其他按钮冲突的固定样式 */
            /* 背景色等将由 updateButtonState 或复制的类名控制 */
        }
    `);

    if (document.getElementById(BUTTON_ID)) {
        simplifyButton = document.getElementById(BUTTON_ID);
        logInfo("简化按钮已存在。更新引用。");
    } else {
        simplifyButton = document.createElement('button');
        simplifyButton.id = BUTTON_ID;
        // 初始将按钮添加到 body。如果 DOMWatcherService 失败，它会留在这里。
        // 如果 DOMWatcherService 成功，它将被移动。
        document.body.appendChild(simplifyButton);
        logInfo(`简化按钮已创建并添加到 body (ID: ${BUTTON_ID}).`);
    }

    simplifyButton.textContent = BUTTON_TEXT_IDLE;
    simplifyButton.title = `简化 AI 回复 (${SCRIPT_VERSION})`;
    simplifyButton.dataset.moved = 'false'; // 初始状态为未移动

    const computedStyle = window.getComputedStyle(simplifyButton);
    const initialBg = computedStyle.backgroundColor;
    if (initialBg && initialBg !== 'rgba(0, 0, 0, 0)' && initialBg !== 'transparent') {
        simplifyButton.dataset.initialBgColor = initialBg;
    } else {
        // 如果初始背景透明 (例如，仅由类控制)，则使用默认值
        // 或者，如果上面的CSS中已为 #${BUTTON_ID} 设置了背景色，可以依赖它
        simplifyButton.dataset.initialBgColor = '#007bff'; // 脚本的默认蓝色
    }
    
    if (!simplifyButton.style.backgroundColor && simplifyButton.dataset.initialBgColor && simplifyButton.dataset.moved === 'false') {
        simplifyButton.style.backgroundColor = simplifyButton.dataset.initialBgColor; // 应用初始背景色
    }


    if (!simplifyButton.dataset.listenerAttached) {
        simplifyButton.addEventListener('click', processLastTwoReplies);
        simplifyButton.dataset.listenerAttached = 'true';
        logInfo('按钮点击事件监听器已添加。');
    }
    updateButtonState('idle'); // 初始化按钮状态和文本 (会应用背景色)

        // --- 定义按钮移动和样式化的函数 (之前是 setupUI 内的局部函数) ---
    const moveAndStyleButtonInternal = (container) => {
        if (!container || !simplifyButton) {
            logError("moveAndStyleButtonInternal: 容器或按钮无效。");
            return;
        }

        if (simplifyButton.dataset.moved === 'true' && simplifyButton.parentElement === container) {
            logDebug("按钮已在目标容器中且已标记为移动，无需重复操作。");
            return;
        }

        logInfo(`目标容器 (${TARGET_CONTAINER_SELECTOR}) 已找到，尝试移动和样式化按钮。容器:`, container);

        // 获取容器内所有已存在的按钮（排除我们自己的简化按钮）
        const existingButtons = Array.from(container.querySelectorAll('button:not(#' + BUTTON_ID + ')'));

        if (existingButtons.length > 0) {
            // 使用第一个现有按钮作为样式参考
            const styleReferenceButton = existingButtons[0];
            logInfo("找到参考按钮（用于样式），将复制其 classes:", styleReferenceButton.className);
            simplifyButton.className = styleReferenceButton.className; // 复制类名

            // 清除可能由 #BUTTON_ID 初始样式或 JavaScript 直接设置的样式，以便类名优先
            // (根据你的 addGlobalStyle，大部分是 position, bottom, right, z-index, padding 等)
            simplifyButton.style.position = '';
            simplifyButton.style.bottom = '';
            simplifyButton.style.right = '';
            simplifyButton.style.zIndex = '';
            simplifyButton.style.padding = '';
            simplifyButton.style.margin = ''; // 通常按钮组内的按钮会有 margin (gap-2 意味着有 margin)
                                            // 如果复制的类名已经包含了正确的 margin，这行可以不要，
                                            // 但为了保险，清除掉直接设置的 margin，让类名控制。
            simplifyButton.style.backgroundColor = ''; // 背景色也由类名或 updateButtonState 控制

            // 获取最后一个现有按钮
            const lastExistingButton = existingButtons[existingButtons.length - 1];
            logInfo("将简化按钮插入到最后一个现有按钮之后:", lastExistingButton);

            // 从当前父节点（可能是 body）移除按钮
            if (simplifyButton.parentElement) {
                simplifyButton.parentElement.removeChild(simplifyButton);
            }
            // 将简化按钮插入到最后一个现有按钮之后
            lastExistingButton.insertAdjacentElement('afterend', simplifyButton);
            logInfo(`简化按钮已成功移至最后一个现有按钮之后。`);

        } else {
            logError(`未能在目标容器 (${TARGET_CONTAINER_SELECTOR}) 中找到其他按钮。简化按钮将附加到容器末尾。按钮将依赖 #${BUTTON_ID}[data-moved="true"] 的样式。`);
            // 如果没有其他按钮，就直接附加到容器 (这种情况下，它会使用 #${BUTTON_ID}[data-moved="true"] 的样式)
            if (simplifyButton.parentElement) {
                simplifyButton.parentElement.removeChild(simplifyButton);
            }
            container.appendChild(simplifyButton);
            logInfo(`简化按钮已成功附加到目标容器末尾。`);
        }
        
        simplifyButton.dataset.moved = 'true'; // 标记为已移动

        // 按钮移动后，其视觉状态（如背景色）可能需要根据当前状态重新应用
        let currentStateGuess = 'idle';
        if (simplifyButton.textContent.includes(BUTTON_TEXT_PROCESSING)) currentStateGuess = 'processing';
        else if (simplifyButton.textContent.includes(BUTTON_TEXT_SUCCESS)) currentStateGuess = 'success';
        else if (simplifyButton.textContent.includes(BUTTON_TEXT_ERROR) || simplifyButton.textContent.includes(BUTTON_TEXT_API_ERROR)) currentStateGuess = 'error';
        else if (simplifyButton.textContent.includes(BUTTON_TEXT_NO_REPLIES)) currentStateGuess = 'no_replies';
        updateButtonState(currentStateGuess); // 会重新应用正确的背景色等
    };

    // --- 使用 DOMWatcherService 监听目标容器 ---
    if (window.DOMWatcherService && typeof window.DOMWatcherService.register === 'function') {
        logInfo(`尝试通过 DOMWatcherService 注册监听目标容器: ${TARGET_CONTAINER_SELECTOR}`);
        const registrationId = window.DOMWatcherService.register({
            id: `simplify-script-target-watcher-${BUTTON_ID}`, // 唯一的注册ID
            selector: TARGET_CONTAINER_SELECTOR,
            callback: function(foundContainer, eventType) {
                // eventType 在这里应为 'added' (因为 DOMWatcherService 的初始检查或后续添加)
                logInfo(`DOMWatcherService 报告: 目标容器 '${TARGET_CONTAINER_SELECTOR}' 事件 '${eventType}'.`);
                moveAndStyleButtonInternal(foundContainer);
                // 由于 once: true, DOMWatcherService 会自动注销此监听器
            },
            eventTypes: ['added'],
            once: true // 关键：找到容器并执行回调后，自动注销
        });

        if (registrationId) {
            logInfo(`已成功向 DOMWatcherService (ID: ${registrationId}) 注册监听。等待目标容器出现...`);
        } else {
            // 这通常意味着注册参数有问题，或者 DOMWatcherService 内部逻辑阻止了注册
            logError(`向 DOMWatcherService 注册监听失败。按钮将保留在初始位置 (通常是 body)，并使用默认的 fixed 定位样式。`);
            // 按钮将使用 #${BUTTON_ID} 定义的 fixed 样式（如果存在）
        }
    } else {
        logError('DOMWatcherService 未加载或不可用。按钮将保留在初始位置 (通常是 body)，并使用默认的 fixed 定位样式。');
        // 按钮将使用 #${BUTTON_ID} 定义的 fixed 样式（如果存在）
        // 此时，在 addGlobalStyle 中为 #${BUTTON_ID} 定义的 fixed 样式将生效。
        // 你可以根据需要调整这些 fixed 样式，使其在无法移动时也能合理显示。
    }
}

    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', setupUI);
    } else {
        setupUI();
    }
})();
// --- END OF FILE simplify_v3_adapted_for_new_structure.js ---