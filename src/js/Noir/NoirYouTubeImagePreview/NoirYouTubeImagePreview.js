module.exports = class NoirOgImagePreview {
	constructor( wrapInAnchor = true ) {
		this._wrapInAnchor = wrapInAnchor;
	}

	getYouTubeImgUrl( url ) {
		if ( ! url.match( /^https?:\/\/(.*\.)?(youtu\.be|youtube\.com|ytimg.com)/ ) ) {
			return false;
		}
		url = url.replace( /(>|<)/gi,"" ).split( /(vi\/|v=|\/v\/|youtu\.be\/|\/embed\/)/ );
		if ( url[2] === undefined ) {
			return false;
		}
		let id = url[2].split( /[^0-9a-z_-]/i )[ 0 ];
		return "https://img.youtube.com/vi/" + id + "/0.jpg";
	}

	transformDisplayedMessage( string ) {
		let out = string;
		let matches = string.match( /a[^>]+href=("[^"]+"|'[^']+')/ );
		if ( ! matches ) {
			return out;
		}
		let url = matches[ 1 ].slice( 1, -1 );
		let imageUrl = this.getYoutubeImgUrl( url );
		if ( ! imageUrl ) {
			return out;
		}

		out += "<div class=\"noirYTIP\">";
		if ( this._wrapInAnchor ) {
			out += "<a class=\"noirYTIP_anchor\" href=\"" + url + "\">";
		}
		out += "<img class=\"noirYTIP_image\" src=\"" + imageUrl + "\" />";
		if ( this._wrapInAnchor ) {
			out += "</a>";
		}
		out += "</div>";

		return out;
	}

};

