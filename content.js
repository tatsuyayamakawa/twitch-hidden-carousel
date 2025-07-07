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
    // カルーセル内のメディア要素を停止
    const mediaElements = element.querySelectorAll("video, audio");
    mediaElements.forEach((media) => {
      try {
        media.pause();
        media.currentTime = 0;
        media.volume = 0;
        media.muted = true;
        // 自動再生属性を削除
        media.removeAttribute("autoplay");
        media.removeAttribute("loop");
      } catch (e) {
        console.warn("メディア要素の停止に失敗:", e);
      }
    });

    // iframe内のメディアも停止を試行
    const iframes = element.querySelectorAll("iframe");
    iframes.forEach((iframe) => {
      try {
        iframe.style.display = "none";
      } catch (e) {
        console.warn("iframe の停止に失敗:", e);
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

    this.hiddenCarousels.delete(element);
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
