import window, { document } from '@qutejs/window';
import Qute from '@qutejs/runtime';
import Compiler from '@qutejs/compiler';
import { capitalizeFirst, kebabToCamel } from '@qutejs/commons';

var IMPORT_RX = /^\s*import\s+(\S+)\s+from\s+(?:(\"[^"]+\")|(\'[^']+\')|([^"'][^;\s]*));?$/mg;
var EXPORT_RX = /^\s*export\s+default\s+/m;


function Loader() {
	this.createScript = function(code, name) {
		var deps = {};
		code = code.replace(IMPORT_RX, function(m, p1, p2, p3, p4) {
			var path = p2 || p3 || p4;

			if (path) {
				if (path[0] === '.' && path[1] === '/') {
					//TODO resolve file path
					deps[p1] = path;
				} else if (p1 !== 'Qute') {
					console.warning('Imports are ignored in dev version!');
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
		code = new Compiler().transpile(code);
		// apply buble if needed
		if (window.buble && window.buble.transform) {
			code = window.buble.transform(code).code;
		}
		if (hasExport) { code += '\nreturn __DEFAULT_EXPORT__;\n'; }
		// for now script deps are expected to be declared above the script - otherwise compiling will fail
		var comp = (new Function(code))();

		var script = new Script();
		script.name = comp ? name || capitalizeFirst(kebabToCamel(comp.prototype.$tag)) : null;
		script.code = code;
		script.deps = deps;
		script.comp = comp;

		return script;
	};

	this.loadScript = function(scriptEl, wnd) {
		return this.createScript(scriptEl.textContent, scriptEl.getAttribute('name')).load(wnd);
	};

	this.load = function(wnd) {
		var scripts = (wnd ? wnd.document : document).querySelectorAll('script[type="text/jsq"]');
		for (var i=0,l=scripts.length; i<l; i++) {
			this.loadScript(scripts[i], wnd);
		}
	};

}

function Script() {
	this.name = null;
	this.code = null;
	this.comp = null;
	this.deps = null;

	this.load = function(wnd) {
		if (this.name) { window[this.name] = this.comp; }
		return this;
	};

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

var PRINT_RX = /%s/g;
function print(text) {
	var i = 1, args = arguments;
	return text.replace(PRINT_RX, function(match, p1) {
		return args[i++];
	});
}

Qute.ERR.resolve = function (code) {
	var text = errors[code];
	if (!text) { text = "Qute Error: "+code; }
	else {
		var args = Array.prototype.slice.call(arguments);
		args[0] = text;
		text = print.apply(null, args);
	}
	throw new Error(text);
};

var errors = {


	// ------------------------------------------------------
	// index.js
	/*
	1: "Unsupported tag: '%s'",
	2: "template 'name' is required",
	*/
	// runtime.js
	5: "Usage: Qute(tag[, viewModelDefinition])",
	// list.js
	10: "Broken list fragment. Ignoring updates",
	11: "Invalid index: '%s'. Length is %s",
	12: "Invalid insertion index: '%s'. Length is %s'",
	13: "Remove anchor is invalid: '%s'. Length is %s",
	14: "Invalid move from index: '%s'. Length is %s",
	15: "Invalid move to index: '%s'. Length is %s",
	// rendering.js
	20: "Invalid dynamic component. Should be a ViewModel constructor or a xtag name",
	// no more used
	//21: "Found a 'nested' element without a 'name' attribute",
	23: "Could not resolve ViewModel at runtime for tag: '%s'",
	24: "dynamic for directive accepts only List instances and not regular arrays",
	25: "List properties cannot be used with the static for directive",
	26: "Bug? Unknown xattr name: %s",
	27: "Unknown converter: %s",
	28: "x-channel cannot be used on regular DOM elements: %s",
	// update.js
	30: "Possible infinite loop detected",
	// vm.js
	31: "Incompatible assign for list property: %s",
	32: "No render function defined for the ViewModel!",
	33: "VM is already mounted!",
	34: "VM is not mounted!",
	35: "View not connected",
	36: "No template found for tag '%s'",
	37: "Failed to install plugin %s. Plugins must provide an install(ctx) method.",
	38: 'Posting message to unknown topic %s',
	39: "x-channel used on a VM not defining channels: %s",
	//36: "Cannot unmount a child view",
	// compiler.js
	/*
	50: "<tag> requires an 'is' attribute",
	51: "Invalid for expression",
	52: "For directive take exatcly one attribute",
	53: "if has only one required attribute: value='expr' and an optional one: @change='onChangeHandler'",
	54: "slot node take zero or one 'name' parameter",
	55: "the root node must have a single children element",
	56: "Invalid if attribute '%s'",
	57: "Closing tag '%s' doesn't match the start tag '%s'",
	58: "Static node (x-html) must have some content",
	*/
	// rollup-plugin.js
	/*
	60: "Tag not supported: '%s'",
	61: "The <template> tag requires a name attribute",
	62: "Unresolved tag: '%s'. Please import the implementation in camel case! Ex: \nimport '%s' from 'some-module'",
	*/
	// xtags-parser.js
	/*
	70: "Bug?",
	72: "Invalid qute file: No closing </'%s'> found.",
	73: "Invalid qute file: Found closing tag '%s'. Expecting '%s'",
	*/
	// binding.js
	//80: "Invalid x-radio expression: '%s'. Must be a tag name with a class. Ex: li.active"
};

Qute.Compiler = Compiler;
Qute.compile = function(text, symbols) {
	return new Compiler().compileFn(text, symbols);
};

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
};

Qute.Loader = Loader;
Qute.loadScripts = function() {
	new Loader().load();
};

export default Qute;
//# sourceMappingURL=index.esm.js.map
