if (window !== window.top) {
    chrome.runtime.sendMessage({fromCnt: 'newLink', link: window.location.href});
}
