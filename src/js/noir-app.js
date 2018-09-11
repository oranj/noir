const NoirContribIrc = require( "./js/Noir/NoirContribIrc/NoirContribIrc.js" );
const NoirOgImagePreview = require( "./js/Noir/NoirOgImagePreview/NoirOgImagePreview.js" );
const NoirYouTubeIframe = require( "./js/Noir/NoirYouTubeIframe/NoirYouTubeIframe.js" );
const NoirLinkify = require( "./js/Noir/NoirLinkify/NoirLinkify.js" );
const NoirYouTubeImagePreview = require( "./js/Noir/NoirYouTubeImagePreview/NoirYouTubeImagePreview.js" );
const NoirMarked = require( "./js/Noir/NoirMarked/NoirMarked.js" );
const NoirAutoComplete = require( "./js/Noir/NoirAutoComplete/NoirAutoComplete.js" );
const NoirEmojione = require( "./js/Noir/NoirEmojione/NoirEmojione.js" );

const { ChatAreaFactory } = require( "./js/Noir/Noir/ChatArea.js" );
const { remote }     = require( "electron" );
const Tabset         = require( "./js/Noir/Noir/Tabset.js" );
// const marked         = require( "marked" );
// const emojione       = require( "emojione" );

// let emojis = Object.keys( emojione.emojioneList );
let tabset = new Tabset();
let chatAreaFactory = new ChatAreaFactory;
let config = remote.getGlobal( "SETTINGS" );

let availablePlugins = {
	NoirLinkify,
	NoirYouTubeImagePreview,
	NoirOgImagePreview,
	NoirYouTubeIframe,
	NoirMarked,
	NoirAutoComplete,
	NoirEmojione
};

let plugins = Object.keys( config.plugins ).reduce( ( agg, key ) => {
	try {
		console.log( "KEY", key );
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

// chatAreaFactory.addAutoCompleteListener( function ircAutoComplete( e ) {

// 	if ( ! e.word.match( /^:.+$/ ) ) {
// 		return;
// 	}

// 	emojis
// 		.filter( em => {
// 			return em.slice( 0, e.word.length ) == e.word;
// 		})
// 		.forEach( em => {
// 			let unicode = emojione.shortnameToUnicode( em );
// 			e.autoCompleteTooltip.suggest(
// 				unicode,
// 				unicode + " " + em,
// 				em.length
// 			);
// 		});
// });

// if ( config.commands ) {
// 	let waitForChars = ( config.commandPromptAfter || 3 );
// 	chatAreaFactory.addAutoCompleteListener( function ircAutoComplete( e ) {
// 		Object.keys( config.commands ).forEach( shortName => {
// 			let cmd = config.commands[shortName];
// 			if ( e.word.length < waitForChars ) {
// 				return;
// 			}
// 			if ( shortName.slice( 0, e.word.length ) != e.word ) {
// 				return;
// 			}
// 			e.autoCompleteTooltip.suggest(
// 				cmd,
// 				shortName,
// 				shortName.length
// 			);
// 		});
// 	});
// }

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
		var config = cxn.config || {};
		if ( config.channels ) {
			cxn.channels = config.channels;
			delete config["channels"];
		}
		if ( ! config.userName ) {
			config.userName = cxn.userName;
		}
		if ( ! config.nick ) {
			config.nick = cxn.userName;
		}
		cxn.config = config;
		var irc = new NoirContribIrc( cxn.host, cxn.name || cxn.host, cxn.userName, cxn.config, cxn.channels, chatAreaFactory, tabset );

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

		// irc.displayedMessageTransforms.push( function strToMarkdown( str ) {
		// 	return marked( str, {
		// 		gfm: true,
		// 		breaks: true,
		// 		sanitize: true,
		// 		smartypants: true
		// 	});
		// });



		// irc.displayedMessageTransforms.push( function strAddYouTube( str ) {
		// 	return youTubeIframe.transformString( str );
		// });

		// irc.displayedMessageTransforms.push( function strAddLinks( str ) {
		// 	return linkifyHtml( str );
		// });

		// irc.displayedMessageTransforms.push( function getLinkImage( str ) {
		// 	return imgPreview.transformString( str );
		// });

		// irc.sentMessageTransforms.push( function strInjectEmoji( str ) {
		// 	return emojione.shortnameToUnicode( str );
		// });

	});
