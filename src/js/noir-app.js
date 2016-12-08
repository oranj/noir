const NoirIrc = require('./js/Noir/NoirIrc/NoirIrc.js');
const { remote } = require('electron');


remote.getGlobal('SETTINGS').connections
	.filter(cxn => cxn.type == 'noir-contrib-irc' )
	.forEach(cxn => {
		var config = cxn.config || {};
		if (config.channels) {
			cxn.channels = config.channels;
			delete config['channels'];
		}
		if (! config.userName) {
			config.userName = cxn.userName;
		}
		if (! config.nick) {
			config.nick = cxn.userName;
		}
		cxn.config = config;
		new NoirIrc(cxn.host, cxn.name || cxn.host, cxn.userName, cxn.config, cxn.channels);
	})