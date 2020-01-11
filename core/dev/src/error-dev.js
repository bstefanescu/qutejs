import Qute from '@qutejs/runtime';

var PRINT_RX = /%s/g;
function print(text) {
	var i = 1, args = arguments;
	return text.replace(PRINT_RX, function(match, p1) {
		return args[i++];
	});
}

Qute.ERR.resolve = function (code) {
	var text = errors[code];
	if (!text) text = "Qute Error: "+code;
	else {
		var args = Array.prototype.slice.call(arguments);
		args[0] = text;
		text = print.apply(null, args);
	}
	throw new Error(text);
}

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
	22: "Unknown user attribute directive: '%s'",
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

export default ERR;
