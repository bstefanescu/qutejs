

var VMS = {};
var XTAGS = {};

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
	return XTAGS[tag];
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
	return VMS[tag];
}

export function registerVM(tag, vm) {
	var qname = new QName(tag);
	VMS[qname.name] = vm;
	if (qname.defaultNs) {
		VMS[qname.localName] = vm;
	}
	return qname;
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
