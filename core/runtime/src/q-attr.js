import ERR from './error.js';
import {findDirective} from './registry.js';


// el is defined only when called on a DOM element
export default function applyUserDirectives(rendering, tag, xattrs, el) {
	var xcall, fns = [], directives = xattrs.$use;
	for (var key in directives) {
		var val = directives[key];
		if (key === '@') { // an x-call
			xcall = val;
		} else {
			var userDir = findDirective(tag, key);
			if (!userDir) {
				ERR("Unknown user attribute directive: '%s'", key);
			}
			var fn = userDir.call(rendering, xattrs, val===true?undefined:val, el);
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

