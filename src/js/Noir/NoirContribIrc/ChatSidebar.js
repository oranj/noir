const View = require("./../Noir/View.js");
const Event = require("./../Noir/Event.js");

const template = `
	<div class="sidebarBlock">
		<h2 class="sidebarBlock_heading">
			{{ title }}

			<i class="sidebarBlock_expander"></i>
		</h2>
		<div class="sidebarBlock_content">
			<div class="sidebarBlock_item clearfix" data-cjs-template="items">
				<span class="sidebarBlock_itemTitle">{{ windowId }}</span>
				<span class="sidebarBlock_itemBadge -empty" data-cjs-name="badge">{{ unreadCount }}</span>
			</div>
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
			toggleClass(item.badge, '-empty', unreadCount == 0);
		}
	}
}

Event.mixin({
	windowSelect: [ 'windowId' ]
}, ChatSidebar);

module.exports = ChatSidebar;
