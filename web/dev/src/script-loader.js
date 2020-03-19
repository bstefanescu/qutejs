import window, {document} from '@qutejs/window';
import Qute from '@qutejs/runtime';
import Compiler from '@qutejs/compiler';
import {capitalizeFirst, kebabToCamel} from '@qutejs/commons';


var IMPORT_RX = /^\s*import\s+(\S+)\s+from\s+(?:(\"[^"]+\")|(\'[^']+\')|([^"'][^;\s]*));?$/mg;
var EXPORT_RX = /^\s*export\s+default\s+/m;

function identityTransform(code) {
	return code;
}

function ScriptLoader(transpileES6) {

	this.create = function(code, name) {
		if (!name) name = 'QuteLambda';
		var deps = {};
		var hasDeps = false;
		code = code.replace(IMPORT_RX, function(m, p1, p2, p3, p4) {
			var path = p2 || p3 || p4;

			if (path) {
				hasDeps = true;
				deps[p1] = path;
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
			js: transpileES6 || identityTransform
		});

		if (hasExport) code += '\nreturn __DEFAULT_EXPORT__;\n';
		// for now script deps are expected to be declared above the script - otherwise compiling will fail

		var script = new Script();
		script.code = code;
		script.deps = deps;
		script.name = name;

		if (hasDeps) {
			console.warn('Imports are ignored in dev version!');
		}

		return script;
	}

	this.load = function(scriptEl, wnd) {
		var script = this.create(scriptEl.textContent, scriptEl.getAttribute('name'));
		script.run();
		script.load(wnd);
		return script;
	}

	this.loadAll = function(wnd) {
		var scripts = (wnd ? wnd.document : document).querySelectorAll('script[type="text/jsq"]');
		for (var i=0,l=scripts.length; i<l; i++) {
			this.load(scripts[i], wnd);
		}
	}

}

function Script() {
	this.name = null;
	this.code = null;
	this.comp = null;
	this.deps = null;

	this.run = function() {
		// adding sourceURL for chrom dev tools.
		var comp = (new Function(this.code+"\n//# sourceURL="+this.name+".js\n"))();
		this.comp = comp;
		return comp;
	}

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


export default ScriptLoader;

