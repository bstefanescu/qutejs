import window, {document, Promise} from '@qutejs/window';

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
	} else {
		var url = 'https://unpkg.com/buble';
		return new Promise(function (resolve, reject) {
			var script = document.createElement('SCRIPT');
			script.setAttribute('src', url);
			script.onload = function() {
				resolve(bubleTransform);
			};
			script.onerror = function() {
				reject(new Error("Failed to load buble from: ", url));
			};
			document.head.appendChild(script);
		});
	}
}
