let IP_DIV_ID = 0;

module.exports = class NoirOgImagePreview {

	constructor( config ) {
		this._imageStyle = config.style || {};
		this._wrapInAnchor = typeof config.wrapInAnchor == "undefined" ? true : config.wrapInAnchor;
	}

	getOgImageFromUrl( url ) {
		var that = this;
		var image = new Image();
		image.className = "noirOGIP_image";
		for ( var property in that._imageStyle ) {
			if ( ! that._imageStyle.hasOwnProperty( property ) ) {
				continue;
			}
			image.style[ property ] = that._imageStyle[ property ];
		}

		return new Promise( function( resolve, reject ) {
			var xhr = new XMLHttpRequest();
			xhr.open( "GET", url );
			xhr.onload = function() {
				var imageUrl = that.getOgImageSrcFromHtml( xhr.responseText );
				if ( !imageUrl ) {
					reject();
				}
				image.src = imageUrl;
				resolve( image );
			};
			xhr.onerror = function() {
				reject();
			};
			xhr.send();
		});
	}

	transformDisplayedMessage( string ) {
		var matches = string.match( /a[^>]+href=("[^"]+"|'[^']+')/ );
		if ( ! matches ) {
			return string;
		}
		var that = this;
		var url = matches[ 1 ].slice( 1, -1 );
		var targetId = "ogip-" + ( ++ IP_DIV_ID );

		this.getOgImageFromUrl( url ).then( function( attachableElement ) {
			var attachTo = document.getElementById( targetId );
			if ( ! attachTo ) {
				return;
			}
			if ( that._wrapInAnchor ) {
				var a = document.createElement( "a" );
				a.href = url;
				a.className = "noirOGIP_anchor";
				a.appendChild( attachableElement );
				attachableElement = a;
			}
			attachTo.appendChild( attachableElement );
		}, function() {
			var remove = document.getElementById( targetId );
			remove.parentNode.removeChild( remove );
		});

		return string + "<div class=\"noirOGIP\" id=\"" + targetId + "\"></div>";
	}

	getOgImageSrcFromHtml( html ) {
		var metaMatch = html.match( /<meta[^>]+og:image['"][^>]+>/ );
		if ( ! metaMatch ) {
			return undefined;
		}
		var propertyMatch = metaMatch[0].match( /content=['"](.*?)['"]/ );
		if ( ! propertyMatch ) {
			return undefined;
		}
		return propertyMatch[ 1 ];
	}
};

