import window, { document } from '@qutejs/window';
import { kebabToCamel } from '@qutejs/commons';

function ERR() {
	ERR.resolve.apply(null, arguments);
}

ERR.resolve = function() {
	throw new Error('Qute Error: '+Array.prototype.slice.call(arguments));
};

function stopEvent(e) {
	e.preventDefault();
	e.stopPropagation();
}

function chainFnAfter(fn, prevFn) {
	return prevFn ? function(arg) {
		prevFn(arg);
		return fn(arg);
	} : fn;
}

function closestVM(el) {
	while (el && !el.__qute__) {
		el = el.parentNode;
	}
	return el && el.__qute__;
}

// filter is a an array whoes first item is true or false. See compiler x-attrs encoding
function filterKeys(obj, filter) {
	var keys = Object.keys(obj);
	if (filter) {
		var incl = filter[0]; // true: include, false: exclude
		return keys.filter(function(key) {
			return (filter.indexOf(key, 1) > -1) === incl;
		});
	} else {
		return keys;
	}
}

var UpdateQueue = {
	maxNestedLoops: 50,
	queue: [],
	after: null, // routines to run after the queue is processed
	push: function(op) {
		if (!this.queue.length) { // schedule
			var self = this;
			window.setTimeout(function() {
				self.run();
			}, 0);
		}
		this.queue.push(op);
	},
	// Add a callback to be invoked after the current queue run. If the queue is empty then the callback is immediately run
	// As queue tasks may push tasks into the queue, pushing a regular task in the queue after an update does not guarantee
	// the task will be run at the end.
	// This is usefull to test (to make assertion after all the uopdates where done)
	// Usually this method is called after an update
	runAfter: function(runAfterCb) {
		if (!this.queue.length) {
			runAfterCb();
		} else {
			if (!this.after) { this.after = [runAfterCb]; }
			else { this.after.push(runAfterCb); }
		}
	},
	run: function() {
		var queue = this.queue;
		var cnt = queue.length;
		var max = cnt+this.maxNestedLoops; // allowed iteration to avoid infintite loops
		while (queue.length > 0) {
			queue[0]();
			// remove from queue after execution
			queue.shift();
			if (++cnt > max) { ERR(30); }
		}

		// run the 'after' routines if any
		if (this.after) {
			var after = this.after;
			for (var i=0,l=after.length; i<l; i++) {
				after[i]();
			}
			this.after = null; // clear the after array
		}
	}

};

function Context(data) {
	if (data) { Object.assign(this, data); }
	this.$topics = {lifecycle:[]}; // lifecycle is a bultin topic
}

Context.prototype = {
	post: function(topic, msg, data) {
		var listeners = this.$topics[topic];
		if (!listeners) { ERR(38, topic); }
		for (var i=0,l=listeners.length;i<l;i++) {
			if (listeners[i](msg, data) === false) {
				break; // stop if one of the listeners returns false
			}
		}
	},
	postAsync: function(topic, msg, data) {
		var self = this;
		window.setTimeout(function() { self.post(topic, msg, data); }, 0);
	},
	subscribe: function(topic, listenerFn) {
		var listeners = this.$topics[topic];
		if (!listeners) {
			this.$topics[topic] = listeners = [];
		}
		listeners.push(listenerFn);
		return this;
	},
	subscribeOnce: function(topic, event, listenerFn) {
		var self = this;
		var onceSubscription = function(msg, data) {
			if (msg === event) {
				listenerFn(msg, data);
				self.unsubscribe(topic, onceSubscription);
			}
		};
		this.subscribe(topic, onceSubscription);
		return onceSubscription;
	},
	unsubscribe: function(topic, listenerFn) {
		var listeners = this.$topics[topic];
		if (listeners) {
			var i = listeners.indexOf(listenerFn);
			if (i > -1) {
				listeners.splice(i, 1);
			}
		}
	},
	freeze: function() {
		Object.freeze(this);
	}
};

var VMS = {};
var XTAGS = {};

function QName(tag) {
	var i = tag.indexOf(':');
	if (i > -1) {
		var prefix = tag.substring(0, i);
		this.prefix = prefix;
		this.localName = tag.substring(i+1);
		this.name = tag;
		this.defaultNs = prefix === 'q';
	} else {
		this.prefix = 'q';
		this.localName = tag;
		this.name = 'q:'+tag;
		this.defaultNs = true;
	}
}

function getTag(tag) {
	return XTAGS[tag];
}


function registerTag(tag, templateFn, isCompiled) {
	var qname = new QName(tag);
	templateFn.$qname = qname;
	templateFn.$compiled = !!isCompiled;
	templateFn.$tag = tag;
	XTAGS[qname.name] = templateFn;
	if (qname.defaultNs) {
		XTAGS[qname.localName] = templateFn;
	}
	return templateFn;
}

function getVM(tag) {
	return VMS[tag];
}

function registerVM(tag, vm) {
	var qname = new QName(tag);
	VMS[qname.name] = vm;
	if (qname.defaultNs) {
		VMS[qname.localName] = vm;
	}
	return qname;
}

function getVMOrTag(tag) {
	return VMS[tag] || XTAGS[tag];
}

