// Check if the window doen't have a parent and if that is toplevel:
if (window !== window.top && window.parent == window.top)
{
  // Then send the current site:
  chrome.runtime.sendMessage({fromCnt: 'newLink', link: document.URL});

  // Check if mobile user agent should be set:
  chrome.storage.local.get('userAgent', function(object)
  {
/*    if ( object.userAgent == "mobile")
    {
      var script = document.createElement("script");
      script.text="navigator.__defineGetter__('userAgent', function () { return 'blablabla'; });";
      document.getElementsByTagName("head")[0].appendChild(script);
    }*/
  });
}
