class Option {
	static Types = {
		Checkbox: 'Checkbox',
		Textarea: 'Textarea',
	};

	static CallbackOnchange = [
		Option.Types.Checkbox,
	];

	static CallbackOnkeyup = [
		Option.Types.Textarea,
	];

	constructor(type, description, onchange) {
		this.type = type;
		this.description = description;
		this.onchange = onchange;

		this.setup();
	}

	setup() {
		this.element = document.querySelector(this.description.selector);

		switch(this.type) {
			case Option.Types.Checkbox:
				this.element.checked = this.description.default;
			break;
			case Option.Types.Textarea:
				this.element.value = this.description.default;
			break;
		}

		if(Option.CallbackOnchange.indexOf(this.type) > -1) {
			this.element.onchange = this.onchange;
		} else if(Option.CallbackOnkeyup.indexOf(this.type) > -1) {
			this.element.onkeyup = this.onchange;
		}
	}

	set value(v) {
		switch(this.type) {
			case Option.Types.Checkbox:
				this.element.checked = v;
			break;
		case Option.Types.Textarea:
				this.element.value = v;
			break;
		}
	}

	get value() {
		switch(this.type) {
			case Option.Types.Checkbox:
				return this.element.checked;
			break;
			case Option.Types.Textarea:
				return this.element.value;
			break;
		}
	}

	static get(opt) {
		if(opt instanceof Option) {
			return opt.value;
		}

		return opt;
	}

	static set_options(options, values) {
		// Primitives: consts (numbers, strings, booleans, null, undefined, ...), arrays

		Utils.objectForEach(values, (k, v) => {
			if(typeof values[k] === 'object') {
				Option.set_options(options[k], values[k]);
			} else if(options[k] instanceof Option) {
				options[k].value = values[k];
			} else {
				options[k] = values[k];
			}
		});
	}

	static resolve(options) {
		return Utils.objectMap(options, (k, v) => {
			if(v instanceof Option) {
				return v.value;
			} else if(typeof v === 'object') {
				return Option.resolve(v);
			} else {
				return v;
			}
		});
	}
}

Utils.objectForEach(Option.Types, type => {
	Option[type] = (...args) => new Option(type, ...args);
});



const XDebugUtilsOptionsDynamic = options_onchange => {
	return {
		filter: {
			show_errors: Utils.objectMap(
				PHPError.Types, 
				key => Option.Checkbox(
					{
						selector: `#${key}-checkbox`,
						default: true,
					}, 
					options_onchange,
				),
			),
			show_var_dumps: Option.Checkbox({
				selector: '#show_var_dumps-checkbox',
				default: true,
			}, options_onchange),
			search: {
				query: Option.Textarea({
					selector: '#search',
					default: '',
				}, options_onchange),
				regex: Option.Checkbox({
					selector: '#search_regex-checkbox',
					default: true,
				}, options_onchange),
				include_errors: Option.Checkbox({
					selector: '#search_include_errors-checkbox',
					default: true,
				}, options_onchange),
				include_var_dumps: Option.Checkbox({
					selector: '#search_include_var_dumps-checkbox',
					default: true,
				}, options_onchange),
			},
		},
		profiler: {
			enabled: false,
			flag: 'on',
		},
	}
};

const XDebugUtilsOptionsStatic = {
	frame: {
		header: {
			backgroundColor: 'lime',
		},
		body: {
			backgroundColor: 'yellow',
			elements_top_margin: 10,
		},
	},
	content_script: {
		remove_args_from_functions: true,
	},
	url_whitelist: '*://*:*/*',
};