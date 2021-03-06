/*
template components
*/

import Emitter from './emit.js';
import UpdateQueue from './update.js';
import {applyListeners, applyEmitters, SetStyle, InheritQClass, SetDisplay, SetToggle} from './binding.js';
import {applyUserDirectives} from './q-attr.js';
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
	this.$app = null;
	this.$r = null;
	this.$el = null;
	this.$attrs = {};
	this.$slots = null;
	this.$uq = false; // updayte queued
}

FunComp.prototype = {
    __QUTE_TPL__: true,
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
				self.$r.update();
				self.$uq = false;
			});
		}
	},
	emit: Emitter.emit,
	emitAsync: Emitter.emitAsync,
	render: function(rendering, XTag, xattrs, slots) {
		this.$r = rendering.spawn(this);
		this.$slots = slots;

		var model = rendering.model, attrs = this.$attrs, $use, $ref,
			bindings, listeners, emitters;

		if (model) {
			this.$app = model.$app;
		}

		if (xattrs) {
			$ref = xattrs.$ref;

			for (var key in xattrs) { // class, style and show, $attrs, $listeners are ignored
				var val = xattrs[key];
				if (key.charCodeAt(0) !== 36 || key === '$html') { // $ - extended attribute -> ignore all extended attrs but $html
					if (typeof val === 'function') {
						rendering.up(SetFuncAttr(this, model, key, val));
						val = val(model);
					}
					attrs[key] = val;
				} else if (key === '$attrs') {
					if (model.$attrs) {
						// inject attributes in template tags
						// we need to create an update function to reinject attrs when model changes
						// otherwise we loose the reactivity on func tags 'q:attrs' attribute
						rendering.up(SetFuncAttrs(this, model, val))();
					}
				} else if (key === '$on') {
                    listeners = val;
                } else if (key === '$emit') {
                    emitters = val;
				} else if (key === '$class') {
					if (!bindings) bindings = [];
					bindings.push(InheritQClass, val);
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

            if (xattrs.$use) {
                $use = applyUserDirectives(rendering, xattrs, null, this);
            }
		}

		var el = XTag(this.$r, xattrs, slots);
		this.$el = el;
		el.__qute__ = this; // to be used by Qute.closestComp

		// apply root bindings if any (q:class, q:style or q:show)
		if (bindings) {
			for (var i=0,l=bindings.length; i<l; i+=2) {
				var up = bindings[i](el, model, bindings[i+1]);
				rendering.up(up)();
			}
        }

        if (emitters) {
            applyEmitters(el, model, emitters);
        }

		// apply listeners if any
		if (listeners) {
			applyListeners(el, model, listeners);
		}

		// call user directives if any
		if ($use) {
			$use(rendering, el);
		}
		if ($ref) rendering.model[$ref] = this;

		// we must push the rendering context of the fun comp
		// to propagate connect / disconnect handlers
		rendering && rendering.$push(this.$r);

		return el;
	}
}
