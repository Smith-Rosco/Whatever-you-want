(function runCustomUI() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runCustomUI);
        return;
    }

    console.log('【自定义脚本】runCustomUI 开始执行');

    // --- 配置区 ---
    const NATIVE_TEXTAREA_SELECTOR = '#ai-chat-input';
    const NATIVE_SEND_BUTTON_SELECTOR = '#ai-send-button';
    const NATIVE_CONTROLS_AREA_SELECTOR = '.flex.items-center.gap-2.pb-2'; // 用于按钮区域
    const CUSTOM_MODE_TOGGLE_ID = 'custom-mode-toggle-scripted'; // 给自定义按钮一个唯一ID
    const CUSTOM_ENHANCEMENT_TOGGLE_ID = 'custom-enhancement-toggle-scripted';

    // --- 状态变量 (在 IIFE 作用域内持久) ---
    let currentMode = '角色扮演模式';
    let currentEnhancement = false;

    // --- 用于存储事件监听器引用的变量，方便后续移除 ---
    let activeSendButtonClickListener = null;
    let activeTextareaKeyDownListener = null;
    // --- 用于存储对原生元素的引用，MutationObserver 可以检查它们是否变化 ---
    let knownNativeTextarea = null;
    let knownNativeSendButton = null;

    function initializeChatEnhancements() {
        console.log('【自定义脚本】尝试执行 initializeChatEnhancements...');

        const nativeTextarea = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
        const nativeSendButton = document.querySelector(NATIVE_SEND_BUTTON_SELECTOR);
        const nativeControlsOrButtonArea = document.querySelector(NATIVE_CONTROLS_AREA_SELECTOR);

        if (!nativeTextarea || !nativeSendButton || !nativeControlsOrButtonArea) {
            console.warn('【自定义脚本】initializeChatEnhancements: 未能找到所有必要的原生页面元素。等待下一次DOM变化或检查选择器。');
            knownNativeTextarea = null; // 标记为未找到
            knownNativeSendButton = null;
            return false;
        }
        console.log('【自定义脚本】initializeChatEnhancements: 核心元素已找到。');
        knownNativeTextarea = nativeTextarea; // 更新已知元素
        knownNativeSendButton = nativeSendButton;


        // --- 移除旧的事件监听器 (如果之前已添加在这些特定元素实例上) ---
        if (activeSendButtonClickListener && nativeSendButton._hasCustomListener) {
            nativeSendButton.removeEventListener('click', activeSendButtonClickListener, true);
            nativeSendButton._hasCustomListener = false; // 清除标记
            console.log('【自定义脚本】旧的发送按钮点击监听器已移除');
        }
        if (activeTextareaKeyDownListener && nativeTextarea._hasCustomListener) {
            nativeTextarea.removeEventListener('keydown', activeTextareaKeyDownListener);
            nativeTextarea._hasCustomListener = false; // 清除标记
            console.log('【自定义脚本】旧的文本区域按键监听器已移除');
        }

        // --- 创建或获取自定义控制按钮 ---
        let modeToggleButton = document.getElementById(CUSTOM_MODE_TOGGLE_ID);
        if (!modeToggleButton) {
            modeToggleButton = document.createElement('button');
            modeToggleButton.id = CUSTOM_MODE_TOGGLE_ID;
            modeToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49';
            modeToggleButton.style.marginLeft = '8px';
            // 确保按钮区域确实存在再添加
            if (nativeControlsOrButtonArea.contains(nativeSendButton)) { // 简单的检查，确保按钮区还合理
                 // 尝试插入到发送按钮之前，或者区域的末尾
                if (nativeSendButton.nextSibling) {
                    nativeControlsOrButtonArea.insertBefore(modeToggleButton, nativeSendButton.nextSibling);
                } else {
                    nativeControlsOrButtonArea.appendChild(modeToggleButton);
                }
                console.log('【自定义脚本】模式切换按钮已创建并添加。');
            } else {
                 nativeControlsOrButtonArea.appendChild(modeToggleButton); // 后备方案
                 console.log('【自定义脚本】模式切换按钮已创建并添加到控件区域尾部 (后备)。');
            }
        }
        modeToggleButton.textContent = currentMode;
        modeToggleButton.onclick = null; // 移除旧的onclick (如果有)
        modeToggleButton.onclick = () => {
            currentMode = (currentMode === '小说模式') ? '角色扮演模式' : '小说模式';
            modeToggleButton.textContent = currentMode;
            console.log('【自定义脚本】模式切换为:', currentMode);
        };


        let enhancementToggleButton = document.getElementById(CUSTOM_ENHANCEMENT_TOGGLE_ID);
        if (!enhancementToggleButton) {
            enhancementToggleButton = document.createElement('button');
            enhancementToggleButton.id = CUSTOM_ENHANCEMENT_TOGGLE_ID;
            enhancementToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49';
            enhancementToggleButton.style.marginLeft = '8px';
            if (modeToggleButton.nextSibling) {
                nativeControlsOrButtonArea.insertBefore(enhancementToggleButton, modeToggleButton.nextSibling);
            } else {
                nativeControlsOrButtonArea.appendChild(enhancementToggleButton);
            }
            console.log('【自定义脚本】增强切换按钮已创建并添加。');
        }
        enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
        enhancementToggleButton.onclick = null; // 移除旧的onclick
        enhancementToggleButton.onclick = () => {
            currentEnhancement = !currentEnhancement;
            enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
            console.log('【自定义脚本】瑟瑟增强切换为:', currentEnhancement);
        };


        // --- 核心逻辑：修改并发送 ---
        function prepareAndSend() {
            // 在实际操作前再次获取最新的 textarea 实例
            const currentTextareaInstance = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
            if (!currentTextareaInstance) {
                console.error("【自定义脚本】prepareAndSend: 动态获取的 nativeTextarea 丢失!");
                return false;
            }

            let rawUserText = currentTextareaInstance.value;
            // console.log('【自定义脚本】prepareAndSend - 原始输入:', rawUserText);

            const existingPrefixRegex = /^<!--\s*(?:小说模式|角色扮演模式)(?:\s*;\s*瑟瑟增强)?\s*-->\n?/i;
            let textWithoutExistingPrefix = rawUserText.replace(existingPrefixRegex, '');
            const userTypedText = textWithoutExistingPrefix.trim();

            let prefixParts = [currentMode];
            if (currentEnhancement) {
                prefixParts.push('瑟瑟增强');
            }
            const commentPrefix = `<!-- ${prefixParts.join('; ')} -->\n`;

            let finalText;
            if (userTypedText) {
                finalText = commentPrefix + userTypedText;
            } else {
                finalText = commentPrefix;
            }
            // console.log('【自定义脚本】prepareAndSend - 最终文本:', finalText);

            const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
            if (nativeInputValueSetter) {
                nativeInputValueSetter.call(currentTextareaInstance, finalText);
            } else {
                currentTextareaInstance.value = finalText;
            }
            currentTextareaInstance.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
            currentTextareaInstance.dispatchEvent(new Event('change', { bubbles: true, composed: true }));
            
            return true;
        }

        // --- 定义新的事件监听器函数 ---
        activeSendButtonClickListener = function(event) {
            console.log('【自定义脚本】原生发送按钮点击被侦测 (捕获阶段)');
            const shouldProceed = prepareAndSend();
            if (!shouldProceed) {
                event.preventDefault();
                event.stopPropagation();
                console.log('【自定义脚本】Button click: 发送被阻止。');
            }
        };

        activeTextareaKeyDownListener = function(event) {
            if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
                console.log('【自定义脚本】原生输入框Enter键被侦测');
                event.preventDefault();
                
                const shouldProceed = prepareAndSend();
                // 再次获取最新的发送按钮实例
                const currentSendButtonInstance = document.querySelector(NATIVE_SEND_BUTTON_SELECTOR);

                if (shouldProceed && currentSendButtonInstance) {
                    currentSendButtonInstance.click();
                } else if (!shouldProceed) {
                    console.log('【自定义脚本】Enter键发送被阻止。');
                }
            }
        };

        // --- 附加新的事件监听器 ---
        // 只有在该元素实例上没有我们的监听器时才添加，防止重复添加
        if (!nativeSendButton._hasCustomListener) {
            nativeSendButton.addEventListener('click', activeSendButtonClickListener, true);
            nativeSendButton._hasCustomListener = true; // 添加标记
            console.log('【自定义脚本】新的发送按钮点击监听器已附加。');
        }
        if (!nativeTextarea._hasCustomListener) {
            nativeTextarea.addEventListener('keydown', activeTextareaKeyDownListener);
            nativeTextarea._hasCustomListener = true; // 添加标记
            console.log('【自定义脚本】新的文本区域按键监听器已附加。');
        }
        return true;
    }

    // --- 首次执行设置 ---
    initializeChatEnhancements();

    // --- 使用 MutationObserver 监视 DOM 变化 ---
    // 尝试找到一个比 document.body 更精确的父容器，但如果找不到，则回退到 body
    let chatAreaParent = document.body; // 默认观察整个 body
    const textareaElement = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
    if (textareaElement && textareaElement.closest('form')) { // 尝试找到最近的 form
        chatAreaParent = textareaElement.closest('form');
    } else if (textareaElement && textareaElement.parentElement) { // 或者父元素
         // 向上查找几层，看是否有一个相对稳定的容器
        let parent = textareaElement.parentElement;
        for(let i=0; i<3 && parent.parentElement; i++) { // 向上最多3层
            if (parent.id || parent.classList.length > 1) { // 有ID或多个类名可能更稳定
                chatAreaParent = parent;
                break;
            }
            parent = parent.parentElement;
        }
        if (chatAreaParent === document.body && textareaElement.parentElement) { // 如果还是body，就用直接父级
            chatAreaParent = textareaElement.parentElement;
        }
    }
    console.log("【自定义脚本】MutationObserver 将观察:", chatAreaParent);

    const observerConfig = { childList: true, subtree: true };

    let reinitTimeout = null;
    const observerCallback = function(mutationsList, observer) {
        let needsReSetup = false;
        // 检查核心元素是否被替换或移除
        const currentTextarea = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
        const currentSendButton = document.querySelector(NATIVE_SEND_BUTTON_SELECTOR);

        if (currentTextarea !== knownNativeTextarea || currentSendButton !== knownNativeSendButton) {
            if (currentTextarea && currentSendButton) { // 确保新元素都存在
                 console.log('【自定义脚本】MutationObserver: 检测到核心元素实例发生变化。');
                 needsReSetup = true;
            } else if (!currentTextarea || !currentSendButton) {
                console.log('【自定义脚本】MutationObserver: 检测到核心元素之一消失。');
                needsReSetup = true; // 可能是暂时移除，稍后重新添加
            }
        }

        // 也可以检查我们的自定义按钮是否还在，如果不在了也需要重新设置
        if (!document.getElementById(CUSTOM_MODE_TOGGLE_ID) || !document.getElementById(CUSTOM_ENHANCEMENT_TOGGLE_ID)) {
            if (currentTextarea && currentSendButton) { // 仅当核心元素存在时，按钮消失才重设
                console.log('【自定义脚本】MutationObserver: 检测到自定义按钮消失。');
                needsReSetup = true;
            }
        }


        if (needsReSetup) {
            console.log('【自定义脚本】MutationObserver 检测到变化，计划重新执行 initializeChatEnhancements。');
            // 使用 debounce 技术防止短时间内频繁调用
            clearTimeout(reinitTimeout);
            reinitTimeout = setTimeout(() => {
                console.log('【自定义脚本】执行延迟后的 initializeChatEnhancements。');
                initializeChatEnhancements();
            }, 150); // 150ms 延迟，给React足够的时间完成DOM更新
        }
    };

    const observer = new MutationObserver(observerCallback);
    
    if (chatAreaParent) {
        observer.observe(chatAreaParent, observerConfig);
        console.log('【自定义脚本】MutationObserver 已启动。');
    } else {
        console.error('【自定义脚本】无法确定 MutationObserver 的观察目标节点。脚本可能无法应对动态DOM变化。');
    }
    

    // (可选) 清理函数，如果你的油猴脚本环境支持在脚本禁用/更新时调用
    // window.cleanupMyChatScript = () => {
    //     observer.disconnect();
    //     clearTimeout(reinitTimeout);
    //     const btn1 = document.getElementById(CUSTOM_MODE_TOGGLE_ID);
    //     if (btn1) btn1.remove();
    //     const btn2 = document.getElementById(CUSTOM_ENHANCEMENT_TOGGLE_ID);
    //     if (btn2) btn2.remove();
    //     // 移除监听器比较麻烦，因为元素实例可能已经变了
    //     // 最好的方式是在 initializeChatEnhancements 开始时就处理好移除
    //     console.log('【自定义脚本】已清理。');
    // };

    console.log('【自定义脚本】已注入并执行 (具备 MutationObserver 的响应式模式)。');

})();
