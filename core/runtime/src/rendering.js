import {document} from '@qutejs/window';
import {ERR} from '@qutejs/commons';

import {applyListeners, applyEmitters, SetFixedClass, SetComputedClass, InheritClass, SetQClass, AddClass, SetStyle,
			SetDisplay, SetToggle, SetText, SetInnerHTML, SetAttr, UpdateUserDom} from './binding.js';
import { filterKeys } from './utils.js';
import {applyUserDirectives} from './q-attr.js';
import ListFragment from './list-fragment.js';
import SwitchFragment from './switch-fragment.js';
import ForFragment from './for-fragment.js';
import FunComp from './func.js';

const converters = {};
// q:attrs values are already evaluated - so the injected values are liiterals
function SetDOMAttrs(el, model, filter) {
	return function() {
		var $attrs = model.$attrs;
		if ($attrs) {
			var keys = filterKeys($attrs, filter);
			for (var i=0,l=keys.length; i<l; i++) {
                var key = keys[i];
                if (key === 'class') {
                    // the class is handled apart to sync with q:class and other dynamkic class changes
                    InheritClass(el, $attrs[key]);
                } else {
                    el.setAttribute(key, $attrs[key]);
                }
			}
		}
	}
}

function appendChildren(parent, children) {
	for (var i=0, l=children.length; i<l; i++) parent.appendChild(children[i]);
}

function extractSlots(children) {
	if (children && children.length) {
		var namedSlots = {}, nestedCnt = 0, hasContent = false;
		for (var i=0,l=children.length; i<l; i++) {
			var child = children[i];
			var nodeType = child.nodeType;
			switch (nodeType) {
				case 1:
					if (child.__qute_slot__) {
						var slotChildren = [];
						var slot = child.__qute_slot__;
						if (slot.startsWith('nested:')) {
							// a fragment
							slot = slot.substring(7);
							var node = child.firstChild;
							while (node) {
								slotChildren.push(node);
								node = node.nextSibling;
							}
						} else { // use the element itself to inject in the target slot
							slotChildren.push(child);
						}
						namedSlots[slot] = slotChildren;
						nestedCnt++;
					} else {
						hasContent = true;
					}
					break;
				case 3:
					if (child.nodeValue.trim()) hasContent = true;
					break;
			}
		}
		if (nestedCnt) {
			return namedSlots;
		} else if (hasContent) { // default slot
			namedSlots.default = children;
			return namedSlots;
		}
	}
	return null;
}



