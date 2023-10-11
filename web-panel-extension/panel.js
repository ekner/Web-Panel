'use strict';

var panel = new function()
{
	var loadingSlowTimeout;
	var expandOpen = false;
	var searchEngine = {name: 'ecosia', url: null};

	var setLoadingCover = function()
	{
		$('#loading').css('display', 'block');

		// First clear the timeout if there already is one:
		clearTimeout(loadingSlowTimeout);

		loadingSlowTimeout = setTimeout(function()
		{
			$('#loadingSlow').css('display', 'block');
		},
		8000);
	};

	var handleReceivedMessage = function(message, sender, response)
	{
		if (typeof message.msg === 'undefined')
			return;

		if (message.msg === 'isSideBar')
		{
			var panelIdentifier = chrome.runtime.getURL('/panel.html');
			var isSideBar = sender.tab.url === panelIdentifier;
			response({isSideBar});
		}
		else if (message.msg === 'newLink')
		{
			handleNewLink(message, sender);
		}
		else if (message.msg === 'loadURL')
		{
			$('#url').val(message.URL);
			panel.loadURL();
		}
		else if (message.msg === 'updateSearchEngine')
		{
			if (typeof message.engine !== 'undefined')
				searchEngine = message.engine;
		}
	};

	var handleNewLink = function(message, sender)
	{
		$('#url').val(message.link);
		$('#loading').css('display', 'none');
		clearTimeout(loadingSlowTimeout);
		$('#loadingSlow').css('display', 'none');

		backAndForward.handleHistoryInformation(message.link);
		chrome.storage.local.set({ 'lastSite': $('#url').val() });
	};

	var startup = function(lastSite)
	{
		var startupPage;

		if (typeof lastSite.lastSite === 'undefined' || lastSite.lastSite === '')
		{
			startupPage = 'local://welcome/index.html';
			chrome.storage.local.set({'lastSite': startupPage});	
		}
		else
		{
			startupPage = lastSite.lastSite;
		}

		$('#url').val(startupPage);
		panel.loadURL();
	};

	var searchInsteadClicked = function()
	{
		$('#url').val(getSearchEngineUrl( $('#url').val() ));
		$('#loadingSlow').css('display', 'none');
		panel.loadURL();
	};

	var keyOnUrlBarPressed = function(event)
	{
		if (event.which === 13)
		{
			event.preventDefault();
			panel.loadURL();
			return false;
		}
	};

	var expand = function()
	{
		if (!expandOpen)
		{
			chrome.storage.local.set({'expandOpen': 'true'});
			$('#expand-content').animate( { marginLeft: '0px' }, 200);
		}
		else
		{
			chrome.storage.local.set({'expandOpen': 'false'});
			$('#expand-content').animate( { marginLeft: '-71px' }, 200 );
		}
		expandOpen = !expandOpen;
	};

	var handleReceivedExpandState = function(object)
	{
		if (object.expandOpen === 'true')
			expand();
	};

	var handleReceivedSearchEngine = function(object)
	{
		if (typeof object.searchEngine === 'undefined')
		{
			chrome.storage.local.set({'searchEngine': searchEngine});
			return;
		}
			
		const se = object.searchEngine;

		// Check if the stored engine is an old (removed) default one. If so, replace it:
		if (['google', 'bing', 'yahoo', 'duckDuckGo'].indexOf(se.name) !== -1 && se.url === null)
			chrome.storage.local.set({'searchEngine': searchEngine});
		else
			searchEngine = object.searchEngine;
	};

	var getSearchEngineUrl = function(keyword)
	{
		if (searchEngine.name === 'ecosia')
			return 'https://www.ecosia.org/search?q=' + keyword;
		else if (searchEngine.name === 'startpage')
			return 'https://www.startpage.com/do/search?q=' + keyword;
		else if (searchEngine.name === 'aol')
			return 'https://search.aol.com/aol/search?q=' + keyword;
		else
			return searchEngine.url.replace(/%s/, keyword);
	};

	var checkCorrectPermissions = function(callback)
	{
		chrome.permissions.contains
		(
			{ origins: ['<all_urls>'] },
			function(result)
			{
				if (result)
				{
					$('#incorrectPermissions').css('display', 'none');
					callback();
				}
				else
				{
					$('#incorrectPermissions').css('display', 'block');
				}
			}
		);
	};

	var checkHashAndSet = function(url, setLoadCover)
	{
		checkCorrectPermissions(function()
		{
			// If the url contains a hash-tag, we must navigate to another page between.
			// See bug #4 on github issues.
			if (url.indexOf('#') !== -1)
			{
				$('#iframe').attr('src', '');
				// We also wait a bit:
				setTimeout(function()
				{
					$('#iframe').attr('src', url);
				}
				, 100);
			}
			else
			{
				$('#iframe').attr('src', url);
			}

			$('#iframe').focus();

			if (setLoadCover)
				setLoadingCover();
		});
	};

	var bindUIActions = function()
	{
		$('#searchInstead').click(function() { searchInsteadClicked(); });
		$('#reload').click(function() { panel.loadURL(); });
		$('#url').keypress(function(event) { keyOnUrlBarPressed(event); });
		$('#expand').click(function() { expand(); });
	};

	var init = function()
	{
		bindUIActions();
		chrome.runtime.onMessage.addListener(function(message, sender, response) { handleReceivedMessage(message, sender, response); });
		chrome.storage.local.get('lastSite', function(object) { startup(object); });
		chrome.storage.local.get('expandOpen', function(object) { handleReceivedExpandState(object); });
		chrome.storage.local.get('searchEngine', function(object) { handleReceivedSearchEngine(object); });
		$('#expand-content').css('marginLeft', '-71px'); // This can't be set in the css-file for some reason.
	};

	this.loadURL = function()
	{
		var search = $('#url').val().match(/^[a-zA-Z]+:\/\//i);

		if (search == null)
		{
			checkHashAndSet('http://' + $('#url').val(), true);
		}
		else
		{
			search = $('#url').val().match(/^local:\/\//i);

			if (search == null)
			{
				checkHashAndSet($('#url').val(), true);
			}
			else
			{
				checkHashAndSet( chrome.extension.getURL( $('#url').val().substring(8) ), false );

				// If another web page is loading right now, the covers must be removed:
				$('#loading').css('display', 'none');
				clearTimeout(loadingSlowTimeout);
				$('#loadingSlow').css('display', 'none');
			}
		}
	};

	init();
};

var bottomBar = new function(data)
{
	this.zoomValue = 100;
	var port = false;

	var setTheme = function(data)
	{
		if (typeof data.theme === 'undefined')
		{
			changeToDefaultTheme();
			return;
		}

		if (data.theme === 'light')
			$('#theme-link').attr('href', '');
		else if (data.theme === 'dark')
			$('#theme-link').attr('href', 'style/dark-theme.css');
		else if (data.theme === 'gx')
			$('#theme-link').attr('href', 'style/gx.css');
		else
			changeToDefaultTheme();
	};

	var changeToDefaultTheme = function()
	{
		chrome.storage.local.set({theme: 'light'});
		$('#theme-link').attr('href', '');
	};

	var reloadTheme = function(message, sender, response)
	{
		if (typeof message.msg !== 'undefined' && message.msg === 'reloadTheme')
			chrome.storage.local.get('theme', function(data) { setTheme(data) });
	};

	var handleConnection = function(_port)
	{
		if (_port.name === 'zoom')
		{
			port = _port;
			port.postMessage({zoomValue: bottomBar.zoomValue});
		}	
	};

	var openUrlInTab = function()
	{
		chrome.tabs.create({url: $('#url').val()});
	};

	var openTabInSidebar = function()
	{
		chrome.tabs.query({active: true}, function(tabs)
		{
			if (tabs.length < 1)
				return;

			$('#url').val(tabs[0].url);
			panel.loadURL();
		});
	};

	var zoomChanged = function()
	{
		bottomBar.zoomValue = $(this).val();
		const zoomVal = bottomBar.zoomValue + '%';
		$('#bottom-bar #zoom-hover p').text(zoomVal);

		if (port !== false)
			port.postMessage({zoomValue: bottomBar.zoomValue});
	};

	var zoomHover = function()
	{
		$('#bottom-bar #zoom-hover').css('display', 'block');
	};

	var zoomUnHover = function()
	{
		$('#bottom-bar #zoom-hover').css('display', 'none');
	};

	var zoomHoverMove = function(e)
	{
		const boxHeight = $('#bottom-bar #zoom-hover').height() + 10;
		$('#bottom-bar #zoom-hover').css('left', e.clientX + 3);
		$('#bottom-bar #zoom-hover').css('top', e.clientY - boxHeight - 3);
	};

	var bindUIActions = function()
	{
		$('#bottom-bar #options').click(function() { chrome.runtime.openOptionsPage(); });
		$('#bottom-bar #open-in-tab').click(openUrlInTab);
		$('#bottom-bar #open-tab-in-sidebar').click(openTabInSidebar);
		$('#bottom-bar #zoom').on('input', zoomChanged);
		$('#bottom-bar #zoom').mouseenter(zoomHover);
		$('#bottom-bar #zoom').mouseleave(zoomUnHover);
		$('#bottom-bar #zoom').mousemove(zoomHoverMove);
	};

	var init = function()
	{
		bindUIActions();
		chrome.storage.local.get('theme', function(data) { setTheme(data) });
		chrome.runtime.onConnect.addListener(handleConnection);
		chrome.runtime.onMessage.addListener(function(message, sender, response) { reloadTheme(message, sender, response); });
	};

	init();
};

var backAndForward = new function()
{
	var historyArray = [];
	var currentPos = -1; // Current position in history

	var getStoredHistoryInformation = function(object)
	{
		if (typeof object.historyArray !== 'undefined' && typeof object.currentPos !== 'undefined')
		{
			historyArray = object.historyArray;
			currentPos = object.currentPos;
		}
	};

	var backClicked = function()
	{
		if (currentPos > 0)
		{
			currentPos --;
			$('#url').val( historyArray[currentPos] );
			panel.loadURL();
			chrome.storage.local.set({'historyArray': historyArray, 'currentPos': currentPos});
		}
	};

	var forwardClicked = function()
	{
		if (currentPos + 1 != historyArray.length)
		{
			currentPos ++;
			$('#url').val( historyArray[currentPos] );
			panel.loadURL();
			chrome.storage.local.set({'historyArray': historyArray, 'currentPos': currentPos});
		}
	};

	var handleReceivedMessage = function(message, sender, response)
	{
		if (message.msg === "clearLoadedHistory")
			clearLoadedHistory();
	};

	var clearLoadedHistory = function()
	{
		historyArray = [];
		currentPos = -1;
	};

	var bindUIActions = function()
	{
		$('#back').click(function() { backClicked(); });
		$('#forward').click(function() { forwardClicked(); });
	};

	var init = function()
	{
		bindUIActions();
		chrome.storage.local.get(['historyArray', 'currentPos'], function(object) { getStoredHistoryInformation(object); });
		chrome.runtime.onMessage.addListener(function(message, sender, response) { handleReceivedMessage(message, sender, response); });
	};

	this.handleHistoryInformation = function (link)
	{
		// Check if the page was just reloaded:
		if (historyArray[historyArray.length - 1] != link)
		{
			// Check if the page was navigated to via history buttons. Then it shouldn't be added to history again:
			if (historyArray[currentPos] != link)
			{
				historyArray.length = currentPos + 1;
				historyArray.push(link);

				// Max length 50:
				if (historyArray.length > 50)
					historyArray.shift();
				else
					currentPos++;

				chrome.storage.local.set({'historyArray': historyArray, 'currentPos': currentPos});
			}
		}
	};

	init();
};

var autoReload = new function()
{
	var displayAutoReload = true;
	var autoReload = false;

	var openAutoReload = function(event)
	{
		displayAutoReload = false;

		$('#auto-reload').css('left', event.pageX);
		$('#auto-reload').css('top', event.pageY);

		$('#auto-reload').css('display', 'block');
	};

	var closeAutoReload = function()
	{
		displayAutoReload = true;
		$('#auto-reload').css('display', 'none');
	};

	var closeAutoReloadClicked = function()
	{
		if (!displayAutoReload)
			closeAutoReload();
	};

	var leftClickOnRelad = function(event)
	{
		event.preventDefault();

		if (displayAutoReload)
			openAutoReload(event);
		else
			closeAutoReload();
	};

	var setReload = function(time, item)
	{
		removeReload();

		autoReload = setInterval(function()
		{
			panel.loadURL();
		},
		time * 1000);

		$(item).addClass('auto-reload-item-active');
		$('#reload').addClass('status-auto');
		$('#auto-reload .clear').css('display', 'block');
	};

	var removeReload = function()
	{
		$('#auto-reload li').removeClass('auto-reload-item-active');
		$('#reload').removeClass('status-auto');
		$('#auto-reload .clear').css('display', 'none');

		if (autoReload !== false)
			clearInterval(autoReload);

		closeAutoReload();
	};

	var reloadItemClicked = function(item)
	{
		var time = Number( $(item).attr('data-time') );

		// Security, if the user has modified the HTML:
		if (isNaN(time))
			return;

		if (time != 0)
		{
			setReload(time, item);
		}
		else
		{
			var lastCustomTime = '';
			chrome.storage.local.get('lastCustomTime', function(object)
			{
				if ( typeof object.lastCustomTime !== 'undefined')
					lastCustomTime = object.lastCustomTime;

				time = '';
				var wrong = '';

				while (time !== null && time.match(/^\d+:\d+:\d+$/) === null || time == '0:0:0')
				{
					time = prompt(wrong + 'Please enter the interval in this format: Hours:Minutes:Seconds', lastCustomTime);
					wrong = 'Wrong format specified.\n\n';
				}
				// If the user has pressed cancel on the prompt:
				if (time == null)
					return;

				chrome.storage.local.set({'lastCustomTime': time});
				var values = time.split(':');
				time = Number(values[0]) * 3600 + Number(values[1]) * 60 + Number(values[2]);
				setReload(time, item);
			});
		}
	};

	var bindUIActions = function()
	{
		$('#reload').bind('contextmenu', function(event) { leftClickOnRelad(event); });
		$('#auto-reload .clear').click(function() { removeReload(); });
		$('#auto-reload li').click(function() { reloadItemClicked(this); });
		$('#reload').click(function() { closeAutoReloadClicked(); }); // The user should be able to close with left click
		$('#auto-reload .close').click(function() { closeAutoReloadClicked(); }); // And by pressing 'close'
	};

	var init = function()
	{
		bindUIActions();
	};

	init();
};

var bookmarks = new function()
{
	var wpb; //web panel bookmarks folder id
	var popupClosed = true;

	var createBookmark = function()
	{
		if ($('#url').val() != '')
		{
			var title = prompt( 'Bookmark title:', $('#url').val() );
			if (title == '')
			{
				alert('Please type a title for the bookmark. Press cancel on the next pop-up to escape.');
				createBookmark();
			}
			else if (title != null)
			{
				chrome.bookmarks.create({'parentId': wpb, 'url': $('#url').val(), 'title': title}, function(result)
				{
					if (result === undefined)
						alert('Bookmark not created: ' + chrome.runtime.lastError.message);
				});
				loadBookmarks();
			}
		}
		else
		{
			alert('You haven\'t entered a url.');
		}
	};

	var bookmarksSearched = function(list)
	{
		if (typeof list[0] === 'undefined')
		{
			chrome.bookmarks.create({'title': 'Web Panel extension'}, function(folder)
			{
				wpb = folder.id;
				loadBookmarks();
			});
		}
		else
		{
			chrome.bookmarks.get(list[0].parentId, function(parent)
			{
				if (parent[0].title == 'Trash')
				{
					chrome.bookmarks.create({'title': 'Web Panel extension'}, function(folder)
					{
						wpb = folder.id;
						loadBookmarks();
					});
				}
				else
				{
					wpb = list[0].id;
					loadBookmarks();
				}
			});
		}
	};

	var loadBookmarks = function()
	{
		chrome.bookmarks.getChildren(wpb, function(result)
		{
			var content = '';
			if (result.length == 0)
			{
				content = '<h3 style="margin-left: 10px;">You have no bookmarks</h3>';
			}
			else
			{
				result.forEach(function(entry)
				{
					if (typeof entry.url === 'undefined')
						return; // If it's a folder, skip it

					var re = /(<([^>]+)>)/ig;
					entry.title = entry.title.replace(re, '');
					entry.url = entry.url.replace(re, '');

					content += '<div data-id="' + entry.id + '" title="' + entry.url + '" class="box">' +
							   '<img class="favicon-img" src="http://www.google.com/s2/favicons?domain=' + entry.url + '"></img>' +
							   '<div class="text-box"><p class="link">' + entry.title + '</p></div>' +
							   '</div>';
				});
			}
			$('#bookmarks-popup').html(content);

			$('.box').on('contextmenu', function(e)
			{
				e.preventDefault();
				chrome.bookmarks.remove( $(this).attr('data-id'), function()
				{
					loadBookmarks();
				});
			});
			$('.box').click(function()
			{
				$('#url').val( $(this).attr('title') );
				panel.loadURL();
				fadeOut();
			});
		});
	};

	var bookmarksClicked = function()
	{
		if (popupClosed)
			fadeIn();
		else
			fadeOut();
	};

	var fadeIn = function()
	{
		$('#bookmarks-popup').fadeIn(100);
		popupClosed = false;
	};

	var fadeOut = function()
	{
		$('#bookmarks-popup').fadeOut(100);
		popupClosed = true;
	};

	var bindUIActions = function()
	{
		$('#add-bookmark').click(function() { createBookmark(); });
		$('#bookmarks').click(function() { bookmarksClicked(); });
	};

	var init = function()
	{
		bindUIActions();

		chrome.bookmarks.search('Web Panel extension', function(list) { bookmarksSearched(list); });
	};

	init();
};

var userAgent = new function()
{
	var currentMode;

	var updateUserAgent = function(agent)
	{
		if (typeof agent !== 'undefined')
		{
			chrome.storage.local.set({ 'userAgent': agent });
			chrome.runtime.sendMessage({ userAgent: agent });
			currentMode = agent;
		}

		if (currentMode === 'mobile')
			$('#expand').addClass('mobile');
		else
			$('#expand').removeClass('mobile');
	};

	var handleReceivedUserAgent = function(object)
	{
		if ( typeof object.userAgent === 'undefined')
			updateUserAgent('desktop');
		else
			updateUserAgent(object.userAgent);
	};

	var expandLeftClicked = function(event)
	{
		event.preventDefault();

		if (currentMode === 'mobile')
			updateUserAgent('desktop');
		else
			updateUserAgent('mobile');
	};

	var bindUIActions = function()
	{
		$('#expand').bind('contextmenu', function (event) { expandLeftClicked(event); });
	};

	var init = function()
	{
		bindUIActions();
		chrome.storage.local.get('userAgent', function(object) { handleReceivedUserAgent(object); });
	};

	init();
};
