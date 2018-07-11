const fs = require( 'fs' );

module.exports = class History {

	constructor( path, data = [] ) {
		this.path = path;
		this.data = data;
	}

	getLastMessageFromSender( sender ) {
		for ( let i = this.data.length - 1; i >= 0; i-- ) {
			if ( this.data[ i ].sender === sender ) {
				return this.data[ i ].message;
			}
		}
		return undefined;
	}

	log( sender, message, timestamp ) {
		this.data.push({ sender, message, timestamp });
		return this;
	}

	save() {
		return new Promise(( resolve, reject ) => {
			fs.writeFile( this.path, JSON.stringify( this.data ), function( err ) {
				if ( err ) {
					reject( err );
				} else {
					resolve();
				}
			});
		});
	}
}
