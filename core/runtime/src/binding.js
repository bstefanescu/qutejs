import window from '@qutejs/window';
import { closestComp } from '@qutejs/commons';
import { stopEvent } from './utils.js';


function bindStyle(elt, value) {
	if (!value) return;
	var style = elt.style;
	if (Array.isArray(value)) {
		for (var i=0,l=value.length; i<l; i++) {
			Object.assign(style, value[i]);
		}
	} else { // an object
		Object.assign(style, value);
	}

}

// the listeners injected from a vm to a nested functional view
// must run in parent vm, context not in functional view context!
// This is why we need to use the vm from the closure scope when the listener was created
export function createListener(vm, fn) {
	return function(e) {
		if (fn.call(vm, e) === false) {
			stopEvent(e);
		}
	};
}

export function applyListeners(el, vm, listeners) {
	for (var key in listeners) {
		var fn = listeners[key];
		el.addEventListener(key, createListener(vm, fn));
	}
}


export function SetText(el, model, expr) {
	return function() {
		var val = expr(model);
		if (val !== el.nodeValue) {
			el.nodeValue = val;
		}
	}
}

export function SetAttr(el, model, key, valFn) {
	return function(changedKey) {
		//if (!changedKey || changedKey === key) {
			var val = valFn(model);
			if (el.getAttribute(key) !== val) {
				if (val == null) {
					el.removeAttribute(key);
				} else {
					el.setAttribute(key, val);
				}
			}
		//}
	}
}

/*
export function SetBindings(el, model, bindFn) {
	return function(changedKey) {
		var bindings = bindFn(model);
		for (var key in bindings) {
			var val = bindings[key];
			if (el.getAttribute(key) !== val) {
				el.setAttribute(key, val);
			}
		}
	}
}
*/
export function SetInnerHTML(el, model, valFn) {
	return function() {
		var val = valFn(model);
		if (el.innerHTML !== val) {
			el.innerHTML = val || '';
		}
	}
}

export function SetDisplay(el, model, valFn) {
	return function() {
		var val = valFn(model);
		var display = el.style.display;
		// backup the current diaply when toggliong OFF to be able to restore if needed
		if (val) {
			if (display === 'none') {
				el.style.display = el.__qute_display || ''; // remove 'none'
			}
		} else if (display !== 'none') {
			if (el.__qute_display == null) el.__qute_display = display;
			el.style.display = 'none';
		}
	}
}


export function SetToggle(el, model, valFn) {
	// valFn returns a map of attr keys to values
	return function() {
		var attrs = valFn(model);
		var keys = Object.keys(attrs);
		for (var i=0,l=keys.length;i<l;i++) {
			var key = keys[i];
			if (attrs[key]) {
				el.setAttribute(key, key);
			} else {
				el.removeAttribute(key);
			}
		}
	}
}

export function SetStyle(el, model, valFn) {
	return function() {
		//TODO only if modified
		bindStyle(el, valFn(model));
	}
}

export function SetProp(vm, model, key, valFn) {
	return function(changedKey) {
		//if (!changedKey || changedKey === key) {
			vm.$set(key, valFn(model));
		//}
	}
}


/*
flags is a bitset:
- bit 0 is storing the isAsync attribute: if 1 isAsync is true, otherwise if 0 isAsync is false
- bit 1 is storing the detailFactory attribute: if 1 the detail is a function which takes the original event as argument and return the detail, otherwise if 0 the detail is a regular model value function
if (flags & 1) =>  is async
if (flags & 2)
*/
function retargetEvent(el, model, srcEvent, toEvent, detailFn, flags) {
    const isAsync = flags & 1;
    const isDetailFactory = flags & 2;
	el.addEventListener(srcEvent, function(e) {
		// avoid infinite loop when emiting from a component root element a
		// custom event with the same name of the original event
		if (e.$originalEvent && e.$originalTarget === el) {
			if (e.$originalEvent.type === srcEvent) return;
		}

		var comp = closestComp(el);
		if (comp) {
            var targetEl = comp.$el;
			var newEvent = new window.CustomEvent(toEvent, {
				bubbles: e.bubbles,
				detail: detailFn ? (isDetailFactory ? detailFn.call(model, e) : detailFn(model)) : model
			});
			newEvent.$originalEvent = e;
			newEvent.$originalTarget = el;
			e.stopImmediatePropagation();
			e.preventDefault();
			if (isAsync) {
				window.setTimeout(function() {
					targetEl.dispatchEvent(newEvent);
				}, 0);
			} else {
				targetEl.dispatchEvent(newEvent);
			}
		}
	});
}

