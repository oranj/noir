const View = require("./../View.js");
const template = `
	<div class="ircWindow -hidden">
		<div class="ircWindow_chatArea">
			<div class="message -anim" data-cjs-template="messages">
				<div class="message_sender" data-cjs-name="sender">
					{{ sender }}
				</div>
				<div class="message_text" data-cjs-name="text">
					{{ text }}
				</div>
				<div class="message_time" data-cjs-name="time">
					{{ timestamp | formatTime }}
				</div>
			</div>
		</div>
		<div class="ircWindow_inputArea">
			<button
				type="button"
				class="ircWindow_submitButton"
				data-cjs-name="button">
				Send
			</button>
			<textarea type="text" class="ircWindow_textInput" data-cjs-name="textarea"></textarea>
		</div>
	</div>`;

module.exports = class ChatWindow {

	constructor(nickname, channel, onSend) {
		this.nickname = nickname;
		this.onSend   = onSend;
		this.channel  = channel;

		this.view = new View(template, {
			formatTime: function(timestamp) {
				var date = new Date(timestamp * 1000);
				var parts = date.toString().split(' ');

				return parts[1] + ' ' + date.getDate() + ', ' + (date.getHours() % 12)
					 + ":" + ("00" + date.getMinutes()).slice(-2)
					+ ":" + ("00" + date.getSeconds()).slice(-2) + (date.getHours() > 12 ? "PM" : "AM");
			}
		});

		this.messageId = 0;

		this.view.textarea.addEventListener('keydown', e => {
			if (e.keyCode == 13) {
				e.preventDefault();
				this.handleMessage();
			}
		});

		this.view.button.addEventListener('click', e => {
			this.handleMessage();
		});
	}

	show() {
		this.view.element.classList.remove('-hidden');
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
		var text = this.view.textarea.value;
		if (! text) {
			return;
		}
		this.onSend.call(null, text);
		this.view.textarea.value = '';
	}

	addMessage(sender, text, timestamp) {
		let message = this.view.messages.add(this.messageId++, {
			sender: sender,
			timestamp: timestamp,
			text: text
		});

		setTimeout(() => {
			message.element.classList.remove('-anim');
		}, 1000);

		return message;
	}

	addSystemMessage(text, timestamp) {
		var view = this.addMessage('', text, timestamp);
		view.element.classList.add('-system');
		return view;
	}

	addJoinMessage(text, timestamp) {
		var view = this.addMessage(null, text, timestamp);
		view.element.classList.add('-join');
		return view;
	}

	addChatMessage(from, text, timestamp) {
		var view = this.addMessage(from, text, timestamp);
		if (from == this.nickname) {
			view.element.classList.add('-you');
		}
		return view;
	}
};