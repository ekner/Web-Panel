/* This will be loaded each time the user visits a new page, like clicking
a link. Then it will send the current url to the panel.js script.
On modern ajax sites, like youtube, when a user navigates, what actually
happens is that ajax content loads and the url is chanded manually. Then we
must send the new url. We can't listen for url changes, so we listen for
clicks with mouse and keyboard, because then the user perhaps navigated. We
use a timeout if the user writes on a text input field for example, so we
don't send tons of messages. */

// Check if the window doen't have a parent and if that is toplevel,
// so that we know that it comes from the sidebar:
if (window !== window.top && window.parent == window.top)
{
  var url = document.URL;
  var waitTimeout = false;

  // Send the current site when the page is loaded:
  chrome.runtime.sendMessage({fromCnt: 'newLink', link: url});

  function waitAndSend()
  {
    if (waitTimeout !== false)
      clearTimeout(wait);

    waitTimeout = setTimeout(function()
    {
      if (document.URL !== url)
      {
        url = document.URL;
        chrome.runtime.sendMessage({fromCnt: 'newLink', link: document.URL});
      }
    }, 500);
  }

  window.addEventListener("click", function()
  {
    waitAndSend();
  });
  window.addEventListener("keyup", function(e)
  {
    // We only listen for the enter key, as it probably is the only key used
    // for navigating away, in a list of links for example.
    if (e.keyCode === 13)
      waitAndSend();
  });
}
