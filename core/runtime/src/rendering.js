import {document} from '@qutejs/window';
import ERR from './error.js';

import App from './app.js';
import { getVMOrTag, getVM, converters } from './registry.js';
import {applyListeners, createListeners, createListener, SetClass, SetStyle,
			SetDisplay, SetToggle, SetText, SetInnerHTML, SetAttr} from './binding.js';
import { filterKeys } from './utils.js';
import Emitter from './emit.js';
import applyUserDirectives from './q-attr.js';
import ListFragment from './list-fragment.js';

import FunComp from './func.js';

function SetDOMAttrs(el, model, filter) {
	return function() {
		var $attrs = model.$attrs;
		if ($attrs) {
			var keys = filterKeys($attrs, filter);
			for (var i=0,l=keys.length; i<l; i++) {
				var key = keys[i];
				el.setAttribute(key, $attrs[key]);
			}
		}
	}
}

function ViewRenderingContext(rendering, marker, isExpr, changeCb, noCache, xattrs, childrenFn) {
	var model = rendering.vm;
	var cache = noCache ? null : {};
	var r = null; // the view rendering context
	var cview = null; // current element
	return function(propKey, initialUpdate) {
		var el, viewXTag = isExpr(model);
		if (viewXTag !== cview) {
			var parent = marker.parentNode;
			if (r) {
				r.$disconnect();
				parent.removeChild(marker.previousSibling);
			}
			if (viewXTag) {
				r = cache && cache[viewXTag];
				if (!r) {
					r = rendering.spawn(model);
					if (cache) cache[viewXTag] = r;
				}
				el = r.r(viewXTag, xattrs, childrenFn(r));
				parent.insertBefore(el, marker);
				r.$connect();
			} else {
				r = null;
			}

			if (changeCb && !initialUpdate) { // avoid calling changeCb the first time the if is rendered
				changeCb.call(model, el && el.__qute__);
			}
			cview = viewXTag;
		} else if (r) {
			// only update children
			r.$update();
		}
	}
}

function evalIfChain(exprs, model) {
	var i = 0;
	for (var l=exprs.length-1; i<l; i++) {
		if (exprs[i](model)) return i;
	}
	var lastExpr = exprs[i];
	// if lastExpr is null is is corresponding to an else statement
	return !lastExpr || lastExpr(model) ? i : -1;
}


function IfRenderingContext(rendering, start, end, exprs, kids, changeCb) {
	var model = rendering.vm;
	var r = null; // the IF / ELSE-IF / ELSE rendering context
	var state = -1; // the current case of IF / ELSE-IF / ELSE as the zero based index of the chain (0 for if, 1 for next else-if, ...)
	return function(propKey, initialUpdate) {
		var newState = evalIfChain(exprs, model);
		if (newState !== state) {
			r && r.$disconnect();
			var parent = start.parentNode;
			// remove current if branch
			while (start.nextSibling && start.nextSibling !== end) {
				parent.removeChild(start.nextSibling);
			}
			r = rendering.spawn(model); // create the IF / ELSE rendering context
			state = newState;
			if (state > -1) {
				var children = kids[state](r);
				for (var i=0,l=children.length; i<l; i++) {
					parent.insertBefore(children[i], end);
				}
			}
			r.$connect();
			if (changeCb && !initialUpdate) { // avoid calling changeCb the first time the if is rendered
				changeCb.call(model, state);
			}
		} else if (r) {
			// only update children
			r.$update();
		}
	}
}

function ForRenderingContext(rendering, start, end, listFn, iterationFn) {
	var model = rendering.vm;
	var r = null; // the for rendering context
	var list = null; // the current list
	return function(propKey) {
		var newList = listFn(model);
		if (newList !== list) {
			r && r.$disconnect();
			var parent = start.parentNode;
			// remove current for content
			while (start.nextSibling && start.nextSibling !== end) {
				parent.removeChild(start.nextSibling);
			}
			r = rendering.spawn(model); // create the FOR rendering context
			list = newList;
			// render content
			if (list) {
				if (!Array.isArray(list)) {
					list = Object.keys(list);
				}
				if (list.length > 0) {
					var l = list.length-1;
					for (var i=0; i<l; i++) {
						var children = iterationFn(list[i], i, true);
						if (children) {
							for (var k=0,ll=children.length; k<ll; k++) {
								parent.insertBefore(children[k], end);
							}
						}
					}
					var children = iterationFn(list[i], i, false);
					if (children) {
						for (var i=0,l=children.length; i<l; i++) {
							parent.insertBefore(children[i], end);
						}
					}
				}
			}
			r.$connect();
		} else if (r) {
			// just update children
			r.$update();
		}
	}
}

