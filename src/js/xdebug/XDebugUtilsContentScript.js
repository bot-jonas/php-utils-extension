class XDebugUtilsContentScript {
	static ELEMENT_ID_ATTR_NAME = 'element_id';

	constructor(options) {
		this.options = options;

		this._serial_id = 1;
		this._ping_interval = 20 * 1000;

		this._setup();
	}

	_generate_serial_id() {
		return (this._serial_id++).toString();
	}

	_setup() {
		this.frame_id = this._get_frame_id();
		console.log(`[${this.frame_id}] ${window.location.href}`);

		this._process_elements(
			{
				added: {
					errors: [...document.querySelectorAll('.xdebug-error')],
					var_dumps: [...document.querySelectorAll('.xdebug-var-dump')],
				},
				removed: {
					errors: [],
					var_dumps: [],
				},
			},
		);

		this._create_process_elements_observer(document);

		this.style_element = document.createElement('style');
		document.head.appendChild(this.style_element);

		this.port = chrome.runtime.connect({
			name: 'content_script',
		});

		this.port.onMessage.addListener(m => this.onMessage(m));

		setInterval(() => {
			chrome.runtime.sendMessage({
				method: 'PING',
			});
		}, this._ping_interval);
	}

	onMessage(message) {
		if(message.method === 'HIDE_ELEMENTS') {
			this.style_element.innerHTML = '.xdebug-hideable { display: none; }';
		} else if(message.method === 'SHOW_ELEMENTS') {
			this.style_element.innerHTML = '.xdebug-hideable { display: block; }';
		}
	}

	_get_frame_id() {
		const ids = [0];

		let w = window;

		while(w != w.parent) {
			let id = 0;

			for(; id < w.parent.length; id++) {
				if(w == w.parent[id]) break;
			}

			ids.push(id);

			w = w.parent;
		}

		return ids.reverse().join('-');
	}

	_process_elements(elements) {
		const added_errors = [];
		const added_var_dumps = [];

		for(let error_ of elements.added.errors) {
			const error = error_.cloneNode(true);
			const element_id = this._generate_serial_id();

			error.setAttribute(XDebugUtilsContentScript.ELEMENT_ID_ATTR_NAME, element_id);

			if(this.options.static.content_script.remove_args_from_functions) {
				for(let td of error.querySelectorAll('td')) {
					const idx = td.innerText.indexOf('(');

					if(idx > -1) td.innerText = td.innerText.substr(0, idx) + '()';
				}
			}

			added_errors.push({
				element_id,
				info: this._parse_error(error),
				html: error.outerHTML,
			});

			const font_ = error_.parentNode;

			// <font>
			font_.classList.add('xdebug-hideable');

			// <br>
			if(font_.previousElementSibling && font_.previousElementSibling.tagName == 'BR') {
				font_.previousElementSibling.classList.add('xdebug-hideable');
			}
		}

		for(let var_dump of elements.added.var_dumps) {
			const element_id = this._generate_serial_id();
			var_dump.setAttribute(XDebugUtilsContentScript.ELEMENT_ID_ATTR_NAME, element_id);

			added_var_dumps.push({
				element_id,
				info: this._parse_var_dump(var_dump),
				html: var_dump.outerHTML,
			});

			// <pre>
			var_dump.classList.add('xdebug-hideable')
		}

		const num_changes = added_errors.length + added_var_dumps.length + elements.removed.errors.length + elements.removed.var_dumps.length;
		if(num_changes == 0) return;

		chrome.runtime.sendMessage({
			method: 'SYNC_SERVER', 
			data: {
				added: {
					errors: added_errors,
					var_dumps: added_var_dumps,
				},
				removed: elements.removed,
				frame_id: this.frame_id,
			},
		});
	}

	_parse_error(el) {
		const info = {};

		for(let tr of el.querySelectorAll('tr')) {
			if(tr.firstChild.tagName == 'TH') {
				const stringWithoutPrefix = Utils.removePrefix(tr.innerText, '( ! ) ');

				if(stringWithoutPrefix) {
					const str = Utils.chopUntil(stringWithoutPrefix, ':');

					try {
						info.error_type_key = PHPError.retrieveErrorTypeKeyFromString(str);
					} catch(e) {
						// Ignore FatalError especification
						// Ex.: Error, TypeError, ...
						continue;
					}
				} else {
					// TODO: Parse more data
				}
			}
		}

		return info;
	}

	_parse_var_dump(el) {
		const info = {};

		return info;
	}

	_create_process_elements_observer(el) {
		const observer = new MutationObserver(m => this._process_elements_observer_callback(m));

		observer.observe(el, {childList: true, subtree: true});

		return observer;
	}

	_process_elements_observer_callback(mutationList) {
		const added_errors = [];
		const added_var_dumps = [];
		const removed_errors = [];
		const removed_var_dumps = [];

		// TODO: Check if node 'moves' are considered in the mutationList, if they are, then, there are duplicates
		for(let mutation of mutationList) {
			for(let child of mutation.addedNodes) {
				// Check element
				if(child.classList) {
					if(child.classList.contains('xdebug-error')) {
						added_errors.push(child);
					}

					if(child.classList.contains('xdebug-var-dump')) {
						added_var_dumps.push(child);
					}
				}

				// Check element nodes
				if(child.querySelectorAll) {
					added_errors.push(...child.querySelectorAll('.xdebug-error'));
					added_var_dumps.push(...child.querySelectorAll('.xdebug-var-dump'));
				}
			}

			for(let child of mutation.removedNodes) {
				// Check element
				if(child.classList) {
					if(child.classList.contains('xdebug-error')) {
						removed_errors.push(child.getAttribute(XDebugUtilsContentScript.ELEMENT_ID_ATTR_NAME));
					}

					if(child.classList.contains('xdebug-var-dump')) {
						removed_var_dumps.push(child.getAttribute(XDebugUtilsContentScript.ELEMENT_ID_ATTR_NAME));
					}
				}

				// Check element nodes
				if(child.querySelectorAll) {
					const removed_errors_el_ids = [...child.querySelectorAll('.xdebug-error')].map(el => el.getAttribute(XDebugUtilsContentScript.ELEMENT_ID_ATTR_NAME));
					const removed_var_dumps_el_ids = [...child.querySelectorAll('.xdebug-var-dump')].map(el => el.getAttribute(XDebugUtilsContentScript.ELEMENT_ID_ATTR_NAME));

					removed_errors.push(...removed_errors_el_ids);
					removed_var_dumps.push(...removed_var_dumps_el_ids);
				}
			}
		}

		this._process_elements({
			added: {
				errors: added_errors, 
				var_dumps: added_var_dumps,
			},
			removed: {
				errors: removed_errors, 
				var_dumps: removed_var_dumps,
			},
		});
	}

	drop() {
		chrome.runtime.sendMessage({
			method: 'REMOVE_TAB',
			data: {
				frame_id: this.frame_id,
			}
		});
	}
}