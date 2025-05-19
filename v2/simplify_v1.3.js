// --- START OF FILE simplify_v3_improved.js --- (假设文件名更改)

(function () {
    'use strict';
    // --- 配置 ---
    const BUTTON_ID = 'simplify-ai-button-v2'; // 按钮的唯一 ID
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
    const SELECTORS_TO_REMOVE_LATEST = 'details.thinking, details.optionsarea'; // 最新回复中要移除的元素选择器
    const SELECTORS_TO_REMOVE_SECOND_LATEST = 'details.optionsarea, details.memoryarea, details.thinking, details.statusbar'; // 次新回复中要移除的元素选择器
    const API_BASE_URL = 'https://aifuck.cc/console/api/installed-apps/';
    const TARGET_CONTAINER_SELECTOR = 'div.flex.items-center.gap-2.pb-2'; // 按钮期望被移入的目标容器

    // --- 状态变量 ---
    let simplifyButton = null; // 按钮元素的引用 (全局)
    let buttonResetTimeout = null; // 按钮状态重置的定时器

    // --- 辅助函数 ---
    function logDebug(...args) { console.log('[简化脚本 v2.2 DEBUG]', ...args); }
    function logInfo(...args) { console.log('[简化脚本 v2.2 INFO]', ...args); }
    function logError(...args) { console.error('[简化脚本 v2.2 ERROR]', ...args); }

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
                // 如果按钮有class（可能来自参考按钮），则不设置背景色，让class控制
                // 否则，使用初始记录的背景色或默认色
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
            const url = `${API_BASE_URL}${appId}/messages?conversation_id=${conversationId}&limit=100`; // 限制100条，应该足够覆盖最后两条
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                logError('获取消息超时 (15s).');
                reject('超时');
            }, 15000); // 15秒超时

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
                    // 筛选出AI的回复，并确保 answer 字段存在 (允许为空字符串，因为简化操作可能会处理空内容)
                    const aiMessages = data.data.filter(msg => msg.hasOwnProperty('answer'));
                    aiMessages.sort((a, b) => a.created_at - b.created_at); // 按创建时间升序排序
                    logInfo(`获取了 ${aiMessages.length} 条有效的 AI 消息 (包含 'answer' 字段)。`);
                    resolve(aiMessages);
                })
                .catch(error => {
                    clearTimeout(timeoutId);
                    if (error.name === 'AbortError') {
                        // 超时已被处理，reject('超时')已调用
                    } else {
                        logError('获取消息网络错误或解析失败:', error);
                        reject(error.message || '网络错误');
                    }
                });
        });
    }

    function updateMessageApi(appId, messageId, newContent, authToken) {
        return new Promise((resolve, reject) => {
            if (!appId || !messageId || newContent === null || newContent === undefined || !authToken) { // 检查 newContent 是否为 null 或 undefined
                logError('更新消息 API 缺少参数', { appId, messageId, newContent: typeof newContent, authToken: !!authToken });
                return reject('更新消息 API 缺少参数');
            }
            const url = `${API_BASE_URL}${appId}/messages/${messageId}`;
            const payload = JSON.stringify({ answer: newContent }); // 发送简化后的 HTML 内容
            const controller = new AbortController();
            const timeoutId = setTimeout(() => {
                controller.abort();
                logError(`更新消息 ${messageId} 超时 (15s).`);
                reject('超时');
            }, 15000); // 15秒超时

            fetch(url, {
                method: "PATCH",
                headers: { "Authorization": authToken, "Content-Type": "application/json", "Accept": "*/*" }, // Accept: */* 是一些API的要求
                body: payload,
                signal: controller.signal
            })
                .then(response => {
                    clearTimeout(timeoutId);
                    if (response.ok) {
                        logInfo(`通过 API 成功更新消息 ${messageId}。`);
                        return response.text(); // 或 response.json() 如果 API 返回 JSON
                    } else {
                        return response.text().then(text => {
                            logError(`通过 API 更新消息 ${messageId} 失败:`, response.status, response.statusText, text);
                            throw new Error(`API 更新失败: ${response.status} - ${text}`);
                        });
                    }
                })
                .then(responseText => {
                    resolve(responseText); // 成功时 resolve API 的响应文本
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
     * 从给定的 DOM 元素 (通常是一个代表消息内容的容器) 中提取并清理内容。
     * @param {HTMLElement} sourceElement - 包含原始HTML内容的 DOM 元素。
     * @param {string} selectorsToRemove - 要从此内容中移除的元素的选择器字符串。
     * @returns {string|null} 清理后的 HTML 字符串，如果出错或源元素无效则返回 null。
     */
    function extractSimplifiedContent(sourceElement, selectorsToRemove) {
        if (!sourceElement || typeof sourceElement.cloneNode !== 'function') { // 增加对 sourceElement 有效性的检查
            logError("    - extractSimplifiedContent: sourceElement 无效或非 DOM 元素。无法处理。", sourceElement);
            return null;
        }
        try {
            // 克隆源元素以进行修改，避免直接操作传入的元素 (特别是当它来自页面DOM时)
            const clonedElement = sourceElement.cloneNode(true);
            if (selectorsToRemove && selectorsToRemove.trim() !== "") {
                const elementsToRemove = clonedElement.querySelectorAll(selectorsToRemove);
                elementsToRemove.forEach(el => el.remove());
            }
            return clonedElement.innerHTML.trim(); // 返回清理后元素的内部 HTML
        } catch (error) {
            logError("    - 内容提取/清理过程中出错:", error, "源元素:", sourceElement);
            return null;
        }
    }

    /**
     * 更新页面上指定AI回复元素的视觉显示。
     * @param {HTMLElement} pageReplyElement - 代表AI回复的顶层DOM元素 (例如 div#ai-chat-answer)。
     * @param {string} simplifiedHtmlForDisplay - 已经过简化的HTML字符串，用于替换原始内容。
     */
    function updatePageElementVisuals(pageReplyElement, simplifiedHtmlForDisplay) {
        if (!pageReplyElement || simplifiedHtmlForDisplay === null) {
            logError("    - updatePageElementVisuals: pageReplyElement 或 simplifiedHtmlForDisplay 为空，无法更新视觉。");
            return false; // 指示更新失败
        }
        // AI 回复内容实际所在的容器 (Markdown 渲染体)
        const contentContainer = pageReplyElement.querySelector(CONTENT_CONTAINER_SELECTOR);
        if (contentContainer) {
            logDebug(`    - 正在更新页面元素 (ID: ${pageReplyElement.id}, 内容容器 class: ${contentContainer.className}) 的视觉效果...`);
            contentContainer.innerHTML = simplifiedHtmlForDisplay; // 更新 markdown-body 的内容

            // 移除此 pageReplyElement 内任何已存在的简化标记，以防重复
            const existingMarks = pageReplyElement.querySelectorAll('.script-simplified-mark');
            existingMarks.forEach(em => em.remove());

            // 创建新的简化标记
            const mark = document.createElement('div');
            mark.className = 'script-simplified-mark';
            mark.textContent = '(已由脚本简化)';

            // 将标记插入到 contentContainer (markdown-body) 的后面，作为其兄弟节点
            // 确保 contentContainer 确实有父节点可以插入
            if (contentContainer.parentNode) {
                contentContainer.parentNode.insertBefore(mark, contentContainer.nextSibling);
            } else {
                // 备选方案：如果 contentContainer 没有父节点（不太可能），则附加到 pageReplyElement
                pageReplyElement.appendChild(mark);
                logError("    - contentContainer 没有父节点，简化标记附加到 pageReplyElement。");
            }

            logInfo(`    - 成功更新页面元素 (ID: ${pageReplyElement.id}) 视觉效果。`);
            return true; // 指示更新成功
        } else {
            logError(`    - 在 pageReplyElement (ID: ${pageReplyElement.id}) 中找不到用于更新视觉效果的内容容器 (${CONTENT_CONTAINER_SELECTOR})。视觉更新失败。`);
            return false; // 指示更新失败
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
            const apiMessages = await fetchMessages(appId, conversationId, authToken); // 从API获取的消息列表 (已排序)
            const pageReplyElements = document.querySelectorAll(AI_REPLY_SELECTOR); // 页面上渲染的AI回复元素 (NodeList)
            logInfo(`从 API 获取了 ${apiMessages.length} 条消息，在页面上找到 ${pageReplyElements.length} 个 AI 回复元素。`);

            const numApiMessages = apiMessages.length;
            const numPageReplies = pageReplyElements.length;

            if (numPageReplies === 0) {
                logInfo('页面上未找到 AI 回复。无需操作。');
                updateButtonState('no_replies');
                return;
            }

            // 注意: 这里的匹配逻辑基于索引。如果API消息和页面元素顺序严重不符，可能会处理错误的消息。
            // 但通常情况下，它们应该是一一对应的（旧消息在上，新消息在下）。
            if (numApiMessages !== numPageReplies) {
                logError(`警告: API 消息数量 (${numApiMessages}) 与页面元素数量 (${numPageReplies}) 不同。将以页面元素为基准定位对应的API消息。`);
                // 这种情况下，依赖 apiMessages[index] 可能不准确，但这是目前最好的猜测。
            }

            let successCount = 0;
            let failCount = 0;
            const repliesToProcess = []; // 存储需要处理的回复信息

            // 定位最新回复
            const lastPageIndex = numPageReplies - 1;
            if (lastPageIndex >= 0) {
                const latestPageElement = pageReplyElements[lastPageIndex];
                // 假设页面元素和API消息是按相同顺序排列的 (旧->新)
                const latestApiMessage = (lastPageIndex < numApiMessages) ? apiMessages[lastPageIndex] : null;
                if (latestApiMessage && latestApiMessage.answer !== undefined) { // 确保有 answer 字段
                    repliesToProcess.push({
                        index: lastPageIndex,
                        pageElement: latestPageElement, // 页面上的 DOM 元素
                        apiMessage: latestApiMessage,   // API 返回的对应消息对象
                        selectorsToRemove: SELECTORS_TO_REMOVE_LATEST,
                        label: "最新"
                    });
                } else {
                    logError(`无法为最新的页面元素 (索引 ${lastPageIndex}) 找到匹配的 API 消息或其 'answer' 字段无效。跳过处理最新消息。`);
                    if (latestPageElement) failCount++; // 如果页面元素存在但API信息不匹配，计入失败 (因为用户可能期望它被处理)
                }
            }

            // 定位次新回复
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
                    if (numPageReplies > 1) { // 仅当确实期望有次新回复时才记录错误
                        logError(`无法为次新的页面元素 (索引 ${secondLastPageIndex}) 找到匹配的 API 消息或其 'answer' 字段无效。跳过处理次新消息。`);
                        // if (secondLatestPageElement) failCount++; // 同上
                    }
                }
            }

            if (repliesToProcess.length === 0) {
                if (failCount > 0 && numPageReplies > 0) { // 有页面元素但因匹配问题导致没有可处理的
                    logError("API消息与页面元素严重不匹配，或目标消息无内容，无法执行简化操作。");
                    updateButtonState('error', '数据不匹配');
                } else if (numPageReplies > 0) { // 有页面回复，但可能不满足处理条件（例如只有一条，不处理次新）
                    logInfo("没有符合条件的消息进行处理。");
                    updateButtonState('idle'); // 或者 'no_replies', '无适用目标'
                } else { // 本来就没有回复
                    updateButtonState('no_replies');
                }
                return;
            }

            repliesToProcess.sort((a, b) => a.index - b.index); // 按页面顺序处理（尽管这里只有最多两个，但好习惯）
            logInfo(`计划处理 ${repliesToProcess.length} 条回复。`);

            for (const target of repliesToProcess) {
                logInfo(`--- 开始处理 ${target.label} 回复 (页面索引: ${target.index}, API ID: ${target.apiMessage.id}) ---`);
                updateButtonState('processing', target.label);

                const { pageElement, apiMessage, selectorsToRemove } = target;

                // 1. 为 API 更新准备内容：从 apiMessage.answer 提取和简化
                let simplifiedContentForApi = null;
                if (apiMessage.answer && typeof apiMessage.answer === 'string') {
                    const tempDivForApiAnswer = document.createElement('div'); // 创建一个临时容器来解析 apiMessage.answer
                    tempDivForApiAnswer.innerHTML = apiMessage.answer;       // 将原始HTML字符串放入临时容器

                    // extractSimplifiedContent 需要一个 DOM 元素作为输入
                    simplifiedContentForApi = extractSimplifiedContent(tempDivForApiAnswer, selectorsToRemove);
                } else {
                    logError(`  - ${target.label} 回复的 API 消息 (ID: ${apiMessage.id}) 中 'answer' 字段为空或非字符串。无法为API提取内容。`);
                }

                if (simplifiedContentForApi === null) {
                    logError(`  - 未能为 ${target.label} 回复 (ID: ${apiMessage.id}) 从 API 原始内容提取有效内容用于 API 更新。跳过此回复。`);
                    failCount++;
                    continue; // 跳过此回复的后续所有处理
                }
                logDebug(`  - 为 ${target.label} 回复 (ID: ${apiMessage.id}) 从 API 原始内容提取的待更新内容长度: ${simplifiedContentForApi.length}`);

                // 添加模式区域
                if (target.label === "最新") {
                    const currentModeText = getCurrentSelectedModeText();

                    if (currentModeText) { // 确保有模式文本才添加
                        const modeAreaHtml = `\n<div class="mode-area">${currentModeText}</div>`; // \n可选，为了格式
                        simplifiedContentForApi += modeAreaHtml;
                        logDebug(`  - (API内容) 已为最新回复追加模式区域: ${modeAreaHtml.trim()}`);
                    } else {
                        logDebug(`  - (API内容) 最新回复无模式文本可追加。`);
                    }
                } else if (target.label === "次新") {
                    // 从次新回复的 API 内容中移除模式区域
                    // 我们需要解析 simplifiedContentForApi 来移除特定 div
                    const tempContainer = document.createElement('div');
                    tempContainer.innerHTML = simplifiedContentForApi;
                    const modeAreaElement = tempContainer.querySelector('div.mode-area');

                    if (modeAreaElement) {
                        modeAreaElement.remove();
                        simplifiedContentForApi = tempContainer.innerHTML;
                        logDebug(`  - (API内容) 已从次新回复移除模式区域。`);
                    } else {
                        logDebug(`  - (API内容) 次新回复中未找到模式区域可移除。`);
                    }
                }

                // 2. 更新 API 消息
                let apiUpdateSuccessful = false;
                try {
                    await updateMessageApi(appId, apiMessage.id, simplifiedContentForApi, authToken);
                    logInfo(`  - ${target.label} 回复 (ID: ${apiMessage.id}) 的 API 消息已成功更新。`);
                    apiUpdateSuccessful = true;
                } catch (apiUpdateError) {
                    logError(`  - 更新 ${target.label} 回复 (ID: ${apiMessage.id}) 的 API 消息失败:`, apiUpdateError);
                    // API 更新失败，不应继续进行页面视觉更新，并计入失败
                    failCount++;
                    continue; // 跳过此回复的页面视觉更新
                }

                // 3. 为页面视觉更新准备内容：从当前页面元素提取和简化
                //    仅在 API 更新成功后执行
                if (apiUpdateSuccessful) {
                    const currentContentContainer = pageElement.querySelector(CONTENT_CONTAINER_SELECTOR);
                    if (currentContentContainer) {
                        // 使用页面上实际的 .markdown-body 内容作为简化的源
                        // 传入克隆节点以防 extractSimplifiedContent 意外修改原始 DOM (虽然它内部也克隆)
                        const simplifiedHtmlForPageDisplay = extractSimplifiedContent(currentContentContainer.cloneNode(true), selectorsToRemove);

                        if (simplifiedHtmlForPageDisplay !== null) {
                            // 4. 更新页面视觉
                            if (updatePageElementVisuals(pageElement, simplifiedHtmlForPageDisplay)) {
                                successCount++;
                            } else {
                                logError(`  - 更新 ${target.label} 回复 (ID: ${apiMessage.id}) 的页面视觉效果失败，尽管 API 已更新。`);
                                failCount++; // API 更新了，但页面没更新，算作一次操作的部分失败
                            }
                        } else {
                            logError(`  - 未能为 ${target.label} 回复 (ID: ${apiMessage.id}) 从页面元素提取有效内容用于视觉更新。API 可能已更新。`);
                            failCount++; // 无法准备页面内容，也算失败
                        }
                    } else {
                        logError(`  - 在 ${target.label} 回复 (ID: ${apiMessage.id}) 的页面元素中找不到内容容器 (${CONTENT_CONTAINER_SELECTOR})。无法更新视觉。API 可能已更新。`);
                        failCount++;
                    }
                }
                await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延时，避免请求过于频繁 (可选)
            } // end of for loop

            const totalTargets = repliesToProcess.length;
            logInfo(`--- 处理完成 --- 成功: ${successCount}, 失败: ${failCount} (共 ${totalTargets} 个目标)`);

            if (failCount > 0 && successCount > 0) { // 部分成功
                updateButtonState('error', `${successCount}/${totalTargets} 成功`);
            } else if (failCount > 0) { // 全部失败
                updateButtonState('error', `0/${totalTargets} 成功`);
            } else if (successCount > 0) { // 全部成功
                updateButtonState('success', `${successCount}/${totalTargets}`);
            } else { // 没有目标被处理，或者没有成功也没有失败 (例如repliesToProcess为空)
                if (totalTargets === 0 && numPageReplies > 0) {
                    updateButtonState('no_replies', '无适用目标');
                } else if (numPageReplies === 0) {
                    updateButtonState('no_replies');
                } else {
                    updateButtonState('idle'); // 默认回退
                }
            }

        } catch (error) { // 捕获 processLastTwoReplies 过程中的顶层错误 (例如 fetchMessages 失败)
            logError('处理过程中发生整体错误:', error);
            if (error.message && error.message.includes("获取失败")) { // 特指 fetchMessages 的已知错误类型
                updateButtonState('api_error', '获取消息失败');
            } else {
                updateButtonState('error', '意外错误');
            }
        }
    }

    function setupUI() {
        addGlobalStyle(`
            .script-simplified-mark { 
                font-size: 10px; 
                color: grey; 
                margin-top: 5px; /* 与 markdown-body 的间距 */
                margin-bottom: 5px; /* 如果后面还有元素，也给点间距 */
                font-style: italic; 
                display: block; /* 确保独占一行 */
            }
            #${BUTTON_ID} {
                /* 初始样式，当按钮还未被移动到目标容器时 */
                position: fixed; 
                cursor: pointer;
                /* 默认背景色在 updateButtonState('idle') 中设置 */
            }
            #${BUTTON_ID}[data-moved="true"] { 
                /* 当按钮被移动到目标容器后应用的样式 */
                position: static; /* 取消 fixed 定位，随文档流 */
                right: auto;
                bottom: auto;
                z-index: auto;
                /* margin-left: 8px; */ /* 可选：如果需要与其他按钮保持间距 */
            }
        `);

        if (document.getElementById(BUTTON_ID)) {
            simplifyButton = document.getElementById(BUTTON_ID);
            logInfo("简化按钮已存在 (可能由脚本重载)。更新引用。");
        } else {
            simplifyButton = document.createElement('button');
            simplifyButton.id = BUTTON_ID;
            document.body.appendChild(simplifyButton);
            logInfo(`简化按钮已创建并添加到 body (ID: ${BUTTON_ID}).`);
        }

        simplifyButton.textContent = BUTTON_TEXT_IDLE; // 初始文本
        simplifyButton.title = '简化最后 1 或 2 条 AI 回复 (v2.2)';
        simplifyButton.dataset.moved = 'false'; // 初始状态为未移动

        // 尝试获取并存储初始背景色 (如果按钮已经有样式)
        const computedStyle = window.getComputedStyle(simplifyButton);
        const initialBg = computedStyle.backgroundColor;
        if (initialBg && initialBg !== 'rgba(0, 0, 0, 0)' && initialBg !== 'transparent') {
            simplifyButton.dataset.initialBgColor = initialBg;
        } else {
            simplifyButton.dataset.initialBgColor = '#007bff'; // 默认一个蓝色作为初始色
        }


        if (!simplifyButton.dataset.listenerAttached) { // 防止重复添加监听器
            simplifyButton.addEventListener('click', processLastTwoReplies);
            simplifyButton.dataset.listenerAttached = 'true';
            logInfo('按钮点击事件监听器已添加。');
        }
        updateButtonState('idle'); // 应用初始状态和样式


        const moveAndStyleButton = (container) => {
            if (!container || !simplifyButton) return;
            // 如果按钮已在目标容器中且已标记，则不重复操作 (避免 MutationObserver 多次触发时的冗余操作)
            if (simplifyButton.parentElement === container && simplifyButton.dataset.moved === 'true') {
                logDebug("按钮已在目标容器中且已标记，无需操作。");
                return;
            }

            // 尝试从目标容器内的其他按钮复制样式类
            const referenceButton = container.querySelector('button:not(#' + BUTTON_ID + ')'); // 寻找非自身按钮作为参考
            if (referenceButton) {
                logInfo("找到参考按钮，将尝试复制其 classes:", referenceButton.classList.toString());
                simplifyButton.className = referenceButton.className; // 复制所有 class
                // 如果复制了 class，清除直接设置的背景色，让 class 生效
                simplifyButton.style.backgroundColor = '';
                // 如果参考按钮没有特定颜色类，可能需要保留或设置一个默认颜色
                // 例如，可以检查参考按钮的颜色，但通常class会处理
            } else {
                logError(`未能在目标容器 (${TARGET_CONTAINER_SELECTOR}) 中找到参考按钮。按钮将保留其默认或初始样式。`);
                // 如果没有参考按钮，确保按钮至少有一个基本的可视样式
                // （此时 simplifyButton.className 为空，updateButtonState 会处理背景色）
            }

            simplifyButton.dataset.moved = 'true'; // 标记为已移动，这将触发CSS中 position:static 的规则

            try {
                container.appendChild(simplifyButton); // 移到末尾
                logInfo(`简化按钮已移至目标容器 (${TARGET_CONTAINER_SELECTOR}) 并尝试应用样式。`);
            } catch (e) {
                logError("尝试将按钮移动到目标容器时出错:", e);
                simplifyButton.dataset.moved = 'false'; // 移动失败，重置标记
                // 按钮可能仍在body中，或在其他位置，样式回退到 fixed
            }
            // 移入容器后，重新应用一次按钮状态，确保样式（尤其是背景色）正确
            // 通过读取当前按钮文本来猜测状态，这比较粗略，但通常够用
            let currentStateGuess = 'idle';
            if (simplifyButton.textContent.includes(BUTTON_TEXT_PROCESSING)) currentStateGuess = 'processing';
            else if (simplifyButton.textContent.includes(BUTTON_TEXT_SUCCESS)) currentStateGuess = 'success';
            else if (simplifyButton.textContent.includes(BUTTON_TEXT_ERROR) || simplifyButton.textContent.includes(BUTTON_TEXT_API_ERROR)) currentStateGuess = 'error';
            else if (simplifyButton.textContent.includes(BUTTON_TEXT_NO_REPLIES)) currentStateGuess = 'no_replies';

            updateButtonState(currentStateGuess); // 用猜测的状态更新，主要为了刷新背景色
        };

        // 使用 MutationObserver 监视目标容器的出现
        const observer = new MutationObserver((mutationsList, observerInstance) => {
            const targetContainer = document.querySelector(TARGET_CONTAINER_SELECTOR);
            if (targetContainer) {
                logInfo('MutationObserver 找到目标容器:', targetContainer);
                moveAndStyleButton(targetContainer);
                observerInstance.disconnect(); // 找到后停止观察，节省资源
                logDebug('停止 MutationObserver (目标容器已找到)。');
            }
        });

        // 页面加载时立即检查一次目标容器是否存在
        const initialTargetContainer = document.querySelector(TARGET_CONTAINER_SELECTOR);
        if (initialTargetContainer) {
            logInfo('目标容器已存在，直接尝试移动和样式化按钮。');
            moveAndStyleButton(initialTargetContainer);
        } else {
            logInfo('未立即找到目标容器，启动 MutationObserver 等待...');
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    // --- 初始化 ---
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', setupUI);
    } else {
        setupUI(); // 如果 DOM 已加载，则直接运行
    }
})();
// --- END OF FILE simplify_v3_improved.js ---