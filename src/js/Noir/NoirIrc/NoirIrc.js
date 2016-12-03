const irc = require('irc');



module.exports = class NoirIrc {
	constructor() {
		this.client = new irc.Client(
			'irc.freenode.net',
			'noirbot',
			{ channels: [ '#raytestmn' ] }
		);

		// Listen for joins
		this.client.addListener("join", (channel, who) => {
			console.log("JOIN", channel, who);
		});

		// Listen for any message, PM said user when he posts
		this.client.addListener("message", (from, to, text, message) => {
			console.log("MESSAGE", from, to, text, message);
		});
	}

	onApplicationClose() {

	}

	onApplicationOpen() {

	}
}

