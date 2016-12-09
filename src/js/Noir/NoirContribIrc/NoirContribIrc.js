const irc                                = require('irc');
const ChatWindow                         = require("./ChatWindow");
const ChatSidebar                        = require("./ChatSidebar");
const {app, ipcRenderer, shell, remote } = require('electron')


module.exports = class NoirContribIrc {
	constructor(host, connectionName, userName, config, channels) {

		config.autoConnect = false;

		this.client = new irc.Client(host, userName, config);

		this.displayedMessageTransforms = [];
		this.sentMessageTransforms = [];

		this.windows = {};
		this.element = document.getElementById('main');
		this.sidebarEntry = new ChatSidebar(connectionName)
			.onWindowSelect( e => {
				this.showWindow(e.windowId);
			});


		this.client.connect(() => {
			channels.forEach(id => {
				if (id[0] == '#') {
					this.joinChannel(id);
				}
			});
		});

		document.getElementById('sidebar').appendChild(this.sidebarEntry.view.element);

		this.client.addListener("join", (channel, who) => {
			if (! this.windows.hasOwnProperty(channel)) {
				return;
			}
			this.windows[channel].addParticipant(who, this.getTimestamp());
		});

		this.client.addListener('error', (message) => {
			console.error('error: ', message);
		});

		this.client.addListener('names', (channel, users) => {
			if (! this.windows.hasOwnProperty(channel)) {
				return;
			}

			this.windows[channel].setParticipants(users);
		});

		this.client.addListener('raw', (message) => {
	    	console.log(message.command + ' ' + message.args.join(' '), this.getTimestamp());
		});

		this.client.addListener('part', (channel, who, reason) => {
			if (! this.window.hasOwnProperty(channel)) {
				return;
			}
			this.windows[channel].removeParticipant(who, reason, this.getTimestamp());
		    console.log('%s has left %s: %s', who, channel, reason);
		});

		this.client.addListener('kick', function(channel, who, by, reason) {
			if (! this.window.hasOwnProperty(channel)) {
				return;
			}
			this.windows[channel].removeParticipant(who, reason, this.getTimestamp());
		    console.log('%s was kicked from %s by %s: %s', who, channel, by, reason);
		});



		// Listen for any message, PM said user when he posts
		this.client.addListener("message", (from, to, text, message) => {
			console.log("MESSAGE", from, to, text, message);
			var channel = message.args[0];
			if (to == userName) {
				channel = from;
				if (! this.windows.hasOwnProperty(channel)) {
					this.openConversation(channel);
				}
			} else if (! this.windows.hasOwnProperty(channel)) {
				return;
			}

			if (to == userName || text.indexOf(userName) >= 0) {
				var notification = new window.Notification("Message from " + from, { body: text, silent: true });
				notification.onclick = function() {
					ipcRenderer.send('focusWindow', 'main');
				};
			}

			this.windows[channel].addChatMessage(from, text, this.getTimestamp());
			if (! this.windows[channel].isVisible()) {
				this.sidebarEntry.handleNotification(channel, 1);
				this.updateBadgeCount();
			}
		});
	}

	updateBadgeCount() {
		if (remote.app.dock && remote.app.dock.setBadge) {
			var count = this.sidebarEntry.getUnreadCounts();
			if (count == 0) {
				remote.app.dock.setBadge("");
			} else {
				remote.app.dock.setBadge(count.toString());
			}
		}
	}

	joinChannel(channelId) {
		var window = this.openWindow(channelId);

		this.client.join(channelId, () => {
			this.client.send('NAMES', channelId.slice(1));
			console.log("JOIN", arguments);
		});
	}

	leaveChannel(channelId) {
		this.closeWindow(channelId);
		this.client.part(channelId);
	}

	openConversation(target) {
		return this.openWindow(target);
	}

	closeConversation(target) {
		this.closeWindow(target);
	}

	openWindow(id) {

		// prevent duplicate windows
		if (this.windows.hasOwnProperty(id)) {
			return this.windows[id];
		}

		let chatWindow = new ChatWindow('noirbot', id)
			.onOpenUrl( e => {
				shell.openExternal( e.url );
			})
			.onMessage( e => {
				this.client.say(id, e.message);
				chatWindow.addChatMessage('noirbot', e.message, this.getTimestamp());
			})
			.onConversationOpened( e => {
				this.openConversation( e.contact );
				this.showWindow(e.contact);
			});


		chatWindow.displayedMessageTransforms = Object.create(this.displayedMessageTransforms);
		chatWindow.sentMessageTransforms      = Object.create(this.sentMessageTransforms);

		this.sidebarEntry.registerWindow(id, 0);

		this.element.appendChild(chatWindow.view.element);
		this.windows[id] = chatWindow;
		return chatWindow;
	}

	closeWindow(id) {
		this.sidebarEntry.unregisterWindow(id);
		this.element.removeChild(window.view.element);

		delete this.windows[id];
	}

	showWindow(id) {
		Object.keys(this.windows).forEach(_id => {
			this.windows[_id].toggleDisplay(_id == id);
		});
		this.sidebarEntry.handleWindowActivated(id);
		this.updateBadgeCount();
	}

	getTimestamp() {
		return (new Date()) / 1000;
	}

	onApplicationClose() {

	}

	onApplicationOpen() {

	}
}

