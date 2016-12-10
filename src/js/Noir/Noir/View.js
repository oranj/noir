"use strict";

const NAME_ATTR     = "data-cjs-name";
const TEMPLATE_ATTR = "data-cjs-template";

/**
 * Represents an html control, with properties bound to collections and elements.
 * @param {HTMLElement|string} root         The element
 * @param {Object}             [filters={}] Filters keyed by filter name
 * @param {Object}             [data={}]    Data values, from parent
 * @class Capstone.View
 */
function View(root, filters = {}, data = {}) {
	if (! (root instanceof HTMLElement)) {
		root = View.htmlToElement(root.toString());
	}
	this.element = root;

	var that = this,
		binds = {};

	/**
	 * Attaches filters to the view
	 * @param {Object} map Filters keyed by filter name
	 * @return {Capstone.View}
	 * @function Capstone.View#addFilters
	 */
	this.addFilters = function(map) {
		Object.keys(map).forEach(name => {
			filters[name] = map[name];
		});
		return this;
	};

	this.getData = function() {
		return data;
	};

	/**
	 * Sets a map of values to the internal data store
	 * @param {Object} map Values keyed by value name
	 * @return {Capstone.View}
	 * @function Capstone.View#set
	 */
	this.set = function(map) {
		Object.keys(map).
			filter(name => {
				var type = typeof map[name];
				if (data[name] != map[name] || (type != "number" && type != "string")) {
					data[name] = map[name];
					return name;
				}
				return false;
			}).
			forEach(invalidate);
		return this;
	};

	function invalidate(name = false) {
		if (! name) {
			// We _want_ prototype values here.
			/* jshint ignore:start */
			for (name in data) {
				invalidate(name);
			}
			invalidate('$key');
			invalidate('$value');
			/* jshint ignore:end */
			return;
		}
		if (that[name] && that[name] instanceof View.CollectionView) {
			that[name].updateAll(data[name]);
		}
		if (! binds.hasOwnProperty(name)) {
			return;
		}
		binds[name].forEach(binding => {
			var str = binding.operations.reduce((value, operation) => {
				if (Array.isArray(operation)) {
					return value + operation.reduce((subValue, subOperation) => {
						return subOperation(subValue, filters);
					}, data);
				}
				if (typeof operation == "string") {
					return value + operation;
				}
				return operation(value, filters);
			}, "");

			binding.setter.call(null, str);
		});
	}

	function initializeControl() {
		buildTemplates(that, filters, data);

		bindNamedElementsToControl(root, that);

		findPatternedTextNodes(root).forEach(textNode => {
			bindPatternedTextNode(textNode, filters, binds);
		});

		findPatternedAttributes(root).forEach(attribute => {
			bindPatternedAttribute(attribute, filters, binds);
		});
	}

	initializeControl();
	invalidate();
}

/**
 * Binds a root HTMLElement to a template, able to copy itself
 * @param {HTMLElement} root
 * @param {Object}      [filters={}]
 * @param {Object}      [data={}]
 * @class Capstone.View.CollectionView
 */
