// --- START OF FILE simplify_v3.2_fixed_logic.js ---

(function () {
  "use strict";
  // --- 配置 (Configuration) ---
  const BUTTON_ID = "simplify-ai-button-v3";
  // ... [其他配置保持不变] ...
  const BUTTON_TEXT_IDLE = "简化回复";
  const BUTTON_TEXT_PROCESSING = "处理中...";
  const BUTTON_TEXT_SUCCESS = "简化成功";
  const BUTTON_TEXT_ERROR = "简化失败";
  const BUTTON_TEXT_NO_REPLIES = "无回复";
  const BUTTON_TEXT_API_ERROR = "API错误";
  const LOCALSTORAGE_TOKEN_KEY = "console_token";
  const LOCALSTORAGE_CONVERSATION_MAP_KEY = "conversationIdInfo";
  const AI_REPLY_SELECTOR = "div#ai-chat-answer";
  const CONTENT_CONTAINER_SELECTOR = ".undefined.markdown-body";
  const BUTTON_AREA_SELECTOR = "div.flex.items-center.gap-2.pb-2";
  const SELECTORS_TO_REMOVE_LATEST = "main > thk, main > opt";
  const SELECTORS_TO_REMOVE_SECOND_LATEST =
    "main > thk, main > sts, main > mem, main > opt";
  const API_BASE_URL = "https://aifuck.cc/console/api/installed-apps/";

  // --- 状态变量 (State Variables) ---
  let simplifyButton = null;
  let buttonResetTimeout = null;

  // --- 辅助函数 (Helper Functions) ---
  const SCRIPT_VERSION = "v3.2 Fixed Logic"; // 版本更新
  function logGroup(label) {
    console.group(`[简化脚本 ${SCRIPT_VERSION}] ${label}`);
  }
  function logGroupEnd() {
    console.groupEnd();
  }
  function logDebug(...args) {
    console.log(`[DEBUG]`, ...args);
  }
  function logInfo(...args) {
    console.log(`[INFO]`, ...args);
  }
  function logError(...args) {
    console.error(`[ERROR]`, ...args);
  }

  // ... [addGlobalStyle, updateButtonState 函数保持不变] ...
  function addGlobalStyle(cssRules) {
    const styleElement = document.createElement("style");
    styleElement.textContent = cssRules;
    document.head.appendChild(styleElement);
    logInfo("全局样式已添加。");
  }
  function updateButtonState(state, detail = "") {
    if (!simplifyButton) return;
    if (buttonResetTimeout) {
      clearTimeout(buttonResetTimeout);
      buttonResetTimeout = null;
    }
    let text = "";
    simplifyButton.disabled = false;
    simplifyButton.style.cursor = "pointer";
    simplifyButton.style.opacity = "1";
    simplifyButton.style.backgroundColor = "";
    switch (state) {
      case "processing":
        text = detail
          ? `${BUTTON_TEXT_PROCESSING} (${detail})`
          : BUTTON_TEXT_PROCESSING;
        simplifyButton.disabled = true;
        simplifyButton.style.backgroundColor = "#9ca3af";
        simplifyButton.style.cursor = "not-allowed";
        simplifyButton.style.opacity = "0.7";
        break;
      case "success":
        text = detail
          ? `${BUTTON_TEXT_SUCCESS} (${detail})`
          : BUTTON_TEXT_SUCCESS;
        simplifyButton.style.backgroundColor = "#10b981";
        buttonResetTimeout = setTimeout(() => updateButtonState("idle"), 3000);
        break;
      case "error":
      case "api_error":
        text = detail
          ? `${BUTTON_TEXT_ERROR} (${detail})`
          : state === "api_error"
          ? BUTTON_TEXT_API_ERROR
          : BUTTON_TEXT_ERROR;
        simplifyButton.style.backgroundColor = "#ef4444";
        buttonResetTimeout = setTimeout(() => updateButtonState("idle"), 5000);
        break;
      case "no_replies":
        text = BUTTON_TEXT_NO_REPLIES;
        simplifyButton.style.backgroundColor = "#60a5fa";
        buttonResetTimeout = setTimeout(() => updateButtonState("idle"), 3000);
        break;
      case "idle":
      default:
        text = BUTTON_TEXT_IDLE;
        if (
          !simplifyButton.className.trim() &&
          simplifyButton.dataset.initialBgColor
        ) {
          simplifyButton.style.backgroundColor =
            simplifyButton.dataset.initialBgColor;
        }
        break;
    }
    simplifyButton.textContent = text;
    logDebug(`按钮状态更新为: ${state}, 文本: "${text}"`);
  }

  // --- 核心逻辑 (Core Logic) ---

  function getAuthToken() {
    const token = localStorage.getItem(LOCALSTORAGE_TOKEN_KEY);
    if (!token) {
      logError(
        "获取认证失败: localStorage 中未找到 Token，键:",
        LOCALSTORAGE_TOKEN_KEY
      );
      return null;
    }
    const formattedToken = token.startsWith("Bearer ")
      ? token
      : `Bearer ${token}`;
    logDebug("成功获取认证 Token。");
    return formattedToken;
  }

  // 【修改】函数名和日志更准确，现在获取的是“角色ID”
  function getCharacterIdFromUrl() {
    const match = window.location.pathname.match(
      /\/explore\/installed\/([a-f0-9-]+)/
    );
    if (match && match[1]) {
      logDebug("成功从 URL 中解析出角色 ID:", match[1]);
      return match[1];
    }
    logError(
      "获取角色 ID 失败: 当前 URL 路径不匹配预期格式。",
      window.location.pathname
    );
    return null;
  }

  // 【新增】函数：通过角色ID请求，获取真正的内部应用ID
  async function fetchInternalAppId(characterId, authToken) {
    if (!characterId || !authToken) {
      logError("获取内部应用 ID 缺少必要参数。");
      return null;
    }

    const url = `${API_BASE_URL}${characterId}`;
    logGroup(`API 请求: 获取内部应用ID (通过角色ID)`);
    logDebug("URL:", url);

    try {
      const response = await fetch(url, {
        method: "GET",
        headers: { Authorization: authToken, Accept: "application/json" },
      });
      if (!response.ok) {
        logError(`API 响应失败: ${response.status} ${response.statusText}`);
        throw new Error("获取应用ID失败");
      }
      const data = await response.json();
      // 根据您提供的响应结构, ID在顶层
      if (data && data.id) {
        logInfo(`成功获取到内部应用 ID: ${data.id}`);
        logGroupEnd();
        return data.id;
      } else {
        logError('API 响应数据格式不正确，未找到 "id" 字段。', data);
        throw new Error("响应格式错误");
      }
    } catch (error) {
      logError("获取内部应用 ID 时发生网络错误或解析失败:", error);
      logGroupEnd();
      return null;
    }
  }

  // 【修改】函数名和日志更准确，现在是根据“应用ID”获取“会话ID”
  function getConversationId(internalAppId) {
    if (!internalAppId) {
      logError("获取会话 ID 失败: 未提供内部应用 ID。");
      return null;
    }
    const mapString = localStorage.getItem(LOCALSTORAGE_CONVERSATION_MAP_KEY);
    if (!mapString) {
      logError("获取会话 ID 失败: localStorage 中未找到会话 ID 映射。");
      return null;
    }
    try {
      const map = JSON.parse(mapString);
      const convId = map[internalAppId];
      if (!convId) {
        // 这个错误现在是正常的，如果一个应用还没有会话记录的话
        logError(
          `在映射中未找到此应用 ID (${internalAppId}) 对应的会话 ID。请先进行一次对话。`
        );
        return null;
      }
      logDebug(`成功获取会话 ID: ${convId} (使用应用ID: ${internalAppId})`);
      return convId;
    } catch (e) {
      logError("获取会话 ID 失败: 解析会话 ID 映射 JSON 失败。", e);
      return null;
    }
  }

  // ... [fetchMessages, updateMessageApi, extractSimplifiedContent, updatePageElementVisuals 函数保持不变] ...
  // 这些函数接收的 appId 参数现在将是 internalAppId，无需修改函数本身
  function fetchMessages(appId, conversationId, authToken) {
    return new Promise((resolve, reject) => {
      if (!appId || !conversationId || !authToken) {
        const errorMsg = "获取消息列表缺少必要参数。";
        logError(errorMsg, {
          appId: !!appId,
          conversationId: !!conversationId,
          authToken: !!authToken,
        });
        return reject(new Error(errorMsg));
      }

      const url = `${API_BASE_URL}${appId}/messages?conversation_id=${conversationId}&limit=100`;
      logGroup(`API 请求: 获取消息列表`);
      logDebug("URL:", url);
      logDebug("Method:", "GET");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        logError("API 请求超时 (15s)。");
        reject(new Error("超时"));
      }, 15000);

      fetch(url, {
        method: "GET",
        headers: { Authorization: authToken, Accept: "application/json" },
        signal: controller.signal,
      })
        .then((response) => {
          clearTimeout(timeoutId);
          if (response.ok) {
            logDebug(`API 响应成功: ${response.status} ${response.statusText}`);
            return response.json();
          } else {
            return response.text().then((text) => {
              logError(
                `API 响应失败: ${response.status} ${response.statusText}`,
                text
              );
              throw new Error(`获取失败: ${response.status} - ${text}`);
            });
          }
        })
        .then((data) => {
          const aiMessages = data.data.filter((msg) =>
            msg.hasOwnProperty("answer")
          );
          aiMessages.sort((a, b) => a.created_at - b.created_at);
          logInfo(`成功获取并筛选出 ${aiMessages.length} 条有效的 AI 消息。`);
          logGroupEnd();
          resolve(aiMessages);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          if (error.name !== "AbortError") {
            logError("API 请求网络错误或解析失败:", error);
          }
          logGroupEnd();
          reject(error);
        });
    });
  }
  function updateMessageApi(appId, messageId, newContent, authToken) {
    return new Promise((resolve, reject) => {
      if (
        !appId ||
        !messageId ||
        newContent === null ||
        newContent === undefined ||
        !authToken
      ) {
        const errorMsg = "更新消息 API 缺少必要参数。";
        logError(errorMsg, {
          appId: !!appId,
          messageId: !!messageId,
          newContent: typeof newContent,
          authToken: !!authToken,
        });
        return reject(new Error(errorMsg));
      }

      const url = `${API_BASE_URL}${appId}/messages/${messageId}`;
      const payload = JSON.stringify({ answer: newContent });
      logGroup(`API 请求: 更新消息 (ID: ${messageId})`);
      logDebug("URL:", url);
      logDebug("Method:", "PATCH");
      logDebug("Payload:", payload.substring(0, 200) + "...");

      const controller = new AbortController();
      const timeoutId = setTimeout(() => {
        controller.abort();
        logError(`API 请求超时 (15s) for message ${messageId}.`);
        reject(new Error("超时"));
      }, 15000);

      fetch(url, {
        method: "PATCH",
        headers: {
          Authorization: authToken,
          "Content-Type": "application/json",
          Accept: "*/*",
        },
        body: payload,
        signal: controller.signal,
      })
        .then((response) => {
          clearTimeout(timeoutId);
          if (response.ok) {
            logInfo(`API 更新成功: ${response.status} ${response.statusText}`);
            return response.text();
          } else {
            return response.text().then((text) => {
              logError(
                `API 更新失败: ${response.status} ${response.statusText}`,
                text
              );
              throw new Error(`API 更新失败: ${response.status} - ${text}`);
            });
          }
        })
        .then((responseText) => {
          logGroupEnd();
          resolve(responseText);
        })
        .catch((error) => {
          clearTimeout(timeoutId);
          if (error.name !== "AbortError") {
            logError(`API 请求网络错误或解析失败:`, error);
          }
          logGroupEnd();
          reject(error);
        });
    });
  }
  function extractSimplifiedContent(sourceElement, selectorsToRemove) {
    if (!sourceElement || typeof sourceElement.cloneNode !== "function") {
      logError(
        "extractSimplifiedContent 错误: sourceElement 无效或非 DOM 元素。",
        sourceElement
      );
      return null;
    }
    try {
      const clonedElement = sourceElement.cloneNode(true);
      if (selectorsToRemove && selectorsToRemove.trim() !== "") {
        const elementsToRemove =
          clonedElement.querySelectorAll(selectorsToRemove);
        elementsToRemove.forEach((el) => el.remove());
        logDebug(
          `从克隆内容中移除了 ${elementsToRemove.length} 个元素 (选择器: ${selectorsToRemove})。`
        );
      } else {
        logDebug(`没有提供需要移除的选择器，返回原始内容。`);
      }
      return clonedElement.innerHTML.trim();
    } catch (error) {
      logError("内容提取/清理过程中出错:", error, "源元素:", sourceElement);
      return null;
    }
  }
  function updatePageElementVisuals(
    pageReplyElement,
    simplifiedHtmlForDisplay
  ) {
    if (!pageReplyElement || simplifiedHtmlForDisplay === null) {
      logError(
        "updatePageElementVisuals 错误: pageReplyElement 或 simplifiedHtmlForDisplay 无效，无法更新视觉。"
      );
      return false;
    }
    const contentContainer = pageReplyElement.querySelector(
      CONTENT_CONTAINER_SELECTOR
    );
    if (contentContainer) {
      logDebug(`正在更新页面元素 (ID: ${pageReplyElement.id}) 的视觉内容...`);
      contentContainer.innerHTML = simplifiedHtmlForDisplay;
      pageReplyElement
        .querySelectorAll(".script-simplified-mark")
        .forEach((em) => em.remove());
      const mark = document.createElement("div");
      mark.className = "script-simplified-mark";
      mark.textContent = "(已由脚本简化)";
      if (contentContainer.parentNode) {
        contentContainer.parentNode.insertBefore(
          mark,
          contentContainer.nextSibling
        );
      } else {
        pageReplyElement.appendChild(mark);
      }
      logInfo(`成功更新页面元素 (ID: ${pageReplyElement.id}) 的视觉效果。`);
      return true;
    } else {
      logError(
        `在页面元素 (ID: ${pageReplyElement.id}) 中未找到内容容器 (${CONTENT_CONTAINER_SELECTOR})。视觉更新失败。`
      );
      return false;
    }
  }

  /**
   * 主处理函数：获取并简化最后两条 AI 回复。
   */
  async function processLastTwoReplies() {
    if (simplifyButton && simplifyButton.disabled) {
      logInfo("处理已在进行中，请稍候...");
      return;
    }
    logGroup("=== 开始简化流程 ===");
    updateButtonState("processing");

    const authToken = getAuthToken();
    if (!authToken) {
      updateButtonState("api_error", "缺少Token");
      logGroupEnd();
      return;
    }

    // 步骤 1: 从 URL 获取角色ID
    const characterId = getCharacterIdFromUrl();
    if (!characterId) {
      updateButtonState("api_error", "无角色ID");
      logGroupEnd();
      return;
    }

    try {
      // 步骤 2: 【新增】通过角色ID获取内部应用ID
      const internalAppId = await fetchInternalAppId(characterId, authToken);
      if (!internalAppId) {
        updateButtonState("api_error", "获取应用ID失败");
        logGroupEnd();
        return;
      }

      // 步骤 3: 【修改】使用内部应用ID获取会话ID
      const conversationId = getConversationId(internalAppId);
      if (!conversationId) {
        updateButtonState("error", "无会话ID,请先对话");
        logGroupEnd();
        return;
      }

      // 步骤 4: 【修改】使用内部应用ID和会话ID获取消息
      const apiMessages = await fetchMessages(
        internalAppId,
        conversationId,
        authToken
      );

      // ... [后续的消息处理逻辑保持不变] ...
      const pageReplyElements = Array.from(
        document.querySelectorAll(AI_REPLY_SELECTOR)
      );
      logInfo(
        `API 返回 ${apiMessages.length} 条消息，页面上找到 ${pageReplyElements.length} 个 AI 回复元素。`
      );

      if (pageReplyElements.length === 0) {
        logInfo("页面上未找到 AI 回复，无需操作。");
        updateButtonState("no_replies");
        logGroupEnd();
        return;
      }
      // ... [剩余的处理循环和UI更新逻辑完全不变, 只需确保将 internalAppId 传递给 updateMessageApi] ...
      let successCount = 0;
      let failCount = 0;
      const repliesToProcess = [];

      const targetsSetup = [
        {
          label: "最新",
          pageIndex: pageReplyElements.length - 1,
          selectors: SELECTORS_TO_REMOVE_LATEST,
        },
        {
          label: "次新",
          pageIndex: pageReplyElements.length - 2,
          selectors: SELECTORS_TO_REMOVE_SECOND_LATEST,
        },
      ];

      for (const setup of targetsSetup) {
        if (setup.pageIndex >= 0) {
          const pageElement = pageReplyElements[setup.pageIndex];
          const apiMessage =
            setup.pageIndex < apiMessages.length
              ? apiMessages[setup.pageIndex]
              : null;
          if (apiMessage && apiMessage.answer !== undefined) {
            repliesToProcess.push({
              ...setup,
              pageElement: pageElement,
              apiMessage: apiMessage,
            });
          } else {
            logError(
              `无法为 ${setup.label} 的页面元素 (索引 ${setup.pageIndex}) 找到匹配的 API 消息。跳过。`
            );
            if (pageElement) failCount++;
          }
        }
      }
      if (repliesToProcess.length === 0) {
        logInfo("没有符合条件的消息需要处理。");
        updateButtonState(
          failCount > 0 ? "error" : "idle",
          failCount > 0 ? "数据不匹配" : ""
        );
        logGroupEnd();
        return;
      }
      logInfo(
        `计划处理 ${repliesToProcess.length} 条回复: ${repliesToProcess
          .map((r) => r.label)
          .join(", ")}`
      );
      repliesToProcess.sort((a, b) => a.pageIndex - b.pageIndex);

      for (const target of repliesToProcess) {
        logGroup(
          `--- 处理 ${target.label} 回复 (API ID: ${target.apiMessage.id}) ---`
        );
        updateButtonState("processing", target.label);
        const { pageElement, apiMessage, selectors, label } = target;
        const tempDivForApiAnswer = document.createElement("div");
        tempDivForApiAnswer.innerHTML = apiMessage.answer || "";
        let simplifiedContentForApi = extractSimplifiedContent(
          tempDivForApiAnswer,
          selectors
        );
        if (simplifiedContentForApi === null) {
          logError(`未能为 ${label} 回复从 API 原始内容提取有效内容。跳过。`);
          failCount++;
          logGroupEnd();
          continue;
        }
        const tempContainer = document.createElement("div");
        tempContainer.innerHTML = simplifiedContentForApi;
        const mainElement = tempContainer.querySelector("main");
        if (mainElement) {
          if (label === "最新") {
            let currentModeText = null;
            if (typeof window.getCurrentSelectedModeText === "function") {
              try {
                currentModeText = window.getCurrentSelectedModeText();
              } catch (e) {
                logError(`调用 window.getCurrentSelectedModeText() 时出错:`, e);
              }
            }
            if (currentModeText) {
              const modeAreaHtml = `<div class="mode-area">${currentModeText}</div>`;
              mainElement.insertAdjacentHTML("beforeend", modeAreaHtml);
              simplifiedContentForApi = tempContainer.innerHTML;
              logInfo(`已为最新回复追加模式区域。`);
            }
          } else if (label === "次新") {
            const modeAreaElement = mainElement.querySelector("div.mode-area");
            if (modeAreaElement) {
              modeAreaElement.remove();
              simplifiedContentForApi = tempContainer.innerHTML;
              logInfo(`已从次新回复中移除模式区域。`);
            }
          }
        }
        try {
          // 【重要】确保这里传递的是 internalAppId
          await updateMessageApi(
            internalAppId,
            apiMessage.id,
            simplifiedContentForApi,
            authToken
          );
          logInfo(`API 消息已成功更新。`);
          if (updatePageElementVisuals(pageElement, simplifiedContentForApi)) {
            successCount++;
          } else {
            logError(`更新页面视觉效果失败，但 API 已更新。`);
            failCount++;
          }
        } catch (apiUpdateError) {
          logError(`更新 API 消息失败:`, apiUpdateError);
          failCount++;
        }
        logGroupEnd();
        await new Promise((resolve) => setTimeout(resolve, 100));
      }

      const totalTargets = repliesToProcess.length;
      logInfo(
        `--- 处理完成 --- 成功: ${successCount}, 失败: ${failCount}, 总计: ${totalTargets}`
      );
      if (failCount > 0 && successCount > 0) {
        updateButtonState("error", `${successCount}/${totalTargets} 成功`);
      } else if (failCount > 0) {
        updateButtonState("error", `0/${totalTargets} 成功`);
      } else if (successCount > 0) {
        updateButtonState("success", `${successCount}/${totalTargets}`);
      } else {
        updateButtonState("idle");
      }
    } catch (error) {
      logError("处理流程发生整体性错误:", error);
      updateButtonState(
        "error",
        error.message.includes("获取失败") ? "获取消息失败" : "意外错误"
      );
    } finally {
      logGroupEnd();
    }
  }

  // ... [setupUI 函数保持不变] ...
  function setupUI() {
    logGroup("=== UI 初始化 ===");

    addGlobalStyle(`
            .script-simplified-mark { 
                font-size: 10px; color: grey; margin-top: 5px; 
                margin-bottom: 5px; font-style: italic; display: block;
            }
            #${BUTTON_ID} {
                position: fixed;
                bottom: 20px; right: 20px;
                z-index: 9999;
                padding: 8px 12px;
                border-radius: 6px;
                border: 1px solid #ccc;
                color: white;
                cursor: pointer;
                transition: background-color 0.3s;
            }
            #${BUTTON_ID}[data-moved="true"] { 
                position: static; 
                right: auto; bottom: auto; z-index: auto;
                padding: 0; border: none;
            }
        `);

    if (document.getElementById(BUTTON_ID)) {
      simplifyButton = document.getElementById(BUTTON_ID);
      logInfo("简化按钮已存在，重新获取引用。");
    } else {
      simplifyButton = document.createElement("button");
      simplifyButton.id = BUTTON_ID;
      document.body.appendChild(simplifyButton);
      logInfo(`简化按钮已创建并添加到 body。`);
    }

    simplifyButton.textContent = BUTTON_TEXT_IDLE;
    simplifyButton.title = `简化 AI 回复 (v${SCRIPT_VERSION})`;
    simplifyButton.dataset.moved = "false";
    simplifyButton.dataset.initialBgColor = "#007bff";
    simplifyButton.style.backgroundColor =
      simplifyButton.dataset.initialBgColor;

    if (!simplifyButton.dataset.listenerAttached) {
      simplifyButton.addEventListener("click", processLastTwoReplies);
      simplifyButton.dataset.listenerAttached = "true";
      logInfo("按钮点击事件监听器已添加。");
    }
    updateButtonState("idle");

    const moveAndStyleButtonInternal = (container) => {
      if (
        !container ||
        !simplifyButton ||
        simplifyButton.dataset.moved === "true"
      ) {
        if (simplifyButton && simplifyButton.dataset.moved === "true") {
          logDebug("按钮已被移动，跳过重复操作。");
        }
        return;
      }
      logInfo(
        `目标容器 (${BUTTON_AREA_SELECTOR}) 已找到，开始移动和样式化按钮...`
      );

      const existingButtons = Array.from(
        container.querySelectorAll("button:not(#" + BUTTON_ID + ")")
      );

      if (existingButtons.length > 0) {
        const styleReferenceButton = existingButtons[0];
        logDebug(
          "找到参考按钮，将复制其 class:",
          styleReferenceButton.className
        );
        simplifyButton.className = styleReferenceButton.className;
        [
          "position",
          "bottom",
          "right",
          "zIndex",
          "padding",
          "margin",
          "border",
          "borderRadius",
        ].forEach((prop) => (simplifyButton.style[prop] = ""));
        const lastExistingButton = existingButtons[existingButtons.length - 1];
        logDebug("将按钮插入到最后一个现有按钮之后。");
        lastExistingButton.insertAdjacentElement("afterend", simplifyButton);
      } else {
        logError(`目标容器中未找到其他按钮，将直接附加到容器末尾。`);
        container.appendChild(simplifyButton);
      }

      simplifyButton.dataset.moved = "true";
      logInfo(`按钮已成功移动到目标容器。`);

      let currentState = "idle";
      if (simplifyButton.textContent.includes(BUTTON_TEXT_PROCESSING))
        currentState = "processing";
      updateButtonState(currentState);
    };
    if (
      window.DOMWatcherService &&
      typeof window.DOMWatcherService.register === "function"
    ) {
      logInfo(
        `尝试通过 DOMWatcherService 注册监听目标容器: ${BUTTON_AREA_SELECTOR}`
      );
      const registrationId = window.DOMWatcherService.register({
        id: `simplify-script-watcher-${Date.now()}`,
        selector: BUTTON_AREA_SELECTOR,
        callback: (foundContainer) => {
          logInfo(`DOMWatcherService 发现目标容器。`);
          moveAndStyleButtonInternal(foundContainer);
        },
        eventTypes: ["added"],
        once: true,
      });
      if (registrationId) {
        logInfo(
          `已成功向 DOMWatcherService 注册监听 (ID: ${registrationId})。`
        );
      } else {
        logError(`向 DOMWatcherService 注册监听失败。`);
      }
    } else {
      logError("DOMWatcherService 不可用。");
    }
    logGroupEnd();
  }
  window.simplifyAIReplies = processLastTwoReplies;
  // --- 脚本启动入口 (Script Entry Point) ---
  if (document.readyState === "loading") {
    window.addEventListener("DOMContentLoaded", setupUI);
  } else {
    setupUI();
  }
})();

// --- END OF FILE simplify_v3.2_fixed_logic.js ---
