import window from '@qutejs/window';
import Compiler from '@qutejs/compiler';
import { serialLoadScripts, IGNORE_PACKAGES } from './script-loader.js';

var IMPORT_RX = /^\s*import\s+(?:(\S+|\{[^}]+\})\s+from\s+)?(?:(\"[^"]+\")|(\'[^']+\')|([^"'][^;\s]*));?$/mg;
var EXPORT_RX = /^\s*export\s+default\s+/m;

function identityTransform(code) {
	return code;
}

function insertStyle(url) {
	let document = window.document;
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

let IMPORT_CNT = 0;
/**
 * Collect imports (styles too) and comment imports in source code.
 * Returns the modifie source code.
 */
function processImports(code, imports, styles) {
    return code.replace(IMPORT_RX, function(m, p1, p2, p3, p4) {
        var path = p2 || p3 || p4, extraCode;
        if (path) {
            if (path.startsWith('\'') || path.startsWith("\"")) {
                path = path.substring(1, path.length-1);
            }
            if (p1) { // a named import
                if (path === '@qutejs/importer') {
                    if (p1.startsWith('{')) {
                        extraCode = "\nconst "+p1+" = Qute.Importer;\n";
                    }
				} else if (IGNORE_PACKAGES[path]) {
					//imports[path] = p1;
                } else if (p1.startsWith('{')) {
                    const importName = '__QUTE_IMPORT_OBJ_'+(++IMPORT_CNT)+'__';
                    extraCode = "\nconst "+p1+" = "+importName+";\n";
                    imports[path] = importName;
                } else {
                    imports[path] = p1;
                }
            } else { // an import
                if (path.slice(-4) === '.css') {
                    styles.push(path);
                } else {
                    imports[path] = "";
                }
            }
        }

        var result = m.replace('import ', '//import ');
        return extraCode ? result+extraCode : result;
    });
}

function JSQLoader(transpileES6) {

	this.create = function(code, name) {
		if (!name) name = 'QuteLambda';

        // 1. we transpile jsq templates first
        code = new Compiler().transpile(code, {
            sourceMap: false,
            compileStyle: compileStyle
        }).code;

        // 2. then we transpile decorators if any
        let transpileResult = new Compiler.DecoratorTranspiler().transpile(code);
        if (transpileResult) {
            code = transpileResult.code;
        }

        // 3. now process imports and remove import statements from code
        var imports = {};
        var styles = [];
        code = processImports(code, imports, styles);

        // 4. now process the default export if any and remove the statement from the code
        var hasExport = false;
		code = code.replace(EXPORT_RX, function(m) {
			hasExport = true;
			return "var __QUTE_DEV_DEFAULT_EXPORT__ = ";
        });
        //  check if a template was exported (in that case there is a line:
        // var __QUTE_DEV_DEFAULT_EXPORT__ = __QUTE_DEFAULT_EXPORT__;
        var isTemplateExport = code.indexOf('var __QUTE_DEV_DEFAULT_EXPORT__ = __QUTE_DEFAULT_EXPORT__;') > -1;
		if (hasExport) {
            if (isTemplateExport) {
                code += '\nreturn Qute(__QUTE_DEV_DEFAULT_EXPORT__);\n';
            } else {
                code += '\nreturn __QUTE_DEV_DEFAULT_EXPORT__;\n';
            }
        }

        // 5. transpile ES6 if needed
        if (transpileES6) {
			code = transpileES6(code);
		}

		var script = new Script();
		script.code = code;
		script.imports = imports;
		script.name = name;
		script.styles = styles;

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
		var scripts = window.document.querySelectorAll('script[type="text/jsq"]');
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
	this.styles = null;

	this.run = function() {
		// adding sourceURL for chrom dev tools.
		var comp = (new Function(this.code+"\n//# sourceURL="+this.name+".js\n"))();
		this.comp = comp;
		return comp;
	}

	this.hasDependencies = function() {
		return (this.imports && Object.keys(this.imports).length > 0);
	}

	// dependencies are returned in the same order they was declared
	this.getDependencies = function() {
		var set = {}, result = [];
		var imports = this.imports;

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
