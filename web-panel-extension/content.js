/* --------------------------------------- */
/* This will be loaded each time the user
/* visits a new page, like clicking a link
/* --------------------------------------- */

// Check if the window doen't have a parent and if that is toplevel,
// so that we know that it comes from the sidebar:
if (window !== window.top && window.parent == window.top)
{
  // Then send the current site:
  chrome.runtime.sendMessage({fromCnt: 'newLink', link: document.URL});

  // On many modern ajax sites, like youtube, when a user navigates, what actually happens is that ajax content loads and the
  // url is chanded manually. Then we must send the new url. We can't listen for url changes, so we listen for clicks:
  window.addEventListener("click", function() {
    chrome.runtime.sendMessage({fromCnt: 'newLink', link: document.URL});
  });

}
