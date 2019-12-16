

var VMS = {};
var XTAGS = {};

export function getTag(tag) {
	return XTAGS[tag];
}

export function registerTag(tag, templateFn, isCompiled) {
	XTAGS[tag] = templateFn;
	templateFn.$compiled = !!isCompiled;
	templateFn.$tag = tag;
	return templateFn;
}

export function getVM(tag) {
	return VMS[tag];
}

export function registerVM(tag, vm) {
	VMS[tag] = vm;
}

export function getVMOrTag(tag) {
	return VMS[tag] || XTAGS[tag];
}

export function snapshotRegistry() {
	return {VMS: Object.assign({}, VMS), XTAGS: Object.assign({}, XTAGS)};
}

export function restoreRegistry(snapshot) {
	VMS = snapshot.VMS;
	XTAGS = snapshot.XTAGS;
}
