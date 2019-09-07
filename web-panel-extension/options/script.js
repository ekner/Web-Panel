'use strict';

const enginesElem = document.getElementById('search-engine');
const themesElem = document.getElementById('theme');
const deleteEngineElem = document.getElementById('delete-engine');
const editEngineElem = document.getElementById('edit-engine');

const defaultSearchEngineList =
[
	['ecosia', 'Ecosia'],
	['startpage', 'Startpage.com'],
	['aol', 'Aol']
];

const standardDefaultSearchEngine = 'ecosia';

var customSearchEngines = {};
var currentSearchEngine = {name: standardDefaultSearchEngine, url: null};

document.getElementById('help-link').addEventListener('click', viewHelp);
document.getElementById('clearAllHistory').addEventListener('click', clearAllHistory);
deleteEngineElem.addEventListener('click', deleteCustomEngine);
editEngineElem.addEventListener('click', editCustomEngine);
enginesElem.addEventListener('change', searchEngineSwitched);
themesElem.addEventListener ('change', themeSwitched);
chrome.storage.local.get('theme',        function(data) { setTheme(data)        });
chrome.storage.local.get('customSearchEngines', function(data) { customSearchEnginesReceived(data) });

function customSearchEnginesReceived(data)
{
	if (typeof data.customSearchEngines !== 'undefined')
		customSearchEngines = data.customSearchEngines;
	generateSearchEngineListElement();
	chrome.storage.local.get('searchEngine', function(data) { setSearchEngine(data) });
}

function generateSearchEngineListElement()
{
	// Clear the select element with the search engines:
	enginesElem.innerHTML = '';

	for (var i = 0; i < defaultSearchEngineList.length; ++i)
	{
		const option = document.createElement('option');
		option.value = defaultSearchEngineList[i][0];
		option.text = defaultSearchEngineList[i][1];
		enginesElem.add(option);
	}

	addCustomSearchEnginesToList();
}

function addCustomSearchEnginesToList()
{
	for (var name in customSearchEngines)
	{
		if (!customSearchEngines.hasOwnProperty(name))
			continue;

		const option = document.createElement('option');
		option.value = option.text = name;
		enginesElem.add(option);
	}

	const option = document.createElement('option');
	option.value = 'custom';
	option.text = 'New...';
	enginesElem.add(option);

	enginesElem.value = currentSearchEngine.name;
	customEnginePanelDisplay();
}

function searchEngineSwitched()
{
	var newEngineName = enginesElem.options[enginesElem.selectedIndex].value;

	if (newEngineName !== 'custom')
	{
		const newEngine = {name: newEngineName, url: customSearchEngines[newEngineName]};
		chrome.runtime.sendMessage({msg: 'updateSearchEngine', engine: newEngine});
		chrome.storage.local.set({'searchEngine': newEngine});
		currentSearchEngine = newEngine;
	}
	else
	{
		newEngineName = prompt('Enter a name for the new search engine:');
		enginesElem.value = currentSearchEngine.name; // Reset the value from custom
		if (newEngineName === null || newEngineName === '')
			return;
		else if (newEngineName === 'custom' || newEngineName.search('"') !== -1)
			alert('The search engine name must not be set to "custom" or contain double quotes.');
		else if (typeof customSearchEngines[newEngineName] !== 'undefined')
			alert('A search engine with this name already exists.');
		else
			addNewEngine(newEngineName);
	}

	customEnginePanelDisplay();
}

function customEnginePanelDisplay()
{
	// Check if the user has selected a custom search engine:
	if (typeof customSearchEngines[currentSearchEngine.name] !== 'undefined')
	{
		deleteEngineElem.style.display = 'inline';
		editEngineElem.style.display = 'inline';
	}
	else
	{
		deleteEngineElem.style.display = 'none';
		editEngineElem.style.display = 'none';
	}
}

function addNewEngine(newEngineName)
{
	const newEngineUrl = prompt('Enter the url for the new search engine. Replace the keyword with "%s" (without quotes):');
	if (newEngineUrl === null || newEngineUrl === '')
		return;
	const newEngine = {name: newEngineName, url: newEngineUrl};
	customSearchEngines[newEngineName] = newEngineUrl;
	chrome.storage.local.set({'customSearchEngines': customSearchEngines, 'searchEngine': newEngine });
	chrome.runtime.sendMessage({msg: 'updateSearchEngine', engine: newEngine});
	currentSearchEngine = newEngine;
	generateSearchEngineListElement();
}

function deleteCustomEngine()
{
	if (typeof customSearchEngines[currentSearchEngine.name] !== 'undefined')
	{
		delete customSearchEngines[currentSearchEngine.name];
		const newEngine = {name: standardDefaultSearchEngine, url: null};
		chrome.storage.local.set({'customSearchEngines': customSearchEngines, 'searchEngine': newEngine });
		chrome.runtime.sendMessage({msg: 'updateSearchEngine', engine: newEngine});
		currentSearchEngine = newEngine;
		generateSearchEngineListElement();
	}
}

function editCustomEngine()
{
	if (typeof customSearchEngines[currentSearchEngine.name] !== 'undefined')
	{
		const newEngineName = prompt('Enter the new name for the search engine:', currentSearchEngine.name);

		if (newEngineName === null || newEngineName === '')
			return;
		else if (newEngineName === 'custom' || newEngineName.search('"') !== -1)
			alert('The search engine name must not be set to "custom" or contain double quotes.');
		else
		{
			const newEngineUrl = prompt('Enter the url for the search engine. Replace the keyword with "%s" (without quotes):', currentSearchEngine.url);
			if (newEngineUrl === null || newEngineUrl === '')
				return;

			delete customSearchEngines[currentSearchEngine.name];
			const newEngine = {name: newEngineName, url: newEngineUrl};
			customSearchEngines[newEngineName] = newEngineUrl;
			chrome.storage.local.set({'customSearchEngines': customSearchEngines, 'searchEngine': newEngine });
			chrome.runtime.sendMessage({msg: 'updateSearchEngine', engine: newEngine});
			currentSearchEngine = newEngine;
			generateSearchEngineListElement();
		}
	}
}

function viewHelp()
{
	chrome.runtime.sendMessage({msg: 'loadURL', URL: 'local://welcome/index.html'});
}

function themeSwitched()
{
	const newTheme = themesElem.options[themesElem.selectedIndex].value;
	chrome.storage.local.set({theme: newTheme});
	chrome.runtime.sendMessage({msg: 'reloadTheme'});
}

function setTheme(data)
{
	const theme = typeof data.theme === 'undefined' ? 'light' : data.theme;
	themesElem.value = theme;
}

function setSearchEngine(data)
{
	if (typeof data.searchEngine !== 'undefined')
		currentSearchEngine = data.searchEngine;
	enginesElem.value = currentSearchEngine.name;
	customEnginePanelDisplay();
}

function clearAllHistory()
{
	chrome.storage.local.set({'historyArray': [], 'currentPos': -1, 'lastSite': ''});
	chrome.runtime.sendMessage({msg: 'clearLoadedHistory'});
}