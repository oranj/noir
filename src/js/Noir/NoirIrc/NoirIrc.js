const irc = require('irc');
const ChatWindow = require("./ChatWindow");
const ChatSidebar = require("./ChatSidebar");

module.exports = class NoirIrc {
	constructor() {
		var channels = [ '#raytestmn', '#nomajingno', 'real_ray' ];

		this.client = new irc.Client(
			'irc.freenode.net',
			'noirbot',
			{ channels: channels.filter(str => str[0] == '#') }
		);

		this.sidebarEntry = new ChatSidebar('irc.freenode.net', (windowId) => {
			this.showWindow(windowId);
		});

		this.windows = {};
		channels.forEach(id => {
			let window = new ChatWindow('noirbot', id, message => {
				this.client.say(id, message);
				window.addChatMessage('noirbot', message, this.getTimestamp());
			});

			this.sidebarEntry.registerWindow(id, 0);

			document.getElementById('main').appendChild(window.view.element);
			this.windows[id] = window;
		});

		document.getElementById('sidebar').appendChild(this.sidebarEntry.view.element);

		this.showWindow([Object.keys(this.windows)[0]]);

		// Listen for joins
		this.client.addListener("join", (channel, who) => {
			if (! this.windows.hasOwnProperty(channel)) {
				return;
			}
			this.windows[channel].addSystemMessage(who + " joined the chatroom", this.getTimestamp());
			console.log("JOIN", channel, who);
		});

		// Listen for any message, PM said user when he posts
		this.client.addListener("message", (from, to, text, message) => {
			console.log("MESSAGE", from, to, text, message);
			var channel = message.args[0];
			if (channel == 'noirbot') {
				channel = from;
			}
			if (! this.windows.hasOwnProperty(channel)) {
				return;
			}
			this.windows[channel].addChatMessage(from, text, this.getTimestamp());
			if (! this.windows[channel].isVisible()) {
				this.sidebarEntry.handleNotification(channel, 1);
			}
			// this.window.addChatMessage(from, text, this.getTimestamp());
		});
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

