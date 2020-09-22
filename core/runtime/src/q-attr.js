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
        var tagOrFn = arguments[0]; // the constructor for VM comps or the rendering fucntion for template comps
        var name = arguments[1];
        var dirFn = arguments[2];
        if (typeof tagOrFn === 'function') {
            if (!tagOrFn.$atdirs) {
                tagOrFn.$atdirs = {};
            }
            tagOrFn.$atdirs[name] = dirFn;
        } else {
            ATTRS[tagOrFn+':'+name] = dirFn;
        }
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
            var userDir;
            if (typeof tag === 'function') {
                userDir = tag.$atdirs && tag.$atdirs[key];
            } else {
                userDir = findDirective(tag, key);
            }
			if (!userDir) {
                userDir = ATTRS[key];
                if (!userDir) {
                    ERR("Unknown custom attribute directive: '%s'", key);
                }
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

