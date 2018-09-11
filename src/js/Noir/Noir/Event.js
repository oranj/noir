"use strict";

var EVENT_SYMBOL = "@@EVENT",
	targetIter = 0,
	targetCallbacks = {};

function ucWord( string ) {
	return string.charAt( 0 ).toUpperCase() + string.slice( 1 );
}

function registerObject( target ) {
	if ( ! target.hasOwnProperty( EVENT_SYMBOL ) ) {
		target[EVENT_SYMBOL] = targetIter;
		targetCallbacks[targetIter] = {};
		targetIter++;
	}
}

function registerEvent( target, event ) {
	registerObject( target );
	if ( ! targetCallbacks[target[EVENT_SYMBOL]].hasOwnProperty( event ) ) {
		targetCallbacks[target[EVENT_SYMBOL]][event] = [];
	}
}

function pushEventCallback( target, event, callback ) {
	targetCallbacks[target[EVENT_SYMBOL]][event].push( callback );
}

/**
 * A Utility for adding simple event support to objects
 * @namespace Event
 */
var Event = /** @lends Event */ {

	/**
	 * Defines events on an object's prototype using "foo" => "onFoo" for instance methods
	 * @param  {Object}   definitions An object whose keys represent the event name and values represent the event data
	 * @param  {Function} Constructor The Constructor function whose prototyhpe to bind to
	 * @return {Function}             The input Constructor, for chaining
	 *
	 * @example
	 * Event.mixin({
	 *     baz: ['bim']
	 * }, Foo);
	 *
	 * var bar = new Foo();
	 * bar.onBaz(function(e) {
	 *     console.log(e.bim);
	 * });
	 */
	mixin: function( definitions, Constructor ) {
		Object.keys( definitions ).forEach( function( name ) {
			Constructor.prototype["on" + ucWord( name )] = function( callback ) {
				registerEvent( this, name );
				pushEventCallback( this, name, callback );
				return this;
			};
		});
		return Constructor;
	},

	/**
	 * Defines events on an object using "foo" => "onFoo", for singletons, static, or namespaces
	 * @param  {Object}   definitions An object whose keys represent the event name and values represent the event data
	 * @param  {Function} Constructor The Constructor function whose prototyhpe to bind to
	 * @return {Function}             The input Constructor, for chaining
	 *
	 * @example
	 * Event.mixinObject({
	 *     baz: ['bim']
	 * }, Foo);
	 *
	 * Foo.onBaz(function(e) {
	 *     console.log(e.bim);
	 * });
	 */
	mixinObject: function( definitions, Target ) {
		Object.keys( definitions ).forEach( function( name ) {
			registerEvent( Target, name );
			Target["on"+ucWord( name )] = function( callback ) {
				pushEventCallback( Target, name, callback );
				return Target;
			};
		});
		return Target;
	},

	/**
	 * Triggers an event on a target
	 * @param  {Object} target The target the event was bound on
	 * @param  {String} event  The name of the function
	 * @param  {Object} data   The event data as a single object
	 *
	 * @example
	 * // with Event.mixin
	 * Event.mixin({
	 *     baz: ['bim']
	 * }, Foo);
	 * ...
	 * Event.trigger(fooA, 'baz', { bim: "bar" });
	 *
	 * @example
	 * // with Event.mixinObject
	 * Event.mixinObject({
	 *     baz: ['bim']
	 * }, Foo);
	 *
	 * Event.trigger(Foo, 'baz', { bim: "bar" });
	 */
	trigger: function( target, event, data ) {
		if ( target.hasOwnProperty( EVENT_SYMBOL ) && targetCallbacks[target[EVENT_SYMBOL]].hasOwnProperty( event ) ) {

			data.sender = target;
			data.eventType = event;

			targetCallbacks[target[EVENT_SYMBOL]][event].forEach( function( callback ) { callback.call( null, data ); });
		}
	}

};

module.exports = Event;