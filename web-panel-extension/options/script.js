const engines = document.getElementById('search-engine');
const themes = document.getElementById('theme');

function viewHelp()
{
	chrome.runtime.sendMessage({msg: 'loadURL', URL: 'local://welcome/index.html'});
}

function searchEngineSwitched()
{
	const newEngine = engines.options[engines.selectedIndex].value;
	chrome.storage.local.set({'searchEngine': newEngine});
	chrome.runtime.sendMessage({msg: 'updateSearchEngine', engine: newEngine});
}

function themeSwitched()
{
	const newTheme = themes.options[themes.selectedIndex].value;
	chrome.storage.local.set({theme: newTheme});
	chrome.runtime.sendMessage({msg: 'reloadTheme'});
}

function setTheme(data)
{
	const theme = typeof data.theme === 'undefined' ? 'light' : data.theme;
	document.querySelector('#theme').value = theme;
}

function setSearchEngine(data)
{
	const searchEngine = typeof data.searchEngine === 'undefined' ? 'google' : data.searchEngine;
	document.querySelector('#search-engine').value = searchEngine;
}

function clearAllHistory()
{
	chrome.storage.local.set({'historyArray': [], 'currentPos': -1, 'lastSite': ''});
	chrome.runtime.sendMessage({msg: 'clearLoadedHistory'});
}

document.getElementById('help-link').addEventListener('click', viewHelp);
document.getElementById('clearAllHistory').addEventListener('click', clearAllHistory);
engines.addEventListener('change', searchEngineSwitched);
themes.addEventListener ('change', themeSwitched);
chrome.storage.local.get('theme',        function(data) { setTheme(data)        });
chrome.storage.local.get('searchEngine', function(data) { setSearchEngine(data) });
