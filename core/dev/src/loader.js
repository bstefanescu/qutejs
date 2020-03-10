import window, {document} from '@qutejs/window';
import Qute from '@qutejs/runtime';
import Compiler from '@qutejs/compiler';
import {capitalizeFirst, kebabToCamel} from '@qutejs/commons';
import transpileES6 from './es6.js';


var IMPORT_RX = /^\s*import\s+(\S+)\s+from\s+(?:(\"[^"]+\")|(\'[^']+\')|([^"'][^;\s]*));?$/mg;
var EXPORT_RX = /^\s*export\s+default\s+/m;

export default function Loader() {
	this.createScript = function(code, name) {
		var deps = {};
		code = code.replace(IMPORT_RX, function(m, p1, p2, p3, p4) {
			var path = p2 || p3 || p4;

			if (path) {
				if (path[0] === '.' && path[1] === '/') {
					//TODO resolve file path
					deps[p1] = path;
				} else if (p1 !== 'Qute') {
					console.warning('Imports are ignored in dev version!')
					throw new Error('Only relative paths are supported for import statements: '+m.trim());
				}
			}

			return m.replace('import ', '//import ');
		});
		var hasExport = false;
		code = code.replace(EXPORT_RX, function(m) {
			hasExport = true;
			return "var __DEFAULT_EXPORT__ = ";
		});
		code = new Compiler().transpile(code, {
			removeNewLines: true,
			// apply buble if needed
			js: transpileES6,
		});

		if (hasExport) code += '\nreturn __DEFAULT_EXPORT__;\n';
		// for now script deps are expected to be declared above the script - otherwise compiling will fail
		var comp = (new Function(code))();

		var script = new Script();
		script.name = comp ? name || capitalizeFirst(kebabToCamel(comp.prototype.$tag)) : null;
		script.code = code;
		script.deps = deps;
		script.comp = comp;

		return script;
	}

	this.loadScript = function(scriptEl, wnd) {
		return this.createScript(scriptEl.textContent, scriptEl.getAttribute('name')).load(wnd);
	}

	this.load = function(wnd) {
		var scripts = (wnd ? wnd.document : document).querySelectorAll('script[type="text/jsq"]');
		for (var i=0,l=scripts.length; i<l; i++) {
			this.loadScript(scripts[i], wnd);
		}
	}
}

function Script() {
	this.name = null;
	this.code = null;
	this.comp = null;
	this.deps = null;

	this.load = function(wnd) {
		if (!wnd) wnd = window;
		if (this.name) window[this.name] = this.comp;
		return this;
	}

/*
	this.resolve = function(path) {
		if (!this.file) return null;
		var parts = this.file.split('/').pop();
		path.split('/').forEach(function(part) {
			if (part === '..') {
				parts.pop();
			} else if (part !== '.') {
				parts.push(part);
			}
		});
		return parts.join('/');
	}
*/

}


