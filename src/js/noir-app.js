const NoirContribIrc = require( "./js/Noir/NoirContribIrc/NoirContribIrc.js" );
const NoirOgImagePreview = require( "./js/Noir/NoirOgImagePreview/NoirOgImagePreview.js" );
const NoirYouTubeIframe = require( "./js/Noir/NoirYouTubeIframe/NoirYouTubeIframe.js" );
const NoirLinkify = require( "./js/Noir/NoirLinkify/NoirLinkify.js" );
const NoirYouTubeImagePreview = require( "./js/Noir/NoirYouTubeImagePreview/NoirYouTubeImagePreview.js" );
const NoirMarked = require( "./js/Noir/NoirMarked/NoirMarked.js" );
const NoirGiphy = require( "./js/Noir/NoirGiphy/NoirGiphy.js" );
const NoirAutoComplete = require( "./js/Noir/NoirAutoComplete/NoirAutoComplete.js" );
const NoirDropbox = require( "./js/Noir/NoirDropbox/NoirDropbox.js" );
const NoirEmojione = require( "./js/Noir/NoirEmojione/NoirEmojione.js" );

const { ChatAreaFactory } = require( "./js/Noir/Noir/ChatArea.js" );
const { remote }     = require( "electron" );
const Tabset         = require( "./js/Noir/Noir/Tabset.js" );

let tabset = new Tabset();
let chatAreaFactory = new ChatAreaFactory;
let config = remote.getGlobal( "SETTINGS" );

let availablePlugins = {
	NoirLinkify,
	NoirYouTubeImagePreview,
	NoirOgImagePreview,
	NoirYouTubeIframe,
	NoirMarked,
	NoirGiphy,
	NoirAutoComplete,
	NoirDropbox,
	NoirEmojione
};

let plugins = Object.keys( config.plugins ).reduce( ( agg, key ) => {
	try {
		agg[ key ] = new ( availablePlugins[ key ] )( config.plugins[ key ] );
	} catch ( e ) {
		console.error( "ERROR registering plugin: ", e );
	}
	return agg;
}, {});


if ( config.autoCompletePlugins ) {
	config.autoCompletePlugins.forEach( name => {
		try {
			if ( typeof plugins[ name ] === "undefined" ) {
				throw new Error( `Unrecognized plugin ${name}` );
			}
			let plugin = plugins[ name ];
			if ( ! plugin.autoComplete ) {
				throw new Error( `Plugin "${name} does not support "autoComplete"` );
			}
			chatAreaFactory.addAutoCompleteListener( e  => {
				plugin.autoComplete( e );
			});
		} catch ( e ) {
			console.error( e.message );
		}
	});
}

( function() {
	var grabber = document.getElementById( "sidebarGrab" );
	var sidebar = document.getElementById( "sidebar" );
	var isDown = false;

	function setSidebarWidth( width ) {
		sidebar.style.width = width + "px";
		localStorage.setItem( "sidebarWidth", width );
	}

	if ( localStorage.getItem( "sidebarWidth" ) ) {
		setSidebarWidth( localStorage.getItem( "sidebarWidth" ) );
	}

	grabber.addEventListener( "mousedown", ( e ) => {
		isDown = true;
		e.preventDefault();
	});

	document.body.addEventListener( "mousemove", ( e ) => {
		if ( ! isDown ) {
			return;
		}
		setSidebarWidth( e.clientX );
		e.preventDefault();
	});

	document.body.addEventListener( "mouseup", ( e ) => {
		isDown = false;
		e.preventDefault();
	});
}() );

document.getElementById( "main" ).appendChild( tabset.view.element );

config.connections
	.filter( cxn => cxn.type == "noir-contrib-irc" )
	.forEach( cxn => {
		var config = {};
		var channels = cxn.channels || [];
		if ( cxn.config ) {
			Object.keys( cxn.config ).forEach( key => {
				config[ key ] = cxn.config[ key ];
			});
			config.channels = cxn.channels;
		}
		if ( config.channels ) {
			channels = config.channels;
			delete config["channels"];
		}
		if ( ! config.userName ) {
			config.userName = cxn.userName;
		}
		if ( ! config.nick ) {
			config.nick = cxn.userName;
		}
		var irc = new NoirContribIrc(
			cxn.host,
			cxn.name || cxn.host,
			cxn.userName,
			config,
			channels,
			chatAreaFactory,
			tabset
		);


		if ( cxn.displayedMessageTransforms ) {
			cxn.displayedMessageTransforms.forEach( name => {
				try {
					if ( typeof plugins[ name ] === "undefined" ) {
						throw new Error( `Unrecognized plugin ${name}` );
					}
					let plugin = plugins[ name ];
					if ( ! plugin.transformDisplayedMessage ) {
						throw new Error( `Plugin "${name} does not support "transformDisplayedMessage"` );
					}
					irc.displayedMessageTransforms.push( str  => {
						return plugin.transformDisplayedMessage( str );
					});
				} catch ( e ) {
					console.error( e.message );
				}
			});
		}

		if ( cxn.fileDropHandler ) {
			try {
				let name = cxn.fileDropHandler;
				if ( typeof plugins[ name ] === "undefined" ) {
					throw new Error( `Unrecognized plugin ${name}` );
				}
				let plugin = plugins[ name ];
				if ( ! plugin.handleFileDrop ) {
					throw new Error( `Plugin "${name}" does not support "handleFileDrop"` );
				}
				irc.fileDropHandler = plugin;
			} catch ( e ) {
				console.error( e.message );
			}
		}

		if ( cxn.sentMessageTransforms ) {
			cxn.sentMessageTransforms.forEach( name => {
				try {
					if ( typeof plugins[ name ] === "undefined" ) {
						throw new Error( `Unrecognized plugin ${name}` );
					}
					let plugin = plugins[ name ];
					if ( ! plugin.transformSentMessage ) {
						throw new Error( `Plugin "${name} does not support "transformSentMessage"` );
					}
					irc.sentMessageTransforms.push( str  => {
						return plugin.transformSentMessage( str );
					});
				} catch ( e ) {
					console.error( e.message );
				}
			});
		}
	});
