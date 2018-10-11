const { Dropbox } = require( "dropbox" );
const fs = require ( "fs" );

module.exports = class NoirDropbox {

	constructor({ accessToken, uploadFileSizeLimit }) {
		this.dropbox = new Dropbox({ accessToken });
		this.accessToken = accessToken;
		this.uploadFileSizeLimit = uploadFileSizeLimit;
	}

	handleFileDrop( chatArea, filePath ) {
		let name = filePath.replace(/^.*[\\\/]/, '');
		return new Promise(( resolve, reject ) => {
			fs.stat( filePath, ( err, stats ) => {
				if ( err ) {
					return reject( err );
				}
				if ( stats.size > this.uploadFileSizeLimit ) {
					return reject( `File is larger than maximum file size of ${file.size}` );
				}
				resolve( true );
			});
		}).then(() => {
			return new Promise(( resolve, reject ) => {
				fs.readFile( filePath, ( err, data ) => {
					if ( err ) {
						return reject( err );
					}
					resolve( data );
				});
			});
		}).then(( data ) => {
			return this.dropbox.filesUpload({ path: "/" + name, contents: data });
		}).then(( response ) => {
			return this.dropbox.sharingCreateSharedLink({ path: response.path_display, short_url: false });
		}).then(( response ) => {
			chatArea.appendText( response.url );
		});
	}

};
