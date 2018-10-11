const fs = require( "fs" );

class NoirLogger {

	constructor( connectionName, folder ) {
		this.log = [];
		if ( !fs.existsSync( folder ) ) {
			fs.mkdirSync( folder, "0777" );
		}
		this.filePath = folder + "/" + connectionName.replace(/[^a-z0-9]/i, '') + ".log";
		if ( fs.existsSync( this.filePath ) ) {
			let string = fs.readFileSync( this.filePath ).toString();
			this.log = NoirLogger.unserializeLog( string );
		} else {
			fs.writeFileSync( this.filePath, "", { mode: "0777" } );
		}
	}

	addMessage( timestamp, channel, username, message ) {
		let entry = { timestamp: Math.floor( timestamp ), channel, username, message };
		this.log.push( entry );
		fs.appendFile( this.filePath, JSON.stringify( entry ) + "\n", ( err ) => {
			if ( err ) {
				console.error( err );
			}
		});
	}

	getMessages( channel ) {
		return this.log.filter(( entry ) => ( channel == entry.channel ));
	}
}

NoirLogger.unserializeLog = function( string ) {
	return string
		.split("\n")
		.filter( v => v )
		.reduce(( log, line ) => {
			try {
				log.push( JSON.parse( line ) );
			} catch ( err ) {
				console.warn( err );
			}
			return log;
		}, [] );
};

module.exports = NoirLogger;
