module.exports = class NoirOgImagePreview {
	constructor( imageStyle, wrapInAnchor ) {
		this._imageIdCounter = 0;
		this._imageStyle = imageStyle;
		this._wrapInAnchor = wrapInAnchor;
	}

	getOgImageFromUrl( url ) {
		var that = this;
		return new Promise(function( resolve, reject ) {
			var xhr = new XMLHttpRequest();
			xhr.open( "GET", url );
			xhr.onload = function() {
				var imageUrl = that.getOgImageFromHtml( xhr.responseText );
				if ( !imageUrl ) {
					reject();
				}
				var image = new Image();
				for ( var property in that._imageStyle ) {
					if ( ! that._imageStyle.hasOwnProperty( property )) {
						continue;
					}
					image.style[ property ] = that._imageStyle[ property ];
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

	attachPreviewToString( string ) {
		var matches = string.match(/a[^\>]+href=("[^"]+"|'[^']+')/);
		if ( ! matches ) {
			return string;
		}
		var that = this;
		var url = matches[ 1 ].slice( 1, -1 );
		var targetId = 'link-image-' + ( ++ this._imageIdCounter );

		this.getOgImageFromUrl( url ).then(function( attachableElement ) {
			var attachTo = document.getElementById( targetId );
			if ( ! attachTo ) {
				return;
			}
			if ( that._wrapInAnchor ) {
				var a = document.createElement( 'a' );
				a.href = url;
				a.appendChild( attachableElement );
				attachableElement = a;
			}
			attachTo.appendChild( attachableElement );
		}, function() {
			var remove = document.getElementById( targetId );
			remove.parentNode.removeChild( remove );
		});

		return string + '<div id="' + targetId + '"></div>';
	}

	getOgImageFromHtml( html ) {
		var metaMatch = html.match(/<meta[^\>]+og:image['"][^\>]+>/);
		if ( ! metaMatch ) {
			return undefined;
		}
		var propertyMatch = metaMatch[0].match(/content=['"](.*?)['"]/);
		if ( ! propertyMatch ) {
			return undefined;
		}
		return propertyMatch[ 1 ];
	}
}

