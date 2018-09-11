const linkifyHtml    = require( "linkifyjs/html" );

module.exports = class NoirLinkify {

	transformDisplayedMessage( string ) {
		return linkifyHtml( string );
	}
};

