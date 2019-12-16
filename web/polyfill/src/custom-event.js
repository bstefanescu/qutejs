/*
 * Polyfill from https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfills
 */
import window from '@qutejs/window';

if ( typeof window.CustomEvent !== "function" ) {
	window.CustomEvent = function ( event, params ) {
		params = params || { bubbles: false, cancelable: false, detail: null };
		var evt = window.document.createEvent( 'CustomEvent' );
		evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
		return evt;
	}
}
