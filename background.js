chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
	if (tab.url.indexOf('https://www.twitch.tv/*') > -1) {
		chrome.scripting.insertCSS({
			target: { tabId: tab.id },
			files: ['style.css'],
		});
	}
});