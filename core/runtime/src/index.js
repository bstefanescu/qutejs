import window from '@qutejs/window';

import ERR from './error.js';
import { chainFnAfter, closestVM, closestListItem } from './utils.js';

import UpdateQueue from './update.js';
import Rendering from './rendering.js';
import ViewModel from './vm.js';
import App from './app.js';
import { registerDirective } from './q-attr.js';
import {StringProp,NumberProp,BooleanProp} from './prop-types';


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

function Qute(renderFn, def) {
    if (!def) {
        // Qute({... def ...}) or Qute(class)
        if (typeof renderFn !== 'function') { // Qute({...})
            def = renderFn;
            renderFn = null;
        } else if (renderFn.prototype instanceof ViewModel) { // Qute(class)
            def = renderFn;
            renderFn = null;
        } // else Qute(renderingFn)
    } else if (typeof renderFn !== 'function') {
        ERR("Usage: Qute(renderFunction[, VM_Definition])");
    }

	function ViewModelImpl(app, attrs) {
		ViewModel.call(this, app, attrs);
	}

	var VMType, VMProto;
	if (typeof def === 'function') {
		if (def.prototype instanceof ViewModel)	{
			// VM is defined as a class
			VMType = def;
			VMProto = VMType.prototype;
		} else {
            ERR('Unsupported ViewModel definition: expecting a class extending Qute.ViewModel');
		}
    }
    if (!VMType) { // VM definition object
		var BaseVm = ViewModel;
		VMProto = Object.create(BaseVm.prototype, {
			constructor: { value: ViewModelImpl },
		});
		if (def) assignPropDefs(VMProto, def); // this is preserving getters
		VMProto.$super = BaseVm.prototype; // to be able to override methods and call the super method if needed
		ViewModelImpl.prototype = VMProto;

		VMType = ViewModelImpl;
    }
    // we store the VMType on the prototype
    VMProto.__VM__ = VMType;
    // add the rendering method of the tag if no one was provided
    if (renderFn) VMProto.render = renderFn;

    if (!VMProto.render) ERR('Unsupported ViewModel definition: No rendering function was defined');

	VMType.watch = function(prop, fn) {
		if (!VMProto.$watch) Object.defineProperty(VMProto, '$watch', {value:{}});
		VMProto.$watch[prop] = fn;
		return VMType;
	}
	VMType.on = function(key, selector, cb) {
		VMProto.$init = chainFnAfter(function(thisObj) {
			thisObj.$on(key, selector, cb);
		}, VMProto.$init);
		return VMType;
	}
	VMType.channel = function(listenFn) {
		VMProto.$channel = listenFn;
		return VMType;
	}
    VMType.mixin = function() {
        for (var i=0,l=arguments.length; i<l; i++) {
            Object.assign(VMProto, arguments[i]);
        }
        return VMType;
    }

	return VMType;
}

Qute.ViewModel = ViewModel;
Qute.isVM = function(obj) {
	return obj instanceof ViewModel;
}

Qute.App = App;
Qute.UpdateQueue = UpdateQueue;
Qute.Rendering = Rendering;
// render a functional template given its render function name and a model
Qute.render = function(renderFn, model) {
	return renderFn(new Rendering(null, model));
}
Qute.defineMethod = function(name, fn) {
	//define method on both ViewModel and Functional components prototype
	ViewModel.prototype[name] = fn;
    Rendering.FunComp.prototype[name] = fn;
}

Qute.registerDirective = registerDirective;

Qute.install = function(plugin) { return plugin.install(Qute); }

Qute.runAfter = function(cb) { UpdateQueue.runAfter(cb); }
Qute.closest = closestVM;
Qute.closestListItem = closestListItem;
Qute.ERR = ERR;

// prop types
Qute.string = function(value) { return new StringProp(value) }
Qute.number = function(value) { return new NumberProp(value) }
Qute.boolean = function(value) { return new BooleanProp(value) }

// store Qute instance in window - this is important so that imported components use the same Qute instance
window.Qute = Qute;

export default Qute;

