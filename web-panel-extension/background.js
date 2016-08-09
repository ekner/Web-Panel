// This removes x-frame restrictions on some sites (not all):
chrome.webRequest.onHeadersReceived.addListener
(
  function(info)
  {
    var headers = info.responseHeaders;
    for (var i = headers.length - 1; i >= 0; --i)
    {
      var header = headers[i].name.toLowerCase();
      if (header == 'x-frame-options' || header == 'frame-options' || header == 'content-security-policy' || header == 'x-content-type-options' || header == 'x-xss-protection')
      {
        headers.splice(i, 1); // Remove header
      }
    }
    return {responseHeaders: headers};
  },
  {
    urls: [ '*://*/*' ],
    types: [ 'sub_frame' ]
  },
  ['blocking', 'responseHeaders']
);

// Get user agent change from panel.js:
var userAgent = "";
chrome.runtime.onMessage.addListener
(
	function (request, sender)
  {
		if (request.userAgent)
    {
      userAgent = request.userAgent;
		}
	}
);

// Set the right user agent when a page is loaded:
chrome.webRequest.onBeforeSendHeaders.addListener
(
  function(details)
  {
    if (details.tabId === -1)
    {
      var headers = details.requestHeaders;

      if ( userAgent === "mobile")
      {
        for (var i = 0; i < headers.length; i++)
        {
          if (headers[i].name.toLowerCase() == 'user-agent')
          {
            headers[i].value = "Mozilla/5.0 (Linux; Android 5.0; LG-D855 Build/LRX21R.A1445306351) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/49.0.2623.110 Mobile Safari/537.36 OPR/36.2.2126.102826";
          }
        }
      }

      return {requestHeaders: headers};
    }
  },
  {
    urls: ["<all_urls>"]
  },
  ["blocking", "requestHeaders"]
);
