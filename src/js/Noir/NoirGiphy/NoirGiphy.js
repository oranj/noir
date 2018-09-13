const https = require( "https" );

module.exports = class NoirGiphy {

	constructor({ apiKey, wakeWord }) {
		this.apiKey = encodeURIComponent( apiKey );
		this.wakeWord = wakeWord;
		this.width = 400;
		this.height = 250;
		this.cache = {};
		this.lastTimeoutHandle = null;
	}

	getGiphyId( url ) {
		let matches = url.match( /(\.|https:\/\/)giphy\.com\/(media|embed)\/(.*?)[^a-zA-Z0-9]/ );
		if ( matches ) {
			return matches [ 3 ];
		}
		matches = url.match( /(\.|https:\/\/)giphy\.com\/gifs\/.?([a-zA-Z0-9]+)([^a-zA-Z0-9\-]|$)/ );

		if ( matches ) {
			return matches[ 2 ];
		}

		return null;
	}

	transformDisplayedMessage( string ) {
		let giphyId = this.getGiphyId( string );
		if ( ! giphyId ) {
			return string;
		}

		return string + `<a href="https://giphy.com/gifs/gif-${giphyId}" class="noirGiphy_link"><img class="noirGiphy_image" src="https://media.giphy.com/media/${giphyId}/giphy.gif" style="max-height: 30vh; min-height: 40px" /></a>`;
	}

	autoComplete({ fullText, searchTooltip }) {
		if ( fullText.slice( 0, this.wakeWord.length ).toLowerCase() != this.wakeWord.toLowerCase() ) {
			return;
		}

		let search = fullText.slice( this.wakeWord.length );

		if ( search.length < 3 ) {
			return;
		}

		let searchId = searchTooltip.getSearchId();
		clearInterval( this.lastTimeoutHandle );
		this.lastTimeoutHandle = setTimeout(() => {
			this.getSearchResults( search ).then( results => {
				results.data.forEach( gif => {
					let { embed_url: embedUrl, title }  = gif;
					let { url, width, height } = gif.images.fixed_height_downsampled;
					let element = new Image();
					element.src = url;
					element.style.width = width + 'px';
					element.style.height = height + 'px';
					searchTooltip.addResult( searchId, element, title, embedUrl );
				});
			});
		}, 300 );
	}

	getSearchResults( keyword ) {
		keyword = encodeURIComponent( keyword ).toLowerCase();
		var url = `https://api.giphy.com/v1/gifs/search?api_key=${this.apiKey}&q=${keyword}`;

		if ( !this.cache.hasOwnProperty( url )) {
			this.cache[ url ] = new Promise(( resolve, reject ) => {
				https.get( url, ( res ) => {
					let data = "";
					if ( res.statusCode !== 200 ) {
						delete this.cache[ url ];
						return reject( "Request failed: " + res.statusCode );
					}
					res.on( "data", ( chunk ) => {
						data += chunk;
					}),
					res.on( "end", () => {
						try {
							resolve( JSON.parse( data ) );
						} catch ( e ) {
							delete this.cache[ url ];
							reject( e );
						}
					});
				}).on( "error", ( e ) => {
					delete this.cache[ url ];
					reject( e );
				});
			});
		}

		return this.cache[ url ];
	}
};
