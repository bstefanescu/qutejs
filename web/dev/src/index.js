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
import ScriptLoader from './script-loader.js'


Qute.Compiler = Compiler;
Qute.compile = function(text, symbols) {
	return new Compiler().compileFn(text, symbols);
}

Qute.css('x-tag { display:none; }\n');

function loadXTag(text) {
	new Compiler().loadXTags(text, function(xtagName, xtagFn, isCompiled) {
		Qute.register(xtagName, xtagFn, isCompiled);
	});
}
// load templates
Qute.load = function(textOrId) {
	if (!textOrId) {
		var xtags = document.getElementsByTagName('x-tag');
	    for (var i=0,l=xtags.length; i<l; i++) {
	    	loadXTag(xtags[i].innerHTML);
	    }
	} else {
		loadXTag(textOrId[0] === '#' ? document.getElementById(textOrId.substring(1)).textContent : textOrId);
	}
}



var loader = loadES6Transpiler().then(
	function(transpiler) {
		return new ScriptLoader(transpiler);
	},
	// failed to load buble
	function(err) {
		console.error('Failed to load ES6 transpiler: ', err);
		return new ScriptLoader(null);
	});

Qute.getScriptLoader = function() {
	return loader;
}

Qute.runWithScriptLoader = function(fn) {
	return Qute.getScriptLoader().then(fn);
}

Qute.loadScripts = function() {
	Qute.getScriptLoader().then(function(loader) {
		loader.loadAll();
	});
}

export default Qute;
