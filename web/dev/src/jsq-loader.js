import window, {document} from '@qutejs/window';
import Qute from '@qutejs/runtime';
import Compiler from '@qutejs/compiler';
import {capitalizeFirst, kebabToCamel} from '@qutejs/commons';
import { serialLoadScripts } from './script-loader.js';

var IMPORT_RX = /^\s*import\s+(?:(\S+)\s+from\s+)?(?:(\"[^"]+\")|(\'[^']+\')|([^"'][^;\s]*));?$/mg;
var EXPORT_RX = /^\s*export\s+default\s+/m;

function identityTransform(code) {
	return code;
}

function insertStyle(url) {
	console.log('insert style', url);
	var link = document.createElement('link');
	link.setAttribute('rel', 'stylesheet');
	link.setAttribute('href', url);
	document.head.appendChild(link);
}

function compileStyle(compiler, attrs, text) {
    text = text.trim();
    return text ? 'Qute.css('+JSON.stringify(text)+');' : '';
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
		var imports = {};

		var dirs = parseDirectives(code);
		code = dirs.code;
		code = code.replace(IMPORT_RX, function(m, p1, p2, p3, p4) {
			var path = p2 || p3 || p4;
			if (path) {
				if (path.startsWith('\'') || path.startsWith("\"")) {
					path = path.substring(1, path.length-1);
				}
				if (p1) { // a named import
					imports[path] = p1;
				} else { // an import
					imports[path] = "";
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
            sourceMap: false,
            compileStyle: compileStyle
        }).code;
		if (transpileES6) {
			code = transpileES6(code);
		}


		if (hasExport) code += '\nreturn __DEFAULT_EXPORT__;\n';

		var script = new Script();
		script.code = code;
		script.imports = imports;
		script.name = name;
		script.scripts = dirs.script;
		script.styles = dirs.style;

		return script;
	}

	this.load = function(scriptEl) {
		var script = this.create(scriptEl.textContent, scriptEl.getAttribute('name'));
		return script.load().then(function() {
			return script.run();
		});
	}

	this.loadAll = function() {
		var promises = [];
		var scripts = document.querySelectorAll('script[type="text/jsq"]');
		for (var i=0,l=scripts.length; i<l; i++) {
			promises.push(this.load(scripts[i]));
		}
		return Promise.all(promises);
	}

}

function Script() {
	this.name = null;
	this.code = null;
	this.comp = null;
	this.imports = null;
	this.scripts = null;
	this.styles = null;

	this.run = function() {
		// adding sourceURL for chrom dev tools.
		var comp = (new Function(this.code+"\n//# sourceURL="+this.name+".js\n"))();
		this.comp = comp;
		return comp;
	}

	this.hasDependencies = function() {
		return (this.scripts && this.scripts.length > 0)
			|| (this.imports && Object.keys(this.imports).length > 0);
	}

	// dependencies are returned in the same order they was declared
	// scripts comes first then comes the imports
	this.getDependencies = function() {
		var set = {}, result = [];
		var scripts = this.scripts;
		var imports = this.imports;

		scripts && scripts.forEach(function(script) {
			if (!set[script]) {
				set[script] = true;
				result.push(script);
			}
		});
		imports && Object.keys(imports).forEach(function(key) {
			if (!set[key]) {
				set[key] = true;
				result.push(key);
			}
		});

		return result;
	}

	this.load = function(beforeLoadDeps) {
        var imports = this.imports;
		var styles = this.styles;
		var deps = this.getDependencies();

		// load styles
		styles && styles.forEach(function(url) {
			insertStyle(url);
		});

		// load script deps
		if (deps) {
			if (beforeLoadDeps) beforeLoadDeps();
			return serialLoadScripts(deps).then(function(vars) {
                // map vars to import names
                Object.keys(vars).forEach(function(url) {
                    var obj = vars[url];
                    if (obj) {
                        var name = imports[url];
                        if (name) {
                            window[name] = obj;
                        }
                    }
                });
            });
		} else {
			return Promise.resolve(); // no scripts to load return an empty promise
		}
	}

	this.loadAndRun = function() {
		var self = this;
		return this.load.then(function() {
			return self.run();
		});
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

