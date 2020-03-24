import window, {document} from '@qutejs/window';
import Qute from '@qutejs/runtime';
import Compiler from '@qutejs/compiler';
import {capitalizeFirst, kebabToCamel} from '@qutejs/commons';


var IMPORT_RX = /^\s*import\s+(?:(\S+)\s+from\s+)?(?:(\"[^"]+\")|(\'[^']+\')|([^"'][^;\s]*));?$/mg;
var EXPORT_RX = /^\s*export\s+default\s+/m;

function identityTransform(code) {
	return code;
}


function JSQLoader(transpileES6) {
	// parse playground directives like @script @style etc.s
	// return {code, script, style}
	function parseDirectives(source) {
	    var r = {};
	    r.code = source.replace(/^\/\/@([a-z]+)\s+(\S+)$/gm, function(m, p1, p2) {
	        var list = r[p1];
	        if (!list) {
	            r[p1] = list = [];
	        }
	        list.push(p2);
	        return '';
	    }).trim();
	    return r;
	}

	this.create = function(code, name) {
		if (!name) name = 'QuteLambda';
		var imports = [], namedImports = {};

		var dirs = parseDirectives(code);
		code = dirs.code;
		code = code.replace(IMPORT_RX, function(m, p1, p2, p3, p4) {
			var path = p2 || p3 || p4;
			if (path) {
				if (path.startsWith('\'') || path.startsWith("\"")) {
					path = path.substring(1, path.length-1);
				}
				if (p1) {
					namedImports[p1] = path;
				} else {
					imports.push(path);
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
			js: transpileES6 || identityTransform
		});

		if (hasExport) code += '\nreturn __DEFAULT_EXPORT__;\n';

		var script = new Script();
		script.code = code;
		script.imports = imports;
		script.namedImports = namedImports;
		script.name = name;
		script.scripts = dirs.script;
		script.styles = dirs.style;

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

function unpkgResolver(name) {
	if (name.startsWith('./')
		|| name === '@qutejs/runtime'
		|| name === '@qutejs/window') return null;
	return 'https://unpkg.com/'+name;
}

function Script() {
	this.name = null;
	this.code = null;
	this.comp = null;
	this.imports = null;
	this.namedImports = null;
	this.scripts = null;
	this.styles = null;

	this.run = function() {
		// adding sourceURL for chrom dev tools.
		var comp = (new Function(this.code+"\n//# sourceURL="+this.name+".js\n"))();
		this.comp = comp;
		return comp;
	}

	this.resolveDependencies = function(resolveFn) {
		var set = {};
		if (this.scripts) {
			this.scripts.forEach(function(script) {
				set[script] = script;
			});
		}

		if (resolveFn !== false) {
			var imports = this.imports;
			var namedImports = this.namedImports;
			if (!resolveFn) resolveFn = unpkgResolver;
			imports && imports.forEach(function(name) {
				var url = resolveFn(name);
				if (url) {
					set[url] = url;
				}
			});

			namedImports && Object.keys(namedImports).forEach(function(key) {
				var name = namedImports[key];
				var url = resolveFn(name);
				if (url) {
					set[url] = url;
				}
			});
		}

		return Object.keys(set);
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


export default JSQLoader;

