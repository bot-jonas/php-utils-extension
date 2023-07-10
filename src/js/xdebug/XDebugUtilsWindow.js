class XDebugUtilsWindow {
	constructor(options, tab_id, client, filter) {
		const options_onchange = () => {
			this._render();
			this._save_options();
		};

		this.options = {
			dynamic: XDebugUtilsOptionsDynamic(options_onchange),
			static: XDebugUtilsOptionsStatic,
		};

		Option.set_options(this.options, options);

		this.tab_id = tab_id;

		this.client = client;
		this.client.onchange_listeners.push(() => this._render());
		this.client.onclose_listeners.push(() => window.close());

		this.filter = filter;

		this._setup_html();
	}

	_setup_html() {
		this.header_element = document.getElementById("header");
		this.main_element = document.getElementById("main");

		const header_height = this.header_element.clientHeight;
		this.header_element.style.position = 'fixed';
		this.header_element.style.top = 0;
		this.main_element.style.marginTop = header_height + 'px';

		const show_all_button = document.getElementById('show_all-button');
		const clear_all_button = document.getElementById('clear_all-button');

		show_all_button.onclick = () => {
			Utils.objectMap(this.options.dynamic.filter.show_errors, (k, v) => v.value = true);
			this._render();
		}

		clear_all_button.onclick = () => {
			Utils.objectMap(this.options.dynamic.filter.show_errors, (k, v) => v.value = false);
			this._render();
		}

		// Style
		this.style_element = document.createElement('style');
		document.head.appendChild(this.style_element);

		this.style_element.innerHTML = `
			#header {
				background-color: ${this.options.static.frame.header.backgroundColor};
			}

			body {
				background-color: ${this.options.static.frame.body.backgroundColor};
			}

			.xdebug-utils-element {
				margin-top: ${this.options.static.frame.body.elements_top_margin}px;
			}
		`;
	}

	_save_options() {
		const options = Option.resolve(this.options);

		// Add stored static to avoid conflicts
		chrome.storage.sync.get(['XDebugUtilsOptions'], data => {
			if(data.XDebugUtilsOptions) { 
				options.static = data.XDebugUtilsOptions.static;
			}

			chrome.storage.sync.set({ XDebugUtilsOptions: options });
		});
	}

	_render() {
		this.main_element.innerHTML = '';
		
		const filtered = this.filter.filter(this.options, {
			tab_id: this.tab_id,
			errors: this.client.errors,
			var_dumps: this.client.var_dumps,
		});

		for(let f of [...filtered.errors, ...filtered.var_dumps]) {
			f.element.classList.add('xdebug-utils-element');
			this.main_element.appendChild(f.element);
		}
	}

	reset_options() {
		chrome.storage.sync.clear();
	}
}