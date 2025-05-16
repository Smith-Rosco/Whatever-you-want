(function runCustomUI() {
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runCustomUI);
        return;
    }
    
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
    const nativeButtonArea = document.querySelector('.flex.items-center.gap-2.pb-2');

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

    const modeToggleButton = document.createElement('button');
    modeToggleButton.id = 'custom-mode-toggle';
    modeToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49';
    modeToggleButton.textContent = currentMode;
    modeToggleButton.addEventListener('click', () => {
        currentMode = (currentMode === '小说模式') ? '角色扮演模式' : '小说模式';
        modeToggleButton.classList.toggle('active', currentMode === '角色扮演模式');
        modeToggleButton.textContent = currentMode;
    });

    const enhancementToggleButton = document.createElement('button');
    enhancementToggleButton.id = 'custom-enhancement-toggle';
    enhancementToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49';
    enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
    if (currentEnhancement) enhancementToggleButton.classList.add('active');

    enhancementToggleButton.addEventListener('click', () => {
        currentEnhancement = !currentEnhancement;
        enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
        enhancementToggleButton.classList.toggle('active', currentEnhancement);
    });

    nativeButtonArea.appendChild(modeToggleButton);
    nativeButtonArea.appendChild(enhancementToggleButton);

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
    customSendButton.innerHTML = `<svg t="1747390393088" class="icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg" p-id="4623" data-darkreader-inline-fill="" width="200" height="200"><path d="M915.515273 142.819385 98.213046 458.199122c-46.058539 17.772838-44.90475 43.601756 2.348455 57.622994l197.477685 58.594874 80.292024 238.91085c10.51184 31.277988 37.972822 37.873693 61.462483 14.603752l103.584447-102.611545 204.475018 149.840224c26.565749 19.467242 53.878547 9.222132 61.049613-23.090076l149.210699-672.34491C965.264096 147.505054 946.218922 130.971848 915.515273 142.819385zM791.141174 294.834331l-348.61988 310.610267c-6.268679 5.58499-11.941557 16.652774-12.812263 24.846818l-15.390659 144.697741c-1.728128 16.24808-7.330491 16.918483-12.497501 1.344894l-67.457277-203.338603c-2.638691-7.954906 0.975968-17.705389 8.022355-21.931178l442.114555-265.181253C812.67481 268.984974 815.674251 272.975713 791.141174 294.834331z" p-id="4624"></path></svg>`; // 省略SVG内容

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
