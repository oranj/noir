const History = require( './History.js' );
const fs = require( 'fs' );

module.exports = class HistoryFactory {

	constructor( root, prefix = '' ) {
		this.root = root;
		this.prefix = prefix;
		this.histories = {};
	}

	make( name ) {
		var path = this.prefix + name;
		var fullpath = this.root + '/' + path;
		if ( ! this.histories.hasOwnProperty( name )) {
			this.histories[ name ] = new Promise(( resolve, reject ) => {
				fs.open( fullpath, 'a+', ( err, fd ) => {
					if ( err && err.code != 'ENOENT' ) {
						return reject( err.code );
					}
					fs.readFile( fullpath, 'utf8', ( err, contents ) => {
						var data = [];
						if ( ! err ) {
							try {
								data = JSON.parse( contents );
							} catch (ignore) {
								console.log( 'no contents' );
							}
						}
						resolve( new History( fullpath, data ));
					});
				});
			});
		}
		return this.histories[ name ];
	}
}
