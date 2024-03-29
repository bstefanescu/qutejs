import window from '@qutejs/window';
import {ERR} from '@qutejs/commons';

import UpdateQueue from './update.js';
import Rendering from './rendering.js';
import ViewModel from './vm.js';
import Application from './app.js';
import Service from './service.js';

import { _mixin, _watch, _on, _require } from './decorators/helpers.js';
import { View, Template, Mixin, On, Watch, Required, Provide, Property, Inject, Link } from './decorators/index.js';
import List from './list.js';


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
        if (typeof renderFn === 'function') {
            def = {};
        } else {
            def = renderFn;
            renderFn = null;
        }
    } else if (typeof renderFn !== 'function') {
        ERR("Usage: Qute(RenderFunction[, Model])");
    }

	function ViewModelImpl(app) {
        ViewModel.call(this, app);
        this.init && this.init(app);
	}

	var VMType, VMProto;
    var BaseVm = ViewModel;
    VMProto = Object.create(BaseVm.prototype, {
        constructor: { value: ViewModelImpl },
    });
    if (def) assignPropDefs(VMProto, def); // this is preserving getters
    VMProto.$super = BaseVm.prototype; // to be able to override methods and call the super method if needed
    ViewModelImpl.prototype = VMProto;
    VMType = ViewModelImpl;

    // add the rendering method of the tag if no one was provided
    if (renderFn) VMProto.render = renderFn;

    if (!VMProto.render) {
        ERR('Unsupported ViewModel definition: No rendering function was defined');
    }

	VMType.watch = function(prop, fn) {
        _watch(VMProto, prop, fn);
		return VMType;
	}
	VMType.on = function(key, selector, cb) {
        _on(VMProto, key, selector, cb);
		return VMType;
	}
    VMType.mixin = function() {
        _mixin(VMProto, Array.prototype.slice.call(arguments));
        return VMType;
    }
    VMType.require = function() {
        _require(VMProto, Array.prototype.slice.call(arguments));
        return VMType;
    }
	return VMType;
}

Qute.ViewModel = ViewModel;
Qute.Application = Application;
Qute.UpdateQueue = UpdateQueue;
Qute.Rendering = Rendering;
Qute.Service = Service;

// decorators an types
Qute.View = View;
Qute.Template = Template;
Qute.Render = Template; // export Template under the name Render too.
Qute.Mixin = Mixin;
Qute.On = On;
Qute.Watch = Watch;
Qute.Required = Required;
Qute.Provide = Provide;
Qute.Property = Property;
Qute.Inject = Inject;
Qute.Link = Link; // a custom property type to create links similar to @Inject
Qute.List = List;

// render a template component given its render function name and a model
Qute.render = function(renderFn, model) {
	return renderFn(new Rendering(null, model));
}
Qute.defineMethod = function(name, fn) {
	//define method on both ViewModel and template components prototype
	ViewModel.prototype[name] = fn;
    Rendering.Template.prototype[name] = fn;
}
Qute.runAfter = function(cb) { UpdateQueue.runAfter(cb); }
// get a component from its root element
Qute.get = function(elt) { return elt.__qute__; }
// Qute.import is added by @qutejs/importer

// store Qute instance in window - this is important so that imported components use the same Qute instance
window.Qute = Qute;

export default Qute;