View.CollectionView = function(root, filters = {}, data = {}) {
	var sourceHTML = root.outerHTML,
		parentNode = root.parentNode,
		all        = {};

	parentNode.removeChild(root);

	this.all = all;
	this.parentNode = parentNode;

	/**
	 * Creates a view element from data, and associates it with a name
	 * @param {string} name The name to identify the view
	 * @param {Object} viewData The data to add to the view
	 * @function Capstone.View.CollectionView#add
	 * @return {Capstone.View}
	 */
	this.add = function(name, viewData) {
		// using Object.create, we can pass a new object which defaults to the available filters
		if (! (viewData instanceof Object)) {
			viewData = { $value: viewData };
		} else {
			viewData.$value = viewData;
		}
		viewData.$key = name;

		var view = (new View(sourceHTML, Object.create(filters), Object.create(data))).set(viewData);
		all[name] = view;

		parentNode.appendChild(view.element);
		return view;
	};

	this.sort = function(callback) {
		var keys = Object.keys(this.all);
		keys.forEach( key => {
			parentNode.removeChild( this.all[key].element );
		});
		keys.sort((a, b) => {
			var dataA = this.all[a].getData();
			var dataB = this.all[b].getData();
			return callback(dataA, dataB);
		});
		keys.forEach( key => {
			parentNode.appendChild( this.all[key].element );
		});
	};

	this.isEmpty = function() {
		return Object.keys(all).length == 0;
	};

	/**
	 * Updates a view identified by a name
	 * @param  {string} name The name which identifies the view
	 * @param  {Object} data The data to update piecemeal
	 * @function Capstone.View.CollectionView#update
	 */
	this.update = function(name, data) {
		if (! this.has(name)) {
			throw new Error(`Cannot update: missing entry "${name}"`);
		}
		all[name].set(data);
	};

	/**
	 * Updates all views to match an input. Removes views not in the input
	 * @param  {object} map A map from name to data used to update view data
	 * @function Capstone.View.CollectionView#updateAll
	 */
	this.updateAll = function(map) {
		Object.keys(all).
			filter(key => ! map.hasOwnProperty(key)).
			forEach(this.remove);

		Object.keys(map).
			forEach(key => this.replace(key, map[key]));
	};

	/**
	 * Inserts or updates views in the collectionview
	 * @param  {string} name
	 * @param  {Object} data
	 * @function Capstone.View.CollectionView#replace
	 * @return {Capstone.View}
	 */
	this.replace = function(name, data) {
		if (this.has(name)) {
			return this.update(name, data);
		}
		return this.add(name, data);
	};

	/**
	 * Removes a view given a name
	 * @param  {string} name
	 * @function Capstone.View.CollectionView#remove
	 */
	this.remove = function(name) {
		if (all.hasOwnProperty(name)) {
			let element = all[name].element;
			if (element.parentNode) {
				element.parentNode.removeChild(element);
			}
			delete all[name];
		}
	};

	/**
	 * Empties the CollectionView
	 * @function Capstone.View.CollectionView#empty
	 */
	this.empty = function() {
		Object.keys(all).forEach(this.remove);
	};

	/**
	 * Checks if the collection has an element identified by name
	 * @param  {string}  name
	 * @return {Boolean}
	 * @function Capstone.View.CollectionView#has
	 */
	this.has = function(name) {
		return all.hasOwnProperty(name);
	};

	/**
	 * Gets the view associated with the name in the collection
	 * @param  {string} name
	 * @return {Capstone.View}
	 * @function Capstone.View.CollectionView#get
	 */
	this.get = function(name) {
		if (! this.has(name)) {
			throw new Error(`Unknown key: ${name}`);
		}
		return all[name];
	};

	/**
	 * Executes a callback on each view in the collection
	 * @param  {Function} callback
	 * @function Capstone.View.CollectionView#forEach
	 */
	this.forEach = function(callback) {
		Object.keys(all).forEach(name => {
			callback.call(null, all[name], name);
		});
	};

	/**
	 * Adds filters to the CollectionView by name
	 * @param {Object} map
	 * @return {Capstone.View.CollectionView}
	 * @function Capstone.View.CollectionView#addFilters
	 */
	this.addFilters = function(map) {
		Object.keys(map).forEach(name => {
			filters[name] = map[name];
		});
		return this;
	};
};

/**
 * Converts an HTML string into an HTMLElement
 * @param  {string}      html HTML input string
 * @return {HTMLElement}
 * @function Capstone.View.htmlToElement
 */
View.htmlToElement = function(html) {
	var matches = html.trim().toLowerCase().match(/^<([a-z]+)/),
		tagName = View.getParentTagName(matches ? matches[1] : false),
		element = document.createElement(tagName);

	element.innerHTML = html;

	if (element.children.length == 1) {
		return element.children[0];
	}
	return element;
};

/**
 * Given a tag name, returns a legal tag name for a parent node
 * @param  {string} nodeType
 * @return {string}
 * @function Capstone.View.getParentTagName
 */
View.getParentTagName = function(nodeType) {
	var nodeMap = {
		tr    : "tbody", // table causes issues here. In chrome, table added with implicit tbody
		td    : "tr",
		tbody : "table",
		thead : "table",
		tfoot : "table",
		th    : "tr"
	};

	nodeType = nodeType.toLowerCase().trim();

	if (nodeMap.hasOwnProperty(nodeType)) {
		return nodeMap[nodeType];
	}
	return 'div';
};

/**
 * Given text, escapes it so that it is suitable for raw html injection
 * @param  {string} text
 * @return {string}
 * @function Capstone.View.escapeHtml
 */
View.escapeHtml = (function() {
	var div = document.createElement('div');
	return function(text) {
		var node = document.createTextNode(text);
		div.innerHTML = '';
		div.appendChild(node);
		return div.innerHTML;
	};
}());

