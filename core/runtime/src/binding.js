import window from '@qutejs/window';
import { closestComp } from '@qutejs/commons';
import { stopEvent } from './utils.js';

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

export function SetClass(elt, model, valFn) {
	return function() {
        var value = valFn(model)
        if (!value) return;
        if (elt.__qute_class__ == null) {
            // not yet set
            elt.__qute_class__ = elt.className || ''; // backup origial class
        }
        var out = elt.__qute_class__ ? [ elt.__qute_class__ ] : [];
        var newClasses = _stringifyClasses(out, value);
        if (newClasses !== elt.className) { // only if modified
            elt.className = newClasses;
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



function retargetEvent(el, model, srcEvent, toEvent, detailFn, isAsync) {
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
				detail: detailFn ? detailFn(model) : e
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
