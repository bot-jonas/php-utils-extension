class XDebugUtilsFilter {

	filter(options, data) {
		this.options = {
			search: {
				regex: Option.get(options.dynamic.filter.search.regex),
				include_errors: Option.get(options.dynamic.filter.search.include_errors),
				include_var_dumps: Option.get(options.dynamic.filter.search.include_var_dumps),
				query: Option.get(options.dynamic.filter.search.query),
			},
			show_errors: Utils.objectMap(options.dynamic.filter.show_errors, (k, v) => Option.get(v)),
			show_var_dumps: Option.get(options.dynamic.filter.show_var_dumps),
		};

		this.tab_id = data.tab_id;

		const errors = this._filter_errors(data.errors);
		const var_dumps = this._filter_var_dumps(data.var_dumps);

		return {errors, var_dumps};
	}

	_search_filter(query, text) {
		if(this.options.search.regex) {
			try {
				const reg = new RegExp(query, 'gi');
				return text.match(query);
			} catch(e) {
				return false;
			}
		} else {
			return text.indexOf(query) != -1;
		}
	}

	_filter_errors(errors) {
		return errors.filter(e => {
			if(e.tab_id != this.tab_id) return false;
			if(!this.options.show_errors[e.info.error_type_key]) return false;

			if(
				this.options.search.include_errors 
				&& this.options.search.query
				&& !this._search_filter(this.options.search.query, e.element.innerText)
			) {
				return false;
			}

			return true;
		});
	}

	_filter_var_dumps(var_dumps) {
		return var_dumps.filter(v => {
			if(v.tab_id != this.tab_id) return false;
			if(!this.options.show_var_dumps) return false;

			if(
				this.options.search.include_var_dumps 
				&& this.options.search.query
				&& !this._search_filter(this.options.search.query, v.element.innerText)
			) {
				return false;
			}

			return true;
		});
	}
}