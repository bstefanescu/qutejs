import {document} from '@qutejs/window';
import ERR from './error.js';

import App from './app.js';
import { getVMOrTag, converters } from './registry.js';
import {applyListeners, applyEmiters, SetClass, SetStyle,
			SetDisplay, SetToggle, SetText, SetInnerHTML, SetAttr} from './binding.js';
import { filterKeys } from './utils.js';
import Emitter from './emit.js';
import applyUserDirectives from './q-attr.js';
import ListFragment from './list-fragment.js';
import SwitchFragment from './switch-fragment.js';
import ForFragment from './for-fragment.js';
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
	x: function(expr) { // expression {{ ... }}
		var text = expr(this.model);
		var el = document.createTextNode(text);
		this.up(SetText(el, this.model, expr));
		return el;
	},
	t: function(value) { // text
		return document.createTextNode(value);
	},
	g: function(isFn, xattrs, children) { // dynamic tag using 'is'
		var tag = isFn(this.model);
		var XTag = getVMOrTag(tag);
		return XTag ? this.v(XTag, xattrs, children) : this.h(tag, xattrs, children);
	},
	h: function(tag, xattrs, children) { // dom node
		var el = document.createElement(tag), $use = null;
		if (xattrs) {
			var model = this.model;
			if (xattrs.$use) {
				$use = applyUserDirectives(this, tag, xattrs, el);
			}
			for (var key in xattrs) {
				var up = null;
				var val = xattrs[key];
				if (key.charCodeAt(0) === 36) { // $ - extended attribute
					if (key === '$on') {
						applyListeners(el, model, val);
					} else if (key === '$class') {
						up = SetClass(el, model, val);
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
						applyEmiters(el, model, val);
					} else if (key === '$slot') {
						el.__qute_slot__ = val;
					} else if (key === '$ref') {
						this.model[val] = el;
					} else if (key === '$channel') {
						ERR("q:channel cannot be used on regular DOM elements: %s", tag);
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
	r: function(tag, xattrs, children) {
		var XTag = getVMOrTag(tag);
		if (!XTag) ERR("Could not resolve component for tag: '%s'", tag);
		return this._v(XTag, xattrs, extractSlots(children));
	},
	v: function(XTag, xattrs, children) { // xtag is specified as a func reference. TODO No more used
		return this._v(XTag, xattrs, extractSlots(children));
	},
	// vm component
	_v: function(XTag, xattrs, slots) { // a vm component (viewmodel)
		if (isVM(XTag)) {
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
			var frag = document.createDocumentFragment();
			appendChildren(frag, children);
			return frag;
		}
		return document.createComment('[slot/]'); // placeholder
	},
	w: function(isExpr, changeCb, noCache, xattrs, childrenFn) { // dynamic view
		var renderFn = function(r, key) {
			return key ? r.r(key, xattrs, childrenFn(r)) : null;
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
		if (!key) {
			console.warn("Reactive list used without a 'q:key' attribute: Performance will suffer!");
		}
		return new ListFragment(this, listFn, iterationFn, key).$create();
	},
	// static array variant of lists - this cannot be updated it is rendered once at creation
	a: function(listFn, iterationFn) {
		return new ForFragment(this, listFn, iterationFn).$create();
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

export default Rendering;