var RenderingProto = {
    cvt: function(content, type) { // used by $html top convert markdown to html
        var converter = converters[type];
        if (!converter) {
            ERR("Unknown converter: %s", type);
        }
        return converter(content, this);
    },
	x: function(expr) { // expression {{ ... }}
		var text = expr(this.model);
		var el = document.createTextNode(text);
		this.up(SetText(el, this.model, expr));
		return el;
    },
    // check for udefied ad ull values ad out put ''
    u: function(value) {
        return value == null ? '' : value;
    },
	t: function(value) { // text
		return document.createTextNode(value);
	},
	g: function(isFn, xattrs, children) { // dynamic tag using 'is'
        var tagOrFn = isFn(this.model);
        if (!tagOrFn) {
            ERR('<q:tag> directive failed: "is" attribute resolve to a falsy value');
        }
        return typeof tagOrFn === 'string' ? this.h(tagOrFn, xattrs, children) : this.c(tagOrFn, xattrs, children);
	},
    h: function(tag, xattrs, children, svg) { // dom node
		var el = svg ? document.createElementNS('http://www.w3.org/2000/svg', tag)
            : document.createElement(tag), $use = null;
		if (xattrs) {
			var model = this.model;
			if (xattrs.$use) {
				$use = applyUserDirectives(this, xattrs, el);
            }
			for (var key in xattrs) {
				var up = null;
                var val = xattrs[key];
                if (key.charCodeAt(0) === 36) { // $ - extended attribute
					if (key === '$on') {
						applyListeners(el, model, val);
					} else if (key === '$class') {
						up = SetQClass(el, model, val);
					} else if (key === '$style') {
						up = SetStyle(el, model, val);
					} else if (key === '$show') {
						up = SetDisplay(el, model, val);
					} else if (key === '$toggle') {
						up = SetToggle(el, model, val);
					} else if (key === '$html') {
                        up = SetInnerHTML(el, model, val);
					} else if (key === '$attrs') {
						up = SetDOMAttrs(el, model, val);
					} else if (key === '$emit') {
						applyEmitters(el, model, val);
					} else if (key === '$slot') {
						el.__qute_slot__ = val;
					} else if (key === '$ref') {
						this.model[val] = el;
                    }
                } else if (key === 'class') {
                    // special handling of classes to sync with inherited class and q:class
                    if (typeof val === 'function') {
                        up = SetComputedClass(el, model, val);
                    } else {
                        SetFixedClass(el, val);
                    }
				} else if (typeof val === 'function') { // a dynamic binding
                    up = SetAttr(el, model, key, val);
                } else {
					el.setAttribute(key, val);
				}
				if (up) {
					this.up(up)(); // push then execute
				}
            }
        }

		if (children) appendChildren(el, children);
		// we should apply any user directive after the children are added.
		if ($use) {
			$use(this, el);
		}
		return el;
	},
	// element with static children (innerHTML is set from the subtree)
	hh:function(tag, xattrs, content, type) {
		var el = this.h(tag, xattrs);
		if (type) { // convert can be a function to convert the content before injecting in the dom
			var converter = converters[type];
			if (!converter) {
				ERR("Unknown converter: %s", type);
			}
			content = converter(content, this);
		}
		el.innerHTML = content;
		return el;
    },
    // a component
    c: function(renderFn, xattrs, children) {
        if (!renderFn) { // recursivity -> use the current render fn
            var vm = this.closestVM(); //TODO impl a closestComp? to support fucnctional templates too?
            if (!vm) ERR('Calling "self" is only allowed inside a Viewodel context');
            renderFn = vm.constructor;
        }
        return this._c(renderFn, xattrs, extractSlots(children));
    },
	// vm component
    _c: function(XTag, xattrs, slots) { // a vm component (viewmodel)
        if (typeof XTag !== 'function') {
            ERR('component tag is not a function: %s', XTag);
        }
		if (XTag.prototype && XTag.prototype.__QUTE_VM__) { // a ViewModel
			var vm = new XTag(this.model.$app);
			return vm.$create(this, xattrs, slots);
		} else if (XTag.$compiled) { // a compiled template
			return new FunComp().render(this, XTag, xattrs, slots);
        } else { // a hand written function or a lazy component
			return XTag(this, xattrs, slots);
        }
	},
	s: function(slotName, defaultChildren) {
		var model = this.model;
		var slots = model.$slots;
		var children = slots && slots[slotName || 'default'] || defaultChildren;
		if (children) {
			const frag = document.createDocumentFragment();
			appendChildren(frag, children);
			return frag;
		}
		return document.createComment('[slot/]'); // placeholder
	},
	o: function(slotName, children) { // outer slot
		const slots = this.model.$slots;
		if (slots && slots[slotName] && children) {
			const frag = document.createDocumentFragment();
			appendChildren(frag, children);
			return frag;
		}
		return document.createComment('[outer-slot/]'); // placeholder
	},
	v: function(isExpr, changeCb, noCache, xattrs, childrenFn) { // dynamic view
		var renderFn = function(r, key) {
			return key ? r.c(key, xattrs, childrenFn(r)) : null;
		}
		return new SwitchFragment(this, 'view', isExpr, renderFn, changeCb, noCache).$create();
	},
	i: function(ifChain, kidsChain, changeCb) { // if / else-if / else
		// ifChain is a list of if expression functions corresponding to if / if-else else chain.
		// When 'else' is present - the last expression corresponding to the else will be null
		// kidsChain is a list of children functions corresponding to if / else-if / else chain
		// both lists have the same when length. When only 'if' is present the list is of length 1.
		var exprFn = function(model) {
			var i = 0;
			for (var l=ifChain.length-1; i<l; i++) {
				if (ifChain[i](model)) return i;
			}
			var lastExpr = ifChain[i];
			// if lastExpr is null is is corresponding to an else statement
			return !lastExpr || lastExpr(model) ? i : -1;
		}
		var renderFn = function(r, key) {
			return key > -1 ? kidsChain[key](r) : null;
		}
		return new SwitchFragment(this, 'if', exprFn, renderFn, changeCb).$create();
	},
	// dynamic lists - which is updating only items that changed
	l: function(listFn, iterationFn, key) {
		return new ListFragment(this, listFn, iterationFn, key).$create();
	},
	// static array variant of lists - this cannot be updated it is rendered once at creation
	a: function(listFn, iterationFn) {
		return new ForFragment(this, listFn, iterationFn).$create();
	},
	// dom element or fragment generated using custom user code.
	z: function(valueFn, frozen) {
		const value = valueFn(this.model);
		const start = document.createComment('[dom]');
		const end = document.createComment('[/dom]');
		const frag = document.createDocumentFragment();
		frag.appendChild(start);
		value && frag.appendChild(value);
		frag.appendChild(end);
		if (!frozen) { // if not frozen register update function
			this.up(UpdateUserDom(valueFn, this.model, start, end));
		}
		return frag;
	},
	up: function(fn) { // register a live update function
		this.ups.push(fn);
		return fn;
	},
	// eval the value of an xattr given the key - if a function invoke the function within the current context otherwise return the value as is
	eval: function(xattr) {
		return typeof xattr === 'function' ? xattr(this.model) : xattr;
	},

	// connect all nested renderings
	connect: function() {
		if (!this.isc) {
			var vm = this.vm;
			// before connect
			vm && vm.willConnect && vm.willConnect();
			var kids = this.kids;
			for (var i=0,l=kids.length; i<l; i++) kids[i].connect();
			this.isc = true;
			// after connect
			vm && vm.connected && vm.connected();
		}
		return this;
	},
	// disconnect all nested renderings
	disconnect: function() {
		if (this.isc) {
			var vm = this.vm;
			// before disconnect
			vm && vm.willDisconnect && vm.willDisconnect();
			var kids = this.kids;
			for (var i=0,l=kids.length; i<l; i++) kids[i].disconnect();
			this.isc = false;
			vm && vm.disconnected && vm.disconnected();
		}
		return this;
	},
	$push: function(r) { // push a sub-renderings
		this.kids.push(r);
		if (this.isc) r.connect();
	},
	// refresh the DOM - call all nested update functions
	update: function() {
		var model = this.model, ups = this.ups;
		for (var i=0,l=ups.length;i<l;i++) ups[i](model);
		return this;
	},

	// run dom update recursively on each nested rendering
	refresh: function() {
		this.update();
		var kids = this.kids;
		for (var i=0,l=kids.length; i<l; i++) {
			var kid = kids[i];
			kid.refresh && kid.refresh();
		}
	},

	// create a child rendering
	spawn: function(model) {
		return new Rendering(this, model || this.model);
	},

	// get the closest VM in current rendering, ignore renderings which are not bound to ViewModel objects (functional compjents etc)
	closestVM: function() {
		var r = this;
		do {
			if (r.vm) return r.vm;
			r = r.parent;
		} while (r);
		return null;
	},
	// to be used by custom directives to safely add fixed class names to an element
	addClass(el, className) {
		AddClass(el, className);
	},
	get app() {
		return this.model.$app;
	}
}

function Rendering(parent, model) {
	this.parent = parent;
	/*
	 the model to use when rendering. The model should provide the following props:
	 	$app,
	 	$attrs,
	 	$slots
	 	and other data properties
	 */
	this.model = model;
	/*
	The associated ViewModel component if any. The VM contract is to provide the following methods:
	1. willConnect
	2. connected
	3. willDisconnect
	4. disconnected
	*/
	this.vm;
	this.ups = []; // the update listeners
	/*
	  Sub-rendering objects if any
	  A rendering object must provide the following functions:
	  	connect
	  	disconnect
	  	$update
	  	refresh
	*/
	this.kids = [];
	this.isc = false; // is connected?
}
Rendering.prototype = RenderingProto;

Rendering.FunComp = FunComp;
// make the bindings visible to component implementors
// add more bindigns here if needed
Rendering.SetAttr = SetAttr;
Rendering.SetDisplay = SetDisplay;
Rendering.converters = converters;
export default Rendering;
