const View = require("./../View.js");
const Event = require("./../Event.js");

const template = `
	<div class="ircSidebar">
		<h2 class="ircSidebar_header">
			{{ title }}
		</h2>
		<div class="ircSidebar_item clearfix" data-cjs-template="items">
			<span class="ircSidebar_itemTitle">{{ windowId }}</span>
			<span class="isValidElement()Sidebar_itemUnread">{{ unreadCount }}</span>
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

class ChatSidebar {

	constructor(title) {
		this.view = new View(template, {}, { title });
		this.unreadCounts = {};
	}

	getUnreadCounts() {
		return Object.keys(this.unreadCounts).reduce((carry, key) => {
			return carry + this.unreadCounts[key];
		}, 0);
	}

	registerWindow(windowId, unreadCount) {
		this.setUnreadCount(windowId, unreadCount);
		var item = this.view.items.add(windowId, { windowId, unreadCount });
		item.element.addEventListener('click', e => {
			Event.trigger(this, 'windowSelect', { windowId });
		})
	}

	unregisterWindow(windowId) {
		delete this.unreadCounts[windowId];
		this.view.items.remove(windowId);
	}

	handleWindowActivated(windowId) {
		this.view.items.forEach((window, _windowId) => {
			toggleClass(window.element, '-active', _windowId == windowId);
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
			toggleClass(item.element, '-unread', unreadCount != 0);
		}
	}
}

Event.mixin({
	windowSelect: [ 'windowId' ]
}, ChatSidebar);

module.exports = ChatSidebar;