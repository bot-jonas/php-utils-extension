// load options
function load_options() {
	// load manifest.json data
	const manifest      = chrome.runtime.getManifest();
	const pluginName    = manifest.name;
	const pluginVersion = manifest.version;
	
	document.getElementById("pluginTitle").innerHTML = pluginName + " " + pluginVersion;
	document.title = "Configurações - " + pluginName + " " + pluginVersion;
	
	chrome.storage.sync.get([
		'XDebugUtilsOptions'
	], data => {
		const options = {
			static: XDebugUtilsOptionsStatic,
		};
		
		if(data.XDebugUtilsOptions) {
			options.static = data.XDebugUtilsOptions.static;
		}

		document.getElementById("url_whitelist").value = options.static.url_whitelist;
		document.getElementById("remove_args_from_functions").checked = options.static.content_script.remove_args_from_functions;
	});	
}

// save options
function save_options() {
	// error checking
	let errors = '';

	const options = {
		static: XDebugUtilsOptionsStatic,
	};
	
	// URL whitelist
	const url_whitelist = document.getElementById("url_whitelist");
	const url_whitelistAsArray = url_whitelist.value.split("\n");
	
	if (url_whitelist.value) {
		for (let x = 0; x < url_whitelistAsArray.length; x++){
			const urlToCheck = url_whitelistAsArray[x];

			try {
				new URLPattern(urlToCheck); // TODO: Improve validation
			} catch(e) {
				errors = errors + "Invalid URL: " + urlToCheck + "<br>";
			}
		}
	}
	
	// display errors
	if (errors) {
		const displayErrors	 = document.getElementById("errors");
		displayErrors.innerHTML = errors;
		return;
	} else { // save data
		options.static.url_whitelist = url_whitelist.value;
		options.static.content_script.remove_args_from_functions = document.getElementById("remove_args_from_functions").checked;

		chrome.storage.sync.set({
			'XDebugUtilsOptions': options,
		});
		
		const displayErrors = document.getElementById("errors");
		displayErrors.innerHTML = '';
		errors = '';
	}
	
	// save notification
	const status = document.getElementById("status");
	status.innerHTML = "Options Saved!";
	setTimeout(function() {
		status.innerHTML = "";
	}, 1200);

}

// reset options to defaults
function reset_options() {
	const options = {
		static: XDebugUtilsOptionsStatic,
	};

	chrome.storage.sync.set({
		'XDebugUtilsOptions': options
	});
	
	document.getElementById("url_whitelist").value = options.static.url_whitelist;
	document.getElementById("remove_args_from_functions").checked = options.static.content_script.remove_args_from_functions;

	// reset notification
	const status = document.getElementById("status");
	status.innerHTML = "Options set to default!";
	setTimeout(function() {
		status.innerHTML = "";
	}, 1200);
	
}

document.addEventListener('DOMContentLoaded', load_options);
document.querySelector('#save').addEventListener('click', save_options);
document.querySelector('#reset').addEventListener('click', reset_options);