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

  window.addEventListener("click", myFunction);

  function myFunction()
  {
    chrome.runtime.sendMessage({fromCnt: 'newLink', link: document.URL});
  }

}
