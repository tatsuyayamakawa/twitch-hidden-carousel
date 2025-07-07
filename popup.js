document.addEventListener("DOMContentLoaded", async () => {
  const toggleBtn = document.getElementById("toggleBtn");
  const statusDiv = document.getElementById("status");
  const statusText = statusDiv.querySelector("span");

  // 現在の状態を取得
  async function updateUI() {
    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      if (!tab.url || !tab.url.includes("twitch.tv")) {
        setErrorState("Twitchではありません", "Twitchページで使用してください");
        return;
      }

      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "getState",
      });

      if (response && typeof response.isHidden === "boolean") {
        updateButtonState(response.isHidden);
      } else {
        setErrorState(
          "ページを更新してください",
          "Content scriptが読み込まれていません"
        );
      }
    } catch (error) {
      console.error("状態取得エラー:", error);
      setErrorState("エラーが発生しました", "ページを更新してください");
    }
  }

  function updateButtonState(isHidden) {
    toggleBtn.disabled = false;

    if (isHidden) {
      toggleBtn.textContent = "カルーセルを表示";
      statusText.textContent = "カルーセル: 非表示";
      statusDiv.className = "status hidden";
    } else {
      toggleBtn.textContent = "カルーセルを非表示";
      statusText.textContent = "カルーセル: 表示";
      statusDiv.className = "status visible";
    }
  }

  function setErrorState(buttonText, statusMessage) {
    toggleBtn.textContent = buttonText;
    toggleBtn.disabled = true;
    statusText.textContent = statusMessage;
    statusDiv.className = "status error";
  }

  function setLoadingState(message = "処理中...") {
    toggleBtn.disabled = true;
    toggleBtn.textContent = message;
    statusText.textContent = "処理中...";
  }

  // ボタンクリック時の処理
  toggleBtn.addEventListener("click", async () => {
    try {
      setLoadingState();

      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });
      const response = await chrome.tabs.sendMessage(tab.id, {
        action: "toggleCarousel",
      });

      if (response && response.success) {
        updateButtonState(response.isHidden);
      } else {
        throw new Error("切り替えに失敗しました");
      }
    } catch (error) {
      console.error("切り替えエラー:", error);
      setErrorState("エラーが発生しました", "ページを更新してください");

      // 2秒後に再度状態を確認
      setTimeout(() => {
        updateUI();
      }, 2000);
    }
  });

  // 初期状態を設定
  await updateUI();
});
