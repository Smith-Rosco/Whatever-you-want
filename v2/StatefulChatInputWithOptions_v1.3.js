// --- START OF FILE StatefulChatInputWithOptions_Simplified.js ---

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

    const OPTIONS_PARENT_SELECTOR = 'div.mx-auto.pt-24.w-full.max-w-\\[720px\\].px-4.relative';
    const OPTIONS_AREA_SELECTOR = 'details.optionsarea.collapsible-area';
    const OPTION_ITEM_SELECTOR = 'div > ol > li'; // 相对于 OPTIONS_AREA_SELECTOR

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
            // 目标：在 sendButtonElement 之后插入 modeToggleButton，
            // 然后在 modeToggleButton 之后插入 enhancementToggleButton.

            // 插入 modeToggleButton 到 sendButtonElement 之后
            // element.insertBefore(newNode, referenceNode.nextSibling)
            // 如果 referenceNode 是最后一个子节点, referenceNode.nextSibling 为 null,
            // 此时 insertBefore(newNode, null) 的行为等同于 appendChild(newNode).
            nativeControlsOrButtonArea.insertBefore(modeToggleButton, sendButtonElement.nextSibling);

            // 插入 enhancementToggleButton 到 modeToggleButton 之后
            nativeControlsOrButtonArea.insertBefore(enhancementToggleButton, modeToggleButton.nextSibling);
            
            console.log('【自定义脚本】自定义按钮已添加到原生发送按钮之后。');
        } else {
            // 后备方案：如果在 nativeControlsOrButtonArea 内未找到 NATIVE_SEND_BUTTON_SELECTOR 指定的按钮，
            // 则将自定义按钮追加到 nativeControlsOrButtonArea 的末尾。
            // 您也可以选择将它们添加到开头，例如：
            // nativeControlsOrButtonArea.insertBefore(enhancementToggleButton, nativeControlsOrButtonArea.firstChild);
            // nativeControlsOrButtonArea.insertBefore(modeToggleButton, nativeControlsOrButtonArea.firstChild); // 注意顺序
            nativeControlsOrButtonArea.appendChild(modeToggleButton);
            nativeControlsOrButtonArea.appendChild(enhancementToggleButton);
            console.warn('【自定义脚本】未在控制区域找到原生发送按钮 (' + NATIVE_SEND_BUTTON_SELECTOR + ')，自定义按钮已追加到控制区域 (' + NATIVE_CONTROLS_AREA_SELECTOR + ') 的末尾。');
        }

        // 更新按钮显示文本和绑定 onclick 事件的逻辑保持不变
        updateModeButtonDisplay(); // 更新模式按钮文本
        modeToggleButton.onclick = null; // 确保移除旧的处理器
        modeToggleButton.onclick = () => {
            currentMode = (currentMode === '小说模式') ? '角色扮演模式' : '小说模式';
            updateModeButtonDisplay();
            console.log('【自定义脚本】模式手动切换为:', currentMode);
        };

        enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`; // 更新增强按钮文本
        enhancementToggleButton.onclick = null; // 确保移除旧的处理器
        enhancementToggleButton.onclick = () => {
            currentEnhancement = !currentEnhancement;
            enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
            console.log('【自定义脚本】瑟瑟增强切换为:', currentEnhancement);
        };

        // --- 选项点击处理逻辑 ---
        if (!optionsParent) {
            console.warn('【自定义脚本】initializeCoreFunctionality: 未能找到选项父容器 (OPTIONS_PARENT_SELECTOR)。选项点击功能将不可用。');
            if (knownOptionsParent && knownOptionsParent._hasCustomOptionListener) { // 如果之前有，现在没了，也要清理
                 knownOptionsParent.removeEventListener('click', activeOptionClickListener);
                 knownOptionsParent._hasCustomOptionListener = false;
            }
            knownOptionsParent = null;
        } else {
            // console.log('【自定义脚本】选项父容器 (OPTIONS_PARENT_SELECTOR) 已找到:', optionsParent);
            if (knownOptionsParent !== optionsParent && knownOptionsParent && knownOptionsParent._hasCustomOptionListener) {
                // 如果父容器实例发生变化，移除旧监听器
                knownOptionsParent.removeEventListener('click', activeOptionClickListener);
                knownOptionsParent._hasCustomOptionListener = false;
                // console.log('【自定义脚本】旧的选项点击监听器已从旧父容器移除');
            }
            knownOptionsParent = optionsParent; // 更新为当前找到的父容器

            if (!activeOptionClickListener) { // 确保 activeOptionClickListener 只定义一次
                activeOptionClickListener = function (event) {
                    // console.log('【自定义脚本】[选项点击] 事件触发于父容器. Event target:', event.target);
                    const clickedLiElement = event.target.closest(OPTION_ITEM_SELECTOR);

                    if (clickedLiElement) {
                        const specificOptionsArea = clickedLiElement.closest(OPTIONS_AREA_SELECTOR);
                        if (!specificOptionsArea) {
                            console.warn('【自定义脚本】[选项点击] 警告: 找到了 li，但未能找到其所属的选项区。Clicked li:', clickedLiElement);
                            return;
                        }
                        // console.log('【自定义脚本】[选项点击] 成功匹配到选项元素 (li):', clickedLiElement.textContent.trim());

                        const optionsInThisArea = Array.from(specificOptionsArea.querySelectorAll(OPTION_ITEM_SELECTOR));
                        if (optionsInThisArea.length === 0) {
                            console.warn('【自定义脚本】[选项点击] 警告: 在当前选项区内未找到任何选项元素。');
                            return;
                        }
                        // 假设前两个是角色扮演，后两个是小说模式的触发（或任何基于索引的逻辑）
                        const clickedIndexInThisArea = optionsInThisArea.indexOf(clickedLiElement);
                        if (optionsInThisArea.length === 4) { // 仅当有4个选项时才执行此特定逻辑
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
                        fillInputAndTriggerUpdate(optionText); // 选项点击依然填充输入框
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
    if (tempTextarea) { // 尝试更精确地定位观察目标
        let commonParent = tempTextarea.parentElement;
        const tempOptionsParent = document.querySelector(OPTIONS_PARENT_SELECTOR);
        if (tempOptionsParent) { // 如果选项区域存在，尝试找到文本区域和选项区域的共同祖先
            while (commonParent && commonParent !== document.body && !commonParent.contains(tempOptionsParent)) {
                commonParent = commonParent.parentElement;
            }
            observerTargetNode = commonParent || document.body;
        } else if (tempTextarea.closest('form')) { // 否则，尝试表单或父元素
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
        const currentSendButton = document.querySelector(NATIVE_SEND_BUTTON_SELECTOR); // 仍然检查发送按钮作为界面存在的标志
        const currentOptionsParent = document.querySelector(OPTIONS_PARENT_SELECTOR);

        // 检查核心DOM元素是否变化
        if (currentTextarea !== knownNativeTextarea || currentSendButton !== knownNativeSendButton) {
            if (currentTextarea) needsReSetup = true; // 如果输入框还在，可能只是父级重绘，需要重新检查
            else needsReSetup = true; // 如果输入框没了，肯定需要重新设置
        }
        // 检查选项区域父元素是否变化
        if (currentOptionsParent !== knownOptionsParent) {
             needsReSetup = true; // 如果选项父容器变化（出现或消失或变成不同实例）
        }
        // 检查自定义按钮是否存在，如果核心输入区存在但按钮丢失，也需要重新设置
        if (currentTextarea && (!document.getElementById(CUSTOM_MODE_TOGGLE_ID) || !document.getElementById(CUSTOM_ENHANCEMENT_TOGGLE_ID))) {
            needsReSetup = true;
        }


        if (needsReSetup) {
            // console.log('【自定义脚本】MutationObserver 检测到变化，计划重新执行 initializeCoreFunctionality。');
            clearTimeout(reinitTimeout);
            reinitTimeout = setTimeout(() => {
                // console.log('【自定义脚本】执行延迟后的 initializeCoreFunctionality。');
                initializeCoreFunctionality();
            }, 250); // 轻微延迟以应对快速的连续DOM更改
        }
    };

    const observer = new MutationObserver(observerCallback);
    observer.observe(observerTargetNode, observerConfig);
    // console.log('【自定义脚本】MutationObserver 已启动。');

    console.log('【自定义脚本】已注入并执行完毕 (v2.3 简化版)。现在可以通过 getCurrentSelectedModeText() 获取模式信息。');

})();
// --- END OF FILE StatefulChatInputWithOptions_Simplified.js ---