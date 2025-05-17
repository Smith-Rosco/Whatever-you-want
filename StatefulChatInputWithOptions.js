(function runCombinedUI() {
    'use strict';

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runCombinedUI);
        return;
    }
    console.log("【自定义脚本】Combined Script Initializing...");

    // --- Configuration Area ---
    // From input.js
    const NATIVE_TEXTAREA_SELECTOR = '#ai-chat-input';
    const NATIVE_SEND_BUTTON_SELECTOR = '#ai-send-button';
    const NATIVE_CONTROLS_AREA_SELECTOR = '.flex.items-center.gap-2.pb-2'; // Used for button area

    // From auto_complete.js
    const STABLE_PARENT_SELECTOR = 'div.mx-auto.pt-24.w-full.max-w-\\[720px\\].px-4.relative';
    const OPTIONS_AREA_SELECTOR = 'details.optionsarea.collapsible-area';
    const OPTION_ITEM_SELECTOR = 'div > ol > li';
    const INPUT_ID_FOR_AUTO_COMPLETE = 'ai-chat-input'; // Same as NATIVE_TEXTAREA_SELECTOR

    // --- Shared State and Elements ---
    let currentMode = '角色扮演模式'; // Initial mode
    let currentEnhancement = false; // Initial enhancement state

    let nativeTextarea;
    let nativeSendButton;
    let nativeControlsOrButtonArea;
    let modeToggleButton; // Will be created by input.js logic
    let enhancementToggleButton; // Will be created by input.js logic

    // --- Initialization Flag for auto_complete part ---
    let eventListenerForAutoCompleteAttached = false;

    // --- Initialize Elements from input.js ---
    function initializeInputScriptElements() {
        nativeTextarea = document.querySelector(NATIVE_TEXTAREA_SELECTOR);
        nativeSendButton = document.querySelector(NATIVE_SEND_BUTTON_SELECTOR);
        nativeControlsOrButtonArea = document.querySelector(NATIVE_CONTROLS_AREA_SELECTOR);

        if (!nativeTextarea || !nativeSendButton || !nativeControlsOrButtonArea) {
            console.error('【自定义脚本】未能找到所有必要的原生页面元素，请检查选择器。');
            console.log({
                nativeTextarea,
                nativeSendButton,
                nativeControlsArea: nativeControlsOrButtonArea
            });
            return false; // Indicate failure
        }
        return true; // Indicate success
    }

    // --- Create Custom Control Buttons (from input.js) ---
    function createCustomButtons() {
        if (!nativeControlsOrButtonArea) return;

        modeToggleButton = document.createElement('button');
        modeToggleButton.id = 'custom-mode-toggle';
        modeToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49';
        modeToggleButton.textContent = currentMode;
        modeToggleButton.style.marginLeft = '8px';
        modeToggleButton.addEventListener('click', () => {
            currentMode = (currentMode === '小说模式') ? '角色扮演模式' : '小说模式';
            modeToggleButton.textContent = currentMode;
            console.log("【自定义脚本】Mode toggled to:", currentMode);
        });

        enhancementToggleButton = document.createElement('button');
        enhancementToggleButton.id = 'custom-enhancement-toggle';
        enhancementToggleButton.className = 'MuiButtonBase-root MuiButton-root MuiButton-default MuiButton-defaultPrimary MuiButton-sizeSmall MuiButton-defaultSizeSmall MuiButton-colorPrimary css-nkqe49';
        enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
        if (currentEnhancement) enhancementToggleButton.classList.add('active');
        enhancementToggleButton.style.marginLeft = '8px';

        enhancementToggleButton.addEventListener('click', () => {
            currentEnhancement = !currentEnhancement;
            enhancementToggleButton.textContent = `瑟瑟增强${currentEnhancement ? '开' : '关'}`;
            enhancementToggleButton.classList.toggle('active', currentEnhancement);
            console.log("【自定义脚本】Enhancement toggled to:", currentEnhancement);
        });

        nativeControlsOrButtonArea.appendChild(modeToggleButton);
        nativeControlsOrButtonArea.appendChild(enhancementToggleButton);
        console.log("【自定义脚本】Custom buttons created and appended.");
    }

    // --- Core Logic: Modify and Send (from input.js) ---
    function prepareAndSend() {
        if (!nativeTextarea) return false; // Should not happen if initialization was successful

        const originalText = nativeTextarea.value.trim();
        let commentParts = [];

        commentParts.push(currentMode);

        if (currentEnhancement) {
            commentParts.push('瑟瑟增强');
        }

        const commentContent = commentParts.join('；');
        const commentPrefix = `<!-- ${commentContent} -->\n`;

        let finalText = commentPrefix + originalText;

        const nativeInputValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        if (nativeInputValueSetter) {
            nativeInputValueSetter.call(nativeTextarea, finalText);
        } else {
            nativeTextarea.value = finalText;
        }

        nativeTextarea.dispatchEvent(new Event('input', { bubbles: true }));
        nativeTextarea.dispatchEvent(new Event('change', { bubbles: true }));
        
        console.log("【自定义脚本】Text prepared for sending:", finalText.substring(0, 100) + "...");
        return true;
    }

    // --- Setup Event Listeners for Sending (from input.js) ---
    function setupSendListeners() {
        if (!nativeSendButton || !nativeTextarea) return;

        // 1. Intercept native send button click
        nativeSendButton.addEventListener('click', function(event) {
            const shouldProceed = prepareAndSend();
            if (!shouldProceed) {
                event.preventDefault();
                event.stopPropagation();
                console.log('【自定义脚本】发送被阻止，因为prepareAndSend返回false。');
            } else {
                console.log('【自定义脚本】原生发送按钮点击，已准备文本。');
            }
        }, true); // Use capture phase

        // 2. Intercept native input Enter key
        nativeTextarea.addEventListener('keydown', function(event) {
            if (event.key === 'Enter' && !event.shiftKey) {
                event.preventDefault();
                if (nativeSendButton) {
                    console.log('【自定义脚本】原生输入框Enter键，触发发送按钮点击。');
                    nativeSendButton.click();
                }
            }
        });
        console.log("【自定义脚本】Send event listeners attached.");
    }


    // --- Auto Complete Logic (from auto_complete.js, adapted) ---

    /**
     * Find and fill the input box, forcibly simulating user input
     * @param {string} textToFill - The text to fill
     */
    function fillInputAndTriggerUpdate(textToFill) {
        const inputTextArea = document.getElementById(INPUT_ID_FOR_AUTO_COMPLETE); // or use nativeTextarea
        if (!inputTextArea) {
            console.error('【自定义脚本】AI选项填充：未能找到目标输入框 #', INPUT_ID_FOR_AUTO_COMPLETE);
            return;
        }
        console.log("【自定义脚本】AI选项填充：找到输入框，准备填充内容:", textToFill);

        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        nativeTextAreaValueSetter.call(inputTextArea, textToFill);
        console.log("【自定义脚本】AI选项填充：已调用原生 value setter 设置值。");

        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        inputTextArea.dispatchEvent(inputEvent);
        console.log("【自定义脚本】AI选项填充：已派发 'input' 事件。");

        // Optional: focus
        // inputTextArea.focus();
    }

    /**
     * Attach click event listener for auto-complete options
     * @param {Element} parentElement - The parent element to attach the listener to
     */
    function attachAutoCompleteClickListener(parentElement) {
        if (eventListenerForAutoCompleteAttached) {
            return;
        }
        console.log("【自定义脚本】AI选项填充：找到父容器，准备附加点击事件监听器。");
        parentElement.addEventListener('click', function(event) {
            const clickedOptionElement = event.target.closest(`${OPTIONS_AREA_SELECTOR} ${OPTION_ITEM_SELECTOR}`);

            if (clickedOptionElement) {
                // Ensure it's within the options area
                if (event.target.closest(OPTIONS_AREA_SELECTOR)) {
                    console.log("【自定义脚本】AI选项填充：检测到选项点击:", clickedOptionElement);
                    const optionText = clickedOptionElement.textContent.trim();

                    // --- NEW LOGIC: Change mode based on clicked option ---
                    const optionsList = clickedOptionElement.parentElement; // Should be <ol>
                    if (optionsList && optionsList.tagName === 'OL') {
                        const allOptions = Array.from(optionsList.children).filter(child => child.matches(OPTION_ITEM_SELECTOR));
                        const clickedIndex = allOptions.indexOf(clickedOptionElement);
                        const totalOptions = allOptions.length;

                        console.log(`【自定义脚本】AI选项填充：Clicked option index: ${clickedIndex}, Total options: ${totalOptions}`);

                        if (totalOptions >= 2) { // Need at least 2 options for the first rule
                            if (clickedIndex === 0 || clickedIndex === 1) {
                                currentMode = '角色扮演模式';
                                if (modeToggleButton) modeToggleButton.textContent = currentMode;
                                console.log("【自定义脚本】AI选项填充：切换到 角色扮演模式");
                            }
                        }
                        if (totalOptions >= 4) { // Need at least 4 options for the second rule
                             // last two items
                            if (clickedIndex === totalOptions - 1 || clickedIndex === totalOptions - 2) {
                                currentMode = '小说模式';
                                if (modeToggleButton) modeToggleButton.textContent = currentMode;
                                console.log("【自定义脚本】AI选项填充：切换到 小说模式");
                            }
                        } else if (totalOptions >= 2 && totalOptions < 4) {
                            // If less than 4 options, but at least 2, the "last two" might overlap with "first two"
                            // For example, with 2 options:
                            // Opt 0: index 0 (first two)
                            // Opt 1: index 1 (first two) AND (last two: totalOptions-1 = 1, totalOptions-2 = 0)
                            // So, if totalOptions is 2 or 3, and the "last two" rule is triggered,
                            // it might override the "first two" if the order of ifs is not careful.
                            // The current logic is fine: first two rule, then last two rule. If an item is both, last rule wins.
                            // If specific priority is needed, the conditions might need adjustment.
                            // For now, the requirement is "if first two" OR "if last two".
                            if (clickedIndex === totalOptions - 1 || (totalOptions > 1 && clickedIndex === totalOptions - 2)) {
                                if (currentMode !== '角色扮演模式') { // Avoid re-setting if already set by first rule
                                    currentMode = '小说模式';
                                    if (modeToggleButton) modeToggleButton.textContent = currentMode;
                                    console.log("【自定义脚本】AI选项填充：切换到 小说模式 (for <4 options case)");
                                }
                            }
                        }
                    }
                    // --- END OF NEW LOGIC ---

                    fillInputAndTriggerUpdate(optionText);
                }
            }
        });
        eventListenerForAutoCompleteAttached = true;
        console.log("【自定义脚本】AI选项填充：点击事件监听器已成功附加到父容器。");
    }

    /**
     * Initialize MutationObserver to wait for the parent element of auto-complete options
     */
    function initAutoCompleteObserver() {
        console.log("【自定义脚本】AI选项填充：未立即找到父容器，启动 MutationObserver 等待...");
        const observer = new MutationObserver((mutationsList, obs) => {
            const parentElement = document.querySelector(STABLE_PARENT_SELECTOR);
            if (parentElement) {
                console.log("【自定义脚本】AI选项填充：MutationObserver 检测到父容器已出现。");
                attachAutoCompleteClickListener(parentElement);
                obs.disconnect();
                console.log("【自定义脚本】AI选项填充：MutationObserver 已停止。");
            }
        });

        if (document.body) {
            observer.observe(document.body, { childList: true, subtree: true });
        } else {
            console.warn("【自定义脚本】AI选项填充：document.body 尚未加载，等待 DOMContentLoaded (should not happen with main guard).");
            // This case should ideally be covered by the main DOMContentLoaded guard at the top.
            document.addEventListener('DOMContentLoaded', () => {
                 observer.observe(document.body, { childList: true, subtree: true });
            });
        }
    }

    // --- Main Script Logic Execution ---
    function run() {
        console.log("【自定义脚本】Running main logic...");

        // Part 1: Initialize elements and UI for input modification
        if (initializeInputScriptElements()) {
            createCustomButtons();
            setupSendListeners();
            console.log('【自定义脚本】Input modification script parts initialized.');
        } else {
            console.error('【自定义脚本】Failed to initialize input modification script parts. Some features might not work.');
            // Depending on severity, you might want to return here.
            // However, the auto-complete part might still be useful.
        }

        // Part 2: Initialize auto-complete functionality
        const initialAutoCompleteParentElement = document.querySelector(STABLE_PARENT_SELECTOR);
        if (initialAutoCompleteParentElement) {
            console.log("【自定义脚本】AI选项填充：父容器已存在，立即附加监听器。");
            attachAutoCompleteClickListener(initialAutoCompleteParentElement);
        } else {
            initAutoCompleteObserver();
        }
        console.log('【自定义脚本】已注入并执行 (Combined Script)。');
    }

    // Run the main logic
    run();

})();
// --- END OF COMBINED SCRIPT ---
