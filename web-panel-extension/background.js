chrome.webRequest.onHeadersReceived.addListener( function (details)
{
  for (var i = 0; i < details.responseHeaders.length; ++i)
  {
     if (details.responseHeaders[i].name.toLowerCase() == 'x-frame-options')
     {
        details.responseHeaders.splice(i, 1);
        return {
           responseHeaders: details.responseHeaders
        };
     }
  }
},
{
  urls: [ "<all_urls>" ]
},
["blocking", "responseHeaders"]);

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
            console.log(details.tabId);
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
