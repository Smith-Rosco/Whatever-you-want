// 假设 DOMWatcherService.js 已经在此脚本之前加载并可通过 window.DOMWatcherService 访问

(function runMergedCustomUIWithDOMWatcher() {
    // 确保 DOMWatcherService 可用
    if (!window.DOMWatcherService) {
        console.error("【输入控制脚本】错误: DOMWatcherService 未加载！脚本无法运行。请确保 DOMWatcherService.js 在此脚本之前加载。");
        // 如果 DOMWatcherService 不存在，可以考虑回退到旧的 MutationObserver 逻辑或直接停止
        // 为了演示，这里我们直接返回
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                console.error("【输入控制脚本】DOMContentLoaded 后检测：DOMWatcherService 仍然未加载！");
            });
        }
        return;
    }

    // --- 配置区 ---
    const NATIVE_TEXTAREA_SELECTOR = '#ai-chat-input';
    const NATIVE_SEND_BUTTON_SELECTOR = '#ai-send-button'; // 用于检测聊天界面，以及按钮插入位置参考
    const NATIVE_CONTROLS_AREA_SELECTOR = '.flex.items-center.gap-2.pb-2'; // 自定义按钮的父容器
    const CUSTOM_MODE_TOGGLE_ID = 'custom-mode-toggle-scripted';
    const CUSTOM_ENHANCEMENT_TOGGLE_ID = 'custom-enhancement-toggle-scripted';

    const OPTIONS_PARENT_SELECTOR = 'div.markdown-body main opt'; // 父容器 <opt>
    const OPTIONS_AREA_SELECTOR = 'div.markdown-body main opt > div'; // 选项区域 <opt> 下的 <div>
    const OPTION_ITEM_SELECTOR = 'ol > li'; // 选项条目 <ol> 下的 <li>

    // --- 状态变量 ---
    let currentMode = '角色扮演模式';
    let currentEnhancement = false;
    let knownNativeTextarea = null; // 仍然可以用来快速引用输入框

    // --- 事件监听器引用 ---
    // activeOptionClickListener 现在会在下方定义，并由 DOMWatcherService 的回调动态附加
    let activeOptionClickListener = null;
    // 用于跟踪哪些 <opt> 元素已经附加了监听器，避免重复附加
    // 使用 WeakSet 是因为它允许垃圾回收器在元素从DOM中移除后回收它们，如果这些元素没有其他引用。
    const listenedOptElements = new WeakSet();


    // --- 全局可访问的函数，用于获取当前选定模式的文本 ---
    function getCurrentSelectedModeText() {
        let prefixParts = [currentMode];
        if (currentEnhancement) {
            prefixParts.push('瑟瑟增强');
        }
        const commentText = `<!-- ${prefixParts.join('; ')} -->`;
        return commentText;
    }
    if (typeof window !== 'undefined') {
        window.getCurrentSelectedModeText = getCurrentSelectedModeText;
    }

    function updateModeButtonDisplay() {
        const modeToggleButton = document.getElementById(CUSTOM_MODE_TOGGLE_ID);
        if (modeToggleButton) {
            modeToggleButton.textContent = currentMode;
        } else {
            // 这个警告可能在按钮还未被 DOMWatcherService 创建时出现，是正常的
            // console.warn('【输入控制脚本】updateModeButtonDisplay: 未能找到模式切换按钮 #', CUSTOM_MODE_TOGGLE_ID);
        }
    }

    function fillInputAndTriggerUpdate(textToFill) {
        const inputTextArea = knownNativeTextarea || document.querySelector(NATIVE_TEXTAREA_SELECTOR);
        if (!inputTextArea) {
            console.error('【输入控制脚本】fillInputAndTriggerUpdate: 未能找到目标输入框', NATIVE_TEXTAREA_SELECTOR);
            return;
        }
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeTextAreaValueSetter.call(inputTextArea, textToFill);
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        inputTextArea.dispatchEvent(inputEvent);
    }

    // --- 核心功能初始化与事件处理 ---

    // 负责创建和管理自定义按钮
    function setupCustomControls(controlsAreaElement) {
        if (!controlsAreaElement) {
            console.warn('【输入控制脚本】setupCustomControls: 控制区域元素无效。');
            return;
        }

        knownNativeTextarea = document.querySelector(NATIVE_TEXTAREA_SELECTOR); // 更新输入框引用

        let modeToggleButton = document.getElementById(CUSTOM_MODE_TOGGLE_ID);
        if (!modeToggleButton) {
            modeToggleButton = document.createElement('button');
            modeToggleButton.id = CUSTOM_MODE_TOGGLE_ID;
            modeToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49';
            modeToggleButton.onclick = () => {
                currentMode = (currentMode === '小说模式') ? '角色扮演模式' : '小说模式';
                updateModeButtonDisplay();
                console.log('【输入控制脚本】模式手动切换为:', currentMode);
            };
            console.log('【输入控制脚本】模式切换按钮已创建并绑定事件。');
        }
        updateModeButtonDisplay(); // 设置初始文本

        let enhancementToggleButton = document.getElementById(CUSTOM_ENHANCEMENT_TOGGLE_ID);
        if (!enhancementToggleButton) {
            enhancementToggleButton = document.createElement('button');
            enhancementToggleButton.id = CUSTOM_ENHANCEMENT_TOGGLE_ID;
            enhancementToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49';
            enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
            enhancementToggleButton.onclick = () => {
                currentEnhancement = !currentEnhancement;
                enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
                console.log('【输入控制脚本】瑟瑟增强切换为:', currentEnhancement);
            };
            console.log('【输入控制脚本】增强切换按钮已创建并绑定事件。');
        }
        if (modeToggleButton.parentElement !== controlsAreaElement) {
            controlsAreaElement.appendChild(modeToggleButton);
        }
        if (enhancementToggleButton.parentElement !== controlsAreaElement) {
            controlsAreaElement.appendChild(enhancementToggleButton);
        }
        console.log('【输入控制脚本】自定义按钮已插入到聊天界面。');
    }

    // 定义选项点击监听器
    activeOptionClickListener = function (event) {
        const clickedLiElement = event.target.closest(OPTION_ITEM_SELECTOR);
        if (!clickedLiElement) return; // 如果点击的不是 li 或其子元素，则忽略

        // 确保点击的 li 在一个有效的选项区域内
        const specificOptionsArea = clickedLiElement.closest(OPTIONS_AREA_SELECTOR);
        if (!specificOptionsArea) {
            console.warn('【输入控制脚本】[选项点击] 警告: 找到了 li，但未能找到其所属的选项区 (' + OPTIONS_AREA_SELECTOR + ')。Clicked li:', clickedLiElement);
            return;
        }

        // 获取当前被点击 li 所属的 <opt> 元素
        const currentOptParent = clickedLiElement.closest(OPTIONS_PARENT_SELECTOR);
        if (!currentOptParent) {
            console.warn('【输入控制脚本】[选项点击] 警告: 找到了 li，但未能找到其所属的父级 <opt> 元素 (' + OPTIONS_PARENT_SELECTOR + ')。');
            return;
        }

        // 获取DOM中所有匹配的 <opt> 元素，并判断当前的是否为最后一个
        const allOptParentsInDom = Array.from(document.querySelectorAll(OPTIONS_PARENT_SELECTOR));
        const isLastOptParent = allOptParentsInDom.length > 0 && allOptParentsInDom[allOptParentsInDom.length - 1] === currentOptParent;

        console.log(`【输入控制脚本】[选项点击] 事件触发于 <opt> (是否为最后一个: ${isLastOptParent}). 目标 li:`, clickedLiElement.textContent.trim());

        const optionsInThisArea = Array.from(specificOptionsArea.querySelectorAll(OPTION_ITEM_SELECTOR));
        if (optionsInThisArea.length === 0) {
            console.warn('【输入控制脚本】[选项点击] 警告: 在当前选项区 (' + OPTIONS_AREA_SELECTOR + ') 内未找到任何选项元素 (使用选择器 ' + OPTION_ITEM_SELECTOR + ')。');
            return;
        }

        const clickedIndexInThisArea = optionsInThisArea.indexOf(clickedLiElement);

        // 只有当这个选项区是最后一个，并且有4个选项时，才执行模式切换
        if (isLastOptParent && optionsInThisArea.length === 4) {
            if (clickedIndexInThisArea === 0 || clickedIndexInThisArea === 1) {
                currentMode = '角色扮演模式';
                console.log('【输入控制脚本】[选项点击][最后一个选项区] 模式因选项点击(当前区索引0或1)切换为: 角色扮演模式');
            } else if (clickedIndexInThisArea === 2 || clickedIndexInThisArea === 3) {
                currentMode = '小说模式';
                console.log('【输入控制脚本】[选项点击][最后一个选项区] 模式因选项点击(当前区索引2或3)切换为: 小说模式');
            }
            updateModeButtonDisplay(); // 更新按钮显示
        } else if (optionsInThisArea.length === 4) {
            console.log(`【输入控制脚本】[选项点击] 当前选项区 (非最后一个，但有4个选项) 被点击。点击索引: ${clickedIndexInThisArea}。未执行与 "最后一个选项区特定" 的模式自动切换逻辑。`);
            // 如果希望所有4选项的区域都切换模式，可以取消 isLastOptParent 的限制，或者添加额外逻辑
        } else {
            console.log(`【输入控制脚本】[选项点击] 当前选项区有 ${optionsInThisArea.length} 个选项 (期望4个进行模式切换)。未执行模式自动切换逻辑。`);
        }

        // 无论如何，都填充输入框
        const optionText = clickedLiElement.textContent.trim();
        fillInputAndTriggerUpdate(optionText);
    };

    // --- 使用 DOMWatcherService 注册监听器 ---

    // 1. 监听聊天输入和控制区域的出现
    // 这个选择器应该指向包含输入框和发送按钮的稳定父容器
    window.DOMWatcherService.register({
        selector: NATIVE_CONTROLS_AREA_SELECTOR,
        id: 'customUI-chatControlsInitializer',
        eventTypes: ['added'],
        once: false, // 如果聊天界面可能动态加载/卸载，设为 false
        callback: function (controlsAreaElement, eventType) {
            console.log('【输入控制脚本 via DOMWatcher】聊天控制区域 (' + NATIVE_CONTROLS_AREA_SELECTOR + ') 已 ' + eventType + ':', controlsAreaElement);
            setupCustomControls(controlsAreaElement);
        }
    });

    // 2. 监听选项父容器 (<opt>) 的出现，用于绑定选项点击事件
    window.DOMWatcherService.register({
        selector: OPTIONS_PARENT_SELECTOR,
        id: 'customUI-optionsParentWatcher',
        eventTypes: ['added'],
        once: false, // 设为 false 因为可能有多个 <opt> 元素，或者它们可能被动态替换
        callback: function (optionsParentElement, eventType) {
            console.log('【输入控制脚本 via DOMWatcher】选项父容器 (' + OPTIONS_PARENT_SELECTOR + ') 已 ' + eventType + ':', optionsParentElement);

            // 检查是否已为此 <opt> 元素附加过监听器
            if (!listenedOptElements.has(optionsParentElement)) {
                optionsParentElement.addEventListener('click', activeOptionClickListener);
                listenedOptElements.add(optionsParentElement); // 标记已附加
                console.log('【输入控制脚本 via DOMWatcher】选项点击监听器已附加到新发现的 <opt>:', optionsParentElement);
            } else {
                // console.log('【输入控制脚本 via DOMWatcher】选项点击监听器已存在于 <opt>:', optionsParentElement);
            }
        }
    });

    // 3. (可选) 监听选项父容器 (<opt>) 的移除，用于清理
    //    这在SPA中如果 <opt> 元素会被完全从DOM移除而不是隐藏时比较有用
    window.DOMWatcherService.register({
        selector: OPTIONS_PARENT_SELECTOR,
        id: 'customUI-optionsParentRemover',
        eventTypes: ['removed'],
        once: false,
        callback: function (removedOptionsParentElement, eventType) {
            console.log('【输入控制脚本 via DOMWatcher】选项父容器 (' + OPTIONS_PARENT_SELECTOR + ') 已 ' + eventType + ':', removedOptionsParentElement);
            if (listenedOptElements.has(removedOptionsParentElement)) {
                // 如果元素从DOM中移除，理论上其事件监听器也会被垃圾回收，
                // 但显式移除是一种好习惯，特别是如果 activeOptionClickListener 引用了外部作用域变量可能导致内存泄漏（在此例中不太可能）
                removedOptionsParentElement.removeEventListener('click', activeOptionClickListener);
                listenedOptElements.delete(removedOptionsParentElement); // 从Set中移除
                console.log('【输入控制脚本 via DOMWatcher】选项点击监听器已从被移除的 <opt> 上卸载。');
            }
        }
    });

    console.log('【输入控制脚本】已注入并配置 DOMWatcherService (v DOMWatcher 优化版)。现在可以通过 getCurrentSelectedModeText() 获取模式信息。');

})();