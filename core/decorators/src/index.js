
import {__qute_decorate, _template, _mixin, _watch, _on, _channel, _properties, _require } from './decorators.js';


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

function On(key, selector) {
    return function(VMProto, name, descriptor) {
        _on(VMProto, key, selector, descriptor.value);
    }
}

function Watch(prop) {
    return function(VMProto, name, descriptor) {
        _watch(VMProto, prop, descriptor.value);
    }
}

function Channel() {
    return function(VMProto, name, descriptor) {
        _channel(VMProto, descriptor.value);
    }
}

function Prop() {
    return function(VMProto, name, descriptor) {
        //do nothing --> properties are handled by the compiler for optimizations
    }
}

function Required() {
    return function(VMProto, name, descriptor) {
        //do nothing --> properties are handled by the compiler for optimizations
    }
}

//TODO: not yet implemented

function DataModel() {
    return function(VMProto, name, descriptor) {
        //TODO
    }
}

function AsyncDataModel() {
    return function(VMProto, name, descriptor) {
        //TODO
    }
}

export {

    // private helper shared with the class decoration compiler
    __qute_decorate,

    // private helpers shared with Qute facade
    _template,
    _mixin,
    _on,
    _channel,
    _watch,
    _properties,
    _require,

    // public API
    Template,
    Template as Render,
    Mixin,
    On,
    Watch,
    Channel,
    Prop,
    Required,
    DataModel,
    AsyncDataModel
}
