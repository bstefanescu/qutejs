import window from '@qutejs/window';
import {ERR} from '@qutejs/commons';

import UpdateQueue from './update.js';
import Rendering from './rendering.js';
import ViewModel from './vm.js';
import App from './app.js';
import Service from './service.js';
import { registerDirective } from './q-attr.js';

import { _mixin, _watch, _on, _channel, _properties, _require } from './decorators/helpers.js';
import { View, Template, Render, Mixin, On, Watch, Channel, Required, DataModel, AsyncDataModel, Property, Factory, Link, List } from './decorators/index.js';

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
        ERR("Usage: Qute(RenderFunction[, Model])");
    }

	function ViewModelImpl(app, attrs) {
        ViewModel.call(this, app, attrs);
        this.init && this.init(app);
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
    // add the rendering method of the tag if no one was provided
    if (renderFn) VMProto.render = renderFn;

    if (!VMProto.render) ERR('Unsupported ViewModel definition: No rendering function was defined');

	VMType.watch = function(prop, fn) {
        _watch(VMProto, prop, fn);
		return VMType;
	}
	VMType.on = function(key, selector, cb) {
        _on(VMProto, key, selector, cb);
		return VMType;
	}
	VMType.channel = function(listenFn) {
        _channel(VMProto, listenFn);
		return VMType;
	}
    VMType.mixin = function() {
        _mixin(VMProto, Array.prototype.slice.call(arguments));
        return VMType;
    }
    VMType.properties = function(properties) {
        _properties(VMProto, properties);
        return VMType;
    },
    VMType.require = function() {
        _require(VMProto, Array.prototype.slice.call(arguments));
        return VMType;
    }
	return VMType;
}

Qute.ViewModel = ViewModel;
Qute.App = App;
Qute.UpdateQueue = UpdateQueue;
Qute.Rendering = Rendering;
Qute.Service = Service;

// decorators an types
Qute.View = View;
Qute.Template = Template;
Qute.Render = Render;
Qute.Mixin = Mixin;
Qute.On = On;
Qute.Watch = Watch;
Qute.Channel = Channel;
Qute.Required = Required;
Qute.DataModel = DataModel;
Qute.AsyncDataModel = AsyncDataModel;
Qute.Property = Property;
Qute.Factory = Factory;
Qute.Link = Link;
Qute.List = List;


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

// store Qute instance in window - this is important so that imported components use the same Qute instance
window.Qute = Qute;

export default Qute;

