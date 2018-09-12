"use strict";

const View = require( "./View.js" );

function segmentAtPosition( cursorPosition, text ) {
	var start, end;

	for ( start = cursorPosition; start >= 0; start-- ) {
		if ( [" ","\n","\t","\r"].includes( text[start] ) ) {
			break;
		}
	}

	for ( end = cursorPosition; end < text.length; end++ ) {
		if ( [undefined, " ", "\n", "\r", "\t"].includes( text[end] ) ) {
			break;
		}
	}

	start = Math.min( cursorPosition, start + 1 );
	end   = Math.max( cursorPosition, end );

	return {
		text:       text,
		word:       text.slice( start, end ),
		beforeWord: text.slice( 0, start ),
		afterWord:  text.slice( end )
	};
}

class AutoCompleteEvent {
	constructor( chatArea, autoCompleteTooltip, word, position, fullText ) {
		this.chatArea            = chatArea;
		this.autoCompleteTooltip = autoCompleteTooltip;
		this.word                = word;
		this.position            = position;
		this.fullText            = fullText;
	}
}

class ChatArea {

	constructor( textarea, autoCompleteListeners ) {
		this.textarea     = textarea;
		this.history  = [];
		this.historyPreservedText;
		this.historyIndex = 0;

		this.autoCompleteTooltip   = new AutoCompleteTooltip( this );
		this.autoCompleteListeners = autoCompleteListeners;

		this.textarea.parentNode.insertBefore(
			this.autoCompleteTooltip.view.element,
			this.textarea
		);

		this.textarea.addEventListener( "keyup", () => {
			let cursorPosition = this.textarea.selectionStart;
			let segmented = segmentAtPosition( cursorPosition, this.textarea.value );

			this.autoCompleteTooltip.awaitSuggestions();
			if ( segmented.word ) {
				let event = new AutoCompleteEvent( this, this.autoCompleteTooltip, segmented.word, cursorPosition, this.textarea.value );

				this.autoCompleteListeners.forEach( ( listener ) => {
					listener.call( null, event );
				});
			}

			this.autoCompleteTooltip.finishSuggestions();
		});

		this.textarea.addEventListener( "keydown", ( e ) => {
			if ( this.autoCompleteTooltip.isVisible() ) {
				if ( e.keyCode == 9 ) {
					this.autoCompleteTooltip.useSelected();
					e.preventDefault();
				} else if ( e.keyCode == 27 ) {
					this.autoCompleteTooltip.hide();
					e.preventDefault();
				} else if ( e.keyCode == 40 ) { // down
					this.autoCompleteTooltip.cursorDown();
					e.preventDefault();
				} else if ( e.keyCode == 38 ) { // up
					this.autoCompleteTooltip.cursorUp();
					e.preventDefault();
				}
			} else if ( e.keyCode == 38 && this.history.length > 0 ) { // up history
				if ( this.historyIndex === this.history.length ) {
					this.historyPreservedText = this.textarea.value;
				}
				this.historyIndex = Math.max( 0, Math.min( this.history.length, this.historyIndex - 1 ) );
				if ( this.historyIndex === this.history.length ) {
					this.textarea.value = this.historyPreservedText;
				} else {
					this.textarea.value = this.history[ this.historyIndex ];
				}
			} else if ( e.keyCode == 40 && this.history.length > 0 ) { // down history
				if ( this.historyIndex === this.history.length ) {
					this.historyPreservedText = this.textarea.value;
				}
				this.historyIndex = Math.max( 0, Math.min( this.history.length, this.historyIndex + 1 ) );
				if ( this.historyIndex === this.history.length ) {
					this.textarea.value = this.historyPreservedText;
				} else {
					this.textarea.value = this.history[ this.historyIndex ];
				}
			} else if ( e.keyCode == 9 ) { // tab
				if ( this.selectNextTemplate( this.textarea.selectionStart ) ) {
					e.preventDefault();
				}
			}
		});

		this.textarea.addEventListener( "blur", () => {
			this.autoCompleteTooltip.hide();
		});
	}

	pushHistory( lastMessage ) {
		let index = this.history.indexOf( lastMessage );
		if ( index !== -1 ) {
			this.history.splice( index, 0 );
		}
		this.history.push( lastMessage );
		this.historyIndex = this.history.length;
	}

