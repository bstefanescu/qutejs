/*
functional components
*/

import Emitter from './emit.js';
import UpdateQueue from './update.js';
import {applyListeners, createListeners, SetStyle, SetClass, SetDisplay, SetToggle} from './binding.js';
import applyUserDirectives from './q-attr.js';
import { filterKeys } from './utils.js';

function SetFuncAttrs(func, vm, filter) { // vm is the parent vm (i.e. current model)
	return function() {
		var vmAttrs = vm.$attrs;
		if (vmAttrs) {
			var keys = filterKeys(vmAttrs, filter);
			for (var i=0,l=keys.length; i<l; i++) {
				var key = keys[i];
				func.set(key, vmAttrs[key]);
			}
		}
	}
}

function SetFuncAttr(func, vm, key, val) { // vm is the parent vm (i.e. current model)
	return function() {
		func.set(key, val(vm));
	}
}

export default function FunComp() {
	this.$r = null;
	this.$el = null;
	this.$attrs = {};
	this.$listeners = null;
	this.$slots = null;
	this.$uq = false; // updayte queued
}

FunComp.prototype = {
	set: function(key, val) {
		var oldVal = this.$attrs[key];
		if (val !== oldVal) {
			this.$attrs[key] = val;
			this.update();
		}
	},
	update: function() {
		if (this.$el && !this.$uq) {
			this.$uq = true;
			var self = this;
			UpdateQueue.push(function() {
				self.$r.$update();
				self.$uq = false;
			});
		}
	},
	emit: Emitter.emit,
	emitAsync: Emitter.emitAsync,
	render: function(rendering, XTag, xattrs, slots) {
		this.$r = rendering.spawn(this);
		this.$slots = slots;

		// we must push the rendering context of the fun comp
		// to propagate connect / disconnect handlers
		rendering && rendering.$push(this.$r);

		var vm = rendering.vm, attrs = this.$attrs, $use,
			bindings, listeners, parentListeners;

		if (xattrs) {
			if (xattrs.$use) {
				$use = applyUserDirectives(rendering, XTag.$tag, xattrs);
			}

			for (var key in xattrs) { // class, style and show, $attrs, $listeners are ignored
				var val = xattrs[key];
				if (key.charCodeAt(0) !== 36 || key === '$html') { // $ - extended attribute -> ignore all extended attrs but $html
					if (typeof val === 'function') {
						rendering.up(SetFuncAttr(this, vm, key, val));
						val = val(vm);
					}
					attrs[key] = val;
				} else if (key === '$attrs') {
					if (vm.$attrs) {
						// inject attributes in functional tags
						// we need to create an update function to reinject attrs when model changes
						// otherwise we loose the reactivity on func tags 'x-attrs' attribute
						rendering.up(SetFuncAttrs(this, vm, val))();
					}
				} else if (key === '$listeners') {
					// copy parent listeners so we can inject in children if needed
					// <fun1 @click='handleCLick'>
					// <fun2 x-listeners><a href='#' x-listeners></fun2>
					// </fun1>
					parentListeners = vm.$listeners;
				} else if (key === '$on') {
					listeners = createListeners(vm, val);
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
				}
			}
		}

		// listemners must be set before rendering the content
		if (listeners && parentListeners) {
			this.$listeners = Object.assign({}, parentListeners, listeners);
		} else if (listeners) {
			this.$listeners = listeners;
		} else if (parentListeners) {
			this.$listeners = Object.assign({}, parentListeners);
		}

		var el = XTag(this.$r, xattrs, slots);
		this.$el = el;

		// apply root bindings if any (x-class, x-style or x-show)
		if (bindings) {
			for (var i=0,l=bindings.length; i<l; i+=2) {
				var up = bindings[i](el, vm, bindings[i+1]);
				rendering.up(up)();
			}
		}

		// call user directives if any
		if ($use) {
			$use(rendering, el);
		}

		return el;
	}
}

