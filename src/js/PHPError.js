class PHPError {
	static Types = {
		ParseError: 'Parse error',
		FatalError: 'Fatal error',
		Warning: 'Warning',
		Notice: 'Notice',
		Deprecated: 'Deprecated',
	};

	static FlippedTypes = Utils.objectFlip(PHPError.Types);

	static retrieveErrorTypeKeyFromString(str) {
		if(PHPError.FlippedTypes[str] != undefined) {
			return PHPError.FlippedTypes[str];
		} else {
			throw new Error(`Unexpected error string: ${str}`)
		}
	}
}