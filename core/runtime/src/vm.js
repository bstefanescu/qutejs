import window, {document} from '@qutejs/window';
import ERR from './error.js';
import { stopEvent, chainFnAfter, closestVM, kebabToCamel, filterKeys } from './utils.js';

import Rendering from './rendering.js';
import UpdateQueue from './update.js';
import App from './app.js';
import {createListeners, SetProp, SetClass, SetStyle, SetToggle, SetDisplay} from './binding.js';
import Emitter from './emit.js';
import applyUserDirectives from './q-attr.js';

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
				if (watcher && watcher.call(this, value, old) === false) return;
				this.update();
			}
		},
		enumerable: isEnumerable(key) // keys starting with _ are not enumerable
	}
}

// set $attrs on VMs
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

function ViewModel(app, attrs) {
	if (!app) app = new App(app);
	var prop = {};
	// the attributes set on vm tag which are not declared as props
	prop.value = {};
	Object.defineProperty(this, '$attrs', prop);
	// the app context if any
	prop.value = app;
	Object.defineProperty(this, '$app', prop);
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
	Object.defineProperty(this, '$st', prop); // state: 0 - default, bit 1 - connected, bit 2 - update queued

	var data = this.init(app) || {};
	prop.value = data;
	Object.defineProperty(this, '$data', prop);
	if (data) {
		for (var key in data) {
			var val = data[key];
			Object.defineProperty(this, key,
				val && val.$bindVM ? val.$bindVM(this, key) : defProp(key)
			);
		}
	}

	if (!this.render) ERR(32);

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
		if (!this.$channel) ERR(39, this.$tag);
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
		if (!this.$el) ERR(35);
		return closestVM(this.$el.parentNode);
	},
	$root: function() {
		var parent = this.$parent();
		return parent ? parent.$root() : this;
	},
	$connect: function() {
		if (this.$st & 1) return; // ignore
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
		// TODO update DOM if previously disconnected
		if (false) this.$update();
		// connect children vms
		this.$r.$connect();
		// call the connected callback
		this.connected && this.connected();
		return this;
	},
	$disconnect: function() {
		if (!(this.$st & 1)) return; // ignore
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
						if (!bindings) bindings = [];
						bindings.push(SetClass, val);
					} else if (key === '$style') {
						if (!bindings) bindings = [];
						bindings.push(SetStyle, val);
					} else if (key === '$show') {
						if (!bindings) bindings = [];
						bindings.push(SetDisplay, val);
					} else if (key === '$toggle') {
						if (!bindings) bindings = [];
						bindings.push(SetToggle, val);
					} else if (key === '$channel') {
						this.listen(val);
					} else if (key !== '$use') {
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
		var $use, parentVM = parentRendering && parentRendering.vm;
		if (xattrs && xattrs.$use) {
			$use = applyUserDirectives(parentVM, this.$tag, xattrs);
		}
		// load definition
		var bindings = parentRendering && this.$load(parentRendering, xattrs, slots);
		var rendering = new Rendering(this, parentRendering);
		this.$r = rendering;
		// must never return null - for non rendering components like popups we return a comment
		var el = this.render(rendering) || document.createComment('<'+this.$tag+'/>');
		el.__qute__ = this;
		this.$el = el;
		if (bindings) for (var i=0,l=bindings.length; i<l; i+=2) {
			var binding = bindings[i];
			var up = bindings[i](el, parentRendering.vm, bindings[i+1]);
			parentRendering.up(up)();
		}
		this.created && this.created(el);
		// this can trigger a connect if tree is already connected (for example when inserting a comp in a connected list)
		parentRendering && parentRendering.$push(this);
		// should use parent vm as context for custom directives
		if ($use) $use.call(parentVM, el);
		return el;
	},

	// manual mount (only roots must be moutned this way)
	mount: function(elOrId, insertBefore) {
		if (this.$el) ERR(33); //TODO should check if connected and if not root
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
		if (!this.$el) ERR(34); // TODO check if root and mounted
		this.$disconnect();
		this.$el.parentNode.removeChild(this.$el);
	},
	$update: function() {
		if (this.$el) { // only if connected
			this.$r.$update();
		}
	},
	update: function() {
		if (this.$st === 1) { // only if connected and not already scheduled to update
			this.$st |= 2; // set updating flag
			var self = this;
			UpdateQueue.push(function() {
				self.$update();
				self.$st ^= 2; // remove updating flag
			});
		}
	},
	$on: function(type/*, selector, cb*/) {
		if (!this.$el) ERR(34);
		//if (!this.$clean) this.$clean = [];
		var selector, cb;
		if (arguments.length === 3) {
			selector = arguments[1];
			cb = arguments[2];
			if (!cb) {
				cb = selector;
				selector = null;
				if (!cb) throw new Error('on function requires a callback argument');
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
		}
		this.$el.addEventListener(type, wrapper);
		this.cleanup(function() {
			self.$el.removeEventListener(type, wrapper);
		});
		//this.$clean.push(type, wrapper);
	},
	emit: Emitter.emit,
	emitAsync: Emitter.emitAsync,
	// -------- app event bus -------------
	post: function(topic, msg, data) {
		this.$app.post(topic, msg, data);
	},
	postAsync: function(topic, msg, data) {
		this.$app.postAsync(topic, msg, data);
	},
	// subscribe and register cleanup to remove subscription at disconnect
	subscribe: function(name, listenerFn) {
		var app = this.$app;
		app.subscribe(name, listenerFn.bind(this));
		this.cleanup(function() {
			app.unsubscribe(name, listenerFn);
		});
		return this;
	},
	subscribeOnce: function(topic, event, listenerFn) {
		var app = this.$app;
		var onceSubscription = app.subscribeOnce(topic, event, listenerFn.bind(this));
		this.cleanup(function() {
			app.unsubscribe(topic, onceSubscription);
		});
		return this;
	},
	toHTML: function() {
		return this.$el && this.$el.outerHTML;
	},
	// ---------- i18n support ---------------------
	t: function() {
		return this.$app.i18n.apply(this.$app, Array.prototype.slice.call(arguments));
	},
	// ---------------------------------------------
	init: function() {} // do nothing
}

export default ViewModel;