function snapshotRegistry() {
	return {VMS: Object.assign({}, VMS), XTAGS: Object.assign({}, XTAGS)};
}

function restoreRegistry(snapshot) {
	VMS = snapshot.VMS;
	XTAGS = snapshot.XTAGS;
}

function addClassMap(cl, value) {
	var keys = Object.keys(value);
	for (var i=0,l=keys.length; i<l; i++) {
		var key = keys[i];
		var val = value[key];
		if (val) { cl.add(key); } else { cl.remove(key); }
	}
}

function bindClass(elt, value) {
	if (!value) { return; }
	var cl = elt.classList;
	if (Array.isArray(value)) {
		for (var i=0,l=value.length; i<l; i++) {
			var val = value[i];
			if (val) {
				if (typeof val === 'string') {
					cl.add(val);
				} else { // an object?
					addClassMap(cl, val);
				}
			}
		}
	} else { // an object
		addClassMap(cl, value);
	}
}

function bindStyle(elt, value) {
	if (!value) { return; }
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
// must run in parent vm, context not in fucntional view context!
// This is why we need to use the vm from the closure scope when the listener was created
function createListener(vm, fn) {
	return function(e) {
		if (fn.call(vm, e) === false) {
			stopEvent(e);
		}
	};
}

function createListeners(vm, $listeners) {
	if ($listeners) {
		for (var key in $listeners) {
			$listeners[key] = createListener(vm, $listeners[key]);
		}
	}
	return $listeners;
}

function SetText(el, model, expr) {
	return function() {
		var val = expr(model);
		if (val !== el.nodeValue) {
			el.nodeValue = val;
		}
	}
}

function SetAttr(el, model, key, valFn) {
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
function SetInnerHTML(el, model, valFn) {
	return function() {
		var val = valFn(model);
		if (el.innerHTML !== val) {
			el.innerHTML = val || '';
		}
	}
}

function SetDisplay(el, model, valFn) {
	return function() {
		var val = valFn(model);
		var display = el.style.display;
		// backup the current diaply when toggliong OFF to be able to restore if needed
		if (val) {
			if (display === 'none') {
				el.style.display = el.__qute_display || ''; // remove 'none'
			}
		} else if (display !== 'none') {
			if (el.__qute_display == null) { el.__qute_display = display; }
			el.style.display = 'none';
		}
	}
}


function SetToggle(el, model, valFn) {
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

function SetClass(el, model, valFn) {
	return function() {
		//TODO only if modified
		bindClass(el, valFn(model));
	}
}

function SetStyle(el, model, valFn) {
	return function() {
		//TODO only if modified
		bindStyle(el, valFn(model));
	}
}

function SetProp(vm, model, key, valFn) {
	return function(changedKey) {
		//if (!changedKey || changedKey === key) {
			vm.$set(key, valFn(model));
		//}
	}
}

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

function SetFuncAttrs($attrs, vm, filter) { // vm is the parent vm (i.e. current model)
	return function() {
		var vmAttrs = vm.$attrs;
		if (vmAttrs) {
			var keys = filterKeys(vmAttrs, filter);
			for (var i=0,l=keys.length; i<l; i++) {
				var key = keys[i];
				$attrs[key] = vmAttrs[key];
			}
		}
	}
}

function SetFuncAttr($attrs, vm, key, val) { // vm is the parent vm (i.e. current model)
	return function() {
		$attrs[key] = val(vm);
	}
}
// TODO set $attrs on VMs
function SetVMAttrs(vm, parentVM, filter) {
	return function() {
		var parentAttrs = parentVM.$attrs;
		if (parentAttrs) {
			var keys = filterKeys(parentAttrs, filter);
			for (var i=0,l=keys.length; i<l; i++) {
				var key = keys[i];
				vm.$set(key, parentAttrs[key]);
			}
		}
	}
}

// emitter prototype
var Emitter = {
	emit: function(event, data) {
		if (!this.$el) { ERR(35); }
		this.$el.dispatchEvent(new window.CustomEvent(event, {bubbles: true, detail: data === undefined ? this : data }));

	},
	emitAsync: function(event, data, timeout) {
		var self = this;
		window.setTimeout(function() { self.emit(event, data); }, timeout || 0);
	}
};

function ViewRenderingContext(model, marker, isExpr, changeCb, noCache, xattrs, childrenFn) {

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
					r = new Rendering(model);
					if (cache) { cache[viewXTag] = r; }
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
		if (exprs[i](model)) { return i; }
	}
	var lastExpr = exprs[i];
	// if lastExpr is null is is corresponding to an else statement
	return !lastExpr || lastExpr(model) ? i : -1;
}


function IfRenderingContext(model, start, end, exprs, kids, changeCb) {
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
			r = new Rendering(model); // create the IF / ELSE rendering context
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

function ForRenderingContext(model, start, end, listFn, iterationFn) {
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
			r = new Rendering(model); // create the FOR rendering context
			list = newList;
			// render content
			if (list) {
				if (!Array.isArray(list)) {
					//if (list instanceof List) ERR(25);
					if (list.$createListFragment) { ERR(25); }
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
	for (var i=0, l=children.length; i<l; i++) { parent.appendChild(children[i]); }
}

function applyListeners(el, vm, listeners, doNotWrap) {
	for (var key in listeners) {
		var fn = listeners[key];
		if (key === 'create') {
			fn.call(vm, el);
		} else {
			el.addEventListener(key, doNotWrap ? fn : createListener(vm, fn));
		}
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
					if (child.nodeName === 'NESTED') { // select only 'nested' elements
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
					if (child.nodeValue.trim()) { hasContent = true; }
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
		var el = document.createElement(tag);
		if (xattrs) {
			var vm = this.vm;
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
					} else {
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
		if (children) { appendChildren(el, children); }
		return el;
	},
	// element with static children (innerHTML is set from the subtree)
	hh:function(tag, xattrs, content, type) {
		var el = this.h(tag, xattrs);
		if (type) { // convert can be a function to convert the content before injecting in the dom
			var converter = Context.Qute.converters[type];
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
		if (!XTag) { ERR(23, tag); }
		return this._v(XTag, xattrs, extractSlots(children));
	},
	v: function(XTag, xattrs, children) { // xtag is specified as a func reference. TODO No more used
		return this._v(XTag, xattrs, extractSlots(children));
	},
	// vm component
	_v: function(XTag, xattrs, slots) { // a vm component (viewmodel)
		if (isVM(XTag)) {
			var vm = new XTag(this.vm.$ctx);
			return vm.$create(this, xattrs, slots);
		} else if (XTag.$compiled) { // a compiled template
			var oldVm = this.vm;
			this.vm = this.functx(this.vm, xattrs, slots);
			var el = XTag(this, xattrs, slots); // pass xattrs and slots too?
			this.vm.$el = el;
			// apply root bindings if any (x-class, x-style or x-show)
			if (this.vm.$bindings) {
				var bindings = this.vm.$bindings;
				for (var i=0,l=bindings.length; i<l; i+=2) {
					var up = bindings[i](el, oldVm, bindings[i+1]);
					this.up(up)();
				}
			}
			if (this.vm.$listeners) { applyListeners(el, this.vm, this.vm.$listeners, true); }
			this.vm = oldVm;
			return el;
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
		var viewFrag = ViewRenderingContext(this.vm, marker, isExpr, changeCb, noCache, xattrs, childrenFn);
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
		var ieFrag = IfRenderingContext(this.vm, start, end, ifChain, kidsChain, changeCb);
		start.__qute__ = ieFrag;
		ieFrag(null, true);
		this.up(ieFrag);
		return frag;
	},
	// dynamic lists - which is tracking changes and update itself
	l: function(listFn, iterationFn) {
		var list = listFn(this.vm);
		//if (!list instanceof List)) ERR(24);
		if (!list.$createListFragment) { ERR(24); }
		return list.$createListFragment(this, iterationFn);
	},
	// static array variant of lists - this cannot be updated it is rendered once at creation
	a: function(listFn, iterationFn) {
		var start = document.createComment('[for]');
		var end = document.createComment('[/for]');
		var frag = document.createDocumentFragment();
		frag.appendChild(start);
		frag.appendChild(end);
		var forFrag = ForRenderingContext(this.vm, start, end, listFn, iterationFn);
		start.__qute__ = forFrag;
		forFrag(null);
		this.up(forFrag);
		return frag;
	},
	up: function(fn) { // register a live update function
		this.ups.push(fn);
//		this.ups[this.ups.length-1].push(fn);
		return fn;
	},
	//======
	// eval the value of an xattr given the key - if a fucntion invoke the function within the current context otherwise return the value as is
	eval: function(xattr) {
		return typeof xattr === 'function' ? xattr(this.vm) : xattr;
	},

	// connect all nested  VMs
	$connect: function() {
		if (!this.isc) {
			var vms = this.vms;
			for (var i=0,l=vms.length; i<l; i++) { vms[i].$connect(); }
			this.isc = true;
		}
		return this;
	},
	// disconnect all nested VMs
	$disconnect: function() {
		if (this.isc) {
			var vms = this.vms;
			for (var i=0,l=vms.length; i<l; i++) { vms[i].$disconnect(); }
			this.isc = false;
		}
		return this;
	},
	$push: function(r) { // push a sub-renderings
		this.vms.push(r);
		if (this.isc) { r.$connect(); }
	},
	// refresh the DOM - call all nested update functions
	$update: function() {
		var model = this.vm, ups = this.ups;
		for (var i=0,l=ups.length;i<l;i++) { ups[i](model); }
		return this;
	},
	functx: function(vm, xattrs, slots) { // functional context
		var $attrs = {};
		var ctx = {
			$parent: vm,
			$attrs: $attrs,
			$listeners: null,
			$slots: slots,
			$el: null,
			$bindings: null,
			emit: Emitter.emit,
			emitAsync: Emitter.emitAsync
		};
		var bindings = null;

		if (xattrs) {
			for (var key in xattrs) { // class, style and show, $attrs, $listeners are ignored
				var val = xattrs[key];
				if (key.charCodeAt(0) !== 36 || key === '$html') { // $ - extended attribute -> ignore all extended attrs but $html
					if (typeof val === 'function') {
						this.up(SetFuncAttr($attrs, vm, key, val))();
					} else {
						$attrs[key] = val;
					}
					//setFnContextAttr($attrs, vm, key, val);
				} else if (key === '$attrs') {
					if (vm.$attrs) {
						// inject attributes in functional tags
						// we need to create an update function to reinject attrs when model changes
						// otherwise we loose the reactivity on func tags 'x-attrs' attribute
						this.up(SetFuncAttrs($attrs, vm, val))();
					}
				} else if (key === '$on') {
					ctx.$listeners = createListeners(vm, val);
				} else if (key === '$class') {
					if (!bindings) { bindings = []; }
					bindings.push(SetClass, val);
				} else if (key === '$style') {
					if (!bindings) { bindings = []; }
					bindings.push(SetStyle, val);
				} else if (key === '$show') {
					if (!bindings) { bindings = []; }
					bindings.push(SetDisplay, val);
				} else if (key === '$toggle') {
					if (!bindings) { bindings = []; }
					bindings.push(SetToggle, val);
				}
			}
		}

		ctx.$bindings = bindings;
		return ctx;
	}

};

function Rendering(vm) {
	this.vm = vm; // defaults to current vm -> changed by functional views
	this.ups = [];
	// vms are usually ViewModels but can be any object providing $connect and $disconnect methods
	// if you enrich the vms api you mustr check list.js since it register a ListFragment instance as a vm
	this.vms = [];
	this.isc = false; // is connected?
}
Rendering.prototype = RenderingProto;

function ListFragment(rendering, listFn) {
	this.start = document.createComment('[list]');
	this.end = document.createComment('[/list]');
	this.r = rendering;
	this.listFn = listFn;
	this.length = 0;

	this.updateChildren = function(model) {
		var first = this.start.nextSibling;
		if (!first || first === this.end || !first.$up) { return; }
		var n = first, end = this.end;
		while (n && n !== end) {
			if (n.$up) {
				var ups = n.$up;
				for (var i=0,l=ups.length;i<l;i++) {
					ups[i](model);
				}
			}
			n = n.nextSibling;
		}
	};

	this.clear = function() {
		var n = this.start;
		var end = this.end;
		var parent = n.parentNode;
		while (n.nextSibling && n.nextSibling !== end) {
			parent.removeChild(n.nextSibling);
		}
		if (!n.nextSibling) { ERR(10); }
		this.length = 0;
	};

	this.get = function(index) {
		if (index < 0 || index > this.length) {
			return null;
		}
		var l = this.length, n = null;
		if (index < l/2) { // from start
			n = this.start.nextSibling;
			while (index-- > 0) { n = n.nextSibling; }
		} else { // from end
			index = l - index - 1;
			n = this.end.previousSibling;
			while (index-- > 0) { n = n.previousSibling; }
		}
		return n;
	};

	this.getInsertion = function(index) {
		if (index < 0 || index > this.length) { ERR(11, index, length); }
		if (index === 0) {
			return this.start.nextSibling;
		}
		if (index === this.length) {
			return this.end;
		}
		return this.get(index);
	};

	this.createItem = function(r, item, index, hasNext) {
		return listFn(r, item, index, hasNext);
	};

	this.insert = function(data, from, count) {
		if (!from) { from = 0; } // if undefined null or 0
		if (!count) { count = data.length - from; } // if undefined null or 0
		if (count < 1) { return; }
		var l = from+count;
		var listFn = this.listFn;
		var r = this.r;
		var node = this.getInsertion(from);
		if (!node) { ERR(12, index, this.length); }
		//TODO redraw if list fragment is broken insted of throwing an error?
		var childR, vm = r.vm, parent = node.parentNode;
		var ll = l-1;
		for (var i=from; i<ll; i++) {
			// we need to wrapp each child in a rendering ctx to be able to disconnect when items are removed
			childR = new Rendering(vm);
			var child = this.createItem(childR, data[i], i, true);
			if (child) {
				parent.insertBefore(child, node);
				r.$push(childR);
				child.__qute_ctx__ = childR;
			}
		}
		childR = new Rendering(vm);
		var child = this.createItem(childR, data[ll], ll, l<data.length);
		if (child) {
			parent.insertBefore(child, node);
			r.$push(childR);
			child.__qute_ctx__ = childR;
		}
		this.length = data.length;
	};

	this.remove = function(from, count) {
		if (from + count > this.length) {
			// TODO enable only if debug mode
			//throw new Error('Removed range exceed the list length: '+from+'#'+count+'. Length is '+this.length);
			return;
		}
		var node = this.get(from);
		if (!node) { ERR(13, from, this.length); }
		var i=0, parent = this.start.parentNode;
		node = node.previousSibling; // cannot be null
		while (i++<count) {
			var child = node.nextSibling;
			child.__qute_ctx__ && child.__qute_ctx__.$disconnect();
			parent.removeChild(child);
		}
		this.length -= count;
	};

	this.move = function(from, to) {
		// TODO this can be optimized (we can search for the 2 nodes in the same time: get2(i1, i2))
		var node = this.get(from);
		if (!node) { ERR(14, from, this.length); }
		var dstNode = this.get(to);
		if (!dstNode) { ERR(15, to, this.length); }
		dstNode = dstNode.nextSibling;
		if (dstNode) {
			dstNode.parentNode.insertBefore(node, dstNode);
		} else {
			dstNode.parentNode.append(node);
		}
	};
}



var AP = Array.prototype;
var ListProto = {
	$createListFragment: function(rendering, listFn) {
		var listRendering = new Rendering(rendering.vm);
		if (!this.lfs) { this.lfs = []; }
		var lf = new ListFragment(listRendering, listFn);
		var frag = document.createDocumentFragment();
		frag.appendChild(lf.start);
		frag.appendChild(lf.end);
		lf.insert(this.$data); // initialize
		rendering.up(lf.updateChildren.bind(lf)); // register children updates
		this.lfs.push(lf);
		rendering.$push(listRendering);
		return frag;
	},
	/*
	$destroy: function() { //TODO not used
		this.lfs = null;
	},
	*/
	$updateNow: function() {
		if (this.lfs) {
			var ops = this.ops;
			var data = this.$data;
			var lfs = this.lfs;
			var l = lfs.length;
			while (ops.length) {
				var op = ops.shift();
				for (var i=0,l=lfs.length; i<l; i++) {
					op(lfs[i], data);
				}
			}
		}
	},
	$update: function(op) {
		if (this.lfs) {
			if (this.ops.push(op) === 1) { // if queue is empty start an update task
				var self = this;
				UpdateQueue.push(function() {
					self.$updateNow();
				});
			}
		}
	},
	$redraw: function() {
		this.$update(function(lf, data) {
			lf.clear();
			lf.insert(data);
		});
	},
	$insert: function(from, count) {
		this.$update(function(lf, data) {
			lf.insert(data, from, count);
		});
	},
	$remove: function(from, count) {
		this.$update(function(lf, data) {
			lf.remove(from, count);
		});
	},
	$move: function(from, to) {
		this.$update(function(lf, data) {
			lf.move(from, to);
		});
	},

	toJSON: function() {
		return this.$data;
	},
	data: function() {
		return this.$data;
	},
	newList: function() {
		return new List(this.$data);
	},

	clear: function() {
		this.replace([]);
	},
	replace: function (ar) {
		this.$data = ar;
		this.$redraw();
	},

	move: function(from, to) {
		this.$data.splice(to, 0, this.$data.splice(from, 1)[0]);
		this.$move(from, to);
	},

	remove: function(item) {
		var i = this.$data.indexOf(item);
		if (i > -1) {
			return this.splice(i, 1);
		}
	},

	push: function() {
		var from = this.$data.length;
		var r = AP.push.apply(this.$data, arguments);
		this.$insert(from, arguments.length);
		return r;
	},
	unshift: function() {
		var from = this.$data.length;
		var r = AP.unshift.apply(this.$data, arguments);
		this.$insert(0, arguments.length);
		return r;
	},
	pop: function() {
		var r = AP.pop.apply(this.$data, arguments);
		this.$remove(this.$data.length, 1);
		return r;
	},
	shift: function() {
		var r = AP.shift.apply(this.$data, arguments);
		this.$remove(0, 1);
		return r;
	},
	splice: function(start, deleteCount) {
		var argsl = arguments.length;
		var len = this.$data.length;
		var r = AP.splice.apply(this.$data, arguments);
		if (argsl === 1) {
			this.$remove(start, len-start);
		} else if (argsl === 2) {
			this.$remove(start, deleteCount);
		} else { // some inserted items
			if (deleteCount) { this.$remove(start, deleteCount); }
			this.$insert(start, argsl-2);
		}
		return r;
	},
	sort: function(cmp) {
		this.$data.sort(cmp);
		this.$redraw();
		return this.$data;
	},
	reverse: function() {
		this.$data.reverse();
		this.$redraw();
		return this.$data;
	},
	get: function(i) {
		return this.$data[i];
	},
	slice: function() {
		return AP.slice.apply(this.$data, arguments);
	},
	forEach: function(cb, thisArg) {
		this.$data.forEach(cb, thisArg);
	},
	map: function(cb, thisArg) {
		return this.$data.map(cb, thisArg);
	},
	filter: function(cb, thisArg) {
		return this.$data.filter(cb, thisArg);
	},
	find: function(cb, thisArg) {
		return this.$data.find(cb, thisArg);
	},
	findIndex: function(cb, thisArg) {
		return this.$data.findIndex(cb, thisArg);
	},
	reduce: function(cb, initialValue) {
		return this.$data.reduce(cb, initialValue);
	},
	reduceRight: function(cb, initialValue) {
		return this.$data.reduceRight(cb, initialValue);
	},
	indexOf: function(elem, from) {
		return this.$data.indexOf(elem, from || 0);
	},
	lastIndexOf: function(elem, from) {
		return this.$data.lastIndexOf(elem, from || this.$data.length-1);
	},
	//TODO add some, every, ...
};
Object.defineProperty(ListProto, 'length', {get:function() {return this.$data.length}});

function List(data) {
	this.ops = []; // update operations queue
	this.lfs = null; // the list fragment
	this.$data = data || []; // the backed data
}
List.prototype = ListProto;

function isEnumerable(key) {
	return key.charCodeAt(0) !== 95; // keys starting with _ are not enumerable
}

function defProp(key) {
	return {
		get: function() {
			return this.$data[key];
		},
		set: function(value) {
			var old = this.$data[key];
			if (old !== value) {
				this.$data[key] = value;
				var watcher = this.$el && this.$watch && this.$watch[key]; // if not connected whatchers are not enabled
				// avoid updating if watcher return false
				if (watcher && watcher.call(this, value, old) === false) { return; }
				this.update(key);
			}
		},
		enumerable: isEnumerable(key) // keys starting with _ are not enumerable
	}
}

function listProp(key) {
	return {
		get: function() {
			return this.$data[key];
		},
		set: function(value) {
			var old = this.$data[key];
			if (old !== value) {
				if (!value) { // remove list content
					this.$data[key].clear();
				} else if (Array.isArray(value)) {
					this.$data[key].replace(value);
				} else if (value instanceof List) {
					//TODO should we copy the data?
					if (old) { old.$disconnect(); }
					this.$data[key] = value;
				} else {
					ERR(31, value);
				}
				var watcher = this.$watch && this.$watch[key];
				// avoid updating if watcher return false
				if (watcher && watcher.call(this, value, old) === false) { return; }
				this.update(key);
			}
		},
		enumerable: isEnumerable(key) // keys starting with _ are not enumerable
	}
}

function ViewModel(ctx, attrs) {
	var prop = {};
	// the attributes set on vm tag which are not declared as props
	prop.value = {};
	Object.defineProperty(this, '$attrs', prop);
	// the app context if any
	prop.value = ctx instanceof Context ? ctx : new Context(ctx);
	Object.defineProperty(this, '$ctx', prop);
	// the listeners registered on the vm tag
	prop.value = null;
	prop.writable = true;
	// the associated rendering context
	Object.defineProperty(this, '$r', prop);
	// listeners injected through tag attributes (e.g. @click)
	Object.defineProperty(this, '$listeners', prop);
	// the slots injected by the caller
	Object.defineProperty(this, '$slots', prop);
	// the view root element
	Object.defineProperty(this, '$el', prop);
	// chained cleanup functions if any was registered
	Object.defineProperty(this, '$clean', prop);
	// States: 0 - initial, 1 - connected, 2 - updating
	prop.value = 0;
	Object.defineProperty(this, '$st', prop); // state: 0 - default, 1 updating , 2 frozen

	var data = this.init(ctx) || {};
	prop.value = data;
	Object.defineProperty(this, '$data', prop);
	if (data) {
		for (var key in data) {
			Object.defineProperty(this, key, data[key] instanceof List ? listProp(key) : defProp(key));
		}
	}

	if (!this.render) { ERR(32); }

	// initialize data model from attributes if any - this will not trigger an update
	if (attrs) {
		var $data = this.$data;
		var $attrs = this.$attrs;
		Object.keys(attrs).forEach(function(key) {
			var value = attrs[key];
			if (key in $data) { // a declared property
				$data[key] = value;
			} else {
				var camelKey = kebabToCamel(key);
				if (camelKey !== key && camelKey in $data) {
					$data[camelKey] = value;
				} else if ($attrs[key] !== value) {
					// attributes are not camelized
					$attrs[key] = value;
				}
			}
		});
	}
}

ViewModel.prototype = {
	__VM__:true,
	toString: function() {
		return 'ViewModel <'+this.$tag+'/>';
	},
	// set an attribute value (can be either a free property (i.e $attrs[key]) or managed property (i.e. $data[key]))
	$set: function(key, value) {
		if (key in this.$data) { // a declared property
			this[key] = value;
		} else {
			var camelKey = kebabToCamel(key);
			if (camelKey !== key && camelKey in this.$data) {
				this[camelKey] = value;
			} else if (this.$attrs[key] !== value) {
				// attributes are not camelized
				this.$attrs[key] = value;
				this.update();
			}
		}
	},
	// subscribe to the given channel name - for use on root VMs
	listen: function(channelName) {
		if (!this.$channel) { ERR(39, this.$tag); }
		// add an init function
		this.$init = chainFnAfter(function(thisObj) {
			thisObj.subscribe(channelName, thisObj.$channel);
		}, this.$init);
		return this;
	},
	//TODO use setup in listen and $on
	setup: function(setupFn) {
		this.$init = chainFnAfter(setupFn, this.$init);
		return this;
	},
	cleanup: function(fn) { // register a cleanup function when component is disconnected
		this.$clean = chainFnAfter(fn, this.$clean);
		return this;
	},
	$parent: function() {
		if (!this.$el) { ERR(35); }
		return closestVM(this.$el.parentNode);
	},
	$root: function() {
		var parent = this.$parent();
		return parent ? parent.$root() : this;
	},
	$connect: function() {
		if (this.$st & 1) { return; } // ignore
		this.$st |= 1; // set connected flag
		// $init may be defined by the prototype to do automatic setup when connected
		// (e.g. automatic installed listeners defined though VM definitioan 'on' property)
		if (this.$init) {
			this.$init(this);
		}
		if (this.$listeners) {
			var listeners = this.$listeners;
			for (var key in listeners) {
				this.$on(key, listeners[key]);
			}
		}
		// connect children vms
		this.$r.$connect();
		// call the connected callback
		this.connected && this.connected();
		return this;
	},
	$disconnect: function() {
		if (!(this.$st & 1)) { return; } // ignore
		this.$st ^= 1; // clear connected flag
		if (this.$clean) {
			this.$clean();
			this.$clean = null;
		}
		this.$r.$disconnect(); // disconnect children vms
		this.disconnected && this.disconnected();
	},
	// initialize a vm from tag raw data
	$load: function(rendering, xattrs, slots) {
		var bindings = null;
		var parentVM = rendering.vm;
		this.$slots = slots;
		if (xattrs) {
			for (var key in xattrs) {
				var val = xattrs[key];
				if (key.charCodeAt(0) === 36) { // $ - extended attribute
					if (key === '$on') {
						//TODO we should make a copy of val since it is modified by createListeners!!!
						this.$listeners = createListeners(parentVM, val); // use parent vm when creating listeners
					} else if (key === '$attrs') { // we must not delete keys from xattrs since it can break when vm is loaded by a dynamic component
						//TODO DO WE NEED to add an update fn? x-attrs are static
						rendering.up(SetVMAttrs(this, parentVM, val))();
					} else if (key === '$class') {
						if (!bindings) { bindings = []; }
						bindings.push(SetClass, val);
					} else if (key === '$style') {
						if (!bindings) { bindings = []; }
						bindings.push(SetStyle, val);
					} else if (key === '$show') {
						if (!bindings) { bindings = []; }
						bindings.push(SetDisplay, val);
					} else if (key === '$toggle') {
						if (!bindings) { bindings = []; }
						bindings.push(SetToggle, val);
					} else if (key === '$channel') {
						this.listen(val);
					} else {
						ERR(26, key);
					}
				} else if (typeof val === 'function') { // a dynamic binding
					rendering.up(SetProp(this, parentVM, key, val))();
				} else { // static binding
					this.$set(key, val);
				}
			}
		}
		return bindings;
	},
	$create: function(parentRendering, xattrs, slots) {
		// load definition
		var bindings = parentRendering && this.$load(parentRendering, xattrs, slots);
		var rendering = new Rendering(this);
		// must never return null - for non rendering components like popups we return a comment
		var el = this.render(rendering) || document.createComment('<'+this.$tag+'/>');
		this.$r = rendering;
		el.__qute__ = this;
		this.$el = el;
		if (bindings) { for (var i=0,l=bindings.length; i<l; i+=2) {
			var binding = bindings[i];
			var up = bindings[i](el, parentRendering.vm, bindings[i+1]);
			parentRendering.up(up)();
		} }
		this.created && this.created(el);
		// this can trigger a connect if tree is already connected (for example when inserting a comp in a connected list)
		parentRendering && parentRendering.$push(this);
		return el;
	},

	// manual mount (only roots must be moutned this way)
	mount: function(elOrId, insertBefore) {
		if (this.$el) { ERR(33); } //TODO should check if connected and if not root
		var target;
		if (elOrId) {
			target = typeof elOrId === 'string' ? document.getElementById(elOrId) : elOrId;
		} else {
			target = document.body;
		}
		var el = this.$create();
		if (insertBefore) {
			target.parentNode.insertBefore(el, target);
		} else {
			target.appendChild(el);
		}
		this.$connect();
		// announce the tree was attached to the DOM
		return this;
	},
	// only manually mounted vms can be unmounted
	unmount: function() {
		// a child vm?
		//if (this.$p) ERR();
		if (!this.$el) { ERR(34); } // TODO check if root and mounted
		this.$disconnect();
		this.$el.parentNode.removeChild(this.$el);
	},
	$update: function(key) {
		if (this.$el) { // only if connected
			this.$r.$update();
		}
	},
	update: function(key) {
		if (this.$st === 1) { // only if connected and not already scheduled to update
			this.$st |= 2; // set updating flag
			var self = this;
			UpdateQueue.push(function() {
				self.$update(key);
				self.$st ^= 2; // remove updating flag
			});
		}
	},
	$on: function(type/*, selector, cb*/) {
		if (!this.$el) { ERR(34); }
		//if (!this.$clean) this.$clean = [];
		var selector, cb;
		if (arguments.length === 3) {
			selector = arguments[1];
			cb = arguments[2];
			if (!cb) {
				cb = selector;
				selector = null;
				if (!cb) { throw new Error('on function requires a callback argument'); }
			}
		} else if (arguments.length === 2) {
			cb = arguments[1];
		} else {
			throw new Error('on function takes 2 or 3 arguments: eventType[, seelctor], callback');
		}
		var self = this;
		var wrapper = function(e) {
			if (!selector || e.target.matches(selector)) {
				if (cb.call(self, e) === false) {
					stopEvent(e);
				}
			}
		};
		this.$el.addEventListener(type, wrapper);
		this.cleanup(function() {
			self.$el.removeEventListener(type, wrapper);
		});
		//this.$clean.push(type, wrapper);
	},
	emit: Emitter.emit,
	emitAsync: Emitter.emitAsync,
	// -------- ctx event bus -------------
	post: function(topic, msg, data) {
		this.$ctx.post(topic, msg, data);
	},
	postAsync: function(topic, msg, data) {
		this.$ctx.postAsync(topic, msg, data);
	},
	// subscribe and register cleanup to remove subscription at disconnect
	subscribe: function(name, listenerFn) {
		var ctx = this.$ctx;
		ctx.subscribe(name, listenerFn.bind(this));
		this.cleanup(function() {
			ctx.unsubscribe(name, listenerFn);
		});
		return this;
	},
	subscribeOnce: function(topic, event, listenerFn) {
		var ctx = this.$ctx;
		var onceSubscription = ctx.subscribeOnce(topic, event, listenerFn.bind(this));
		this.cleanup(function() {
			ctx.unsubscribe(topic, onceSubscription);
		});
		return this;
	},
	toHTML: function() {
		return this.$el && this.$el.outerHTML;
	},
	// ---------------------------------------------
	init: function() {} // do nothing
};

/**
 * We cannot use Object.assign since getter are lost. So we copy the prop def itself
 */
function assignPropDefs(dst, src) {
	var keys = Object.keys(src);
    for(var i=0,l=keys.length; i<l; i++) {
      var key = keys[i];
      Object.defineProperty(dst, key, Object.getOwnPropertyDescriptor(src, key));
    }
    return dst;
}

function Qute(tag, def, BaseVm) {
	if (!tag) { ERR(5); }

	function ViewModelImpl(ctx, attrs) {
		ViewModel.call(this, ctx, attrs);
	}

	var VMType, VMProto;
	if (typeof def === 'function') {
		if (def.prototype instanceof ViewModel)	{
			// VM is defined as a class
			VMType = def;
			VMProto = VMType.prototype;
		} else {
			// a rendering function - we simply register the rendering fucntion for the given tag
			return registerTag(tag, def);
		}
	} else { // VM definition object
		if (!BaseVm) { BaseVm = ViewModel; }
		VMProto = Object.create(BaseVm.prototype, {
			constructor: {value:ViewModelImpl},
		});
		if (def) { assignPropDefs(VMProto, def); } // this is preserving getters
		VMProto.$super = BaseVm.prototype; // to be able to override methods and call the super method if needed
		ViewModelImpl.prototype = VMProto;

		VMType = ViewModelImpl;
	}

	// add the rendering method of the tag if no one was provided
	if (!VMProto.render) {
		VMProto.render = Qute.template(tag);
		if (!VMProto.render) {
			ERR(36, tag);
		}
	}
	// add the tag meta property
	VMProto.$tag = tag;
	VMProto.$qname = registerVM(tag, VMType);

	VMType.watch = function(prop, fn) {
		if (!VMProto.$watch) { Object.defineProperty(VMProto, '$watch', {value:{}}); }
		VMProto.$watch[prop] = fn;
		return VMType;
	};
	VMType.on = function(key, selector, cb) {
		VMProto.$init = chainFnAfter(function(thisObj) {
			thisObj.$on(key, selector, cb);
		}, VMProto.$init);
		return VMType;
	};
	VMType.channel = function(listenFn) {
		VMProto.$channel = listenFn;
		return this;
	};

	return VMType;
}

Qute.List = List;
Qute.ViewModel = ViewModel;

// link a viewmodel to a template. Usefull for classes where defining prototype methods is not part of the class syntax
Qute.link = function(VMType, renderFn) {
	VMType.prototype.render = renderFn;
};


var QUTE_STYLE=null;
Qute.css = function(css) {
	var doc = window.document;
	if (!QUTE_STYLE) {
		var style = doc.getElementById('--qute-inline-styles');
		if (!style) {
			style = doc.createElement('STYLE');
			style.id = '--qute-inline-styles';
			style.type = 'text/css';
			style.textContent = "\n";
			doc.head.insertBefore(style, doc.head.firstChild);
		}
		QUTE_STYLE = style;
	}
	QUTE_STYLE.textContent += css;
};

Qute.converters = {};
Context.Qute = Qute; // we need this to access globals defined in Qute like converters
Qute.Context = Context;
Qute.UpdateQueue = UpdateQueue;
Qute.Rendering = Rendering;
// render a functional template given its tag name and a model
Qute.render = function(xtagName, model) {
	return getTag(xtagName)(new Rendering(model));
};

Qute.register = registerTag;
Qute.template = getTag;
Qute.snapshotRegistry = snapshotRegistry;
Qute.restoreRegistry = restoreRegistry;
Qute.vm = getVM;
Qute.vmOrTemplate = getVMOrTag;

Qute.runAfter = function(cb) { UpdateQueue.runAfter(cb); };
Qute.closest = closestVM;
Qute.ERR = ERR;

export default Qute;
//# sourceMappingURL=index.esm.js.map
