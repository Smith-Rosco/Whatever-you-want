(function() {
    'use strict';
    // 为了区分，可以在控制台日志中加一个标记
    console.log("AI选项填充脚本 v1.3 已加载 (强制React更新) - SCRIPT TAG VERSION");

    // --- 配置区 (与原脚本相同) ---
    const stableParentSelector = 'div.mx-auto.pt-24.w-full.max-w-\\[720px\\].px-4.relative';
    const optionsAreaSelector = 'details.optionsarea.collapsible-area';
    const optionItemSelector = 'div > ol > li';
    const inputId = 'ai-chat-input';
    // --- 配置区结束 ---

    let eventListenerAttached = false; // 标志位

    /**
     * 查找并填充输入框，强制模拟用户输入
     * @param {string} textToFill - 要填充的文本
     */
    function fillInputAndTriggerUpdate(textToFill) {
        const inputTextArea = document.getElementById(inputId);
        if (!inputTextArea) {
            console.error('AI选项填充脚本：未能找到目标输入框 #', inputId);
            return;
        }
        console.log("AI选项填充脚本：找到输入框，准备填充内容:", textToFill);

        // --- 关键步骤：强制模拟用户输入 ---
        // 1. 获取 HTMLTextAreaElement 的原生 value setter
        const nativeTextAreaValueSetter = Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value').set;
        // 2. 使用原生 setter 来设置值
        nativeTextAreaValueSetter.call(inputTextArea, textToFill);
        console.log("AI选项填充脚本：已调用原生 value setter 设置值。");

        // 3. 创建并派发 'input' 事件
        const inputEvent = new Event('input', { bubbles: true, cancelable: true });
        inputTextArea.dispatchEvent(inputEvent);
        console.log("AI选项填充脚本：已派发 'input' 事件。");

        // 4. （可选，但有时需要）派发 'change' 事件
        // const changeEvent = new Event('change', { bubbles: true, cancelable: true });
        // inputTextArea.dispatchEvent(changeEvent);
        // console.log("AI选项填充脚本：已派发 'change' 事件。");

        console.log("AI选项填充脚本：内容填充及事件派发完成。");
        // 可选：自动聚焦到输入框
        // inputTextArea.focus();
    }

    /**
     * 附加点击事件监听器的函数
     * @param {Element} parentElement - 要附加监听器的父元素
     */
    function attachClickListener(parentElement) {
        if (eventListenerAttached) {
            return;
        }
        console.log("AI选项填充脚本：找到父容器，准备附加点击事件监听器。");
        parentElement.addEventListener('click', function(event) {
            // 确保点击的是选项区域内的列表项
            const clickedOption = event.target.closest(`${optionsAreaSelector} ${optionItemSelector}`);
            if (clickedOption) {
                // 再次确认点击的是列表项本身或其子元素，并且它确实在 optionsAreaSelector 内部
                if (event.target.closest(optionsAreaSelector) && event.target.closest(optionItemSelector)) {
                    console.log("AI选项填充脚本：检测到选项点击:", clickedOption);
                    const optionText = clickedOption.textContent.trim();
                    fillInputAndTriggerUpdate(optionText);
                }
            }
        });
        eventListenerAttached = true;
        console.log("AI选项填充脚本：点击事件监听器已成功附加到父容器。");
    }

    /**
     * 初始化 MutationObserver 来等待父元素出现
     */
    function initObserver() {
        console.log("AI选项填充脚本：未立即找到父容器，启动 MutationObserver 等待...");
        const observer = new MutationObserver((mutationsList, obs) => {
            const parentElement = document.querySelector(stableParentSelector);
            if (parentElement) {
                console.log("AI选项填充脚本：MutationObserver 检测到父容器已出现。");
                attachClickListener(parentElement); // 找到后附加监听器
                obs.disconnect(); // 停止观察
                console.log("AI选项填充脚本：MutationObserver 已停止。");
            }
        });
        // 观察 document.body 的子节点变化和整个子树的变化
        // 确保 document.body 存在
        if (document.body) {
            const config = { childList: true, subtree: true };
            observer.observe(document.body, config);
        } else {
            // 如果 document.body 此时还不存在 (例如脚本在 <head> 中且没有 defer)
            // 则等待 DOMContentLoaded 事件
            console.warn("AI选项填充脚本：document.body 尚未加载，等待 DOMContentLoaded。");
            document.addEventListener('DOMContentLoaded', () => {
                 console.log("AI选项填充脚本：DOMContentLoaded 事件触发，重新尝试启动 MutationObserver。");
                 const config = { childList: true, subtree: true };
                 observer.observe(document.body, config); // 此时 document.body 必定存在
            });
        }
    }

    // --- 脚本主逻辑 ---
    // 确保在DOM基本加载完毕后执行，以防 document.body 不存在
    // 或者目标元素在脚本执行时已经存在
    function runScript() {
        const initialParentElement = document.querySelector(stableParentSelector);
        if (initialParentElement) {
            console.log("AI选项填充脚本：父容器已存在，立即附加监听器。");
            attachClickListener(initialParentElement);
        } else {
            initObserver();
        }
    }

    // 确保DOM内容加载完成后执行脚本逻辑
    // 如果脚本被放在 </body> 之前，'DOMContentLoaded' 可能已经触发
    // 或者 document.readyState 已经是 'interactive' 或 'complete'
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', runScript);
    } else {
        // DOMContentLoaded has already fired or document is ready
        runScript();
    }

})();
