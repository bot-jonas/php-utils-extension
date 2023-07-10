window.onload = () => {
	chrome.storage.sync.get([
		'XDebugUtilsOptions',
	], (data) => {
		let options = {
			static: XDebugUtilsOptionsStatic,
		};

		if(data.XDebugUtilsOptions) {
			options = data.XDebugUtilsOptions;
		}

		if(Utils.isWhitelistedUrl(options.static.url_whitelist, document.URL)) {
			const xu_content_script = new XDebugUtilsContentScript(options);

			window.onbeforeunload = () => xu_content_script.drop();
			window.addEventListener('onclose', () => xu_content_script.drop());
		}
		
	});
}