class TwitchCarouselController {
  constructor() {
    this.isHidden = false;
    this.observer = null;
    this.hiddenCarousels = new Set();
    this.init();
  }

  async init() {
    // 保存された状態を読み込み
    try {
      const result = await chrome.storage.local.get(["carouselHidden"]);
      this.isHidden = result.carouselHidden || false;
    } catch (error) {
      console.warn("Storage読み込みエラー:", error);
    }

    // 初期化
    this.setupObserver();
    this.applyCarouselState();

    // メッセージリスナーの設定
    chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
      if (request.action === "toggleCarousel") {
        this.toggleCarousel();
        sendResponse({ success: true, isHidden: this.isHidden });
      } else if (request.action === "getState") {
        sendResponse({ isHidden: this.isHidden });
      }
    });
  }

  setupObserver() {
    // 既存のObserverがあれば停止
    if (this.observer) {
      this.observer.disconnect();
    }

    // DOM変更を監視
    this.observer = new MutationObserver((mutations) => {
      let shouldApply = false;

      mutations.forEach((mutation) => {
        if (mutation.type === "childList") {
          mutation.addedNodes.forEach((node) => {
            if (node.nodeType === Node.ELEMENT_NODE) {
              // カルーセル要素が追加された場合
              if (this.isCarouselElement(node)) {
                shouldApply = true;
              }
              // カルーセル要素の子要素が追加された場合
              const carousels = node.querySelectorAll
                ? node.querySelectorAll('[data-a-target="front-page-carousel"]')
                : [];
              if (carousels.length > 0) {
                shouldApply = true;
              }
            }
          });
        }
      });

      if (shouldApply) {
        // 少し遅延させて確実にDOMが構築されてから実行
        setTimeout(() => this.applyCarouselState(), 100);
      }
    });

    // 監視開始
    this.observer.observe(document.body, {
      childList: true,
      subtree: true,
    });
  }

  isCarouselElement(element) {
    // カルーセル要素かどうかを判定
    if (!element || !element.getAttribute) return false;

    const dataATarget = element.getAttribute("data-a-target");
    const dataTarget = element.getAttribute("data-target");
    const className = element.className || "";

    return (
      dataATarget === "front-page-carousel" ||
      dataTarget === "front-page-carousel" ||
      (dataATarget && dataATarget.includes("carousel")) ||
      (dataTarget && dataTarget.includes("carousel")) ||
      className.includes("carousel")
    );
  }

  findCarouselElements() {
    // 正確なTwitchカルーセルセレクター
    const selectors = [
      '[data-a-target="front-page-carousel"]',
      '[data-target="front-page-carousel"]',
      // バックアップセレクター
      '[data-a-target*="carousel"]',
      '[data-target*="carousel"]',
      ".carousel-item",
      '[class*="carousel"]',
    ];

    let elements = [];
    selectors.forEach((selector) => {
      try {
        const found = document.querySelectorAll(selector);
        elements = elements.concat(Array.from(found));
      } catch (error) {
        console.warn(`セレクター "${selector}" でエラー:`, error);
      }
    });

    // 重複を削除
    return [...new Set(elements)];
  }

  stopCarouselMedia(element) {
    // カルーセル内のメディア要素の音声のみを停止
    const mediaElements = element.querySelectorAll("video, audio");
    mediaElements.forEach((media) => {
      try {
        // 音声のみを無効化（ビデオは破壊しない）
        media.muted = true;
        media.volume = 0;

        // 一時停止（srcは触らない）
        media.pause();

        // 自動再生を無効化
        media.removeAttribute("autoplay");

        // 音声が再開されないようにイベントリスナーを追加
        const maintainMute = () => {
          if (!media.muted) media.muted = true;
          if (media.volume > 0) media.volume = 0;
        };

        // 定期的にミュート状態を維持
        media.addEventListener("volumechange", maintainMute);
        media.addEventListener("play", maintainMute);
        media.addEventListener("loadeddata", maintainMute);

        // マークを付けて管理
        media.setAttribute("data-twitch-muted", "true");
      } catch (e) {
        console.warn("メディア要素のミュートに失敗:", e);
      }
    });

    // iframe内の音声も停止（表示は維持）
    const iframes = element.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      try {
        // iframeの音声を無効化するためのスタイル調整
        iframe.style.visibility = "hidden";
        iframe.style.position = "absolute";
        iframe.style.left = "-9999px";
        iframe.setAttribute("data-twitch-muted", "true");
      } catch (e) {
        console.warn("iframe のミュートに失敗:", e);
      }
    });
  }

  hideCarousel(element) {
    if (this.hiddenCarousels.has(element)) return;

    // メディアを停止
    this.stopCarouselMedia(element);

    // 要素を非表示
    element.style.display = "none";
    element.setAttribute("data-twitch-hidden", "true");

    this.hiddenCarousels.add(element);
  }

  showCarousel(element) {
    if (!this.hiddenCarousels.has(element)) return;

    // 要素を表示
    element.style.display = "";
    element.removeAttribute("data-twitch-hidden");

    // メディア要素を復元
    this.restoreCarouselMedia(element);

    this.hiddenCarousels.delete(element);
  }

  restoreCarouselMedia(element) {
    // メディア要素の音声を復元
    const mediaElements = element.querySelectorAll(
      "video[data-twitch-muted], audio[data-twitch-muted]"
    );
    mediaElements.forEach((media) => {
      try {
        // ミュートを解除
        media.muted = false;
        // ボリュームは少し低めに設定（元の音量を復元したい場合は調整）
        media.volume = 0.5;

        // イベントリスナーを削除（追加されたミュート維持機能を無効化）
        media.removeEventListener("volumechange", this.maintainMute);
        media.removeEventListener("play", this.maintainMute);
        media.removeEventListener("loadeddata", this.maintainMute);

        // マークを削除
        media.removeAttribute("data-twitch-muted");
      } catch (e) {
        console.warn("メディア要素の復元に失敗:", e);
      }
    });

    // iframe要素を復元
    const iframes = element.querySelectorAll("iframe[data-twitch-muted]");
    iframes.forEach((iframe) => {
      try {
        // スタイルを元に戻す
        iframe.style.visibility = "";
        iframe.style.position = "";
        iframe.style.left = "";
        iframe.removeAttribute("data-twitch-muted");
      } catch (e) {
        console.warn("iframe の復元に失敗:", e);
      }
    });
  }

  applyCarouselState() {
    const carousels = this.findCarouselElements();

    carousels.forEach((carousel) => {
      if (this.isHidden) {
        this.hideCarousel(carousel);
      } else {
        this.showCarousel(carousel);
      }
    });

    // リロード後の追加対策：既に停止済みのメディアを再確認
    if (this.isHidden) {
      setTimeout(() => {
        this.forceStopAllCarouselMedia();
      }, 500); // DOM構築完了後に再実行
    }
  }

  forceStopAllCarouselMedia() {
    // 非表示状態で音声が再生されている場合の強制ミュート
    const carousels = this.findCarouselElements();
    carousels.forEach((carousel) => {
      if (
        carousel.style.display === "none" ||
        carousel.hasAttribute("data-twitch-hidden")
      ) {
        // 非表示なのに音声が再生されている可能性がある要素を強制ミュート
        const allMedia = carousel.querySelectorAll("video, audio");
        allMedia.forEach((media) => {
          if (!media.muted || media.volume > 0) {
            media.muted = true;
            media.volume = 0;
            media.pause();

            // ミュート維持のイベントリスナーを追加
            const maintainMute = () => {
              if (!media.muted) media.muted = true;
              if (media.volume > 0) media.volume = 0;
            };

            media.addEventListener("volumechange", maintainMute);
            media.addEventListener("play", maintainMute);
            media.setAttribute("data-twitch-muted", "true");
          }
        });
      }
    });
  }

  async toggleCarousel() {
    this.isHidden = !this.isHidden;

    // 状態を保存
    try {
      await chrome.storage.local.set({ carouselHidden: this.isHidden });
    } catch (error) {
      console.warn("Storage保存エラー:", error);
    }

    // 即座に反映
    this.applyCarouselState();
  }
}

// ページ読み込み完了後に初期化
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", () => {
    new TwitchCarouselController();
  });
} else {
  new TwitchCarouselController();
}
