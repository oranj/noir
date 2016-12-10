const View = require("./View.js");


const templateHtml = `
<div class="tabset">
	<div class="tabset_tabs">
		<div class="tabset_tab" data-tab-key="{{ $key }}
		" data-cjs-template="tabs">
			{{ label }}
		</div>
	</div>
	<div class="tabset_contents">
		<div class="tabset_view" data-cjs-template="views">

		</div>
	</div>
</div>
`;

class Tabset {

	constructor() {
		this.view = new View(templateHtml);
		this.activeTab = null;
		this.view.element.addEventListener('click', (e) => {
			let node = e.target;
			while (! node.hasAttribute('data-tab-key')) {
				if (node == this.view.element) {
					return;
				}
				node = node.parentNode;
			}
			this.show(node.getAttribute('data-tab-key'));
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

	add(key, label, element) {
		this.view.tabs.replace(key, { key, label });
		var content = this.view.views.replace(key, { key });
		content.element.appendChild(element);
		if (! this.activeTab) {
			this.activeTab = key;
			this.show(key);
		}
	}

	remove(key) {
		this.view.views.remove(key);
		this.view.tabs.remove(key);
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
		this.activeTab = key;
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