function bindNamedElementsToControl(root, view) {
	[].forEach.call(root.querySelectorAll(`[${NAME_ATTR}]`), el => {
		var name = el.getAttribute(NAME_ATTR);
		el.removeAttribute(NAME_ATTR);
		view[name] = el;
	});
}

function findPatternedTextNodes(root) {
	var out = [], node,
		walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT, {
		acceptNode: el => {
			return (/{{(.*?)}}/m.test(el.wholeText)) ? NodeFilter.FILTER_ACCEPT : NodeFilter.FILTER_REJECT;
		}
	}, false);

	while ((node = walker.nextNode())) {
		out.push(node);
	}
	return out;
}

function findPatternedAttributes(root) {
	var elements = [].slice.call(root.querySelectorAll('*')).concat([root]);
	return elements.
		filter(element => element.hasAttributes()).
		reduce((carry, element) => {
			var attributes = Object.keys(element.attributes).reduce((carry, ordinal) => {
				var attribute = element.attributes[ordinal];
				if (/{{(.*)}}/.test(attribute.value)) {
					carry.push(attribute);
				}
				return carry;
			}, []);
			return carry.concat(attributes);
		}, []);
}

function findParentWithAttribute(attribute, element, top = document.body) {
	element = element.parentNode;
	while (element && element.parentNode != top) {
		if (element.hasAttribute(attribute)) {
			return element;
		}
		element = element.parentNode;
	}
}

function buildTemplates(view, filters, data) {
	[].slice.call(view.element.querySelectorAll(`[${TEMPLATE_ATTR}]`)).
		filter(el => {
			return ! findParentWithAttribute(TEMPLATE_ATTR, el, view.element);
		}).
		forEach(element => {
			var name = element.getAttribute(TEMPLATE_ATTR);
				element.removeAttribute(TEMPLATE_ATTR);

			view[name] = new View.CollectionView(element, Object.create(filters), Object.create(data));

		});
}

function tokenizeText(text, filterList) {
	var matches, runaway = 200, out = [];
	while (( matches = text.match(/^(.*?)({{(.*?)}})(.*)$/m) )) {
		if (matches[1]) {
			out.push(matches[1]);
		}
		out.push(buildFilterFnList(matches[3], filterList));
		if (runaway-- === 0) {
			throw new Error("Runaway loop detected");
		}
		text = matches[4];
	}
	if (text.trim()) {
		out.push(text);
	}
	return out;
}

function pushBind(binds, target, operations, setter, ctx) {
	if (! binds.hasOwnProperty(target)) {
		binds[target] = [];
	}
	binds[target].push({ operations, setter, ctx });
}

function bindPatternedAttribute(attribute, filterList, binds) {
	var tokens = tokenizeText(attribute.value, filterList),
		operations = tokens.map(token => {
			return (typeof token == "string" ? token : token.operations);
		});

	tokens.filter((token) => !! token.bind).forEach(token => {
		pushBind(binds, token.bind, operations, (value) => {
			attribute.value = value;
		}, attribute);
	});
}

function bindPatternedTextNode(textNode, filterList, binds) {
	var tokens = tokenizeText(textNode.wholeText, filterList);

	if (tokens.length === 1) {
		textNode.nodeValue = "";
		pushBind(binds, tokens[0].bind, [ tokens[0].operations ], (value) => {
			textNode.nodeValue = value;
		}, textNode);
		return;
	}

	tokens.map((token) => {
		if (typeof token == "string") {
			return document.createTextNode(token);
		}
		var target = document.createElement('span');
		pushBind(binds, token.bind, [ token.operations ], (value) => {
			target.innerHTML = value;
			// target.innerHTML = View.escapeHtml(value);
		}, target);
		return target;
	}).forEach((element) => {
		textNode.parentNode.insertBefore(element, textNode);
	});
	textNode.parentNode.removeChild(textNode);
}

function buildFilterFnList(statement) {
	var statements = statement.split('|').map(str => str.trim()),
		valuePath = statements.shift().split('.').map(str => str.trim()),
		bind = valuePath[0],
		operations = [];

	operations.push((data) => {
		return valuePath.reduce((node, name) => {
			return (name in node) ? (node[name]) : "";
		}, data);
	});

	statements.forEach((filter) => {
		operations.push((value, filters) => {
			if (filters[filter]) {
				return filters[filter].call(null, value);
			}
			console.error(`Unknown filter "${filter}"`);
			return "";
		});
	});

	return { bind, operations };
}

module.exports = View;
