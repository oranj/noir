const Event = require("../Event.js");

class Tab {

	setBadge( badge ) {

	}

	handleFocus( e ) {
		Event.trigger(this, 'blur', { tab: this });
	}

	handleBlur( e ) {
		Event.trigger(this, 'blur', { tab: this });
	}

}

Event.mixin({

	focus: [ 'tab' ],
	blur: [ 'tab' ],
	close:

}, Tab);
