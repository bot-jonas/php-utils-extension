class Utils {
	// https://stackoverflow.com/a/74743115
	static merge(a, b) {
		return [a, b].reduce(
			(r, o) => 
				Object
				.entries(o)
				.reduce((q, [k, v]) => ({
					...q,
					[k]: v && (typeof v === 'object' && !Array.isArray(v)) ? Utils.merge(q[k] || {}, v) : v
				}), r),
			{}
		);
	}

	static objectFlip(obj) {
		return Object
			.entries(obj)
			.reduce((ret, entry) => {
				const [ key, value ] = entry;
				ret[ value ] = key;
				return ret;
			}, {}
		);
	}

	static chopUntil(str, char) {
		if(str.length === 0) return '';

		let r = '';
		let idx = 0;

		while(idx < str.length) if(str[idx] === char) return r; else r += str[idx++];

		return r;
	}

	static removePrefix(str, prefix) {
		if(str.length < prefix.length) return false;

		if(str.substr(0, prefix.length) == prefix) {
			return str.substr(prefix.length);
		}

		return false;
	}

	static fillObjectFromKeys(keys, value) {
		return keys.reduce((obj, key) => {obj[key] = true; return obj; }, {});
	}

	static setValue(obj, key, value) {
		if(Array.isArray(key)) {
			if(key.length > 0) {
				let i, aux = obj;
				
				for(i=0; i<key.length-1; i++) {
					aux = aux[key[i]];
				}

				aux[key[i]] = value;
			}
		} else {
			obj[key] = value;
		}
	}

	static isWhitelistedUrl(whitelist, url) {
		let _url = new URL(url);
		_url.search = _url.hash = '';
		_url = _url.toString();

		return whitelist
			.split("\n")
			.some(u => (new URLPattern(u)).test(_url));
	}

	static objectMap(obj, func) {
		const res = {};

		for(let key in obj) {
			res[key] = func(key, obj[key]);
		}

		return res;
	}

	static objectForEach(obj, func) {
		for(let key in obj) {
			func(key, obj[key]);
		}
	}
}