	selectNextTemplate( cursorPosition ) {
		let text     = this.textarea.value;
		let preText  = text.slice( 0, cursorPosition );
		let atText   = "";
		let postText = text.slice( cursorPosition );

		let matches = postText.match( /^(.*?)\[\[([^\]]+)\]\](.*)$/ );
		if ( !matches ) {
			return false;
		}

		preText  += matches[1];
		atText   = "[[" + matches[2] + "]]";
		postText = matches[3];

		this.textarea.value = preText + atText + postText;

		this.textarea.selectionStart = preText.length;
		this.textarea.selectionEnd = preText.length + atText.length;

		return true;
	}

	replaceWordAtCurrentPosition( word ) {
		this.replaceWordAtPosition( this.textarea.selectionStart, word );
	}

	replaceWordAtPosition( cursorPosition, word ) {
		let segmented = segmentAtPosition( cursorPosition, this.textarea.value );
		let preCursor = segmented.beforeWord + word;
		let postCursor = segmented.afterWord;

		this.textarea.value = preCursor + postCursor;
		this.textarea.focus();

		if ( ! this.selectNextTemplate( cursorPosition ) ) {

			this.textarea.selectionStart = preCursor.length;
			this.textarea.selectionEnd = preCursor.length;

		}
	}
}

var autoCompleteTemplate = `
	<div class="autoComplete clearfix">
		<div class="autoComplete_popup"
			data-cursor-pos="0"
			data-cjs-name="popup">
			<div class="autoComplete_suggestion"
				data-value="{{ value }}"
				data-weight="{{ weight }}"
				data-cjs-template="suggestions">
				{{ label }}
			</div>
		</div>
	</div>`;

class AutoCompleteTooltip {
	constructor( chatArea ) {

		this.chatArea = chatArea;
		this.view = new View( autoCompleteTemplate );
		this.suggestions = null;
		this.cursor = 0;
		this.view.element.addEventListener( "click", ( e ) => {
			var node = e.target;
			while ( ! node.hasAttribute( "data-value" ) ) {
				if ( node == this.view.element ) {
					return;
				}
				node = node.parentNode;
			}
			let value = node.getAttribute( "data-value" );
			chatArea.replaceWordAtCurrentPosition( value );
			this.hide();

			e.preventDefault();
			e.stopPropagation();
		});
	}

	show() {
		this.view.popup.classList.add( "-visible" );
	}

	hide() {
		this.clear();
		this.view.popup.classList.remove( "-visible" );
	}

	isVisible() {
		return this.view.popup.classList.contains( "-visible" );
	}

	clear() {
		this.view.suggestions.empty();
	}

	isEmpty() {
		return this.view.suggestions.isEmpty();
	}

	awaitSuggestions() {
		this.clear();
		this.suggestions = [];
	}

	suggest( value, label, weight ) {
		this.suggestions.push({ value, label, weight });
	}

	getCursorPosition() {
		return this.view.popup.setAttribute( "data-cursor-pos" );
	}

	cursorUp() {
		this.cursor = ( ( this.cursor + this.suggestions.length ) - 1 ) % this.suggestions.length;
		this.view.popup.setAttribute( "data-cursor-pos", this.cursor );
	}

	cursorDown() {
		this.cursor = ( this.cursor + 1 ) % this.suggestions.length;
		this.view.popup.setAttribute( "data-cursor-pos", this.cursor );
	}

	useSelected() {
		this.chatArea.replaceWordAtCurrentPosition( this.suggestions[this.cursor].value );
		this.hide();
	}

	finishSuggestions() {

		if ( this.suggestions.length == 0 ) {
			this.hide();
			return;
		}

		this.cursor = ( this.cursor % this.suggestions.length );

		this.suggestions.sort( ( a, b ) => {
			let diff = a.weight - b.weight;
			return diff / Math.abs( diff );
		});

		this.suggestions = this.suggestions.slice( 0, 5 );

		this.suggestions.forEach( s => {
			this.view.suggestions.replace( s.label, s );
		});

		this.show();
	}
}

class ChatAreaFactory {

	constructor() {
		this.autoCompleteListeners = [];
	}

	make( textarea ) {
		return new ChatArea( textarea, this.autoCompleteListeners );
	}

	addAutoCompleteListener( listener ) {
		this.autoCompleteListeners.push( listener );
		return this;
	}

}

module.exports = { ChatArea, ChatAreaFactory };
