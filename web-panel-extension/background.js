'use strict';

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
			if (header == 'x-frame-options' || header == 'frame-options' || header == 'content-security-policy' || header == 'x-content-type-options' || header == 'x-xss-protection' || header == 'x-content-security-policy')
				headers.splice(i, 1);
		}
		return {responseHeaders: headers};
	},
	{
		urls: ['*://*/*']
	},
	['blocking', 'responseHeaders']
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
					headers[i].value = 'Mozilla/5.0 (Linux; Android 7.0; EVA-L09 Build/HUAWEIEVA-L09) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/59.0.3071.125 Mobile Safari/537.36 OPR/43.0.2246.121183';
			}
		}
		return {requestHeaders: headers};
	},
	{
		urls: ['*://*/*']
	},
	['blocking', 'requestHeaders']
);
