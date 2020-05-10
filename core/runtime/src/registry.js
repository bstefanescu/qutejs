import { LazyComponent } from './importer.js';

var IMPORTS = {};
var ALIASES = {};
var VMS = {};
var XTAGS = {};
var ATTRS = {};

export const converters = {};

export function QName(tag) {
	var i = tag.indexOf(':');
	if (i > -1) {
		var prefix = tag.substring(0, i);
		this.prefix = prefix;
		this.localName = tag.substring(i+1);
		this.name = tag;
		this.defaultNs = prefix === 'q';
	} else {
		this.prefix = 'q';
		this.localName = tag;
		this.name = 'q:'+tag;
		this.defaultNs = true;
	}
}

export function getTag(tag) {
    var target = ALIASES[tag] || tag;
	return XTAGS[target];
}


export function registerTag(tag, templateFn, isCompiled) {
	var qname = new QName(tag);
	templateFn.$qname = qname;
	templateFn.$compiled = !!isCompiled;
	templateFn.$tag = tag;
	XTAGS[qname.name] = templateFn;
	if (qname.defaultNs) {
		XTAGS[qname.localName] = templateFn;
	}
	return templateFn;
}

export function getVM(tag) {
    var target = ALIASES[tag] || tag;
	return VMS[target];
}

export function registerVM(tag, vm) {
	var qname = new QName(tag);
	VMS[qname.name] = vm;
	if (qname.defaultNs) {
		VMS[qname.localName] = vm;
	}
	return qname;
}

// do not use aliases neither imports
function _getVMOrTag(tag) {
    return VMS[tag] || XTAGS[tag];
}

export function getVMOrTag(tag) {
    var target = ALIASES[tag] || tag;
    var comp = VMS[target] || XTAGS[target];
    if (!comp) {
        // may be a lazy component?
        var imports = IMPORTS[target];
        if (imports) {
            comp = LazyComponent(target, imports, _getVMOrTag);
        }
    }
	return comp;
}

export function addImports(map) {
    Object.assign(IMPORTS, map);
}

export function getDirective(key) {
	return ATTRS[key];
}

export function findDirective(tag, name) {
	return ATTRS[tag+':'+name] || ATTRS[name];
}

export function registerDirective(/*[tag, ]name, dirFn*/) {
	if (arguments.length === 3) {
		ATTRS[arguments[0]+':'+arguments[1]] = arguments[2];
	} else {
		ATTRS[arguments[0]] = arguments[1];
	}
}

export function snapshotRegistry() {
	return {VMS: Object.assign({}, VMS), XTAGS: Object.assign({}, XTAGS)};
}

export function restoreRegistry(snapshot) {
	VMS = snapshot.VMS;
	XTAGS = snapshot.XTAGS;
}

export function addAliases(aliasMap) {
    Object.assign(ALIASES, aliasMap);
}