export function applyEmitters(el, model, ar) {
	for (var i=0,l=ar.length; i<l; i+=4) {
		retargetEvent(el, model, ar[i+1], ar[i], ar[i+2], ar[i+3]);
	}
}

// ------- Element class handling -------

function _addClassesFromObject(classes, value) {
	var keys = Object.keys(value);
	for (var i=0,l=keys.length; i<l; i++) {
		var key = keys[i];
		if (value[key]) classes.push(key);
	}
}
function _stringifyClasses(out, value) {
	if (Array.isArray(value)) {
		for (var i=0,l=value.length; i<l; i++) {
			var val = value[i];
			if (val) {
				if (typeof val === 'string') {
                    out.push(val);
                } else { // an object?
					_addClassesFromObject(out, val);
				}
			}
		}
	} else { // an object
		_addClassesFromObject(out, value);
    }
    return out.join(' ');
}

export function ClassHandler(fixedClassName) {
    // 0 - fixed or computed part set through class attribute,
    // 1 - dynamic part set through q:class
    // 2 - fixed or computed part inherited from parent component element through q:attrs
    // 3 - dyanmic part inhertied from parent component element through q:class if any
    this.parts = [fixedClassName || '','','',''];
    this.dirty = false;
}
ClassHandler.prototype = {
	// append class names to the fixed part
	add(className) {
		let fixedPart = this.parts[0];
		if (fixedPart) {
			fixedPart += ' '+className;
		} else {
			fixedPart = className;
		}
		this.parts[0] = fixedPart;
        this.dirty = true;
        return this;
	},
    attr(className) {
        if (this.parts[0] !== className) {
            this.parts[0] = className;
            this.dirty = true;
        }
        return this;
    },
    qclass(expr) {
        const className = _stringifyClasses([], expr);
        if (this.parts[1] !== className) {
            this.parts[1] = className;
            this.dirty = true;
        }
        return this;
    },
    iattr(className) { // inject class literal from q:attrs (inherited class attribute)
        if (this.parts[2] !== className) {
            this.parts[2] = className;
            this.dirty = true;
        }
        return this;
    },
    iqclass(expr) {
        const className = _stringifyClasses([], expr);
        if (this.parts[3] !== className) {
            this.parts[3] = className;
            this.dirty = true;
        }
        return this;
    },
    apply(el) {
        if (this.dirty) {
            el.className = this.parts.join(' ').trim();
            this.dirty = false;
        }
    }
}

// to be used by user directives to append fixed class on an element
export function AddClass(elt, value) {
    if (elt.__qute_clh__) {
        elt.__qute_clh__.add(value).apply(elt);
    } else {
        elt.className = value;
    }
}

export function SetFixedClass(elt, value) {
    if (elt.__qute_clh__) {
        elt.__qute_clh__.attr(value).apply(elt);
    } else {
        elt.className = value;
    }
}

export function SetComputedClass(elt, model, valFn) {
    if (!elt.__qute_clh__) {
        elt.__qute_clh__ = new ClassHandler(elt.className);
    }
	return function() {
        var value = valFn(model);
        elt.__qute_clh__.attr(value || '').apply(elt);
	}
}

export function InheritClass(elt, className) {
    if (!elt.__qute_clh__) {
        elt.__qute_clh__ = new ClassHandler(elt.className);
    }
    elt.__qute_clh__.iattr(className).apply(elt);
}

export function SetQClass(elt, model, valFn) {
    if (!elt.__qute_clh__) {
        elt.__qute_clh__ = new ClassHandler(elt.className);
    }
	return function() {
        var value = valFn(model);
        elt.__qute_clh__.qclass(value || '').apply(elt);
	}
}

export function InheritQClass(elt, model, valFn) {
    if (!elt.__qute_clh__) {
        elt.__qute_clh__ = new ClassHandler(elt.className);
    }
	return function() {
        var value = valFn(model);
        elt.__qute_clh__.iqclass(value || '').apply(elt);
	}
}
