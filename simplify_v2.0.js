(function() {
    'use strict';
    // --- 配置 ---
    const BUTTON_ID = 'simplify-ai-button-v2'; // 按钮的唯一 ID (虽然现在不用ID选择器了)
    const BUTTON_TEXT_IDLE = '简化回复'; // 空闲状态按钮文本
    const BUTTON_TEXT_PROCESSING = '处理中...'; // 处理中状态按钮文本
    const BUTTON_TEXT_SUCCESS = '简化成功'; // 成功状态按钮文本
    const BUTTON_TEXT_ERROR = '简化失败'; // 失败状态按钮文本
    const BUTTON_TEXT_NO_REPLIES = '无回复'; // 未找到回复时的文本
    const BUTTON_TEXT_API_ERROR = 'API错误'; // API 或 Token 错误文本
    const LOCALSTORAGE_TOKEN_KEY = 'console_token'; // 存储 Token 的键名
    const LOCALSTORAGE_CONVERSATION_MAP_KEY = 'conversationIdInfo'; // 存储会话 ID 映射的键名
    const AI_REPLY_SELECTOR = 'div#ai-chat-answer'; // AI 回复的主容器选择器
    const CONTENT_CONTAINER_SELECTOR = '.undefined.markdown-body'; // 包含所有内容的容器选择器 (用于提取/修改)
    // --- 选择器常量 (适配 <details> HTML 结构) ---
    const SELECTORS_TO_REMOVE_LATEST = 'details.thinking, details.optionsarea'; // 最新回复移除：思考区, 选项区
    const SELECTORS_TO_REMOVE_SECOND_LATEST = 'details.optionsarea, details.memoryarea, details.thinking, details.statusbar'; // 次新回复移除：选项区, 记忆区, 思考区, 状态栏
    const API_BASE_URL = 'https://aifuck.cc/console/api/installed-apps/'; // API 基础 URL
    // --- 目标按钮容器选择器 ---
    const TARGET_CONTAINER_SELECTOR = 'div.flex.items-center.gap-2.pb-2';
    // --- 状态变量 ---
    let simplifyButton = null; // 按钮元素的引用
    let buttonResetTimeout = null; // 用于重置按钮状态的计时器

    // --- 辅助函数 ---
    function logDebug(...args) { console.log('[简化脚本 v2.0 DEBUG]', ...args); }
    function logInfo(...args) { console.log('[简化脚本 v2.0 INFO]', ...args); }
    function logError(...args) { console.error('[简化脚本 v2.0 ERROR]', ...args); }

    /**
     * 添加全局 CSS 样式到文档
     * @param {string} cssRules - 要添加的 CSS 规则字符串
     */
    function addGlobalStyle(cssRules) {
        const styleElement = document.createElement('style');
        styleElement.textContent = cssRules;
        document.head.appendChild(styleElement);
        logDebug('全局样式已添加。');
    }

    /**
     * 更新按钮的外观和状态 (使用 inline style)
     * @param {'idle' | 'processing' | 'success' | 'error' | 'no_replies' | 'api_error'} state - 按钮状态
     * @param {string} [detail=''] - 附加的详细文本
     */
    function updateButtonState(state, detail = '') {
        simplifyButton = document.querySelector('[data-simplify-button="true"]'); // 确保获取最新的按钮引用
        if (!simplifyButton) {
            // logDebug('updateButtonState: 简化按钮未找到。');
            return;
        }
        if (buttonResetTimeout) {
            clearTimeout(buttonResetTimeout);
            buttonResetTimeout = null;
        }
        let text = '';
        simplifyButton.disabled = false;
        simplifyButton.style.backgroundColor = '';
        simplifyButton.style.cursor = '';
        simplifyButton.style.opacity = '';

        switch (state) {
            case 'processing':
                text = detail ? `${BUTTON_TEXT_PROCESSING} (${detail})` : BUTTON_TEXT_PROCESSING;
                simplifyButton.disabled = true;
                simplifyButton.style.backgroundColor = '#9ca3af'; // 灰色
                simplifyButton.style.cursor = 'not-allowed';
                simplifyButton.style.opacity = '0.7';
                break;
            case 'success':
                text = detail ? `${BUTTON_TEXT_SUCCESS} (${detail})` : BUTTON_TEXT_SUCCESS;
                simplifyButton.style.backgroundColor = '#10b981'; // 绿色
                buttonResetTimeout = setTimeout(() => updateButtonState('idle'), 3000);
                break;
            case 'error':
            case 'api_error':
                text = detail ? `${BUTTON_TEXT_ERROR} (${detail})` : (state === 'api_error' ? BUTTON_TEXT_API_ERROR : BUTTON_TEXT_ERROR);
                simplifyButton.style.backgroundColor = '#ef4444'; // 红色
                buttonResetTimeout = setTimeout(() => updateButtonState('idle'), 5000);
                break;
            case 'no_replies':
                text = BUTTON_TEXT_NO_REPLIES;
                simplifyButton.style.backgroundColor = '#60a5fa'; // 浅蓝色 (Info)
                buttonResetTimeout = setTimeout(() => updateButtonState('idle'), 3000);
                break;
            case 'idle':
            default:
                text = BUTTON_TEXT_IDLE;
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
                headers: {"Authorization": authToken, "Accept": "application/json"},
                signal: controller.signal
            })
            .then(response => {
                clearTimeout(timeoutId);
                if (response.ok) { // status >= 200 && status < 300
                    return response.json();
                } else {
                    // Try to get text for better error message
                    return response.text().then(text => {
                        logError('获取消息失败:', response.status, response.statusText, text);
                        throw new Error(`获取失败: ${response.status} - ${text}`);
                    });
                }
            })
            .then(data => {
                const aiMessages = data.data.filter(msg => msg.hasOwnProperty('answer') && msg.answer !== null && msg.answer !== '');
                aiMessages.sort((a, b) => a.created_at - b.created_at);
                logInfo(`获取了 ${aiMessages.length} 条有效的 AI 消息。`);
                resolve(aiMessages);
            })
            .catch(error => {
                clearTimeout(timeoutId); // Ensure timeout is cleared on any error
                if (error.name === 'AbortError') {
                    // Already handled by timeout log, reject already called
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
                headers: {"Authorization": authToken, "Content-Type": "application/json", "Accept": "*/*"},
                body: payload,
                signal: controller.signal
            })
            .then(response => {
                clearTimeout(timeoutId);
                if (response.ok) {
                    logInfo(`通过 API 成功更新消息 ${messageId}。`);
                    return response.text(); // Or response.json() if expecting JSON
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
                    // Already handled
                } else {
                    logError(`更新消息 ${messageId} 时网络错误或API问题:`, error);
                    reject(error.message || '网络错误');
                }
            });
        });
    }

    function extractSimplifiedContent(contentContainer, selectorsToRemove) {
        if (!contentContainer) {
            logError("    - extractSimplifiedContent: contentContainer 为 null。无法处理。");
            return null;
        }
        try {
            const clonedContainer = contentContainer.cloneNode(true);
            if (selectorsToRemove && selectorsToRemove.trim() !== "") {
                const elementsToRemove = clonedContainer.querySelectorAll(selectorsToRemove);
                elementsToRemove.forEach(el => el.remove());
            }
            return clonedContainer.innerHTML.trim();
        } catch (error) {
            logError("    - 内容提取/清理过程中出错:", error);
            return null;
        }
    }

    function updatePageElementVisuals(pageElement, simplifiedHtml) {
        if (!pageElement || simplifiedHtml === null) return;
        const contentContainer = pageElement.querySelector(CONTENT_CONTAINER_SELECTOR);
        if (contentContainer) {
            logDebug(`    - 正在更新页面元素视觉效果...`);
            contentContainer.innerHTML = simplifiedHtml;
            let mark = contentContainer.querySelector('.script-simplified-mark');
            if (!mark) {
                mark = document.createElement('div');
                mark.className = 'script-simplified-mark';
                mark.style.fontSize = '10px';
                mark.style.color = 'grey';
                mark.style.marginTop = '5px';
                mark.style.fontStyle = 'italic';
                contentContainer.appendChild(mark);
            }
            mark.textContent = '(已由脚本简化)';
            logInfo(`    - 成功更新页面元素视觉效果。`);
        } else {
            logError(`    - 找不到用于更新视觉效果的内容容器 (${CONTENT_CONTAINER_SELECTOR})。视觉更新失败。`);
        }
    }

    async function processLastTwoReplies() {
        if (!simplifyButton || simplifyButton.disabled) {
            logInfo('正在处理中或按钮无效，请稍候...');
            return;
        }
        logInfo(`按钮点击: ${BUTTON_TEXT_IDLE}`);
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
            const pageReplies = document.querySelectorAll(AI_REPLY_SELECTOR);
            logInfo(`在页面上找到 ${pageReplies.length} 个 AI 回复元素。`);

            const numApiMessages = apiMessages.length;
            const numPageReplies = pageReplies.length;

            if (numPageReplies === 0) {
                logInfo('页面上未找到 AI 回复。无需操作。');
                updateButtonState('no_replies');
                return;
            }

            if (numApiMessages !== numPageReplies) {
                logError(`警告: API 消息数量 (${numApiMessages}) 与页面元素数量 (${numPageReplies}) 不同。将以页面元素为基准定位。`);
            }

            let successCount = 0;
            let failCount = 0;
            const repliesToProcess = [];

            const lastPageIndex = numPageReplies - 1;
            if (lastPageIndex >= 0) {
                const latestPageElement = pageReplies[lastPageIndex];
                const latestApiMessage = (lastPageIndex < numApiMessages) ? apiMessages[lastPageIndex] : null;
                if (latestApiMessage) {
                    repliesToProcess.push({
                        index: lastPageIndex, element: latestPageElement, apiMessage: latestApiMessage,
                        selectorsToRemove: SELECTORS_TO_REMOVE_LATEST, label: "最新"
                    });
                } else {
                    logError(`无法为最新的页面元素 (索引 ${lastPageIndex}) 找到匹配的 API 消息。跳过处理最新消息。`);
                    failCount++;
                }
            }

            const secondLastPageIndex = numPageReplies - 2;
            if (secondLastPageIndex >= 0) {
                const secondLatestPageElement = pageReplies[secondLastPageIndex];
                const secondLatestApiMessage = (secondLastPageIndex < numApiMessages) ? apiMessages[secondLastPageIndex] : null;
                if (secondLatestApiMessage) {
                    repliesToProcess.push({
                        index: secondLastPageIndex, element: secondLatestPageElement, apiMessage: secondLatestApiMessage,
                        selectorsToRemove: SELECTORS_TO_REMOVE_SECOND_LATEST, label: "次新"
                    });
                } else {
                    if (numPageReplies > 1) {
                        logError(`无法为次新的页面元素 (索引 ${secondLastPageIndex}) 找到匹配的 API 消息。跳过处理次新消息。`);
                        // failCount++; // Decide if this counts as a hard failure
                    }
                }
            }

            if (repliesToProcess.length === 0 && failCount > 0 && numPageReplies > 0) {
                 logError("API消息与页面元素严重不匹配，无法执行简化操作。");
                 updateButtonState('error', '数据不匹配');
                 return;
            }
            if (repliesToProcess.length === 0 && numPageReplies > 0) {
                logInfo("没有符合条件的消息进行处理 (例如只有一条消息，或API不匹配但未计入failCount)。");
                // Potentially updateButtonState('no_replies') or 'idle' if no explicit error
                 updateButtonState('idle');
                return;
            }


            repliesToProcess.sort((a, b) => a.index - b.index);
            logInfo(`计划处理 ${repliesToProcess.length} 条回复。`);

            for (const target of repliesToProcess) {
                logInfo(`--- 开始处理 ${target.label} 回复 (页面索引: ${target.index}, API ID: ${target.apiMessage.id}) ---`);
                updateButtonState('processing', target.label);
                const contentContainer = target.element.querySelector(CONTENT_CONTAINER_SELECTOR);
                if (!contentContainer) {
                    logError(`  - 无法找到 ${target.label} 回复的内容容器 (${CONTENT_CONTAINER_SELECTOR})。跳过此回复。`);
                    failCount++;
                    continue;
                }
                const newContent = extractSimplifiedContent(contentContainer, target.selectorsToRemove);
                if (newContent === null) {
                    logError(`  - 未能为 ${target.label} 回复提取有效内容。跳过更新。`);
                    failCount++;
                    continue;
                }
                logDebug(`  - 为 ${target.label} 回复提取的内容长度: ${newContent.length}`);
                try {
                    await updateMessageApi(appId, target.apiMessage.id, newContent, authToken);
                    updatePageElementVisuals(target.element, newContent);
                    successCount++;
                } catch (updateError) {
                    logError(`  - 更新 ${target.label} 回复失败:`, updateError);
                    failCount++;
                }
                await new Promise(resolve => setTimeout(resolve, 100)); // 短暂延迟
            }

            const totalProcessed = repliesToProcess.length;
            logInfo(`--- 处理完成 --- 成功: ${successCount}, 失败: ${failCount} (共 ${totalProcessed} 个目标)`);

            if (failCount > 0) {
                updateButtonState('error', `${successCount}/${totalProcessed} 成功`);
            } else if (successCount > 0) {
                updateButtonState('success', `${successCount}/${totalProcessed}`);
            } else {
                 if (totalProcessed === 0 && numPageReplies > 0) { // No items were targeted for processing but replies existed
                     updateButtonState('no_replies', '无适用目标');
                 } else {
                     updateButtonState('idle'); // Nothing processed, return to idle
                 }
            }

        } catch (error) {
            logError('处理过程中发生整体错误:', error);
            updateButtonState('error', '意外错误');
        }
    }

    function setupUI() {
        addGlobalStyle(`
            .script-simplified-mark { font-size: 10px; color: grey; margin-top: 5px; font-style: italic; }
        `);

        const insertButtonIntoContainer = (container) => {
            if (!container) return;
            if (container.querySelector('[data-simplify-button="true"]')) {
                simplifyButton = container.querySelector('[data-simplify-button="true"]');
                logDebug("简化按钮已存在，更新引用。");
                if (!simplifyButton.dataset.listenerAttached) {
                    simplifyButton.addEventListener('click', processLastTwoReplies);
                    simplifyButton.dataset.listenerAttached = 'true';
                }
                return;
            }

            const referenceButton = container.querySelector('button');
            if (!referenceButton) {
                logError(`未能在目标容器 (${TARGET_CONTAINER_SELECTOR}) 中找到参考按钮以复制样式。无法添加按钮。`);
                return;
            }
            logInfo("找到参考按钮:", referenceButton, "将复制其 classes:", referenceButton.classList);

            simplifyButton = document.createElement('button');
            simplifyButton.className = referenceButton.className;
            simplifyButton.dataset.simplifyButton = 'true';
            simplifyButton.textContent = BUTTON_TEXT_IDLE;
            simplifyButton.title = '简化最后 1 或 2 条 AI 回复 (v2.0)';
            simplifyButton.addEventListener('click', processLastTwoReplies);
            simplifyButton.dataset.listenerAttached = 'true';

            try {
                container.appendChild(simplifyButton);
                logInfo(`简化按钮已复制样式并添加到目标容器末尾。`);
            } catch (e) {
                logError("尝试 appendChild 到新容器时出错:", e);
            }
            updateButtonState('idle');
        };

        const observer = new MutationObserver((mutationsList, observerInstance) => {
            const targetContainer = document.querySelector(TARGET_CONTAINER_SELECTOR);
            if (targetContainer) {
                logInfo('MutationObserver 找到目标容器:', targetContainer);
                insertButtonIntoContainer(targetContainer);
                observerInstance.disconnect();
                logDebug('停止 MutationObserver.');
            }
        });

        const initialTargetContainer = document.querySelector(TARGET_CONTAINER_SELECTOR);
        if (initialTargetContainer) {
            logInfo('目标容器已存在，直接尝试添加按钮。');
            insertButtonIntoContainer(initialTargetContainer);
        } else {
            logInfo('未立即找到目标容器，启动 MutationObserver 等待...');
            observer.observe(document.body, { childList: true, subtree: true });
        }
    }

    // --- 初始化 ---
    if (document.readyState === 'loading') {
        window.addEventListener('DOMContentLoaded', setupUI);
    } else {
        setupUI();
    }
})();
