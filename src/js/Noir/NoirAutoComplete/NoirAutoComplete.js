module.exports = class NoirAutoComplete {

	constructor({ completions, waitForChars }) {
		this._waitForChars = waitForChars;
		this._completions = completions;
	}

	autoComplete({ word, autoCompleteTooltip }) {
		if ( word.length < this._waitForChars ) {
			return;
		}
		return Object.keys( this._completions )
			.filter( key => {
				return key.slice( 0, word.length ) == word;
			})
			.forEach( key => {
				autoCompleteTooltip.suggest( this._completions[ key ], key, key.length );
			});
	}
};

