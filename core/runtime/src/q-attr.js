
// el is defined only when called on a DOM element
export function applyUserDirectives(rendering, xattrs, el, comp) {
    var xcall, fns = [], directives = xattrs.$use;
    for (let i=0,l=directives.length; i<l; i+=2) {
        const userDir = directives[i];
        const val = directives[i+1];
        if (!userDir) { // a q:call
            xcall = val;
        } else if (userDir === 'id') { // a q:id
            rendering.app.publish(val, comp || el);
            return null;
        } else {
            const fn = userDir.call(rendering, xattrs, val, el, comp);
			if (fn) fns.push(fn);
        }
    }
	return (xcall || fns.length) && function(rendering, el) {
		if (xcall) xcall.call(rendering.model, el);
		for (var i=0,l=fns.length; i<l; i++) {
			fns[i].call(rendering, el);
		}
	}
}
