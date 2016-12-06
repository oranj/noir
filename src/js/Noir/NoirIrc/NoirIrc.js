const irc = require('irc');
const ChatWindow = require("./ChatWindow");
const ChatSidebar = require("./ChatSidebar");
const {app} = require('electron')


module.exports = class NoirIrc {
	constructor(host, nickName, config, channels) {

		config.autoConnect = false;

		this.client = new irc.Client(host, nickName, config);


		this.windows = {};
		this.element = document.getElementById('main');
		this.sidebarEntry = new ChatSidebar(host)
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

		this.client.addListener('part', function(channel, who, reason) {
		    console.log('%s has left %s: %s', who, channel, reason);
		});
		this.client.addListener('kick', function(channel, who, by, reason) {
		    console.log('%s was kicked from %s by %s: %s', who, channel, by, reason);
		});

		// Listen for any message, PM said user when he posts
		this.client.addListener("message", (from, to, text, message) => {
			console.log("MESSAGE", from, to, text, message);
			var channel = message.args[0];
			if (message.command == "PRIVMSG") {
				channel = from;
				if (! this.windows.hasOwnProperty(channel)) {
					this.openConversation(channel);
				}
			} else if (! this.windows.hasOwnProperty(channel)) {
				return;
			}
			this.windows[channel].addChatMessage(from, text, this.getTimestamp());
			if (! this.windows[channel].isVisible()) {
				this.sidebarEntry.handleNotification(channel, 1);
				app.dock.setBadge(this.sidebarEntry.getUnreadCounts())
			}
		});
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
		let window = new ChatWindow('noirbot', id)
			.onMessage( e => {
				this.client.say(id, e.message);
				window.addChatMessage('noirbot', e.message, this.getTimestamp());
			})
			.onConversationOpened( e => {
				this.openConversation( e.contact );
				this.showWindow(e.contact);
			});

		this.sidebarEntry.registerWindow(id, 0);

		this.element.appendChild(window.view.element);
		this.windows[id] = window;
		return window;
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
	}

	getTimestamp() {
		return (new Date()) / 1000;
	}

	onApplicationClose() {

	}

	onApplicationOpen() {

	}
}

