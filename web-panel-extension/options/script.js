const engines = document.getElementById('search-engine');

function viewHelp()
{
	chrome.runtime.sendMessage({msg: 'loadURL', URL: 'local://welcome/index.html'});
}

function searchEngineSwitched()
{
	const newEngine = engines.options[engines.selectedIndex].value;
	chrome.runtime.sendMessage({msg: 'changeSearchEngine', engine: newEngine});
}

document.getElementById('help-link').addEventListener('click', viewHelp);
engines.addEventListener('change', searchEngineSwitched);
