import {document} from '@qutejs/window';
import Loader from './loader.js'
import Qute from '@qutejs/runtime';
import Compiler from '@qutejs/compiler';
import transpileES6 from './es6.js';

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

Qute.transpile = function(source) {
	return new Compiler().transpile(source, {
		removeNewLines: true,
		js: transpileES6,
	});
}

Qute.Loader = Loader;
Qute.loadScripts = function() {
	new Loader().load();
}
export default Qute;
