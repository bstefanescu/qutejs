import ERR from './error.js';
import {findDirective} from './registry.js';



export default function applyUserDirectives(rendering, tag, xattrs) {
	var xcall, fns = [], directives = xattrs.$use;
	for (var key in directives) {
		var val = directives[key];
		if (key === '@') { // an x-call
			xcall = val;
		} else {
			var userDir = findDirective(tag, key);
			if (!userDir) {
				ERR(50, key);
			}
			var fn = userDir.call(rendering, xattrs, val===true?undefined:val);
			if (fn) fns.push(fn)
		}
	}
	return (xcall || fns.length) && function(rendering, el) {
		if (xcall) xcall.call(rendering.vm, el);
		for (var i=0,l=fns.length; i<l; i++) {
			fns[i].call(rendering, el);
		}
	}
}

