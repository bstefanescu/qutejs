import { ERR } from '@qutejs/commons/src';
import { _template, _mixin, _watch, _on, _require } from './helpers.js';

/**
 * To be used on Qute.Application derived classes
 * @param {*} renderFn
 */
function View(VM) {
    return function(target) {
        target.prototype.VM = VM;
    }
}

function Template(renderFn) {
    return function(target) {
        _template(target.prototype, renderFn);
    }
}

function Mixin() {
    var args = arguments;
    return function(target) {
        _mixin(target.prototype, args);
    }
}

/**
 * Register an event listener
 * @param {string} event
 * @param {*string} selector
 */
function On(event, selector) {
    return function(VMProto, name, descriptor) {
        _on(VMProto, event, selector, descriptor.value);
    }
}

function Watch(prop) {
    return function(VMProto, name, descriptor) {
        _watch(VMProto, prop, descriptor.value);
    }
}

function Required() {
    return function(VMProto, name, descriptor) {
        //do nothing --> properties are handled by the compiler for optimizations
    }
}

function DataModel(id) {
    return function(target, key, value) {
        let app;
        if (target.__QUTE_APP__) {
            app = target;
        } else if (target.app) {
            app = target.app;
        } else {
            ERR('The @DataModel decorator is meant to be used on Qute.Application or Qute.Service classes, or on any class providig a `app` field of type Qute.Application!');
        }
        app.defineProp(id, value).link(target, key);
    }
}

function AsyncDataModel(id) {
    return function(target, key, value) {
        let app;
        if (target.__QUTE_APP__) {
            app = target;
        } else if (target.app) {
            app = target.app;
        } else {
            ERR('The @DataModel decorator is meant to be used on Qute.Application or Qute.Service classes, or on any class providig a `app` field of type Qute.Application!');
        }
        app.defineAsyncProp(id, value).link(target, key);
    }
}


export {
    // public API
    View,
    Template,
    Mixin,
    On,
    Watch,
    Required,
    DataModel,
    AsyncDataModel
}
