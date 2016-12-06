const NoirIrc = require('./js/Noir/NoirIrc/NoirIrc.js');

var client = new NoirIrc('irc.freenode.com', 'noirbot', {
	userName: 'noirbot'
}, [
	'#raytestmn'
]);
