let YT_IFRAME_ID = 0;

module.exports = class NoirYouTubeIframe {

	constructor( style ) {
		this._style = style;
		this._libraryLoadPromise = null;
	}

	_lazyLoadLibrary() {
		if ( !this._libraryLoadPromise ) {
			this._libraryLoadPromise = new Promise( ( resolve ) => {
				let tag = document.createElement( "script" );
				tag.src = "https://www.youtube.com/iframe_api";
				document.body.appendChild( tag );

				window.onYouTubeIframeAPIReady = function() {
					resolve( window.YT );
				};
			});
		}
		return this._libraryLoadPromise;
	}

	getIdFromUrl( url ) {
		if ( ! url.match( /^https?:\/\/(.*\.)?(youtu\.be|youtube\.com|ytimg.com)/ ) ) {
			return false;
		}
		url = url.replace( /(>|<)/gi,"" ).split( /(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/ );
		if ( url[2] === undefined ) {
			return false;
		}
		return url[2].split( /[^0-9a-z_-]/i )[ 0 ];
	}

	transformDisplayedMessage( string ) {
		let matches = string.match( /a[^>]+href=("[^"]+"|'[^']+')/ );
		if ( ! matches ) {
			return string;
		}
		let id = this.getIdFromUrl( matches[ 1 ].slice( 1, -1 ) );
		if ( ! id ) {
			return string;
		}
		let targetId = "nyti-" + ( ++ YT_IFRAME_ID );
		this._lazyLoadLibrary().then( ({ Player }) => {
			let config = Object.create( this._style );
			config.videoId = id;
			new Player( targetId, config );
		});

		return string + "<div id=\"" + targetId + "\"></div>";
	}
};

