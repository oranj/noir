const View = require("./../View.js");
const template = `
	<div class="ircSidebar">
		<h2 class="ircSidebar_header">
			{{ title }}
		</h2>
		<div class="ircSidebar_item clearfix" data-cjs-template="items">
			<span class="ircSidebar_itemTitle">{{ windowId }}</span>
			<span class="ircSidebar_itemUnread">{{ unreadCount }}</span>
		</div>
	</div>`;

module.exports = class ChatWindow {

	constructor(title, onWindowSelect) {
		this.view = new View(template, {}, { title });
		this.onWindowSelect = onWindowSelect;
		this.unreadCounts = {};
	}

	registerWindow(windowId, unreadCount) {
		this.setUnreadCount(windowId, unreadCount);
		var item = this.view.items.add(windowId, { windowId, unreadCount });
		item.element.addEventListener('click', e => {
			this.onWindowSelect.call(null, [ windowId ]);
		})
	}

	handleWindowActivated(windowId) {
		this.view.items.forEach((window, _windowId) => {
			if (_windowId == windowId) {
				window.element.classList.add('-active');
			} else {
				window.element.classList.remove('-active');
			}
		});
		this.setUnreadCount(windowId, 0);
	}

	handleNotification(windowId, increment) {
		this.setUnreadCount(windowId, this.unreadCounts[windowId] + increment);
	}

	setUnreadCount(windowId, unreadCount) {
		this.unreadCounts[windowId] = unreadCount;
		if (this.view.items.has(windowId)) {
			let item = this.view.items.get(windowId);
			item.set({ unreadCount });
			if (unreadCount == 0) {
				item.element.classList.remove('-unread');
			} else {
				item.element.classList.add('-unread');
			}
		}
	}
};