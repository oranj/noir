const NoirContribIrc = require('./js/Noir/NoirContribIrc/NoirContribIrc.js');
const { remote }     = require('electron');
const linkifyHtml    = require('linkifyjs/html');
const marked         = require('marked');
const emojione       = require('emojione');

let emoji = Object.keys(emojione.emojioneList);

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
		var irc = new NoirContribIrc(cxn.host, cxn.name || cxn.host, cxn.userName, cxn.config, cxn.channels);

		irc.displayedMessageTransforms.push(function strToMarkdown(str) {
			return marked(str, {
				gfm: true,
				breaks: true,
				sanitize: true,
				smartypants: true
			});
		});

		irc.displayedMessageTransforms.push(function strAddLinks(str) {
			return linkifyHtml(str);
		});

		irc.sentMessageTransforms.push(function strInjectEmoji(str) {
			return emojione.shortnameToUnicode(str);
		});

		irc.autoCompleteListeners.push(function autoCompleteEmoji(event) {

			let lastWord = event.currentWord;

			if (lastWord[0] != ':') {
				return false;
			}

			if (lastWord.length < 2) {
				return false;
			}

			var candidates = emoji
				.filter(em => ( em.slice(0, lastWord.length) == lastWord ))
				.map(em => {
					let unicode = emojione.shortnameToUnicode(em);
					return {
						replace: lastWord,
						value: unicode,
						label: unicode + " " + em
					};
				});

			candidates.sort((a, b) => {
				var diff = a.value.length - b.value.length;
				return diff / Math.abs(diff);
			});

			return candidates.slice(0, 5);
		});
	})
