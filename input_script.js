(function runCustomUI() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runCustomUI);
        return;
    }

    // 🔽 以下是你原来的全部脚本内容
    // --------------------------------------
    
    // --- 配置区 ---
    const NATIVE_TEXTAREA_SELECTOR = '#ai-chat-input';
    const NATIVE_SEND_BUTTON_SELECTOR = '#ai-send-button';
    const NATIVE_INPUT_AREA_WRAPPER_SELECTOR = '.p-\\[5\\.5px\\].max-h-\\[150px\\].bg-white';
    const NATIVE_CONTROLS_AREA_SELECTOR = '.flex.items-center.gap-2.pb-2';

    let currentMode = '小说模式';
    let currentEnhancement = false;

    const nativeTextarea = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
    const nativeSendButton = document.querySelector(NATIVE_SEND_BUTTON_SELECTOR);
    const nativeInputAreaWrapper = document.querySelector(NATIVE_INPUT_AREA_WRAPPER_SELECTOR);
    const nativeControlsArea = document.querySelector(NATIVE_CONTROLS_AREA_SELECTOR);

    if (!nativeTextarea || !nativeSendButton || !nativeInputAreaWrapper || !nativeControlsArea) {
        console.error('【自定义脚本】未能找到所有必要的原生页面元素，请检查选择器。');
        console.log({
            nativeTextarea,
            nativeSendButton,
            nativeInputAreaWrapper,
            nativeControlsArea
        });
        return;
    }

    const customStatusControlsContainer = document.createElement('div');
    customStatusControlsContainer.className = 'custom-status-controls-container';

    const modeToggleButton = document.createElement('button');
    modeToggleButton.id = 'custom-mode-toggle';
    modeToggleButton.className = 'custom-status-button';
    modeToggleButton.textContent = currentMode;
    modeToggleButton.addEventListener('click', () => {
        currentMode = (currentMode === '小说模式') ? '角色扮演模式' : '小说模式';
        modeToggleButton.classList.toggle('active', currentMode === '角色扮演模式');
        modeToggleButton.textContent = currentMode;
    });

    const enhancementToggleButton = document.createElement('button');
    enhancementToggleButton.id = 'custom-enhancement-toggle';
    enhancementToggleButton.className = 'custom-status-button';
    enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
    if (currentEnhancement) enhancementToggleButton.classList.add('active');

    enhancementToggleButton.addEventListener('click', () => {
        currentEnhancement = !currentEnhancement;
        enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
        enhancementToggleButton.classList.toggle('active', currentEnhancement);
    });

    customStatusControlsContainer.appendChild(modeToggleButton);
    customStatusControlsContainer.appendChild(enhancementToggleButton);

    const customInputAreaContainer = document.createElement('div');
    customInputAreaContainer.className = 'custom-input-area-container';

    const customTextarea = document.createElement('textarea');
    customTextarea.id = 'custom-ai-chat-input';
    customTextarea.placeholder = '开始你的创作... (Shift+Enter 换行)';
    customTextarea.addEventListener('input', function () {
        this.style.height = 'auto';
        this.style.height = (this.scrollHeight) + 'px';
        customSendButton.classList.toggle('active', this.value.trim().length > 0);
    });
    customTextarea.addEventListener('keydown', function (event) {
        if (event.key === 'Enter' && !event.shiftKey) {
            event.preventDefault();
            customSendButton.click();
        }
    });

    const customSendButton = document.createElement('button');
    customSendButton.id = 'custom-ai-send-button';
    customSendButton.title = '发送';
    customSendButton.innerHTML = `<svg width="20" height="20" ...>...</svg>`; // 省略SVG内容

    customInputAreaContainer.appendChild(customTextarea);
    customInputAreaContainer.appendChild(customSendButton);

    if (nativeInputAreaWrapper) {
        nativeInputAreaWrapper.style.display = 'none';
        nativeInputAreaWrapper.parentNode.insertBefore(customInputAreaContainer, nativeInputAreaWrapper.nextSibling);
    }

    nativeControlsArea.insertBefore(customStatusControlsContainer, nativeControlsArea.firstChild);

    customSendButton.addEventListener('click', () => {
        const customText = customTextarea.value.trim();
        if (!customText) return;

        const statusText = `【模式：${currentMode} | 增强：${currentEnhancement ? '开' : '关'}】\n`;
        const finalText = statusText + customText;

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(nativeTextarea, finalText);
        } else {
            nativeTextarea.value = finalText;
        }

        nativeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        nativeTextarea.dispatchEvent(new Event('change', { bubbles: true }));

        setTimeout(() => {
            if (nativeSendButton) nativeSendButton.click();
            customTextarea.value = '';
            customTextarea.style.height = 'auto';
            customTextarea.style.height = (customTextarea.scrollHeight) + 'px';
            customSendButton.classList.remove('active');
        }, 100);
    });

    console.log('【自定义脚本】已注入并执行。');
})();
