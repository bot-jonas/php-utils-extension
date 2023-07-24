class XDebugUtilsClient {
	constructor(tab_id) {
		this.tab_id = tab_id;

		this.errors = [];
		this.var_dumps = [];
		this.onchange_listeners = [];
		this.onclose_listeners = [];
		this._ping_interval = 20 * 1000;
	}

	connect() {
		this.port = chrome.runtime.connect({ name: `popup_${this.tab_id}` });
		this.port.onMessage.addListener(m => this.onMessage(m));

		setInterval(() => {
			this.port.postMessage({
				method: 'PING',
			});
		}, this._ping_interval);
	}

	onMessage(message) {
		if(message.method === 'SYNC_CLIENT') {
			this.errors = message.data.errors.map(e => {
				return {...e, element: this.create_element(e.html)}
			});
			
			this.var_dumps = message.data.var_dumps.map(e => {
				return {...e, element: this.create_element(e.html)}
			});

			this.onchange_listeners.forEach(f => f());
		} else if(message.method === 'CLOSE_CLIENT') {
			this.onclose_listeners.forEach(f => f());
		} else if(message.method === 'PONG') {
			console.log('PONG');
		}
	}

	create_element(html) {
		const temp = document.createElement('div');
		temp.innerHTML = html;

		return temp.firstChild;
	}
}