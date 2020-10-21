import {document} from '@qutejs/window';
import {kebabToCamel, ERR } from '@qutejs/commons';
import { stopEvent, filterKeys, chainFnAfter } from './utils.js';

import Rendering from './rendering.js';
import UpdateQueue from './update.js';
import App from './app.js';
import {applyListeners, SetProp, SetClass, SetStyle, SetToggle, SetDisplay} from './binding.js';
import Emitter from './emit.js';
import {applyUserDirectives} from './q-attr.js';
import { Prop } from '@qutejs/types';

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
	// the slots injected by the caller
	Object.defineProperty(this, '$slots', prop);
	// the view root element
	Object.defineProperty(this, '$el', prop);
	// chained cleanup functions if any was registered
	Object.defineProperty(this, '$clean', prop);
	// States: 0 - initial, 1 - connected, 2 - updating
	prop.value = 0;
	Object.defineProperty(this, '$st', prop); // state: 0 - default, bit 1 - connected, bit 2 - update queued

	prop.value = {};
    Object.defineProperty(this, '$data', prop);
    /*
    var props = this.$props || {};
    if (typeof props === 'function') props = props(app);
    for (var key in props) {
        Object.defineProperty(this, key, createProp(this, key, props[key]));
    }
    */
    this.$defineProps && this.$defineProps();

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

    // call init hook
    this.init && this.init(app);
	if (!this.render) ERR("No render function defined for the ViewModel!");
}

ViewModel.prototype = {
    __QUTE_VM__: true, // ViewModel marker
	toString: function() {
		return 'ViewModel <'+this.render.name+'/>';
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
		if (!this.$channel) ERR("q:channel used on a VM not defining channels: %s", this.toString());
		// add an init function
		this.setup(function(thisObj) {
			thisObj.subscribe(channelName, thisObj.$channel);
		});
		return this;
	},
	//TODO use setup in listen and $on
	setup: function(setupFn) {
		this.$setup = chainFnAfter(setupFn, this.$setup);
		return this;
	},
	cleanup: function(fn) { // register a cleanup function when component is disconnected
		this.$clean = chainFnAfter(fn, this.$clean);
		return this;
	},
	$parent: function() {
		if (!this.$r) return null;
		return this.$r.closestVM();
	},
	$root: function() {
		var parent = this.$parent();
		return parent ? parent.$root() : this;
	},
	connect: function() {
		this.$r && this.$r.connect();
	},
	disconnect: function() {
		this.$r && this.$r.disconnect();
	},
	refresh: function() {
		this.$r && this.$r.refresh();
	},
	willConnect: function() {
		// TODO the connected flag is no mor euseful since we can use $r.isc
		if (this.$st & 1) return; // ignore
		this.$st |= 1; // set connected flag
		// $setup may be defined by the prototype to do automatic setup when connected
		// (e.g. automatic installed listeners defined though VM definitioan 'on' property)
		if (this.$setup) {
			this.$setup(this);
		}

		// TODO update DOM if previously disconnected
		if (false) this.$update();

		// call the connected callback
		//this.connected && this.connected();
		return this;
	},
	willDisconnect: function() {
		if (!(this.$st & 1)) return; // ignore
		this.$st ^= 1; // clear connected flag
		if (this.$clean) {
			this.$clean();
			this.$clean = null;
		}
	},
	// initialize a vm from tag raw data
	$load: function(rendering, xattrs, slots) {
		var bindings = null;
		var model = rendering.model;
		this.$slots = slots;
		if (xattrs) {
			for (var key in xattrs) {
				var val = xattrs[key];
				if (key.charCodeAt(0) === 36) { // $ - extended attribute
					if (key === '$attrs') { // we must not delete keys from xattrs since it can break when vm is loaded by a dynamic component
						//TODO DO WE NEED to add an update fn? q:attrs are static
						rendering.up(SetVMAttrs(this, model, val))();
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
					}
				} else if (typeof val === 'function') { // a dynamic binding
					rendering.up(SetProp(this, model, key, val))();
				} else { // static binding
					this.$set(key, val);
				}
			}
        }
        if (this.$require) {
            var req = this.$require;
            for (var i=0,l=req.length; i<l; i++) {
                if (this.$data[req[i]] == null) {
                    ERR('Required property is not defined: "'+req[i]+'" in '+this.toString());
                }
            }
        }
		return bindings;
	},
	$create: function(parentRendering, xattrs, slots) {
		var $use,
			model = parentRendering && parentRendering.model,
			listeners = xattrs && xattrs.$on;
		if (xattrs && xattrs.$use) {
			$use = applyUserDirectives(parentRendering, this.constructor, xattrs, this);
		}

		// load definition
		var bindings = parentRendering && this.$load(parentRendering, xattrs, slots);
		var rendering = new Rendering(parentRendering, this);
		rendering.vm = this;
		this.$r = rendering;
		// must never return null - for non rendering components like popups we return a comment
		var el = this.render(rendering) || document.createComment('<'+this.toString()+'/>');
		el.__qute__ = this;
		this.$el = el;
        this.created && this.created(el);

		if (bindings) for (var i=0,l=bindings.length; i<l; i+=2) {
			var up = bindings[i](el, model, bindings[i+1]);
			parentRendering.up(up)();
		}

		if (listeners) {
			applyListeners(el, model, listeners);
		}

		// should use parent vm as context for custom directives
		if ($use) $use(parentRendering, el);
		if (parentRendering && xattrs && xattrs.$ref) {
			parentRendering.model[xattrs.$ref] = this;
		}

		// this can trigger a connect if tree is already connected (for example when inserting a comp in a connected list)
		parentRendering && parentRendering.$push(rendering);

        this.ready && this.ready(el);

		return el;
	},

	// manual mount (only roots must be moutned this way)
	mount: function(elOrId, insertBefore) {
		if (this.$r) ERR("VM is already mounted");
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
		this.connect();
		// announce the tree was attached to the DOM
		return this;
	},
	// only manually mounted vms can be unmounted
	unmount: function() {
		// a child vm?
		if (!this.r) ERR("VM is not mounted");
		this.disconnect();
		this.$el.parentNode.removeChild(this.$el);
		this.$el = null;
	},
	$update: function() {
		if (this.$r) { // TODO only if connected
			this.$r.update();
            //TODO fire an update event?
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
		if (!this.$el) ERR("View not connected");
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
    defineProp: function(Type, key, value, arg) {
        if (value && value.__qute_factory) value = value();
        Object.defineProperty(this, key, Prop.getType(Type).createProp(this, key, value, arg));
    },
    definePropWithFactory: function(Type, key, value, arg) {
        Object.defineProperty(this, key, Prop.getType(Type).createProp(this, key, value(), arg));
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
	}
	// ---------------------------------------------
}

export default ViewModel;
