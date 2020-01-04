var Qute = (function (window) {
	'use strict';

	var window__default = 'default' in window ? window['default'] : window;

	function capitalizeFirst(value) {
		return value[0].toUpperCase()+value.substring(1);
	}

	function kebabToCamel(value) {
		var i = value.indexOf('-');
		if (i == -1) { return value; }
		var out = value.substring(0, i);
		var s = i+1;
		i = value.indexOf('-', s);
		while (i > -1) {
			out += capitalizeFirst(value.substring(s, i));
			s = i+1;
			i = value.indexOf('-', s);
		}
		if (s < value.length) {
			out += capitalizeFirst(value.substring(s));
		}
		return out;
	}

	function ERR$1() {
		ERR$1.resolve.apply(null, arguments);
	}

	ERR$1.resolve = function() {
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
				window__default.setTimeout(function() {
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
				if (++cnt > max) { ERR$1(30); }
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
			if (!listeners) { ERR$1(38, topic); }
			for (var i=0,l=listeners.length;i<l;i++) {
				if (listeners[i](msg, data) === false) {
					break; // stop if one of the listeners returns false
				}
			}
		},
		postAsync: function(topic, msg, data) {
			var self = this;
			window__default.setTimeout(function() { self.post(topic, msg, data); }, 0);
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

	function getTag(tag) {
		return XTAGS[tag];
	}

	function registerTag(tag, templateFn, isCompiled) {
		XTAGS[tag] = templateFn;
		templateFn.$compiled = !!isCompiled;
		templateFn.$tag = tag;
		return templateFn;
	}

	function getVM(tag) {
		return VMS[tag];
	}

	function registerVM(tag, vm) {
		VMS[tag] = vm;
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
			if (!this.$el) { ERR$1(35); }
			this.$el.dispatchEvent(new window__default.CustomEvent(event, {bubbles: true, detail: data === undefined ? this : data }));

		},
		emitAsync: function(event, data, timeout) {
			var self = this;
			window__default.setTimeout(function() { self.emit(event, data); }, timeout || 0);
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
						if (list.$createListFragment) { ERR$1(25); }
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
			var el = window.document.createTextNode(text);
			this.up(SetText(el, this.vm, expr));
			return el;
		},
		t: function(value) { // text
			return window.document.createTextNode(value);
		},
		g: function(isFn, xattrs, children) { // dynamic tag using 'is'
			var tag = isFn(this.vm);
			var XTag = getVMOrTag(tag);
			return XTag ? this.v(XTag, xattrs, children) : this.h(tag, xattrs, children);
		},
		h: function(tag, xattrs, children) { // dom node
			var el = window.document.createElement(tag);
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
							ERR$1(28, tag);
						} else {
							ERR$1(26, key);
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
					ERR$1(27, type);
				}
				content = converter(content, this);
			}
			el.innerHTML = content;
			return el;
		},
		r: function(tag, xattrs, children) {
			var XTag = getVMOrTag(tag);
			if (!XTag) { ERR$1(23, tag); }
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
				var frag = window.document.createDocumentFragment();
				appendChildren(frag, children);
				return frag;
			}
			return window.document.createComment('[slot/]'); // placeholder
		},
		w: function(isExpr, changeCb, noCache, xattrs, childrenFn) { // dynamic view
			var marker = window.document.createComment('[view/]');
			var frag = window.document.createDocumentFragment();
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
			var start = window.document.createComment('[if]');
			var end = window.document.createComment('[/if]');
			var frag = window.document.createDocumentFragment();
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
			if (!list.$createListFragment) { ERR$1(24); }
			return list.$createListFragment(this, iterationFn);
		},
		// static array variant of lists - this cannot be updated it is rendered once at creation
		a: function(listFn, iterationFn) {
			var start = window.document.createComment('[for]');
			var end = window.document.createComment('[/for]');
			var frag = window.document.createDocumentFragment();
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
		this.start = window.document.createComment('[list]');
		this.end = window.document.createComment('[/list]');
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
			if (!n.nextSibling) { ERR$1(10); }
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
			if (index < 0 || index > this.length) { ERR$1(11, index, length); }
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
			if (!node) { ERR$1(12, index, this.length); }
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
			if (!node) { ERR$1(13, from, this.length); }
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
			if (!node) { ERR$1(14, from, this.length); }
			var dstNode = this.get(to);
			if (!dstNode) { ERR$1(15, to, this.length); }
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
			var frag = window.document.createDocumentFragment();
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
						ERR$1(31, value);
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

		if (!this.render) { ERR$1(32); }

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
			if (!this.$channel) { ERR$1(39, this.$tag); }
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
			if (!this.$el) { ERR$1(35); }
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
							ERR$1(26, key);
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
			var el = this.render(rendering) || window.document.createComment('<'+this.$tag+'/>');
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
			if (this.$el) { ERR$1(33); } //TODO should check if connected and if not root
			var target;
			if (elOrId) {
				target = typeof elOrId === 'string' ? window.document.getElementById(elOrId) : elOrId;
			} else {
				target = window.document.body;
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
			if (!this.$el) { ERR$1(34); } // TODO check if root and mounted
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
			if (!this.$el) { ERR$1(34); }
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
		if (!tag) { ERR$1(5); }

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
				ERR$1(36, tag);
			}
		}
		// add the tag meta property
		VMProto.$tag = tag;

		registerVM(tag, VMType);

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
		var doc = window__default.document;
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
	Qute.ERR = ERR$1;

	function splitList(text) {
		if (!text) { return undefined; }
		text = text.trim();
		if (!text) { return undefined; }
		var rx = text.indexOf(',') > -1 ? /\s*,\s*/ : /\s+/;
		return makeSymbols(text.split(rx));
	}

	function makeSymbols(keys) {
		return keys.reduce(function(acc, value) {
			acc[value] = true;
			return acc;
		}, {});
	}

	function ERR$2(msg) {
		throw new Error(msg);
	}

	// A regex HTML PARSER extended to support special attr names (inspired from https://johnresig.com/blog/pure-javascript-html-parser/)


	var STAG_RX = /^<([-A-Za-z0-9_:]+)((?:\s+[-\w@#:]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|(?:\{[^}]*\})|[^>\s]+))?)*)\s*(\/?)>/,
	    ETAG_RX = /^<\/([-A-Za-z0-9_:]+)[^>]*>/,
	    ATTR_RX = /([-A-Za-z0-9_@#:]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|(?:\{((?:\\.|[^}])*)\})|([^>\s]+)))?/g;

	var voids = {else:true, case:true, area:true, base:true, br:true, col:true, embed:true, hr:true, img:true, input:true, link:true, meta:true, param:true, source:true, track:true, wbr:true};

	function parseHTML(html, handler) {
	    function handleStartTag(tagName, attrsDecl, isVoid) { // void elements are tags with no close tag
	        tagName = tagName.toLowerCase();
	        isVoid = isVoid || voids[tagName];
	        if (!isVoid) { stack.push(tagName); }
	        var attrs = [];
	        ATTR_RX.lastIndex = 0;
	        var m = ATTR_RX.exec(attrsDecl);
	        while (m) {
	            // preserve empty values like: "" or ''. If attribute with no value then the boolean true is used as the value
	            var v = m[2] != null ? m[2] : (m[3] != null ? m[3] : (m[4] != null ? m[4] : (m[5] != null ? m[5] : true)));
	            attrs.push({ name: m[1], value: v, expr: m[4] != null });
	            m = ATTR_RX.exec(attrsDecl);
	        }
	        handler.start(tagName, attrs, !!isVoid);
	    }

	    function handleEndTag(tagName) {
	        tagName = tagName.toLowerCase();
	        var top = stack.pop();
	        if (top !== tagName) { throw new Error('Unmatched close tag. Current Open tag is <'+top+'> but found </'+tagName+'>') }
	        handler.end(tagName);
	    }

	    var text = '', match = null, stack = [];
	    while (html) {
	        var i = html.indexOf('<');
	        if (i === -1) {
	            text += html;
	            html = null; // exit
	        } else if (i > 0) {
	            text += html.substring(0, i);
	            html = html.substring(i);
	        } else { // i === 0
	            var c = html.charAt(i+1);
	            if (c === '!' && html.substring(i+2, i+4) === '--') { // <!--
	                if (text && handler.text) { handler.text(text); text = ''; }
	                var k = html.indexOf('-->', i+3);
	                if (k === -1) {
	                    throw new Error('Parse error: comment not closed');
	                }
	                if (handler.comment) { handler.comment(html.substring(i+3, k)); }
	                html = html.substring(k+3);
	            } else if (c === '/' && (match = ETAG_RX.exec(html))) { // end tag
	                if (text && handler.text) { handler.text(text); text = ''; }
	                html = html.substring(i+match[0].length);
	                handleEndTag(match[1]);
	            } else if (match = STAG_RX.exec(html)) { // start tag
	                if (text && handler.text) { handler.text(text); text = ''; }
	                html = html.substring(i+match[0].length);
	                handleStartTag(match[1], match[2], match[3]);
	            } else { // not a html tag
	                // get the next <
	                var next = html.indexOf('<', i+1);
	                if (next === -1) {
	                    text += html;
	                    html = null;
	                } else {
	                    text += html.substring(i, next);
	                    html = html.substring(next);
	                }
	            }
	        }
	    }
	    if (text && handler.text) { handler.text(text); }
	    if (stack.length > 0) {
	        throw new Error("Unclosed tag: "+stack[0]);
	    }
	}

	/**
	 * Transform jsq files to js files
	 * No map file is required since the transformation preserve original code lines
	 */


	var TAG_RX = /(?:^|\n)\s*<(?:(x-tag)|(x-style))(\s+[^>]*)?>/;
	var TAG_END_RX = /\s*<\/(?:(x-tag)|(x-style))\s*>/;
	var ATTR_RX$1 = /([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;
	var CNT_LINES_RX = /\n/g;

	function getTagName(match) {
	    if (match[1]) { return 'x-tag'; }
	    if (match[2]) { return 'x-style'; }
	    ERR$2("Bug?");
	}


	function parseAttrs(attrsDecl) {
	    var attrs = {};
	    ATTR_RX$1.lastIndex = 0;
	    var m = ATTR_RX$1.exec(attrsDecl);
	    while (m) {
	        // preserve empty values like: "" or ''. If attribute with no value then the boolean true is used as the value
	        attrs[m[1]] = m[2] != null ? m[2] : (m[3] != null ? m[3] : (m[4] != null ? m[4] : true));
	        m = ATTR_RX$1.exec(attrsDecl);
	    }
	    return attrs;
	}

	function newLines(text) { // remove any characters but new lines from given text
		var ar = text.match(CNT_LINES_RX);
	    return ar ? ar.join('') : '';
	}

	function parseXTags(source, handler) {
	    var m = TAG_RX.exec(source);
	    while (m) {
	    	var lfs = newLines(m[0]);
	        var partText = source.substring(0, m.index);
	        if (partText) {
	            handler.text(partText+lfs);
	        }
	        source = source.substring(m.index+m[0].length);
	        var stag = getTagName(m);
	        var attrs = m[3];
	        if (attrs) { attrs = attrs.trim(); }
	        m = TAG_END_RX.exec(source);
	        if (!m) { ERR$2(("Invalid qute file: No closing </" + stag + "> found.")); }

	        var etag = getTagName(m);
	        if (etag !== stag) { ERR$2(("Invalid qute file: Found closing tag '" + etag + "'. Expecting '" + stag + "'")); }

	        partText = source.substring(0, m.index);
	        handler.tag(stag, attrs ? parseAttrs(attrs) : null, partText);

	        source = source.substring(m.index+m[0].length);
	        m = TAG_RX.exec(source);
	    }
	    // scan for imports on the remaining text
	    if (source)  {
	        handler.text(source);
	    }
	}


	// ======================= transform JSQ to JS =====================

	function handleTemplate(compiler, attrs, text) {
		if (!attrs || !attrs.name) { ERR$2("x-tag attribute 'name' is required"); }
	    var name = attrs.name;
	    //var fname = kebabToCamel(name);
	    var imports = attrs.import || null;

	    var compiledFn = compiler.compile(text, splitList(imports));
	    return 'Qute.register("'+name+'", '+compiledFn+', true);\n';
	}

	function handleStyle(compiler, attrs, text) {
	    return 'Qute.css('+JSON.stringify(text.trim())+');\n';
	}

	function transpile(compiler, source, opts) {
	    // We do not validate source -> If the source is not including a import Qute from ... then
	    // a syntgax error will be trown by javascript (since Qute symbol will not be found)

		var out = '';
	    parseXTags(source, {
	        tag: function(tag, attrs, text) {
	            if (text) {
	                if (tag === 'x-tag') {
	                    out += handleTemplate(compiler, attrs, text);
	                } else if (tag === 'x-style') {
	                    out += handleStyle(compiler, attrs, text);
	                } else {
	                	ERR$2(("Unsupported tag: '" + tag + "'"));
	                }
	                if (!(opts && opts.removeNewLines)) { out += newLines(text); }
	            }
	        },
	        text: function(text) {
	        	if (text) { out += text; }
	        }
	    });

	    return out;
	}

	/*
	  cb is a callback which will be called when an xtag was parsed:
	  cb(xtagName, xtagFn, isCompiled)
	 */
	function loadXTags(compiler, source, cb) {
	    parseXTags(source, {
	        tag: function(tag, attrs, text) {
	            if (tag !== 'x-tag') { ERR$2(("Unsupported tag: '" + tag + "'")); }
	            if (!attrs || !attrs.name) { ERR$2("x-tag attribute 'name' is required"); }
	            var fn = compiler.compileFn(text, splitList(attrs.import));
	            cb(attrs.name, fn, !attrs.static);
	        },
	        text: function(){} // ignore
	    });
	}

	/*
	attrs: {key: value, $, @}

	h(tag, attrs[, bindings, events], children) - output dom node
	v(expr) - variable text
	t(text) - static text
	f(list, item, index, hasNext, node) - for
	x(expr, ifFragment, elseFragment) - if
	c(tag, attrs, children) - view
	*/



	/*
	1. Rewrite var names inside a literal object representation: we need to avoid rewriting words inside simple or double quoted strings or unquoted keys (which looks like vars)

	QSTR:
	'(?:\\.|[^'])*'
	DQSTR:
	"(?:\\.|[^"])*"
	VAR:
	[a-zA-Z_\$][0-9a-zA-Z_\$]*
	KEY:
	[\{,]\s*[a-zA-Z_\$][0-9a-zA-Z_\$]*\s*\:

	((?:QSTR)|(?:DQSTR)|(?:KEY))|(VAR)
	=> p1: ignore (String or key), p2: var

	2. Rewrite var names in expressions (no literal obj reprentation)
	We can do this using the same regex as above like this:
	((?:QSTR)|(?:DQSTR))|(VAR)
	=> p1: ignore (String), p2: var
	*/
	var VAR_RX = /^[a-zA-Z_\$][0-9a-zA-Z_\$]*$/;
	var EXPR_RX = /((?:'(?:\\.|[^'])*')|(?:"(?:\\.|[^"])*"))|([a-zA-Z_\$][0-9a-zA-Z_\$\.]*)/g;
	var OBJ_RX = /((?:'(?:\\.|[^'])*')|(?:"(?:\\.|[^"])*")|(?:[\{,]\s*[a-zA-Z_\$][0-9a-zA-Z_\$\.]*\s*\:))|([a-zA-Z_\$][0-9a-zA-Z_\$\.]*)/g;

	var ARROW_FN_RX = /^(\(?)\s*((?:[a-zA-Z_$][a-zA-Z_$0-9]*)(?:\s*,\s*[a-zA-Z_$][a-zA-Z_$0-9]*)*)(\)?)\s*=>\s*(.*)$/;
	// nested is a special tag we added for convenience in the regular html tags - it is used as a more meaningful replacement of template or div
	var HTML_TAGS = makeSymbols("nested html head meta link title base body style nav header footer main aside article section h1 h2 h3 h4 h5 h6 div p pre blockquote hr ul ol li dl dt dd span a em strong b i u s del ins mark small sup sub dfn code var samp kbd q cite ruby rt rp br wbr bdo bdi table caption tr td th thead tfoot tbody colgroup col img figure figcaption map area video audio source track script noscript object param embed iframe canvas abbr address meter progress time form button input textarea select option optgroup label fieldset legend datalist menu output details summary command keygen acronym applet bgsound basefont big center dir font frame frameset noframes strike tt xmp template".split(" "));


	function _s(val) {
	    return JSON.stringify(val);
	}

	function _key(match) {
		var i = match.indexOf('.');
		return i > 0 ? match.substring(0,i) : match;
	}
	// write expr (without literal objects) by rewriting vars
	function __x(expr, ctx) {
	    return expr.replace(EXPR_RX, function(match, p1, p2) {
	    	if (!p2) { return match; }
	    	if (p2 === 'this') { // replace by 'm'
	    		return 'm';
	    	} else if (p2.startsWith('this.')) {
	    		return 'm'+p2.substring(4);
	    	}
	    	return !ctx.symbols[_key(match)] ? 'm.'+p2 : match;
	    });
	}
	function _x(expr, ctx) {
	    return '(' + __x(expr, ctx) + ')';
	}
	// write literal object by rewriting vars
	function _o(expr, ctx) {
	    return '(' + expr.replace(OBJ_RX, function(match, p1, p2) {
	    	if (!p2) { return match; }
	    	if (p2 === 'this') { // replace by 'm'
	    		return 'm';
	    	} else if (p2.startsWith('this.')) {
	    		return 'm'+p2.substring(4);
	    	}
	    	return !ctx.symbols[_key(match)] ? 'm.'+p2 : match;
	    }) + ')';
	}
	function _xo(expr, ctx) {
		if (expr == null) { return 'null'; }
		var c = expr.charAt(0);
		return (c === '{' || c === '[' ? _o : _x)(expr, ctx);
	}
	// used to wrap a compiled expr in a lambda function
	function _v(expr) {
		return 'function(m){return '+expr+'}';
	}
	function _r(expr) { // a sub-rendering context fn
		return 'function($){return '+expr+'}';
	}

	function getArrowFn(expr, ctx) {
		var m = ARROW_FN_RX.exec(expr);
		if (m) {
			var open = m[1];
			var args = m[2].trim();
			var close = m[3];
			var body = m[4].trim();

			if (!!open !== !!close) {
				ERR$2('Invalid arrow function syntax: '+expr);
			}
			if (!body) {
				ERR$2('Invalid arrow function syntax: '+expr);
			}
			// 123 = { and 125 = }
			var bs = body.charCodeAt(0);
			var be = body.charCodeAt(body.length-1);
			if (bs === 123) {
				if (be !== 125) {
					ERR$2('Invalid arrow function syntax: '+expr);
				} // else body is in the form { ... }
			} else if (be === 125) {
				ERR$2('Invalid arrow function syntax: '+expr);
			} else { // no { ... }
				body = '{'+body+';}';
			}
			// push in ctx.symbols  the local vars
			var symbols = ctx.symbols;
			var localSymbols = Object.assign({},symbols);
			args.split(/\s*,\s*/).forEach(function (key) { localSymbols[key] = true; });
			ctx.symbols = localSymbols;
			var r = '(function('+args+')'+__x(body, ctx)+')($1,m)'; // call the inline fn with the m (this) and the $1 argument
			ctx.symbols = symbols; // restore symbols
			return r;
			// pop from ctx symbols the local vars
		}
		return null;
	}
	// write a callback (e.g. they are used by events)
	// if the event is a var name => we generate a fn: function(e) { expr(e) }
	// otherwise we generate a function: function() { expr }
	function _cb(expr, ctx) {
		if (VAR_RX.test(expr)) {
			// event listeners will be called with args:
			// 1. for functions: VM.callback(event) - where this is the VM
			// 2. for vm methods: VM.callback(event) - where this is the VM
			// 3. for expressions: $1 - the event, this - the vm
			// the event cb function must always be called with the element as the 'this' object
			if (ctx.imports[expr]) { // an imported function
				return "function($1){return "+expr+".call(this, $1)}";
			} else { // a vm method
				return "function($1){return this."+expr+"($1)}";
			}
		} else {
			var arrowFn = getArrowFn(expr, ctx);
			if (arrowFn) {
				//return "function(this,$1){"+arrowFn+"}";
				return "function($1){var m=this;"+arrowFn+"}";
			} else {
				return "function($1){var m=this;"+_x(expr, ctx)+"}";
			}
		}
	}

	function _fn(name) {
		//TODO '$' must not be used as a for argument!!
		var r = '$.'+name+'(';
		if (arguments.length>1) {
			r += Array.prototype.slice.call(arguments, 1).join(',');
		}
		return r+')';
	}
	function _node(xattrs, ctx) {
		return xattrs ? xattrs.compile(ctx) : 'null';
	}
	function _nodes(children, ctx) {
		if (!children || !children.length) { return 'null'; }
		return '['+children.map(function(child) {
			return child.compile(ctx);
		}).join(',')+']';
	}
	/*
	function _bindings(bindings, ctx) {
		var out = [];
		for (var key in bindings) {
			out.push(_s(key)+':'+_v(_xo(bindings[key], ctx)));
		}
		return out.length ? '{'+out.join(',')+'}' : null;
	}
	*/
	/*
	function _bindings(bindings, ctx) {
		var out = [];
		for (var key in bindings) {
			out.push(_s(key)+':'+_xo(bindings[key], ctx));
		}
		return out.length ? _v('{'+out.join(',')+'}') : null;
	}
	*/
	function _events(events, ctx) {
		var out = [];
		for (var key in events) {
			out.push(_s(key)+':'+_cb(events[key], ctx));
		}
		return out.length ? '{'+out.join(',')+'}' : null;
	}
	/*
	function _attrs(attrs) {
		var out = null;
		if (attrs) {
			out = [];
			for (var key in attrs) {
				out.push(_s(key)+':'+_s(attrs[key]));
			}
		}
		return out && out.length ? '{'+out.join(',')+'}' : 'null';
	}
	*/
	/*
	ol impl which compile each binding as a function
	function _xattrs(bindings, events, ctx) {
		var out = null;
		if (bindings) {
			out = [];
			for (var key in bindings) {
				// TODO use v(..) only if not a literal to optimize literal assignment like boolean or number (do not enclose in a function)
				out.push(_s(key)+':'+_v(_xo(bindings[key], ctx)));
			}
		}
		if (events) {
			out || (out = []);
			var v = _events(events, ctx);
			if (v) out.push('"$on":'+v);
		}
		return out && out.length ? '{'+out.join(',')+'}' : 'null';
	}
	*/
	function _xattrs(attrs, bindings, xattrs, directives, events, ctx) {
		var out = null;
		if (attrs) {
			out = [];
			for (var key in attrs) {
				out.push(_s(key)+':'+_s(attrs[key]));
			}
		}
		if (bindings) {
			out || (out = []);
			for (var key in bindings) {
				out.push(_s(key)+':'+_v(_xo(bindings[key], ctx)));
			}
		}
		if (xattrs) {
			out || (out = []);
			for (var key in xattrs) {
				var val;
				if (key === '$attrs' || key === '$listeners') {
					val = xattrs[key];
				} else {
					val = _v(_xo(xattrs[key], ctx));
				}
				out.push(_s(key)+':'+val);
			}
		}
		if (directives) {
			out || (out = []);
			for (var key in directives) {
				out.push(_s(key)+':'+directives[key]); // directives are already encoded
			}
		}
		if (events) {
			out || (out = []);
			var v = _events(events, ctx);
			if (v) { out.push('"$on":'+v); }
		}
		return out && out.length ? '{'+out.join(',')+'}' : 'null';
	}

	function attrValue(attr) {
		return attr.value === true ? attr.name : attr.value;
	}

	function RootNode() {
		this.name = 'root';
		this.children = [];
		this.append = function(child) {
	        this.children.push(child);
		};
		this.lastChild = function() {
			return this.children[this.children.length-1];
		};
		this.compile = function(ctx) {
			var children = this.children;
			if (children.length !== 1) { ERR$2("the root node must have a single children element"); }
			return this.children[0].compile(ctx);
		};
		// trim the children (remove trailing and leading blank nodes)
		this.trim = function() {
			var children = this.children;
			if (children.length > 1) {
				var child = children[0];
				if (child instanceof TextNode && child.isBlank) { children.shift(); }
				child = children[children.length-1];
				if (child instanceof TextNode && child.isBlank) {
					child.pop();
				}
			}
			return this;
		};
	}

	function DomNode(name, attrs) {
		this.name = name;
		this.attrs = null;
		this.bindings = null;
		this.xattrs = null; // directives like x-show
		// for future use (not yet used)
		// directives are custom attrs that can be  contirbuted by apps
		// They are treated like xattrs but are output as is (as they are encoded at read time)
		this.directives = null;
		this.events = null;
		this.children = [];

		this.attr = function(name, value) {
			if (!this.attrs) { this.attrs = {}; }
			this.attrs[name] = value;
		};
		this.bind = function(name, value) {
			var bindings = this.bindings || (this.bindings = {});
			bindings[name] = value.trim();
		};
		this.xattr = function(name, value) {
			if (!this.xattrs) { this.xattrs = {}; }
			this.xattrs[name] = value.trim();
		};
		this.directive = function(name, value) {
			if (!this.directives) { this.directives = {}; }
			this.directives[name] = value;
		};
		this.on = function(name, value) {
			var events = this.events || (this.events = {});
			events[name] = value.trim();
		};

		this.append = function(node) {
			this.children.push(node);
		};

		this.compile = function(ctx) {
			if (this.name === 'tag') {
				var attrs = this.attrs;
				if (!attrs || !attrs.is) { ERR$2("<tag> requires an 'is' attribute"); }
				var isAttr = attrs.is;
				delete attrs.is;
				return _fn('g', _v(_x(isAttr, ctx)), // g from tag
					//_attrs(this.attrs),
					_xattrs(this.attrs, this.bindings, this.xattrs, this.directives, this.events, ctx),
					_nodes(this.children, ctx));
			}
			if (this.name === 'view') {
				var attrs = this.attrs;
				if (!attrs || !attrs.is) { ERR$2("<view> requires an 'is' attribute"); }

				var isExpr = _v(_x(attrs.is, ctx));
				delete attrs.is;
				var noCache = 'false';
				if ('x-nocache' in attrs) {
					delete attrs['x-nocache'];
					noCache = 'true';
				}
				var onChange = 'null';
				if ('x-change' in attrs) {
					onChange = _cb(attrs['x-change'], ctx);
					delete attrs['x-change'];
				}

				return _fn('w', // w from view ?
					isExpr,
					onChange,
					noCache,
					_xattrs(this.attrs, this.bindings, this.xattrs, this.directives, this.events, ctx), //xattrs
					_r(_nodes(this.children, ctx)) // childrenFn
				);
			}
			var fname, tag;
			//if (ctx.isXTag(this.name))
			if (this.name in HTML_TAGS) { // a dom element
				fname = 'h'; // h from html
				tag = _s(this.name);
			} else { // a component
				var tag = ctx.resolve(this.name);
				if (tag) { // resolved compile time
					fname = 'v'; // v from view model
				} else { // should resolve at runtime
					fname = 'r'; // r from runtime
					tag = _s(this.name);
				}
			}
			if (this.name==='pre') {
				ctx = ctx.push();
				ctx.pre = true;
			}
			return _fn(fname, tag,
				//_attrs(this.attrs),
				_xattrs(this.attrs, this.bindings, this.xattrs, this.directives, this.events, ctx),
				_nodes(this.children, ctx));
		};

		this.xcontent = function(type, attr) {
			if (attr.value === true) {
				return new StaticNode(this, type);
			} else {
				//TODO: use type ...
	    		this.xattr('$html', attr.value);
	    	}
	    	return this;
		};

		function parseXAttrs(val) {
			if (val === true) { return 'null'; }
			var first = true;
			if (val.charCodeAt(0) === 33) { // a ! -> exclude rule
				val = val.substring(1);
				first = false;
			}
			var ar;
			val = val.trim();
			if (val.indexOf(',') > -1) {
				ar = val.split(/\s*,\s*/);
			} else {
				ar = val.split(/\s+/);
			}
			ar.unshift(first); // insert the filter type (true for inclusion, false for exclusion) as the first item
			return _s(ar);
		}

		this.parseAttrs = function(attrs) {
			var r = this;
			for (var i=0,l=attrs.length; i<l; i++) {
		    	var attr = attrs[i];
		    	var name = attr.name;
		        var c = name[0];
		        if (c === ':') {
		        	this.bind(name.substring(1), attr.value);
		        } else if (c === '@') {
		        	this.on(name.substring(1), attr.value);
		        } else if ('x-for' === name) {
		        	r = new ListNode(attr.value, this);
		        } else if ('x-attrs' === name) {
		        	this.xattr('$attrs', parseXAttrs(attr.value));
		        } else if ('x-listeners' === name) {
		        	this.xattr('$listeners', parseXAttrs(attr.value));
		        } else if ('x-channel' === name) {
		        	this.attr('$channel', attr.value); // use a regular attr since valkue is always a string literal
				} else if ('x-show' === name) {
					this.xattr('$show', attr.value);
				} else if ('x-class' === name) {
					this.xattr('$class', attr.value);
				} else if ('x-style' === name) {
					this.xattr('$style', attr.value);
				} else if ('x-toggle' === name) {
					this.xattr('$toggle', attr.value);
				} else if ('x-html' === name) {
					if (attr.value === true) {
						r = new StaticNode(this, null);
					} else {
	    				this.xattr('$html', attr.value);
	    			}
				} else if ('x-markdown' === name) {
					r = new StaticNode(this, 'markdown');
		        } else if (name.startsWith('x-content-')) {
		        	var ctype = name.substring('x-content-'.length);
		        	r = new StaticNode(this, ctype !== 'html' ? ctype : null);
		        } else if (attr.expr) {
		        	// an expression: support { ... } as an alternative for :name
		    		this.bind(name, attr.value);
		    	} else if (name.startsWith('x-bind:')) {
		    		this.bind(name.substring(7), attr.value);
		    	} else if (name.startsWith('x-on:')) {
		    		this.on(name.substring(5), attr.value);
		        } else {
		        	this.attr(name, attrValue(attr));
		        }
			}
			return r;
		};

		return this.parseAttrs(attrs);
	}
	// a DomNode that has static children (set with innerHTML from the template content)
	function StaticNode(node, type) {
		this.node = node;
		this.compile = function(ctx) {
			return _fn('hh', _s(this.node.name),
				//_attrs(this.node.attrs),
				_xattrs(this.node.attrs, this.node.bindings, this.node.xattrs, this.node.directives, this.node.events, ctx),
				_s(this.html.join('')),
				_s(type)
			);
		};

		// compile logic
		this.tag = node.name;
		this.stack = [];
		this.html = [];
		this.start = function(tagName, attrs, isVoid) {
			var html = this.html;
			html.push('<', tagName);
			for (var i=0,l=attrs.length; i<l; i++) {
				var attr = attrs[i];
				html.push(' ', attr.name);
				if (attr.value !== true) {
					html.push('="', attr.value, '"');
				}
			}
			html.push(isVoid?'/>':'>');
			if (!isVoid) { this.stack.push(tagName); }
		};
		this.end = function(tagName) {
			var tag = this.stack.pop();
			if (tag) { // subtree traversed
				if (tag !== tagName) { ERR$2(("Closing tag '" + tagName + "' doesn't match the start tag '" + tag + "'")); }
				this.html.push('</', tagName, '>');
			} else {
				return true; // finished
			}
		};
		this.text = function(text) {
			this.html.push(text);
		};
	}

	function TextNode(value) {
		this.value = value;
		this.isBlank = value.trim().length===0;
		this.compile = function(ctx) {
			var value = this.isBlank && !ctx.pre ? this.value.trim()+' ' : this.value;
			return _fn('t', _s(value));
		};
		this.append = function(text) {
			this.value += text;
			if (this.isBlank) { this.isBlank = this.value.trim().length===0; }
		};
	}

	function ExprNode() {
		this.parts = [];
		this.text = function(text) {
			this.parts.push(false, text);
		};
		this.expr = function(expr) {
			this.parts.push(true, expr);
		};
		this.compile = function(ctx) {
			var parts = this.parts;
			var out = [];
			for (var i=0,l=parts.length; i<l; i+=2) {
				if (parts[i]) { out.push(_x(parts[i+1], ctx)); }
				else { out.push(_s(parts[i+1])); }
			}
			return _fn('x', _v(out.join('+')));
		};
	}

	var FOR_RX = /^\s*(.+)\s+in\s+(.+)\s*$/;
	function parseForExpr(listNode, expr) {
		var m = FOR_RX.exec(expr);
		if (!m) { ERR$2("Invalid for expression"); }
		listNode.list = m[2].trim();
		var item = m[1].trim();
		if (item.indexOf(',') > -1) {
			var args = item.split(/\s*,\s*/);
			listNode.item = args[0];
			listNode.index = args[1];
			if (args.length > 2) { listNode.hasNext = args[2]; }
		} else {
			listNode.item = item;
		}
	}
	function ListNode(expr, node) {
		this.node = node;
		this.list = null;
		this.item = null;
		//TODO can we just not include them in args list? instead of using _?
		this.index = '_';
		this.hasNext = '__';

		// parse expr
		parseForExpr(this, expr);

		this.append = function(node) {
			this.node.append(node);
		};

		this.compile = function(ctx) {
			// we wrap children in a inline fucntion def so that item, index and has_next are resolved inside the children nodes
			// also, _x function must not rewrite item, index and has_next variable ...
			// 1. compile children and avoid rewriting iteration vars
			var forCtx = ctx.push();
			var forSymbols = forCtx.symbols;
			forSymbols[this.item] = true;
			forSymbols[this.index] = true;
			forSymbols[this.hasNext] = true;
			var children = _node(this.node, forCtx);
			// 2. wrap children
			var childrenFn = 'function($,'+this.item+','+this.index+','+this.hasNext+'){return '+children+'}';
			return _fn('l', _v(_x(this.list, ctx)), childrenFn);
		};

	}

	function ForNode(tag, attrs) {
		this.list = null;
		this.item = null;
		this.index = '_';
		this.hasNext = '__';

		this.children = [];
		this.append = function(child) {
	        this.children.push(child);
		};
		this.lastChild = function() {
			return this.children[this.children.length-1];
		};
		this.compile = function(ctx) {
			// we wrap children in a inline fucntion def so that item, index and has_next are resolved inside the children nodes
			// also, _x function must not rewrite item, index and has_next variable ...
			// 1. compile children and avoid rewriting iteration vars
			var forCtx = ctx.push();
			var forSymbols = forCtx.symbols;
			forSymbols[this.item] = true;
			forSymbols[this.index] = true;
			forSymbols[this.hasNext] = true;
			var children = _nodes(this.children, forCtx);
			// 2. wrap children
			var childrenFn = 'function('+this.item+','+this.index+','+this.hasNext+'){return '+children+'}';
			return _fn('a', _v(_x(this.list, ctx)), childrenFn);
		};

		if (attrs.length !== 1) { ERR$2("For directive take exatcly one attribute"); }
		parseForExpr(this, attrs[0].value);
	}

	function IfNode(tag, attrs) {
		this.children = [];
		this.cases = null; // array of if-else / if nodes.
		this._else = null;
		this.change = null; // onchange event handler if any
		this.expr = null;

		// we don't check the attr name - any name may be used (not only 'value')
		var valueAttr = attrs[0];
		if (attrs.length === 2) {
			var changeAttr = attrs[1];
			if (valueAttr.name === 'x-change') {
				changeAttr = valueAttr;
				valueAttr = attrs[1];
			} else if (changeAttr.name !== 'x-change') {
				ERR$2(("Invalid if attribute '" + (changeAttr.name) + "'. You may want to use x-change?"));
			}
			this.change = changeAttr.value;
		} else if (attrs.length !== 1) {
			ERR$2("if has only one required attribute: value='expr' and an optional one: x-change='onChangeHandler'");
		}
		this.expr = attrValue(valueAttr);

		this.append = function(node) {
			if (node instanceof ElseNode) {
				if (this.cases) {
					var lastCase = this.cases[this.cases.length-1];
					if (lastCase.expr === null) { ERR$2('Invalid if/else-id/else tags: else must be the last one in the chain.'); }
				} else {
					this.cases = [];
				}
				this.cases.push(node);
			} else if (this.cases) {
				var lastCase = this.cases[this.cases.length-1];
				lastCase.children.push(node);
			} else {
				this.children.push(node);
			}
		};

		this.compile = function(ctx) {
			// if/else-if/else signature: 'i', list_of_exprs, list_of_children, changeCb
			// else expr is null
			// if only if is present the a list of size is used.
			var change = this.change ? _cb(this.change, ctx) : 'null';

			var exprs = [ _v(_x(this.expr, ctx)) ], kids = [ _r(_nodes(this.children, ctx)) ];
			if (this.cases) {
				var cases = this.cases;
				for (var i=0,l=cases.length; i<l; i++) {
					var ifCase = cases[i];
					exprs.push(ifCase.expr ? _v(_x(ifCase.expr, ctx)) : 'null');
					kids.push(_r(_nodes(ifCase.children, ctx)));
				}
			}
			return _fn('i', '['+exprs.join(',')+']', '['+kids.join(',')+']', change);
		};
	}

	function ElseNode(tag, attrs) {
		this.children = [];
		this.expr === null;
		if (tag === 'else-if') {
			if (attrs.length !== 1) {
				ERR$2("the else-if tag must have a 'value' attribute");
			}
			// we don't check the attr name...
			this.expr = attrValue(attrs[0]);
		} //else the else tag: no attributes
	}

	//TODO
	function SlotNode(tagName, attrs) {
		this.name = tagName;
		this.children = [];
		this.append = function(child) {
	        this.children.push(child);
		};
		//TODO is this needed?
		this.lastChild = function() {
			return this.children[this.children.length-1];
		};
		this.process = function(processor) {
			return processor.processSlot(this);
		};
		this.compile = function(ctx) {
			// we push the 'm' (current model) because the slot renderer (i.e. r.s)
			// needs the current model to fetch the slot value
			return _fn('s', _s(this.slotName), _nodes(this.children, ctx));
		};
		if (attrs.length > 1) { ERR$2("slot node take zero or one 'name' parameter"); }
		this.slotName = attrs.length ? attrValue(attrs[0]) : null;
	}


	var MUSTACHE_RX = /\{\{([^\}]+)\}\}/g;
	//var BLANK_RX = /^\s*$/;

	var NODES = {
		'if':  IfNode,
		'else':  ElseNode,
		'else-if': ElseNode,
		'for':  ForNode,
		'slot': SlotNode
	};

	var SYMBOLS = {
		"true": true, "false": true, "undefined": true, "null":true, "$1": true,
		"this":true, "JSON": true, "Object":true, "console":true, "window": true, "$": true
	};



	function Compiler() {
		function Context(symbols, imports, resolve, pre) {
			this.pre = pre; // if pre then do not compact spaces in TextNodes
			this.resolve = resolve;
			this.symbols = symbols;
			this.imports = imports;
			this.push = function() {
				return new Context(Object.assign({}, this.symbols), this.imports, this.resolve, this.pre);
			};
		}
		// collector is used only when static html should be collected sue to an x-html attribute
		// See StaticNode
		this.collector = null;
		this.top = null;
		this.stack = [];
		this.lastText = null; // used to merge adjacent text nodes

		this.resolve = function(tag) {
			return null;// the default is to resolve at runtime
		};

		this.pushText = function(text) {
			if (this.lastText) { this.lastText.append(text); }
			else {
				var node = new TextNode(text);
				this.push(node, true);
				this.lastText = node;
			}
		};

		this.push = function(node, isVoid) {
			this.lastText = null;
			this.top.append(node);
			if (!isVoid) {
				this.stack.push(this.top);
				this.top = node;
			}
		};

		this.pop = function() {
			this.lastText = null;
	        var top = this.top;
	        this.top = this.stack.pop();
	        return top;
		};


		this.text = function(text) {
			if (this.collector) {
				this.collector.text(text);
				return;
			}
		    var i = text.indexOf('{{'), s = 0;
		    if (i > -1) {
		        MUSTACHE_RX.lastIndex = i;
		        var match = MUSTACHE_RX.exec(text);
		        if (match) {
		           	var node = new ExprNode();
		            do {
		                var index = match.index;
		                if (index > s) {
		                    node.text(text.substring(s, index));
		                }
		                node.expr(match[1]);
		                s = MUSTACHE_RX.lastIndex;
		                match = MUSTACHE_RX.exec(text);
		            } while (match);
		            if (s < text.length) {
		                node.text(text.substring(s));
		            }
		            this.push(node, true);
		            return;
		        }
		    }
		    this.pushText(text);
		};

		this.start = function(tagName, attrs, isVoid) {
			if (this.collector) {
				this.collector.start(tagName, attrs, isVoid);
			} else {
				var NodeType = NODES[tagName];
				var node;
				if (NodeType) {
					node = new NodeType(tagName, attrs, isVoid);
				} else {
					node = new DomNode(tagName, attrs, isVoid);
					if (node instanceof StaticNode) {
						// allow <div x-conent-{random} />
						//if (isVoid) ERR("Static node (x-html) must have some content");
						this.collector = node;
					}
				}
				this.push(node, isVoid);
			}
		};

		this.end = function(tagName) {
			if (this.collector) {
				if (!this.collector.end(tagName)) {
					return
				}
				// subtree traversed - remove collector
				this.collector = null;
			}
			this.pop();
		};

		this.parse = function(text) {
			this.top = new RootNode();
			parseHTML(text.trim(), {
				start: this.start.bind(this),
				end: this.end.bind(this),
				text: this.text.bind(this)
			});
			// "trim" the root node (blank text mnodes mayt appear because of comments)
			return this.top.trim();
		};

	    this.compile = function(text, imports, pre) { // r is the Renderer
	    	var ctx = new Context(Object.assign(imports || {}, SYMBOLS), imports || {}, this.resolve, pre);
	    	var r = this.parse(text).compile(ctx);
	    	//console.log("COMPILED:",r);
	        return 'function($){return '+r+';}';
	    };

		this.compileFn = function(text, imports, pre) {
			var ctx = new Context(Object.assign(imports || {}, SYMBOLS), imports || {}, this.resolve, pre);
	    	var r = this.parse(text).compile(ctx);
	    	//console.log("COMPILED:",r);
			return new Function('$', 'return '+r+';');
		};

		this.transpile = function(source, opts) {
			return transpile(this, source, opts);
		};

		this.loadXTags = function(source, cb) {
			return loadXTags(this, source, cb);
		};

	}

	var IMPORT_RX = /^\s*import\s+(\S+)\s+from\s+(?:(\"[^"]+\")|(\'[^']+\')|([^"'][^;\s]*));?$/mg;
	var EXPORT_RX = /^\s*export\s+default\s+/m;


	function Loader() {
		this.createScript = function(code, name) {
			var deps = {};
			code = code.replace(IMPORT_RX, function(m, p1, p2, p3, p4) {
				var path = p2 || p3 || p4;

				if (path) {
					if (path[0] === '.' && path[1] === '/') {
						//TODO resolve file path
						deps[p1] = path;
					} else if (p1 !== 'Qute') {
						console.warning('Imports are ignored in dev version!');
						throw new Error('Only relative paths are supported for import statements: '+m.trim());
					}
				}

				return m.replace('import ', '//import ');
			});
			var hasExport = false;
			code = code.replace(EXPORT_RX, function(m) {
				hasExport = true;
				return "var __DEFAULT_EXPORT__ = ";
			});
			code = new Compiler().transpile(code);
			// apply buble if needed
			if (window__default.buble && window__default.buble.transform) {
				code = window__default.buble.transform(code).code;
			}
			if (hasExport) { code += '\nreturn __DEFAULT_EXPORT__;\n'; }
			// for now script deps are expected to be declared above the script - otherwise compiling will fail
			var comp = (new Function(code))();

			var script = new Script();
			script.name = comp ? name || capitalizeFirst(kebabToCamel(comp.prototype.$tag)) : null;
			script.code = code;
			script.deps = deps;
			script.comp = comp;

			return script;
		};

		this.loadScript = function(scriptEl, wnd) {
			return this.createScript(scriptEl.textContent, scriptEl.getAttribute('name')).load(wnd);
		};

		this.load = function(wnd) {
			var scripts = (wnd ? wnd.document : window.document).querySelectorAll('script[type="text/jsq"]');
			for (var i=0,l=scripts.length; i<l; i++) {
				this.loadScript(scripts[i], wnd);
			}
		};

	}

	function Script() {
		this.name = null;
		this.code = null;
		this.comp = null;
		this.deps = null;

		this.load = function(wnd) {
			if (this.name) { window__default[this.name] = this.comp; }
			return this;
		};

	/*
		this.resolve = function(path) {
			if (!this.file) return null;
			var parts = this.file.split('/').pop();
			path.split('/').forEach(function(part) {
				if (part === '..') {
					parts.pop();
				} else if (part !== '.') {
					parts.push(part);
				}
			});
			return parts.join('/');
		}
	*/

	}

	var PRINT_RX = /%s/g;
	function print(text) {
		var i = 1, args = arguments;
		return text.replace(PRINT_RX, function(match, p1) {
			return args[i++];
		});
	}

	Qute.ERR.resolve = function (code) {
		var text = errors[code];
		if (!text) { text = "Qute Error: "+code; }
		else {
			var args = Array.prototype.slice.call(arguments);
			args[0] = text;
			text = print.apply(null, args);
		}
		throw new Error(text);
	};

	var errors = {


		// ------------------------------------------------------
		// index.js
		/*
		1: "Unsupported tag: '%s'",
		2: "template 'name' is required",
		*/
		// runtime.js
		5: "Usage: Qute(tag[, viewModelDefinition])",
		// list.js
		10: "Broken list fragment. Ignoring updates",
		11: "Invalid index: '%s'. Length is %s",
		12: "Invalid insertion index: '%s'. Length is %s'",
		13: "Remove anchor is invalid: '%s'. Length is %s",
		14: "Invalid move from index: '%s'. Length is %s",
		15: "Invalid move to index: '%s'. Length is %s",
		// rendering.js
		20: "Invalid dynamic component. Should be a ViewModel constructor or a xtag name",
		// no more used
		//21: "Found a 'nested' element without a 'name' attribute",
		23: "Could not resolve ViewModel at runtime for tag: '%s'",
		24: "dynamic for directive accepts only List instances and not regular arrays",
		25: "List properties cannot be used with the static for directive",
		26: "Bug? Unknown xattr name: %s",
		27: "Unknown converter: %s",
		28: "x-channel cannot be used on regular DOM elements: %s",
		// update.js
		30: "Possible infinite loop detected",
		// vm.js
		31: "Incompatible assign for list property: %s",
		32: "No render function defined for the ViewModel!",
		33: "VM is already mounted!",
		34: "VM is not mounted!",
		35: "View not connected",
		36: "No template found for tag '%s'",
		37: "Failed to install plugin %s. Plugins must provide an install(ctx) method.",
		38: 'Posting message to unknown topic %s',
		39: "x-channel used on a VM not defining channels: %s",
		//36: "Cannot unmount a child view",
		// compiler.js
		/*
		50: "<tag> requires an 'is' attribute",
		51: "Invalid for expression",
		52: "For directive take exatcly one attribute",
		53: "if has only one required attribute: value='expr' and an optional one: @change='onChangeHandler'",
		54: "slot node take zero or one 'name' parameter",
		55: "the root node must have a single children element",
		56: "Invalid if attribute '%s'",
		57: "Closing tag '%s' doesn't match the start tag '%s'",
		58: "Static node (x-html) must have some content",
		*/
		// rollup-plugin.js
		/*
		60: "Tag not supported: '%s'",
		61: "The <template> tag requires a name attribute",
		62: "Unresolved tag: '%s'. Please import the implementation in camel case! Ex: \nimport '%s' from 'some-module'",
		*/
		// xtags-parser.js
		/*
		70: "Bug?",
		72: "Invalid qute file: No closing </'%s'> found.",
		73: "Invalid qute file: Found closing tag '%s'. Expecting '%s'",
		*/
		// binding.js
		//80: "Invalid x-radio expression: '%s'. Must be a tag name with a class. Ex: li.active"
	};

	Qute.Compiler = Compiler;
	Qute.compile = function(text, symbols) {
		return new Compiler().compileFn(text, symbols);
	};

	Qute.css('x-tag { display:none; }\n');

	function loadXTag(text) {
		new Compiler().loadXTags(text, function(xtagName, xtagFn, isCompiled) {
			Qute.register(xtagName, xtagFn, isCompiled);
		});
	}
	// load templates
	Qute.load = function(textOrId) {
		if (!textOrId) {
			var xtags = window.document.getElementsByTagName('x-tag');
		    for (var i=0,l=xtags.length; i<l; i++) {
		    	loadXTag(xtags[i].innerHTML);
		    }
		} else {
			loadXTag(textOrId[0] === '#' ? window.document.getElementById(textOrId.substring(1)).textContent : textOrId);
		}
	};

	Qute.Loader = Loader;
	Qute.loadScripts = function() {
		new Loader().load();
	};

	return Qute;

}(window));
//# sourceMappingURL=qutejs-dev-0.9.3.js.map
