// Check if the window has a parent and it that is toplevel:
if (window !== window.top && window.parent == window.top) {
  // Then send the current site:
  chrome.runtime.sendMessage({fromCnt: 'newLink', link: document.URL});
}
