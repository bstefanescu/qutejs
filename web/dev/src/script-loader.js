import { document, Promise } from '@qutejs/window';


function insertScript(url) {
	return new Promise(function(resolve, reject) {
		console.log('insert script', url);
		var script = document.createElement('script');
		script.setAttribute('src', url);
	    script.onload = function() {
	    	resolve(url);
		};
		script.onerror = function() {
			reject(new Error("Failed to package from: " + url));
		}
		document.head.appendChild(script);
	});
}

var IGNORE_PACKAGES = {
	"@qutejs/runtime": true,
	"@qutejs/window": true,
	"@qutejs/dev": true,
}

// A task returns a Promise. the serial function is serializing tasks and run
// each task after the previous one finished
export function serial(tasks, arg) {
	Promise.resolve
	return tasks.reduce(function (chain, currentTask) {
		return chain.then(function(val) {
			return currentTask(val);
		});
	}, Promise.resolve(arg));
}

export function resolveScript(nameOrUrl) {
	if (IGNORE_PACKAGES[nameOrUrl]) return null;
	if (nameOrUrl.startsWith('@') || nameOrUrl.indexOf('/') === -1) {
		return 'https://unpkg.com/'+nameOrUrl;
	} else {
		return nameOrUrl;
	}
}

// usage: loadScripts('buble', 'jquery').then(...)
// or loadScripts(['buble', 'jquery']).then(...)
export function loadScripts(urls) {
	if (!Array.isArray(urls)) {
		urls = Array.prototype.slice.call(arguments);
	}
	var promises = [];
	for (var i=0,l=urls.length; i<l; i++) {
		var url = resolveScript(urls[i]);
		if (url) {
			promises.push(insertScript(url));
		}
	}
	return Promise.all(promises);
}

// a task must return a promise
function SerialTask(url) {
	return function() {
		return insertScript(url);
	}
}
export function serialLoadScripts(urls) {
	if (!Array.isArray(urls)) {
		urls = Array.prototype.slice.call(arguments);
	}
	var tasks = [];
	for (var i=0,l=urls.length; i<l; i++) {
		var url = resolveScript(urls[i]);
		if (url) {
			tasks.push(SerialTask(url));
		}
	}
	return serial(tasks);
}
