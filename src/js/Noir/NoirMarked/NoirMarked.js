const marked    = require( "marked" );

module.exports = class NoirMarked {

	constructor( config ) {
		this.config = config;
	}

	transformDisplayedMessage( string ) {
		return marked( string, this.config );
	}
};

