/**
 * The Qute runtime packed with IE polyfills and buble for
 * being able to write inlined components on any browser (>=IE9).
 */

// ----------- IE Polyfill
import '@qutejs/polyfill';

// ----------- ES6 transform via buble if not supported by the browser
import loadES6Transpiler from './buble-loader.js';

// ----------- Qute runtime

import window, {document, Promise} from '@qutejs/window';
import Qute from '@qutejs/runtime';
import Compiler from '@qutejs/compiler';
import JSQLoader from './jsq-loader.js';


Qute.Compiler = Compiler;
Qute.JSQLoader = JSQLoader;
Qute.compile = function(text, symbols) {
	return new Compiler().compileFn(text, symbols);
}

var loader = loadES6Transpiler().then(
	function(transpiler) {
		return new JSQLoader(transpiler);
	},
	// failed to load buble
	function(err) {
		console.error('Failed to load ES6 transpiler: ', err);
		return new JSQLoader(null);
	});

Qute.getLoader = function() {
	return loader;
}

Qute.runWithLoader = function(fn) {
	return Qute.getLoader().then(fn);
}

// TODO remove this - replaced by load
Qute.loadScripts = function() {
	Qute.getLoader().then(function(loader) {
		loader.loadAll();
	});
}

Qute.loadTemplates = function(idOrElement) {
	var script; // tje script element
	if (typeof idOrElement === 'string') {
		script = document.getElementById(idOrElement);
	} else {
		script = idOrElement;
	}
	if (script) {
		new JSQLoader().load(script);
	}
}

Qute.load = function(idOrElement) {
	if (idOrElement) {
		var script; // tje script element
		if (typeof idOrElement === 'string') {
			script = document.getElementById(idOrElement);
		} else {
			script = idOrElement;
		}
		if (script) {
			Qute.getLoader().then(function(loader) {
				loader.load(script);
			});
		}
	} else { // load all
		Qute.getLoader().then(function(loader) {
			loader.loadAll();
		});
	}
}

export default Qute;
