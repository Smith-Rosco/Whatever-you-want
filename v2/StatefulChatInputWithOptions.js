(function runMergedCustomUI() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runMergedCustomUI);
        return;
    }

    console.log('【自定义脚本】runMergedCustomUI 开始执行 v2.2 (暴露模式文本函数，不修改发送内容)');

    // --- 配置区 ---
    const NATIVE_TEXTAREA_SELECTOR = '#ai-chat-input';
    const NATIVE_SEND_BUTTON_SELECTOR = '#ai-send-button';
    const NATIVE_CONTROLS_AREA_SELECTOR = '.flex.items-center.gap-2.pb-2';
    const CUSTOM_MODE_TOGGLE_ID = 'custom-mode-toggle-scripted';
    const CUSTOM_ENHANCEMENT_TOGGLE_ID = 'custom-enhancement-toggle-scripted';

    const OPTIONS_PARENT_SELECTOR = 'div.mx-auto.pt-24.w-full.max-w-\\[720px\\].px-4.relative';
    const OPTIONS_AREA_SELECTOR = 'details.optionsarea.collapsible-area';
    const OPTION_ITEM_SELECTOR = 'div > ol > li'; // 这个选择器是相对于 OPTIONS_AREA_SELECTOR 的

    // --- 状态变量 ---
    let currentMode = '角色扮演模式';
    let currentEnhancement = false;

    // --- 事件监听器引用 ---
    let activeSendButtonClickListener = null;
    let activeTextareaKeyDownListener = null;
    let activeOptionClickListener = null;

    // --- DOM元素引用 ---
    let knownNativeTextarea = null;
    let knownNativeSendButton = null;
    let knownOptionsParent = null;

    // --- 新增：全局可访问的函数，用于获取当前选定模式的文本 ---
    function getCurrentSelectedModeText() {
        let prefixParts = [currentMode];
        if (currentEnhancement) {
            prefixParts.push('瑟瑟增强');
        }
        const commentText = `<!-- ${prefixParts.join('; ')} -->`;
        // console.log('【自定义脚本】getCurrentSelectedModeText() 返回:', commentText);
        return commentText;
    }
    // 将函数暴露到全局作用域
    if (typeof window !== 'undefined') {
        window.getCurrentSelectedModeText = getCurrentSelectedModeText;
    }


    function updateModeButtonDisplay() {
        const modeToggleButton = document.getElementById(CUSTOM_MODE_TOGGLE_ID);
        if (modeToggleButton) {
            modeToggleButton.textContent = currentMode;
            // console.log('【自定义脚本】updateModeButtonDisplay: 模式按钮文本已更新为', currentMode);
        } else {
            console.warn('【自定义脚本】updateModeButtonDisplay: 未能找到模式切换按钮 #', CUSTOM_MODE_TOGGLE_ID);
        }
    }

    function fillInputAndTriggerUpdate(textToFill) {
        const inputTextArea = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
        if (!inputTextArea) {
            console.error('【自定义脚本】fillInputAndTriggerUpdate: 未能找到目标输入框', NATIVE_TEXTAREA_SELECTOR);
            return;
        }
        // console.log("【自定义脚本】fillInputAndTriggerUpdate: 准备填充内容:", textToFill);

        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeTextAreaValueSetter.call(inputTextArea, textToFill);

        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        inputTextArea.dispatchEvent(inputEvent);
        // console.log("【自定义脚本】fillInputAndTriggerUpdate: 内容填充及事件派发完成。");
    }

    function initializeCoreFunctionality() {
        console.log('【自定义脚本】尝试执行 initializeCoreFunctionality...');

        const nativeTextarea = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
        const nativeSendButton = document.querySelector(NATIVE_SEND_BUTTON_SELECTOR);
        const nativeControlsOrButtonArea = document.querySelector(NATIVE_CONTROLS_AREA_SELECTOR);
        const optionsParent = document.querySelector(OPTIONS_PARENT_SELECTOR);

        if (!nativeTextarea || !nativeSendButton || !nativeControlsOrButtonArea) {
            console.warn('【自定义脚本】initializeCoreFunctionality: 未能找到核心聊天页面元素。等待DOM变化。');
            knownNativeTextarea = null;
            knownNativeSendButton = null;
            return false;
        }
        // console.log('【自定义脚本】initializeCoreFunctionality: 核心聊天元素已找到。');
        knownNativeTextarea = nativeTextarea;
        knownNativeSendButton = nativeSendButton;

        // --- 移除旧的事件监听器 ---
        if (activeSendButtonClickListener && nativeSendButton._hasCustomListener) {
            nativeSendButton.removeEventListener('click', activeSendButtonClickListener, true);
            nativeSendButton._hasCustomListener = false;
        }
        if (activeTextareaKeyDownListener && nativeTextarea._hasCustomListener) {
            nativeTextarea.removeEventListener('keydown', activeTextareaKeyDownListener);
            nativeTextarea._hasCustomListener = false;
        }

        // --- 创建或获取自定义控制按钮 ---
        let modeToggleButton = document.getElementById(CUSTOM_MODE_TOGGLE_ID);
        if (!modeToggleButton) {
            modeToggleButton = document.createElement('button');
            modeToggleButton.id = CUSTOM_MODE_TOGGLE_ID;
            modeToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49';
            modeToggleButton.style.marginLeft = '8px';
            if (nativeControlsOrButtonArea.contains(nativeSendButton)) {
                nativeControlsOrButtonArea.insertBefore(modeToggleButton, nativeSendButton.nextSibling || null);
            } else {
                nativeControlsOrButtonArea.appendChild(modeToggleButton);
            }
            console.log('【自定义脚本】模式切换按钮已创建并添加。');
        }
        updateModeButtonDisplay();
        modeToggleButton.onclick = null;
        modeToggleButton.onclick = () => {
            currentMode = (currentMode === '小说模式') ? '角色扮演模式' : '小说模式';
            updateModeButtonDisplay();
            console.log('【自定义脚本】模式手动切换为:', currentMode);
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
        enhancementToggleButton.onclick = null;
        enhancementToggleButton.onclick = () => {
            currentEnhancement = !currentEnhancement;
            enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
            console.log('【自定义脚本】瑟瑟增强切换为:', currentEnhancement);
        };

        // --- 核心逻辑：准备发送（不再修改内容） ---
        function prepareAndSend() {
            const currentTextareaInstance = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
            if (!currentTextareaInstance) {
                console.error("【自定义脚本】prepareAndSend: nativeTextarea 丢失!");
                return false; // 如果输入框不存在，则阻止发送
            }
            // 不再修改输入框内容
            // console.log("【自定义脚本】prepareAndSend: 允许发送，当前模式信息可通过 getCurrentSelectedModeText() 获取。");
            // console.log("【自定义脚本】prepareAndSend: 当前输入框内容为: '", currentTextareaInstance.value, "'");
            return true; // 允许发送
        }

        activeSendButtonClickListener = function (event) {
            // console.log('【自定义脚本】原生发送按钮点击被侦测 (捕获阶段)');
            const shouldProceed = prepareAndSend(); // 检查是否可以继续（例如，输入框是否存在）
            if (!shouldProceed) {
                event.preventDefault(); event.stopPropagation(); // 如果 prepareAndSend 返回 false，则阻止
                // console.log('【自定义脚本】Button click: 发送被阻止 (prepareAndSend 返回 false)。');
            } else {
                // console.log('【自定义脚本】Button click: 允许发送。实际发送内容未被脚本修改。');
            }
        };

        activeTextareaKeyDownListener = function (event) {
            if (event.key === 'Enter' && !event.shiftKey && !event.isComposing) {
                // console.log('【自定义脚本】原生输入框Enter键被侦测');
                const shouldProceed = prepareAndSend(); // 检查是否可以继续
                if (shouldProceed) {
                    // event.preventDefault(); // 这一行要小心，如果原生逻辑依赖它，可能会有问题。
                                         // 但由于我们不再修改内容，直接让原生click触发可能更稳妥。
                                         // 原始逻辑是 preventDefault 然后 click()。我们保持这个模式。
                    event.preventDefault();
                    const currentSendButtonInstance = document.querySelector(NATIVE_SEND_BUTTON_SELECTOR);
                    if (currentSendButtonInstance && !currentSendButtonInstance.disabled) {
                        // console.log('【自定义脚本】Enter键: 允许发送，触发按钮点击。实际发送内容未被脚本修改。');
                        currentSendButtonInstance.click();
                    }
                } else {
                    event.preventDefault(); // 如果 prepareAndSend 返回 false，则阻止
                    // console.log('【自定义脚本】Enter键发送被阻止 (prepareAndSend 返回 false)。');
                }
            }
        };

        if (!nativeSendButton._hasCustomListener) {
            nativeSendButton.addEventListener('click', activeSendButtonClickListener, true); // 依然使用捕获阶段
            nativeSendButton._hasCustomListener = true;
        }
        if (!nativeTextarea._hasCustomListener) {
            nativeTextarea.addEventListener('keydown', activeTextareaKeyDownListener); // keydown 通常在冒泡阶段处理
            nativeTextarea._hasCustomListener = true;
        }

        // --- 选项点击处理逻辑 ---
        if (!optionsParent) {
            console.warn('【自定义脚本】initializeCoreFunctionality: 未能找到选项父容器 (OPTIONS_PARENT_SELECTOR)。选项点击功能将不可用。');
            knownOptionsParent = null;
        } else {
            console.log('【自定义脚本】选项父容器 (OPTIONS_PARENT_SELECTOR) 已找到:', optionsParent);
            knownOptionsParent = optionsParent;
            if (activeOptionClickListener && optionsParent._hasCustomOptionListener) {
                optionsParent.removeEventListener('click', activeOptionClickListener);
                optionsParent._hasCustomOptionListener = false;
                // console.log('【自定义脚本】旧的选项点击监听器已移除');
            }

            activeOptionClickListener = function (event) {
                // console.log('【自定义脚本】[选项点击] 事件触发于父容器. Event target:', event.target);

                const clickedLiElement = event.target.closest(OPTION_ITEM_SELECTOR);

                if (clickedLiElement) {
                    const specificOptionsArea = clickedLiElement.closest(OPTIONS_AREA_SELECTOR);

                    if (!specificOptionsArea) {
                        console.warn('【自定义脚本】[选项点击] 警告: 找到了 li，但未能找到其所属的选项区 (details.optionsarea). Clicked li:', clickedLiElement);
                        return;
                    }
                    // console.log('【自定义脚本】[选项点击] 成功匹配到选项元素 (li):', clickedLiElement.tagName, `内容: "${clickedLiElement.textContent.trim()}"`);
                    // console.log('【自定义脚本】[选项点击] 该选项所属的特定选项区 (details):', specificOptionsArea);

                    const optionsInThisArea = Array.from(specificOptionsArea.querySelectorAll(OPTION_ITEM_SELECTOR));

                    if (optionsInThisArea.length === 0) {
                        console.warn('【自定义脚本】[选项点击] 警告: 在当前选项区内未找到任何选项元素。检查选择器:', OPTION_ITEM_SELECTOR, '在 context:', specificOptionsArea);
                        return;
                    }
                    if (optionsInThisArea.length !== 4) {
                        console.warn(`【自定义脚本】[选项点击] 警告: 当前选项区找到了 ${optionsInThisArea.length} 个选项，但预期是4个。功能可能不按预期工作。`);
                    }

                    const clickedIndexInThisArea = optionsInThisArea.indexOf(clickedLiElement);
                    // console.log(`【自定义脚本】[选项点击] 选项 "${clickedLiElement.textContent.trim()}" 在其选项区内的索引为: ${clickedIndexInThisArea}`);

                    if (clickedIndexInThisArea === 0 || clickedIndexInThisArea === 1) {
                        currentMode = '角色扮演模式';
                        console.log('【自定义脚本】[选项点击] 模式因选项点击(当前区索引0或1)切换为: 角色扮演模式');
                    } else if (clickedIndexInThisArea === 2 || clickedIndexInThisArea === 3) {
                        currentMode = '小说模式';
                        console.log('【自定义脚本】[选项点击] 模式因选项点击(当前区索引2或3)切换为: 小说模式');
                    } else {
                        console.warn('【自定义脚本】[选项点击] 当前区索引无效或未在预期的0-3范围内:', clickedIndexInThisArea, `(当前选项区共找到 ${optionsInThisArea.length} 个选项)`);
                    }
                    updateModeButtonDisplay();

                    const optionText = clickedLiElement.textContent.trim();
                    fillInputAndTriggerUpdate(optionText); // 选项点击依然填充输入框

                } else {
                    // console.log('【自定义脚本】[选项点击] 点击未匹配到任何选项元素 (li). Clicked target was:', event.target);
                }
            };

            if (!optionsParent._hasCustomOptionListener) {
                optionsParent.addEventListener('click', activeOptionClickListener);
                optionsParent._hasCustomOptionListener = true;
                console.log('【自定义脚本】新的选项点击监听器已附加到选项父容器:', optionsParent);
            }
        }
        return true;
    }

    initializeCoreFunctionality();

    let observerTargetNode = document.body;
    const tempTextarea = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
    if (tempTextarea) {
        let commonParent = tempTextarea.parentElement;
        let tempOptionsParent = document.querySelector(OPTIONS_PARENT_SELECTOR);
        if (tempOptionsParent) {
            while (commonParent && commonParent !== document.body && !commonParent.contains(tempOptionsParent)) {
                commonParent = commonParent.parentElement;
            }
            observerTargetNode = commonParent || document.body;
        } else if (tempTextarea.closest('form')) {
            observerTargetNode = tempTextarea.closest('form');
        } else if (tempTextarea.parentElement) {
            observerTargetNode = tempTextarea.parentElement;
        }
    }
    // console.log("【自定义脚本】MutationObserver 将观察:", observerTargetNode.tagName, observerTargetNode.id ? `#${observerTargetNode.id}`: '', observerTargetNode.classList.toString().replace(/\s+/g, '.'));


    const observerConfig = { childList: true, subtree: true };
    let reinitTimeout = null;

    const observerCallback = function (mutationsList, observer) {
        let needsReSetup = false;
        const currentTextarea = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
        const currentSendButton = document.querySelector(NATIVE_SEND_BUTTON_SELECTOR);
        const currentOptionsParent = document.querySelector(OPTIONS_PARENT_SELECTOR);

        if (currentTextarea !== knownNativeTextarea || currentSendButton !== knownNativeSendButton) {
            if (currentTextarea && currentSendButton) needsReSetup = true;
            else needsReSetup = true;
        }
        if (currentOptionsParent !== knownOptionsParent) {
            if (currentOptionsParent) needsReSetup = true;
            else if (knownOptionsParent) needsReSetup = true;
        }
        if (!document.getElementById(CUSTOM_MODE_TOGGLE_ID) || !document.getElementById(CUSTOM_ENHANCEMENT_TOGGLE_ID)) {
            if (currentTextarea && currentSendButton) needsReSetup = true;
        }

        if (needsReSetup) {
            // console.log('【自定义脚本】MutationObserver 检测到变化，计划重新执行 initializeCoreFunctionality。');
            clearTimeout(reinitTimeout);
            reinitTimeout = setTimeout(() => {
                // console.log('【自定义脚本】执行延迟后的 initializeCoreFunctionality。');
                initializeCoreFunctionality();
            }, 250);
        }
    };

    const observer = new MutationObserver(observerCallback);
    observer.observe(observerTargetNode, observerConfig);
    // console.log('【自定义脚本】MutationObserver 已启动。');

    console.log('【自定义脚本】已注入并执行完毕 (v2.2)。现在可以通过 getCurrentSelectedModeText() 获取模式信息。');

})();
