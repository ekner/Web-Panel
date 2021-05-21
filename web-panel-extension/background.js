'use strict';

var headersToBlock = ['x-frame-options', 'frame-options', 'content-security-policy', 'x-content-type-options', 'x-xss-protection', 'x-content-security-policy'];

// This removes x-frame restrictions on some sites (not all):
chrome.webRequest.onHeadersReceived.addListener
(
	function(data)
	{
		if (data.tabId !== -1)
			return;

		var headers = data.responseHeaders;
		for (var i = headers.length - 1; i >= 0; --i)
		{
			var header = headers[i].name.toLowerCase();
			if (headersToBlock.includes(header))
				headers.splice(i, 1);
		}
		return {responseHeaders: headers};
	},
	{
		urls: ['*://*/*']
	},
	['blocking', 'responseHeaders', 'extraHeaders']
);

// Get user agent change from panel.js:
var userAgent = '';
chrome.runtime.onMessage.addListener
(
	function (request, sender)
	{
		if (request.userAgent)
			userAgent = request.userAgent;
	}
);

// Set the right user agent when a page is loaded:
chrome.webRequest.onBeforeSendHeaders.addListener
(
	function(data)
	{
		if (data.tabId !== -1)
			return;

		var headers = data.requestHeaders;
		if (userAgent === 'mobile')
		{
			for (var i = 0; i < headers.length; i++)
			{
				if (headers[i].name.toLowerCase() === 'user-agent')
					headers[i].value = 'Mozilla/5.0 (Linux; Android 11; Pixel 5) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/89.0.4389.105 Mobile Safari/537.36 OPR/63.3.3216.58675';
			}
		}
		return {requestHeaders: headers};
	},
	{
		urls: ['*://*/*']
	},
	['blocking', 'requestHeaders']
);
