import window from '@qutejs/window';

import ERR from './error.js';
import { chainFnAfter, closestVM, closestListItem } from './utils.js';

import UpdateQueue from './update.js';
import Rendering from './rendering.js';
import ViewModel from './vm.js';
import App from './app.js';
import { createListener } from './binding.js';
import { addImports, addAliases, registerTag, registerVM, getTag, getVM, getVMOrTag, snapshotRegistry, restoreRegistry, registerDirective, converters } from './registry.js';
import {StringProp,NumberProp,BooleanProp} from './prop-types';
import { serialImport, importAll, setImporterOptions } from './importer.js';


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
	if (!tag) ERR("Usage: Qute(tag[, VM_Definition, Base_VM])");

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
			// a rendering function - we simply register the rendering fucntion for the given tag
			return registerTag(tag, def);
		}
	} else { // VM definition object
		if (!BaseVm) BaseVm = ViewModel;
		VMProto = Object.create(BaseVm.prototype, {
			constructor: {value:ViewModelImpl},
		});
		if (def) assignPropDefs(VMProto, def); // this is preserving getters
		VMProto.$super = BaseVm.prototype; // to be able to override methods and call the super method if needed
		ViewModelImpl.prototype = VMProto;

		VMType = ViewModelImpl;
	}

	// add the rendering method of the tag if no one was provided
	if (!VMProto.render) {
		VMProto.render = Qute.template(tag);
		if (!VMProto.render) {
			ERR("No template found for tag '%s'", tag);
		}
	}
	// add the tag meta property
	VMProto.$tag = tag;
	VMProto.$qname = registerVM(tag, VMType);

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
		return this;
	}

	return VMType;
}

Qute.ViewModel = ViewModel;
Qute.isVM = function(obj) {
	return obj instanceof ViewModel;
}

// link a viewmodel to a template. Usefull for classes where defining prototype methods is not part of the class syntax
Qute.link = function(VMType, renderFn) {
	VMType.prototype.render = renderFn;
}


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
}

Qute.converters = converters;
Qute.App = App;
Qute.UpdateQueue = UpdateQueue;
Qute.Rendering = Rendering;
// render a functional template given its tag name and a model
Qute.render = function(xtagName, model) {
	return getTag(xtagName)(new Rendering(null, model));
}
Qute.defineMethod = function(name, fn) {
	//define method on both ViewModel and Functional components prototype
	ViewModel.prototype[name] = fn;
    Rendering.FunComp.prototype[name] = fn;
}

Qute.register = registerTag;
Qute.template = getTag;
Qute.snapshotRegistry = snapshotRegistry;
Qute.restoreRegistry = restoreRegistry;
Qute.vm = getVM;
Qute.vmOrTemplate = getVMOrTag;
Qute.registerDirective = registerDirective;
Qute.importAll = importAll;
Qute.import = serialImport;
Qute.addImports = addImports;
Qute.addAliases = addAliases;
Qute.setImporterOptions = setImporterOptions;

Qute.runAfter = function(cb) { UpdateQueue.runAfter(cb); }
Qute.closest = closestVM;
Qute.closestListItem = closestListItem;
Qute.ERR = ERR;

// prop types
Qute.string = function(value) { return new StringProp(value) }
Qute.number = function(value) { return new NumberProp(value) }
Qute.boolean = function(value) { return new BooleanProp(value) }

// stiore QUte innstance in window - this is important so that imported components can register in a sharted qute instance
window.Qute = Qute;

export default Qute;

