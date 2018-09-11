const emojione       = require( "emojione" );
const EMOJILIST = Object.keys( emojione.emojioneList );

module.exports = class NoirOmojione {

	constructor() {}

	autoComplete({ word, autoCompleteTooltip }) {
		if ( word.charAt( 0 ) !== ":" ) {
			return;
		}
		if ( word.length < 2 ) {
			return;
		}

		return EMOJILIST
			.filter( em => {
				return em.slice( 0, word.length ) == word;
			})
			.forEach( em => {
				let unicode = emojione.shortnameToUnicode( em );
				autoCompleteTooltip.suggest( unicode, unicode + " " + em, em.length );
			});
	}

	transformSentMessage( string ) {
		return emojione.shortnameToUnicode( string );
	}
};

