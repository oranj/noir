const View        = require("./../Noir/View.js");
const Event       = require("./../Noir/Event.js");

const template = `
	<div class="ircWindow -hidden">
		<div class="ircWindow_chatArea" data-cjs-name="scrollArea">
			<div class="message -anim" data-cjs-template="messages">
				<div class="message_time" data-cjs-name="time">
					{{ timestamp | formatTime | html }}
				</div>
				<div class="message_sender" data-cjs-name="sender">
					{{ sender | html }}
				</div>
				<div class="message_text" data-cjs-name="text">
					{{ text | formatMessage }}
				</div>
			</div>
		</div>
		<div class="ircWindow_inputArea">
			<div class="ircWindow_buttonArea">
				<button
					type="button"
					class="ircWindow_button -send"
					data-cjs-name="sendButton">
					<i class="fa fa-paper-plane" aria-hidden="true"></i>
				</button>
				<div class="ircWindow_contactArea" data-cjs-name="contactArea">
					<div data-cjs-template="contacts" class="ircWindow_contact" data-contact-name="{{ $key | html }}">
						{{ $key | html }}
					</div>
				</div>
				<button
					type="button"
					class="ircWindow_button -people"
					data-cjs-name="peopleButton">
					<i class="fa fa-users" aria-hidden="true"></i>
				</button>
			</div>
			<textarea type="text" class="ircWindow_textInput" data-cjs-name="textarea"></textarea>
		</div>
	</div>`;

function toggleClass(element, className, value) {
	if (value == undefined) {
		value = ! element.classList.contains(className);
	}
	if (value) {
		element.classList.add(className);
	} else {
		element.classList.remove(className);
	}
}

class ChatWindow {

	constructor(nickname, channel) {

		this.nickname = nickname;
		this.channel  = channel;

		this.lastMessage   = null;
		this.lastSender    = null;
		this.lastTimestamp = null;
		this.lastText      = '';
		this.lastDisplayedTimestamp = 0;

		this.displayedMessageTransforms = [];
		this.sentMessageTransforms = [];
		this.autoCompleteListeners = [];

		this.view = new View(template, {
			formatTime: function(timestamp) {
				var date = new Date(timestamp * 1000);
				var parts = date.toString().split(' ');

				return parts[1] + ' ' + date.getDate() + ', ' + (date.getHours() % 12)
					 + ":" + ("00" + date.getMinutes()).slice(-2)
					+ ":" + ("00" + date.getSeconds()).slice(-2) + (date.getHours() > 12 ? "PM" : "AM");
			},
			html: View.escapeHtml,
			formatMessage: str => {
				return this.displayedMessageTransforms.reduce((carry, plugin) => {
					return plugin(carry)
				}, str);
			}
		});

		this.view.element.addEventListener('click', e => {
			var node = e.target;
			while (node.tagName.toUpperCase() != 'A') {
				if (node == view.element) {
					return;
				}
				node = node.parentNode;
			}
			e.preventDefault();
			Event.trigger(this, 'openUrl', { url: node.href });
		});

		this.messageId = 0;

		this.view.textarea.addEventListener('keydown', e => {
			if (e.keyCode == 13 && ! e.shiftKey) {
				e.preventDefault();
				this.handleMessage();
			}
		});

		this.view.sendButton.addEventListener('click', e => {
			this.handleMessage();
		});
		this.view.peopleButton.addEventListener('click', e => {
			toggleClass(this.view.contactArea, '-open');
		});
		this.view.contactArea.addEventListener('click', (e) => {
			var node = e.target;
			while (! node.hasAttribute('data-contact-name')) {
				if (node == this.view.contactArea) {
					return;
				}
				node = node.parentNode;
			}
			let contact = node.getAttribute('data-contact-name');
			Event.trigger(this, 'conversationOpened', { contact });
		});
	}

	setParticipants(participants) {
		this.view.contacts.updateAll(participants);
	}

	show() {
		this.view.element.classList.remove('-hidden');
		this.view.textarea.focus();
	}

	hide() {
		this.view.element.classList.add('-hidden');
	}

	toggleDisplay(show) {
		if (show === undefined) {
			show = ! this.isVisible();
		}
		if (show) {
			this.show();
		} else {
			this.hide();
		}
	}

	isVisible() {
		return ! this.view.element.classList.contains("-hidden");
	}

	handleMessage() {
		let message = this.sentMessageTransforms.reduce((carry, transform) => {
			return transform(carry);
		}, this.view.textarea.value);

		if (! message) {
			return;
		}
		Event.trigger(this, 'message', { message });
		this.view.textarea.value = '';
	}

	addMessage(sender, text, timestamp) {

		let displayTime = (timestamp - this.lastDisplayedTimestamp > 300);
		let wasRecent = (timestamp - this.lastTimestamp) < 5;
		let sameSender = (sender == this.lastSender);

		if (sameSender && wasRecent) {
			this.lastText = this.lastText + "\n" + text;
			this.lastMessage.set({ text: this.lastText });
		} else {
			this.lastMessage = this.view.messages.add(this.messageId++, {
				sender: sender,
				timestamp: timestamp,
				text: text
			});
			if (displayTime) {
				this.lastDisplayedTimestamp = timestamp;
				this.lastMessage.element.classList.add('-timestamped');
			}
			this.lastText   = text;
			this.lastSender = sender;
		}

		this.lastTimestamp = timestamp;

		setTimeout(() => {
			this.lastMessage.element.classList.remove('-anim');
		}, 1000);

		return this.lastMessage;
	}

	addSystemMessage(text, timestamp) {
		var view = this.addMessage('', text, timestamp);
		view.element.classList.add('-system');
		return view;
	}

	addParticipant(who, timestamp) {
		var text = who + " has joined " + this.channel;
		var view = this.addMessage(null, text, timestamp);

		view.element.classList.add('-join');
		view.element.classList.add('-system');
		this.view.contacts.replace(who, '');
		return view;
	}

	removeParticipant(who, reason, timestamp) {
		var text = who + " has left " + this.channel+"\n&nbsp;&nbsp;" + reason;
		var view = this.addMessage(null, text, timestamp);

		view.element.classList.add('-join');
		view.element.classList.add('-system');
		this.view.contacts.remove(who);
		return view;
	}

	addChatMessage(from, text, timestamp) {

		var view = this.addMessage(from, text, timestamp);

		if (from == this.nickname) {
			view.element.classList.add('-you');
		}
		setTimeout(() => {
			this.view.scrollArea.scrollTop = this.view.scrollArea.scrollHeight;
		}, 10);
		return view;
	}
};

Event.mixin({
	message: [ 'message' ],
	openUrl: [ 'url' ],
	conversationOpened: [ 'contact' ]
}, ChatWindow);

module.exports = ChatWindow;
