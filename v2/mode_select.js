// --- START OF FILE statefulChatInput.js ---

(function runCustomUI() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runCustomUI);
        return;
    }

    console.log('【自定义脚本】runCustomUI 开始执行');

    // --- 配置区 ---
    const NATIVE_TEXTAREA_SELECTOR = '#ai-chat-input'; // 仅用于定位按钮区域的参考
    const NATIVE_SEND_BUTTON_SELECTOR = '#ai-send-button'; // 主要用于定位按钮应该插入的位置
    const NATIVE_CONTROLS_AREA_SELECTOR = '.flex.items-center.gap-2.pb-2'; // 用于按钮区域
    const CUSTOM_MODE_TOGGLE_ID = 'custom-mode-toggle-scripted'; // 给自定义按钮一个唯一ID
    const CUSTOM_ENHANCEMENT_TOGGLE_ID = 'custom-enhancement-toggle-scripted';

    // --- 状态变量 (在 IIFE 作用域内持久) ---
    let currentMode = '角色扮演模式'; // 默认模式
    let currentEnhancement = false; // 默认不增强

    // --- 用于存储对原生元素的引用，MutationObserver 可以检查它们是否变化 ---
    // 尽管我们不再直接操作这些元素的功能，但它们的存在和位置对我们的UI添加很重要
    let knownNativeTextarea = null;
    let knownNativeSendButton = null;

    // --- 暴露给全局的函数 ---
    window.getCurrentSelectedModeText = function() {
        let prefixParts = [currentMode];
        if (currentEnhancement) {
            prefixParts.push('瑟瑟增强');
        }
        const commentText = `<!-- ${prefixParts.join('; ')} -->`;
        console.log('【自定义脚本】getCurrentSelectedModeText 被调用，返回:', commentText);
        return commentText;
    };
    console.log('【自定义脚本】全局函数 getCurrentSelectedModeText 已定义。');


    function initializeCustomUI() {
        console.log('【自定义脚本】尝试执行 initializeCustomUI...');

        const nativeTextarea = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
        const nativeSendButton = document.querySelector(NATIVE_SEND_BUTTON_SELECTOR);
        const nativeControlsOrButtonArea = document.querySelector(NATIVE_CONTROLS_AREA_SELECTOR);

        if (!nativeControlsOrButtonArea) { // 核心是找到按钮区域
            console.warn('【自定义脚本】initializeCustomUI: 未能找到按钮区域。等待下一次DOM变化或检查选择器。');
            // 如果按钮区域找不到，那么其他元素是否找到意义不大，因为按钮无处安放
            knownNativeTextarea = null;
            knownNativeSendButton = null;
            return false;
        }
        console.log('【自定义脚本】initializeCustomUI: 按钮区域已找到。');

        // 更新已知元素引用，主要用于 MutationObserver 判断是否需要重新初始化
        knownNativeTextarea = nativeTextarea;
        knownNativeSendButton = nativeSendButton;


        // --- 创建或获取自定义控制按钮 ---
        let modeToggleButton = document.getElementById(CUSTOM_MODE_TOGGLE_ID);
        if (!modeToggleButton) {
            modeToggleButton = document.createElement('button');
            modeToggleButton.id = CUSTOM_MODE_TOGGLE_ID;
            modeToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49'; // 样式仅供参考，可能需要根据目标网站调整
            modeToggleButton.style.marginLeft = '8px';

            // 尝试将按钮插入到原生发送按钮之后，或者区域的末尾
            // 确保 nativeSendButton 存在且在 nativeControlsOrButtonArea 内
            if (nativeSendButton && nativeControlsOrButtonArea.contains(nativeSendButton)) {
                if (nativeSendButton.nextSibling) {
                    nativeControlsOrButtonArea.insertBefore(modeToggleButton, nativeSendButton.nextSibling);
                } else {
                    nativeControlsOrButtonArea.appendChild(modeToggleButton);
                }
            } else {
                 // 如果发送按钮不存在，或者不在预期的容器里，就直接添加到容器末尾
                nativeControlsOrButtonArea.appendChild(modeToggleButton);
                console.log('【自定义脚本】模式切换按钮已创建并添加到控件区域尾部 (后备，原生发送按钮未找到或位置异常)。');
            }
            console.log('【自定义脚本】模式切换按钮已创建并添加。');
        }
        modeToggleButton.textContent = currentMode;
        modeToggleButton.onclick = null; // 移除旧的onclick (如果有)
        modeToggleButton.onclick = () => {
            currentMode = (currentMode === '小说模式') ? '角色扮演模式' : '小说模式';
            modeToggleButton.textContent = currentMode;
            console.log('【自定义脚本】模式切换为:', currentMode);
            // 如果需要，可以在这里触发一个自定义事件，通知其他脚本状态已改变
            // document.dispatchEvent(new CustomEvent('customModeChanged', { detail: { mode: currentMode, enhancement: currentEnhancement } }));
        };


        let enhancementToggleButton = document.getElementById(CUSTOM_ENHANCEMENT_TOGGLE_ID);
        if (!enhancementToggleButton) {
            enhancementToggleButton = document.createElement('button');
            enhancementToggleButton.id = CUSTOM_ENHANCEMENT_TOGGLE_ID;
            enhancementToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49'; // 样式仅供参考
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
            // document.dispatchEvent(new CustomEvent('customModeChanged', { detail: { mode: currentMode, enhancement: currentEnhancement } }));
        };

        console.log('【自定义脚本】initializeCustomUI 执行完毕。');
        return true;
    }

    // --- 首次执行设置 ---
    initializeCustomUI();

    // --- 使用 MutationObserver 监视 DOM 变化 ---
    // 尝试找到一个比 document.body 更精确的父容器，但如果找不到，则回退到 body
    let chatAreaParent = document.body; // 默认观察整个 body
    const controlsAreaElement = document.querySelector(NATIVE_CONTROLS_AREA_SELECTOR);

    if (controlsAreaElement) {
        chatAreaParent = controlsAreaElement;
        // 如果 controlsAreaElement 本身体积较小，可以观察其父元素，以捕获 controlsAreaElement 被替换的情况
        if (controlsAreaElement.parentElement) {
            chatAreaParent = controlsAreaElement.parentElement;
        }
    } else {
        // 如果按钮区域选择器找不到，尝试基于输入框或发送按钮定位观察区域
        const textareaElement = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
        if (textareaElement && textareaElement.closest('form')) {
            chatAreaParent = textareaElement.closest('form');
        } else if (textareaElement && textareaElement.parentElement) {
            let parent = textareaElement.parentElement;
            for(let i=0; i<3 && parent.parentElement; i++) {
                if (parent.id || parent.classList.length > 1) {
                    chatAreaParent = parent;
                    break;
                }
                parent = parent.parentElement;
            }
            if (chatAreaParent === document.body && textareaElement.parentElement) {
                chatAreaParent = textareaElement.parentElement;
            }
        }
    }
    console.log("【自定义脚本】MutationObserver 将观察:", chatAreaParent);

    const observerConfig = { childList: true, subtree: true };

    let reinitTimeout = null;
    const observerCallback = function(mutationsList, observer) {
        let needsReSetup = false;

        // 检查我们的自定义按钮是否还在，如果不在了就需要重新设置
        // 同时，也检查核心参考元素（如发送按钮）是否变化，因为这可能意味着整个UI区域被重建
        const currentNativeSendButton = document.querySelector(NATIVE_SEND_BUTTON_SELECTOR);
        const currentControlsArea = document.querySelector(NATIVE_CONTROLS_AREA_SELECTOR);

        if (!document.getElementById(CUSTOM_MODE_TOGGLE_ID) || !document.getElementById(CUSTOM_ENHANCEMENT_TOGGLE_ID)) {
            if (currentControlsArea) { // 仅当核心按钮区域存在时，按钮消失才重设
                console.log('【自定义脚本】MutationObserver: 检测到自定义按钮消失。');
                needsReSetup = true;
            }
        } else if (currentNativeSendButton !== knownNativeSendButton && currentNativeSendButton && currentControlsArea) {
            // 如果原生发送按钮实例变了 (且新的按钮和区域都存在)，也可能需要重新定位我们的按钮
            console.log('【自定义脚本】MutationObserver: 检测到原生发送按钮实例发生变化。');
            needsReSetup = true;
        } else if (!currentControlsArea) {
            // 如果按钮区域消失了，也标记，等待它重新出现
             console.log('【自定义脚本】MutationObserver: 检测到核心按钮区域消失。');
             needsReSetup = true;
        }


        if (needsReSetup) {
            console.log('【自定义脚本】MutationObserver 检测到变化，计划重新执行 initializeCustomUI。');
            // 使用 debounce 技术防止短时间内频繁调用
            clearTimeout(reinitTimeout);
            reinitTimeout = setTimeout(() => {
                console.log('【自定义脚本】执行延迟后的 initializeCustomUI。');
                initializeCustomUI();
            }, 250); // 250ms 延迟，给动态渲染留足时间
        }
    };

    const observer = new MutationObserver(observerCallback);

    observer.observe(chatAreaParent, observerConfig);
    console.log('【自定义脚本】MutationObserver 已启动。');


    // (可选) 清理函数，如果你的油猴脚本环境支持在脚本禁用/更新时调用
    // window.cleanupMyChatScript = () => {
    //     console.log('【自定义脚本】开始清理...');
    //     observer.disconnect();
    //     clearTimeout(reinitTimeout);
    //     const btn1 = document.getElementById(CUSTOM_MODE_TOGGLE_ID);
    //     if (btn1) btn1.remove();
    //     const btn2 = document.getElementById(CUSTOM_ENHANCEMENT_TOGGLE_ID);
    //     if (btn2) btn2.remove();
    //     delete window.getCurrentSelectedModeText; // 移除全局函数
    //     console.log('【自定义脚本】已清理。');
    // };

    console.log('【自定义脚本】已注入并执行 (UI模式，提供 getCurrentSelectedModeText 函数)。');

})();
// --- END OF FILE statefulChatInput.js ---