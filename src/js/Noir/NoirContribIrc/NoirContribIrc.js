const irc                            = require( "irc" );
const ChatWindow                     = require( "./ChatWindow" );
const ChatSidebar                    = require( "./ChatSidebar" );
const NoirLogger                     = require( "../NoirLogger/NoirLogger" );
const { ipcRenderer, shell, remote } = require( "electron" );

const LOG_DIR = remote.app.getPath('userData')+"/Logs";

module.exports = class NoirContribIrc {
	constructor( host, connectionName, userName, config, channels, chatAreaFactory, tabset ) {

		config.autoConnect = false;

		this.logger = new NoirLogger( connectionName, LOG_DIR );
		this.client = new irc.Client( host, userName, config );
		this.userName = userName,
		this.tabset = tabset;
		this.appIsFocused = false;
		this.activeWindowId = null;


		let browser = remote.getCurrentWindow();
		browser.on( "focus", () => {
			if ( this.activeWindowId ) {
				this.sidebarEntry.setUnreadCount( this.activeWindowId, 0 );
				this.updateBadgeCount();
			}
			this.appIsFocused = true;
		});
		browser.on( "blur", () => {
			this.appIsFocused = false;
		});

		this.displayedMessageTransforms = [];
		this.sentMessageTransforms      = [];
		this.autoCompleteListeners      = [];
		this.connectionName = connectionName;

		this.windows = {};
		this.chatAreaFactory = chatAreaFactory;

		this.sidebarEntry = new ChatSidebar( connectionName )
			.onWindowSelect( e => {
				this.showWindow( e.windowId );
			});


		this.client.connect( () => {
			channels.forEach( id => {
				if ( id[0] == "#" ) {
					this.joinChannel( id );
				}
			});
		});

		document.getElementById( "sidebar" ).appendChild( this.sidebarEntry.view.element );

		this.client.addListener( "join", ( channel, who ) => {
			if ( ! this.windows.hasOwnProperty( channel ) ) {
				if ( who == userName ) {
					this.joinChannel( channel );
				}
				return;
			}
			this.windows[channel].addParticipant( who, this.getTimestamp() );
		});

		this.client.addListener( "error", ( message ) => {
			console.error( "error: ", message );
		});

		this.client.addListener( "names", ( channel, users ) => {
			if ( ! this.windows.hasOwnProperty( channel ) ) {
				return;
			}

			this.windows[channel].setParticipants( users );
		});

		this.client.addListener( "raw", ( message ) => {
			console.log( message.command + " " + message.args.join( " " ), this.getTimestamp() );
		});

		this.client.addListener( "part", ( channel, who, reason ) => {
			if ( ! this.window.hasOwnProperty( channel ) ) {
				return;
			}
			this.windows[channel].removeParticipant( who, reason, this.getTimestamp() );
			console.log( "%s has left %s: %s", who, channel, reason );
		});

		this.client.addListener( "kick", function( channel, who, by, reason ) {
			if ( ! this.window.hasOwnProperty( channel ) ) {
				return;
			}
			this.windows[channel].removeParticipant( who, reason, this.getTimestamp() );
			console.log( "%s was kicked from %s by %s: %s", who, channel, by, reason );
		});

		this.client.addListener( "message", ( from, to, text, message ) => {
			console.log( "MESSAGE", from, to, text, message );
			var channel = message.args[0];
			if ( to == userName ) {
				channel = from;
				if ( ! this.windows.hasOwnProperty( channel ) ) {
					this.openConversation( channel );
				}
			} else if ( ! this.windows.hasOwnProperty( channel ) ) {
				return;
			}

			let isTabInactive = ! this.windows[ channel ].isVisible() || ! this.appIsFocused;
			let isForMe = ( to == userName ) || ( text.indexOf( userName ) >= 0 );

			if ( isTabInactive && isForMe ) {
				var notification = new window.Notification( "Message from " + from, { body: text, silent: true });
				notification.onclick = () => {
					this.showWindow( channel );
					ipcRenderer.send( "focusWindow", "main" );
				};
				this.sidebarEntry.handleNotification( channel, 1 );
				this.updateBadgeCount();
			}

			this.windows[channel].addChatMessage( from, text, this.getTimestamp() );
		});
	}

	updateBadgeCount() {
		if ( !remote.app.dock || !remote.app.dock.setBadge ) {
			return;
		}
		let count = this.sidebarEntry.getUnreadCounts();
		let badge = count ? count.toString() : "";

		if ( count && badge != remote.app.dock.getBadge() ) {
			remote.app.dock.bounce();
		}

		remote.app.dock.setBadge( badge );
	}

	joinChannel( channelId ) {
		this.openWindow( channelId );

		this.client.join( channelId, () => {
			this.client.send( "NAMES", channelId.slice( 1 ) );
			console.log( "JOIN", arguments );
		});
	}

	leaveChannel( channelId ) {
		this.closeWindow( channelId );
		this.client.part( channelId );
	}

	openConversation( target ) {
		return this.openWindow( target );
	}

	closeConversation( target ) {
		this.closeWindow( target );
	}

	openWindow( id ) {

		// prevent duplicate windows
		if ( this.windows.hasOwnProperty( id ) ) {
			return this.windows[id];
		}

		let chatWindow = new ChatWindow( this.userName, id, this.chatAreaFactory )
			.onOpenUrl( e => {
				shell.openExternal( e.url );
			})
			.onMessage( e => {
				let matches = e.message.match( /^\/join\s+(#[^\s]+)/ );
				if ( matches ) {
					this.joinChannel( matches[1] );
					return;
				}
				var withConn = () => {
					this.client.say( id, e.message );
					this.logger.addMessage( this.getTimestamp(), id, this.userName, e.message );
					chatWindow.addChatMessage( this.userName, e.message, this.getTimestamp() );
				};
				if ( this.client.conn === null ) {
					this.client.connect( withConn );
				} else {
					withConn();
				}
			})
			.onConversationOpened( e => {
				this.openConversation( e.contact );
				this.showWindow( e.contact );
			});


		chatWindow.displayedMessageTransforms = Object.create( this.displayedMessageTransforms );
		chatWindow.sentMessageTransforms      = Object.create( this.sentMessageTransforms );
		chatWindow.autoCompleteListeners      = Object.create( this.autoCompleteListeners );

		this.logger.getMessages( id ).forEach(({ username, message, timestamp }) => {
			chatWindow.addChatMessage( username, message, timestamp );
		});

		this.sidebarEntry.registerWindow( id, 0 );

		this.tabset
			.add( this.connectionName+" "+id )
			.setLabel( id )
			.setContents( chatWindow.view.element )
			.onShow( () => {
				this.sidebarEntry.handleWindowActivated( id );
				this.updateBadgeCount();
				chatWindow.show();
			})
			.onHide( ( e ) => {
				console.log( e );
			})
			.onClose( ( e ) => {
				this.closeWindow( id );
				console.log( e );
			});

		this.activeWindowId = id;
		this.windows[id] = chatWindow;
		return chatWindow;
	}

	closeWindow( id ) {
		this.sidebarEntry.unregisterWindow( id );
		this.tabset.remove( this.connectionName+" "+id );
		// this.element.removeChild(window.view.element);

		delete this.windows[id];
	}

	showWindow( id ) {
		this.activeWindowId = id;
		this.tabset.show( this.connectionName+" "+id );
	}

	getTimestamp() {
		return ( new Date() ) / 1000;
	}

	onApplicationClose() {

	}

	onApplicationOpen() {

	}
};

