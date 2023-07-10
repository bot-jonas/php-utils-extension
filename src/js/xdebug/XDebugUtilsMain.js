window.onload = () => {
	const url = new URL(window.location);
	let tab_id = url.searchParams.get('tab_id');

	if(tab_id === null) return;
	tab_id = parseInt(tab_id);

	chrome.storage.sync.get([
		'XDebugUtilsOptions',
	], data => {
		let XDebugUtilsOptions = {};
		
		if(data.XDebugUtilsOptions) {
			XDebugUtilsOptions = data.XDebugUtilsOptions;
		}

		// Communicates with content script
		const xu_client = new XDebugUtilsClient(tab_id);
		xu_client.connect();

		const xu_filter = new XDebugUtilsFilter();
		const xu_window = new XDebugUtilsWindow(XDebugUtilsOptions, tab_id, xu_client, xu_filter);

		console.log(xu_window);
	});
}