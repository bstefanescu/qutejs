import window from '@qutejs/window';
import { loadScripts } from './script-loader.js';

function testES6() {
	try {
		new Function("(a = 0) => a; class X{}");
		return true;
	} catch (e) {
		return false;
	}
}

function bubleTransform(code) {
	return window.buble.transform(code).code;
}

export default function loadES6Transpiler() {
	if (testES6()) {
		return Promise.resolve(null); // browser supports ES6 syntax
	} else if (window.buble && window.buble.transform) {
		return Promise.resolve(bubleTransform);
	} else { // lopad buble package from unpkg.com
		return loadScripts('buble').then(function() {
			return bubleTransform;
		});
	}
}
