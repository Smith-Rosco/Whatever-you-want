(function runMergedCustomUI() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runMergedCustomUI);
        return;
    }

    console.log('【自定义脚本】runMergedCustomUI 开始执行 v2.3 (简化版：仅UI增强和选项填充，无发送干预)');

    // --- 配置区 ---
    const NATIVE_TEXTAREA_SELECTOR = '#ai-chat-input';
    const NATIVE_SEND_BUTTON_SELECTOR = '#ai-send-button'; // 仍用于检测聊天界面是否存在
    const NATIVE_CONTROLS_AREA_SELECTOR = '.flex.items-center.gap-2.pb-2';
    const CUSTOM_MODE_TOGGLE_ID = 'custom-mode-toggle-scripted';
    const CUSTOM_ENHANCEMENT_TOGGLE_ID = 'custom-enhancement-toggle-scripted';

    // --- 选择器针对新的 HTML 结构进行修改 ---
    const OPTIONS_PARENT_SELECTOR = 'div.markdown-body main opt'; // 父容器变为 <opt>
    const OPTIONS_AREA_SELECTOR = 'div.markdown-body main opt > div'; // 选项区域是 <opt> 下的 <div>
    const OPTION_ITEM_SELECTOR = 'ol > li'; // 选项条目是 <ol> 下的 <li>, 相对于 OPTIONS_AREA_SELECTOR

    // --- 状态变量 ---
    let currentMode = '角色扮演模式';
    let currentEnhancement = false;

    // --- 事件监听器引用 ---
    let activeOptionClickListener = null; // 仅保留选项点击监听器

    // --- DOM元素引用 ---
    let knownNativeTextarea = null;
    let knownNativeSendButton = null; // 用于检测
    let knownOptionsParent = null;

    // --- 全局可访问的函数，用于获取当前选定模式的文本 ---
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
        console.log('【自定义脚本】尝试执行 initializeCoreFunctionality (简化版)...');

        const nativeTextarea = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
        const nativeSendButton = document.querySelector(NATIVE_SEND_BUTTON_SELECTOR); // 用于检测
        const nativeControlsOrButtonArea = document.querySelector(NATIVE_CONTROLS_AREA_SELECTOR);
        const optionsParent = document.querySelector(OPTIONS_PARENT_SELECTOR);

        if (!nativeTextarea || !nativeControlsOrButtonArea) { // 发送按钮不再是脚本功能的核心依赖，但仍可作为聊天界面存在的标志
            console.warn('【自定义脚本】initializeCoreFunctionality: 未能找到核心聊天页面元素（输入框或控制区域）。等待DOM变化。');
            knownNativeTextarea = null;
            knownNativeSendButton = null; // 也重置
            return false;
        }
        // console.log('【自定义脚本】initializeCoreFunctionality: 核心聊天元素（输入框、控制区域）已找到。');
        knownNativeTextarea = nativeTextarea;
        knownNativeSendButton = nativeSendButton; // 记录下来，用于 MutationObserver 的比对

                // --- 创建或获取自定义控制按钮 ---
        let modeToggleButton = document.getElementById(CUSTOM_MODE_TOGGLE_ID);
        if (!modeToggleButton) {
            modeToggleButton = document.createElement('button');
            modeToggleButton.id = CUSTOM_MODE_TOGGLE_ID;
            modeToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49'; // 保持您的样式
            modeToggleButton.style.marginLeft = '8px';
            // console.log('【自定义脚本】模式切换按钮已创建。');
        }
        // 如果按钮已存在于DOM中并被重新获取，后续的insertBefore/appendChild会将其移动到新位置

        let enhancementToggleButton = document.getElementById(CUSTOM_ENHANCEMENT_TOGGLE_ID);
        if (!enhancementToggleButton) {
            enhancementToggleButton = document.createElement('button');
            enhancementToggleButton.id = CUSTOM_ENHANCEMENT_TOGGLE_ID;
            enhancementToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49'; // 保持您的样式
            enhancementToggleButton.style.marginLeft = '8px';
            // console.log('【自定义脚本】增强切换按钮已创建。');
        }

        // 定位原生发送按钮，假设它在 nativeControlsOrButtonArea 内部
        // NATIVE_CONTROLS_AREA_SELECTOR 是我们期望这些按钮所在的父容器
        // NATIVE_SEND_BUTTON_SELECTOR 是 "原有的按钮"
        const sendButtonElement = nativeControlsOrButtonArea.querySelector(NATIVE_SEND_BUTTON_SELECTOR);

        if (sendButtonElement) {
            nativeControlsOrButtonArea.insertBefore(modeToggleButton, sendButtonElement.nextSibling);
            nativeControlsOrButtonArea.insertBefore(enhancementToggleButton, modeToggleButton.nextSibling);
            console.log('【自定义脚本】自定义按钮已添加到原生发送按钮之后。');
        } else {
            nativeControlsOrButtonArea.appendChild(modeToggleButton);
            nativeControlsOrButtonArea.appendChild(enhancementToggleButton);
            console.warn('【自定义脚本】未在控制区域找到原生发送按钮 (' + NATIVE_SEND_BUTTON_SELECTOR + ')，自定义按钮已追加到控制区域 (' + NATIVE_CONTROLS_AREA_SELECTOR + ') 的末尾。');
        }

        updateModeButtonDisplay();
        modeToggleButton.onclick = null;
        modeToggleButton.onclick = () => {
            currentMode = (currentMode === '小说模式') ? '角色扮演模式' : '小说模式';
            updateModeButtonDisplay();
            console.log('【自定义脚本】模式手动切换为:', currentMode);
        };

        enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
        enhancementToggleButton.onclick = null;
        enhancementToggleButton.onclick = () => {
            currentEnhancement = !currentEnhancement;
            enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
            console.log('【自定义脚本】瑟瑟增强切换为:', currentEnhancement);
        };

        // --- 选项点击处理逻辑 ---
        if (!optionsParent) {
            console.warn('【自定义脚本】initializeCoreFunctionality: 未能找到选项父容器 ('+ OPTIONS_PARENT_SELECTOR +')。选项点击功能将不可用。');
            if (knownOptionsParent && knownOptionsParent._hasCustomOptionListener) {
                 knownOptionsParent.removeEventListener('click', activeOptionClickListener);
                 knownOptionsParent._hasCustomOptionListener = false;
            }
            knownOptionsParent = null;
        } else {
            // console.log('【自定义脚本】选项父容器 ('+ OPTIONS_PARENT_SELECTOR +') 已找到:', optionsParent);
            if (knownOptionsParent !== optionsParent && knownOptionsParent && knownOptionsParent._hasCustomOptionListener) {
                knownOptionsParent.removeEventListener('click', activeOptionClickListener);
                knownOptionsParent._hasCustomOptionListener = false;
                // console.log('【自定义脚本】旧的选项点击监听器已从旧父容器移除');
            }
            knownOptionsParent = optionsParent;

            if (!activeOptionClickListener) {
                activeOptionClickListener = function (event) {
                    // console.log('【自定义脚本】[选项点击] 事件触发于父容器. Event target:', event.target);
                    // OPTION_ITEM_SELECTOR 'ol > li' 用于 event.target.closest()
                    const clickedLiElement = event.target.closest(OPTION_ITEM_SELECTOR);

                    if (clickedLiElement) {
                        // OPTIONS_AREA_SELECTOR 'div.markdown-body main opt > div' 用于 clickedLiElement.closest()
                        const specificOptionsArea = clickedLiElement.closest(OPTIONS_AREA_SELECTOR);
                        if (!specificOptionsArea) {
                            console.warn('【自定义脚本】[选项点击] 警告: 找到了 li，但未能找到其所属的选项区 ('+ OPTIONS_AREA_SELECTOR +')。Clicked li:', clickedLiElement);
                            return;
                        }
                        // console.log('【自定义脚本】[选项点击] 成功匹配到选项元素 (li):', clickedLiElement.textContent.trim());

                        // OPTION_ITEM_SELECTOR 'ol > li' 用于 querySelectorAll 相对于 specificOptionsArea
                        const optionsInThisArea = Array.from(specificOptionsArea.querySelectorAll(OPTION_ITEM_SELECTOR));
                        if (optionsInThisArea.length === 0) {
                            console.warn('【自定义脚本】[选项点击] 警告: 在当前选项区内未找到任何选项元素 (使用选择器 ' + OPTION_ITEM_SELECTOR + ' on area ' + OPTIONS_AREA_SELECTOR + ')。');
                            return;
                        }
                        
                        const clickedIndexInThisArea = optionsInThisArea.indexOf(clickedLiElement);
                        if (optionsInThisArea.length === 4) {
                           if (clickedIndexInThisArea === 0 || clickedIndexInThisArea === 1) {
                                currentMode = '角色扮演模式';
                                console.log('【自定义脚本】[选项点击] 模式因选项点击(当前区索引0或1)切换为: 角色扮演模式');
                            } else if (clickedIndexInThisArea === 2 || clickedIndexInThisArea === 3) {
                                currentMode = '小说模式';
                                console.log('【自定义脚本】[选项点击] 模式因选项点击(当前区索引2或3)切换为: 小说模式');
                            }
                            updateModeButtonDisplay();
                        } else {
                             console.log(`【自定义脚本】[选项点击] 当前选项区有 ${optionsInThisArea.length} 个选项，未执行模式自动切换逻辑。`);
                        }

                        const optionText = clickedLiElement.textContent.trim();
                        fillInputAndTriggerUpdate(optionText);
                    }
                };
            }

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
        const tempOptionsParent = document.querySelector(OPTIONS_PARENT_SELECTOR);
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
            if (currentTextarea) needsReSetup = true;
            else needsReSetup = true;
        }
        if (currentOptionsParent !== knownOptionsParent) {
             needsReSetup = true;
        }
        if (currentTextarea && (!document.getElementById(CUSTOM_MODE_TOGGLE_ID) || !document.getElementById(CUSTOM_ENHANCEMENT_TOGGLE_ID))) {
            needsReSetup = true;
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

    console.log('【自定义脚本】已注入并执行完毕 (v2.3 简化版)。现在可以通过 getCurrentSelectedModeText() 获取模式信息。');

})();