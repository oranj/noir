const View = require("./View.js");
const Event = require("./Event.js");


const templateHtml = `
<div class="tabset">
	<div class="tabset_tabs">
		<div class="tabset_tab" data-tab-key="{{ $key }}"
			data-cjs-template="tabs">
			<span class="tabset_tabLabel" data-cjs-name="label"></span>
			<span class="tabset_tabBadge" data-cjs-name="badge"></span>
			<i class="tabset_tabClose" data-cjs-name="close"></i>
		</div>
	</div>
	<div class="tabset_contents">
		<div class="tabset_view" data-cjs-template="views">

		</div>
	</div>
</div>
`;

class Tab {

	constructor( contentView, tabView, key, tabset ) {
		this.tabView = tabView;
		this.contentView = contentView;
		this.tabView.close.addEventListener("click", (e) => {
			console.log("CLICK");
			tabset.remove(key);
			e.preventDefault();
			e.stopPropagation();
		});
	}

	setLabel( label ) {
		this.tabView.label.innerHTML = View.escapeHtml( label );
		return this;
	}

	setBadge( badge ) {
		if (badge) {
			this.tabView.badge.innerHTML = View.escapeHtml( badge );
			this.tabView.badge.classList.add('-active');
		} else {
			this.tabView.badge.innerHTML = ''
			this.tabView.badge.classList.remove('-active');
		}
		return this;
	}

	setContents( element ) {
		while (this.contentView.element.children.length > 0) {
			this.contentView.element.removeChild(this.contentView.element.firstChild);
		}
		this.contentView.element.appendChild(element);
		return this;
	}

}

Event.mixin({
	show: [ "tab" ],
	hide: [ "tab" ],
	close: [ "tab" ]
}, Tab);

class Tabset {

	constructor() {
		this.view = new View(templateHtml);
		this.activeTab = null;
		this.tabs = {};
		this.view.element.addEventListener('click', (e) => {
			console.log("CLICK TABSET");
			let node = e.target;
			while (! node.hasAttribute('data-tab-key')) {
				if (node == this.view.element) {
					return;
				}
				node = node.parentNode;
			}
			this.show(node.getAttribute('data-tab-key'));
			e.preventDefault();
			e.stopPropagation();
		});
		this.view.element.ownerDocument.addEventListener('keydown', (e) => {
			if (! (e.metaKey && e.altKey)) {
				return;
			}
			if (e.keyCode == 37) { //left
				this.showPrevious();
			}
			if (e.keyCode == 39) { //right
				this.showNext();
			}

		});
	}

	add(key) {
		let tabHandle = this.view.tabs.replace(key, { key });
		let content = this.view.views.replace(key, { key });
		var tab = new Tab( content, tabHandle, key, this );
		this.tabs[ key ] = tab;

		if (! this.activeTab) {
			this.show(key);
		}

		return tab;
	}

	remove(key) {
		if (this.activeTab == key) {
			let tab = this.view.tabs.get(key).element;
			if (tab.previousElementSibling) {
				this.show(tab.previousElementSibling.getAttribute('data-tab-key'));
			} else if (tab.nextElementSibling) {
				this.show(tab.nextElementSibling.getAttribute('data-tab-key'));
			} else {
				this.activeTab = null;
				Event.trigger(this.tabs[key], 'hide', {
					tab: this.tabs[this.activeTab]
				});
			}
		}
		this.view.views.remove(key);
		this.view.tabs.remove(key);
		Event.trigger(this.tabs[key], 'close', {
			tab: this.tabs[key]
		});

		delete this.tabs[key];
	}

	show(key) {
		this.view.tabs.forEach((view, currentKey) => {
			if (key == currentKey) {
				view.element.classList.add('-selected');
			} else {
				view.element.classList.remove('-selected');
			}
		});
		this.view.views.forEach((view, currentKey) => {
			if (key == currentKey) {
				view.element.classList.add('-selected');
			} else {
				view.element.classList.remove('-selected');
			}
		});
		if (this.activeTab) {
			Event.trigger(this.tabs[this.activeTab], 'hide', {
				tab: this.tabs[this.activeTab]
			});
		}
		this.activeTab = key;
		Event.trigger(this.tabs[this.activeTab], 'show', {
			tab: this.tabs[this.activeTab]
		});
	}

	showPrevious() {
		if (! this.activeTab) {
			return;
		}
		let tab = this.view.tabs.get(this.activeTab).element;
		let nextTab;
		if (! tab.previousElementSibling) {
			nextTab = tab.parentNode.children[tab.parentNode.children.length - 1];
		} else {
			nextTab = tab.previousElementSibling;
		}
		this.show(nextTab.getAttribute('data-tab-key'));
	}

	showNext() {
		if (! this.activeTab) {
			return;
		}
		let tab = this.view.tabs.get(this.activeTab).element;
		let nextTab;
		if (! tab.nextElementSibling) {
			nextTab = tab.parentNode.children[0];
		} else {
			nextTab = tab.nextElementSibling;
		}
		this.show(nextTab.getAttribute('data-tab-key'));
	}
}

module.exports = Tabset;