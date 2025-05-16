// --- START OF FILE input.js ---

(function runCustomUI() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runCustomUI);
        return;
    }

    // 🔽 以下是你修改后的脚本内容
    // --------------------------------------

    // --- 配置区 ---
    const NATIVE_TEXTAREA_SELECTOR = '#ai-chat-input';
    const NATIVE_SEND_BUTTON_SELECTOR = '#ai-send-button';
    // const NATIVE_INPUT_AREA_WRAPPER_SELECTOR = '.p-\\[5\\.5px\\].max-h-\\[150px\\].bg-white'; //不再需要隐藏或替换它
    const NATIVE_CONTROLS_AREA_SELECTOR = '.flex.items-center.gap-2.pb-2'; // 用于按钮区域

    let currentMode = '小说模式'; // 初始模式
    let currentEnhancement = false; // 初始增强状态

    const nativeTextarea = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
    const nativeSendButton = document.querySelector(NATIVE_SEND_BUTTON_SELECTOR);
    // const nativeInputAreaWrapper = document.querySelector(NATIVE_INPUT_AREA_WRAPPER_SELECTOR); // 不再直接操作
    const nativeControlsOrButtonArea = document.querySelector(NATIVE_CONTROLS_AREA_SELECTOR);

    if (!nativeTextarea || !nativeSendButton || !nativeControlsOrButtonArea) {
        console.error('【自定义脚本】未能找到所有必要的原生页面元素，请检查选择器。');
        console.log({
            nativeTextarea,
            nativeSendButton,
            nativeControlsArea: nativeControlsOrButtonArea
        });
        return;
    }

    // --- 创建自定义控制按钮 ---
    const modeToggleButton = document.createElement('button');
    modeToggleButton.id = 'custom-mode-toggle';
    modeToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49';
    modeToggleButton.textContent = currentMode;
    modeToggleButton.style.marginLeft = '8px'; // 添加一点左边距
    modeToggleButton.addEventListener('click', () => {
        currentMode = (currentMode === '小说模式') ? '角色扮演模式' : '小说模式';
        modeToggleButton.classList.toggle('active', currentMode === '角色扮演模式');
        modeToggleButton.textContent = currentMode;
    });

    const enhancementToggleButton = document.createElement('button');
    enhancementToggleButton.id = 'custom-enhancement-toggle';
    enhancementToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49';
    enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
    if (currentEnhancement) enhancementToggleButton.classList.add('active');
    enhancementToggleButton.style.marginLeft = '8px'; // 添加一点左边距

    enhancementToggleButton.addEventListener('click', () => {
        currentEnhancement = !currentEnhancement;
        enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
        enhancementToggleButton.classList.toggle('active', currentEnhancement);
    });

    // 将按钮添加到原生按钮区域的末尾
    nativeControlsOrButtonArea.appendChild(modeToggleButton);
    nativeControlsOrButtonArea.appendChild(enhancementToggleButton);


    // --- 核心逻辑：修改并发送 ---
    function prepareAndSend() {
        const originalText = nativeTextarea.value.trim();

        // 如果原文为空，并且没有任何模式或增强被激活，则不发送 (除非您希望即使为空也发送前缀)
        if (!originalText && currentMode !== '小说模式' && !currentEnhancement) {
            // 如果希望即使用户未输入，但模式激活时也发送前缀，则移除此if块的部分或全部
            // console.log('【自定义脚本】输入为空且无特殊模式，不发送。');
            // return false; // 表示未处理或不应发送
        }
        
        let prefixParts = [];
        if (currentMode === '小说模式') {
            prefixParts.push('小说模式');
        }
        if (currentEnhancement) {
            prefixParts.push('瑟瑟增强');
        }

        let finalText = originalText; // 默认是原始文本
        if (prefixParts.length > 0) {
            const statusText = `【${prefixParts.join('，')}】\n`;
            finalText = statusText + originalText;
        } else if (!originalText) { // 如果没有前缀，并且原始文本也为空，则不发送
             console.log('【自定义脚本】输入为空且无前缀，不发送。');
             return false; // 明确指示不应发送
        }


        // 更新原生输入框的值
        // 使用 setter 来更好地兼容某些框架 (如React)
        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(nativeTextarea, finalText);
        } else {
            nativeTextarea.value = finalText; // 后备方案
        }

        // 触发 input 和 change 事件，确保页面（尤其是使用框架的页面）能感知到值的变化
        nativeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        nativeTextarea.dispatchEvent(new Event('change', { bubbles: true }));
        
        return true; // 表示已处理，可以继续发送
    }

    // 1. 拦截原生发送按钮的点击
    if (nativeSendButton) {
        nativeSendButton.addEventListener('click', function(event) {
            // console.log('【自定义脚本】原生发送按钮点击被侦测 (捕获阶段)');
            const shouldProceed = prepareAndSend();
            if (!shouldProceed) {
                event.preventDefault(); // 阻止默认的点击行为（即发送）
                event.stopPropagation(); // 阻止事件进一步传播
                console.log('【自定义脚本】发送被阻止，因为prepareAndSend返回false。');
            }
            // 如果 shouldProceed 是 true, 事件会继续，原生按钮的默认行为（发送修改后的文本）会执行
        }, true); // 使用捕获阶段，确保我们的逻辑在原生处理之前执行
    }

    // 2. 拦截原生输入框的Enter键
    if (nativeTextarea) {
        nativeTextarea.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                // console.log('【自定义脚本】原生输入框Enter键被侦测');
                event.preventDefault(); // 阻止默认的Enter行为（如换行或表单提交）
                
                const shouldProceed = prepareAndSend();
                
                if (shouldProceed && nativeSendButton) {
                    // 确保在点击前，textarea的值已经是最新的
                    // prepareAndSend 内部已经更新了 textarea
                    nativeSendButton.click(); // 手动触发原生发送按钮的点击
                } else if (!shouldProceed) {
                    console.log('【自定义脚本】Enter键发送被阻止，因为prepareAndSend返回false。');
                }
            }
        });
    }

    console.log('【自定义脚本】已注入并执行 (修改原生行为模式)。');

})();
// --- END OF FILE input.js ---