function isVM(obj) {
	return obj && obj.prototype && obj.prototype.__VM__;
}

function appendChildren(parent, children) {
	for (var i=0, l=children.length; i<l; i++) parent.appendChild(children[i]);
}
function removeRange(from, to) {
	var parent = from.parentNode;
	while (from.nextSibling && from.nextSibling !== to) {
		parent.removeChild(from.nextSibling);
	}
}

function extractSlots(children) {
	if (children && children.length) {
		var namedSlots = {}, nestedCnt = 0, hasContent = false;
		for (var i=0,l=children.length; i<l; i++) {
			var child = children[i];
			var nodeType = child.nodeType;
			switch (nodeType) {
				case 1:
					if (child.nodeName === 'NESTED' || child.nodeName === 'Q:NESTED') { // select only 'nested' elements
						var slot = child.getAttribute('name') || 'default';
						var slotChildren = [];
						var node = child.firstChild;
						while (node) {
							slotChildren.push(node);
							node = node.nextSibling;
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

// ==============================================


var RenderingProto = {
	x: function(expr) { // expression {{ ... }}
		var text = expr(this.vm);
		var el = document.createTextNode(text);
		this.up(SetText(el, this.vm, expr));
		return el;
	},
	t: function(value) { // text
		return document.createTextNode(value);
	},
	g: function(isFn, xattrs, children) { // dynamic tag using 'is'
		var tag = isFn(this.vm);
		var XTag = getVMOrTag(tag);
		return XTag ? this.v(XTag, xattrs, children) : this.h(tag, xattrs, children);
	},
	h: function(tag, xattrs, children) { // dom node
		var el = document.createElement(tag), $use = null;
		if (xattrs) {
			var vm = this.vm;
			if (xattrs.$use) {
				$use = applyUserDirectives(this, tag, xattrs, el);
			}
			for (var key in xattrs) {
				var up = null;
				var val = xattrs[key];
				if (key.charCodeAt(0) === 36) { // $ - extended attribute
					if (key === '$on') {
						applyListeners(el, vm, val);
					} else if (key === '$class') {
						up = SetClass(el, vm, val);
					} else if (key === '$style') {
						up = SetStyle(el, vm, val);
					} else if (key === '$show') {
						up = SetDisplay(el, vm, val);
					} else if (key === '$toggle') {
						up = SetToggle(el, vm, val);
					} else if (key === '$html') {
						up = SetInnerHTML(el, vm, val);
					} else if (key === '$attrs') {
						up = SetDOMAttrs(el, vm, val);
					} else if (key === '$listeners') {
						//TODO filter like for $attrs
						//TODO value must be a function ... and not use directly vm.$listeners
						applyListeners(el, vm, vm.$listeners, true); // do not wrap listeners fns (already wrapped by the parent context)
						//TODO
					} else if (key === '$channel') {
						ERR(28, tag);
					} else if (key !== '$use') {
						ERR(26, key);
					}
				} else if (typeof val === 'function') { // a dynamic binding
					up = SetAttr(el, vm, key, val);
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
				ERR(27, type);
			}
			content = converter(content, this);
		}
		el.innerHTML = content;
		return el;
	},
	r: function(tag, xattrs, children) {
		var XTag = getVMOrTag(tag);
		if (!XTag) ERR(23, tag);
		return this._v(XTag, xattrs, extractSlots(children));
	},
	v: function(XTag, xattrs, children) { // xtag is specified as a func reference. TODO No more used
		return this._v(XTag, xattrs, extractSlots(children));
	},
	// vm component
	_v: function(XTag, xattrs, slots) { // a vm component (viewmodel)
		if (isVM(XTag)) {
			var vm = new XTag(this.vm.$app);
			return vm.$create(this, xattrs, slots);
		} else if (XTag.$compiled) { // a compiled template
			return new FunComp().render(this, XTag, xattrs, slots);
		} else { // a hand written function
			return XTag(this, xattrs, slots);
		}
	},
	s: function(slotName, defaultChildren) {
		var vm = this.vm;
		var slots = vm.$slots;
		var children = slots && slots[slotName || 'default'] || defaultChildren;
		if (children) {
			var frag = document.createDocumentFragment();
			appendChildren(frag, children);
			return frag;
		}
		return document.createComment('[slot/]'); // placeholder
	},
	w: function(isExpr, changeCb, noCache, xattrs, childrenFn) { // dynamic view
		var marker = document.createComment('[view/]');
		var frag = document.createDocumentFragment();
		frag.appendChild(marker);
		var viewFrag = ViewRenderingContext(this, marker, isExpr, changeCb, noCache, xattrs, childrenFn)
		marker.__qute__ = viewFrag;
		viewFrag(null, true);
		this.up(viewFrag);
		return frag;
	},
	i: function(ifChain, kidsChain, changeCb) { // if / else-if / else
		// ifChain is a list of if expression functions corresponding to if / if-else else chain.
		// When 'else' is present - the last expression corresponding to the else will be null
		// kidsChain is a list of children functions corresponding to if / else-if / else chain
		// both lists have the same when length. When only 'if' is present the list is of length 1.
		var start = document.createComment('[if]');
		var end = document.createComment('[/if]');
		var frag = document.createDocumentFragment();
		frag.appendChild(start);
		frag.appendChild(end);
		var ieFrag = IfRenderingContext(this, start, end, ifChain, kidsChain, changeCb);
		start.__qute__ = ieFrag;
		ieFrag(null, true);
		this.up(ieFrag);
		return frag;
	},
	// dynamic lists - which is updating only items that changed
	l: function(listFn, iterationFn, key) {
		if (!key) {
			console.warn("Reactive list used without a 'x-key' attribute: Performance will suffer!");
		}
		return new ListFragment(this, listFn, iterationFn, key).$create();
	},
	// static array variant of lists - this cannot be updated it is rendered once at creation
	a: function(listFn, iterationFn) {
		var start = document.createComment('[for]');
		var end = document.createComment('[/for]');
		var frag = document.createDocumentFragment();
		frag.appendChild(start);
		frag.appendChild(end);
		var forFrag = ForRenderingContext(this, start, end, listFn, iterationFn);
		start.__qute__ = forFrag;
		forFrag(null);
		this.up(forFrag);
		return frag;
	},
	up: function(fn) { // register a live update function
		this.ups.push(fn);
		return fn;
	},
	// eval the value of an xattr given the key - if a function invoke the function within the current context otherwise return the value as is
	eval: function(xattr) {
		return typeof xattr === 'function' ? xattr(this.vm) : xattr;
	},

	// connect all nested  VMs
	$connect: function() {
		if (!this.isc) {
			var vms = this.vms;
			for (var i=0,l=vms.length; i<l; i++) vms[i].$connect();
			this.isc = true;
		}
		return this;
	},
	// disconnect all nested VMs
	$disconnect: function() {
		if (this.isc) {
			var vms = this.vms;
			for (var i=0,l=vms.length; i<l; i++) vms[i].$disconnect();
			this.isc = false;
		}
		return this;
	},
	$push: function(r) { // push a sub-renderings
		this.vms.push(r);
		if (this.isc) r.$connect();
	},
	// refresh the DOM - call all nested update functions
	$update: function() {
		var model = this.vm, ups = this.ups;
		for (var i=0,l=ups.length;i<l;i++) ups[i](model);
		return this;
	},
	// create a child rendering
	spawn: function(vm) {
		return new Rendering(vm || this.vm, this);
	},
	// get the closest VM in current rendering, ignore renderings which are not bound to ViewModel objects (functional compjents etc)
	closestVM: function() {
		var r = this;
		do {
			if (r.vm && r.vm.__VM__) return r.vm;
			r = r.parent;
		} while (r);
		return null;
	}
}

function Rendering(vm, parent) {
	this.parent = parent;
	this.vm = vm; // defaults to current vm -> changed by functional views
	this.ups = []; // the update listeners
	// vms are usually ViewModels but can be any object providing $connect and $disconnect methods
	// if you enrich the vms api you mustr check list.js since it register a ListFragment instance as a vm
	this.vms = [];
	this.isc = false; // is connected?
}
Rendering.prototype = RenderingProto;

Rendering.FunComp = FunComp;
// make the bindings visible to component implementors
// add more bindigns here if needed
Rendering.SetAttr = SetAttr;
Rendering.SetDisplay = SetDisplay;

export default Rendering;
