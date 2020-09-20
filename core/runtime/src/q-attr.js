import {ERR} from '@qutejs/commons';

var ATTRS = {};

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

// el is defined only when called on a DOM element
export function applyUserDirectives(rendering, tag, xattrs, compOrEl) {
	var xcall, fns = [], directives = xattrs.$use;
	for (var key in directives) {
		var val = directives[key];
		if (key === '@') { // an q:call
			xcall = val;
		} else {
			var userDir = findDirective(tag, key);
			if (!userDir) {
				ERR("Unknown user attribute directive: '%s'", key);
			}
			var fn = userDir.call(rendering, xattrs, val===true?undefined:val, compOrEl);
			if (fn) fns.push(fn)
		}
	}
	return (xcall || fns.length) && function(rendering, el) {
		if (xcall) xcall.call(rendering.model, el);
		for (var i=0,l=fns.length; i<l; i++) {
			fns[i].call(rendering, el);
		}
	}
}

