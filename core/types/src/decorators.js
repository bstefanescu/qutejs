import {__qute_decorate_member__, _template, _mixin, _watch, _on, _channel, _require } from './helpers.js';

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

function Required() {
    return function(VMProto, name, descriptor) {
        //do nothing --> properties are handled by the compiler for optimizations
    }
}

function DataModel(id) {
    return function(ServiceProto, name, descriptor) {
        // do nothing --> properties are handled by the compiler for optimizations
    }
}

function AsyncDataModel(id) {
    return function(ServiceProto, name, descriptor) {
        // do nothing --> properties are handled by the compiler for optimizations
    }
}

export {
    // public API
    Template,
    Mixin,
    On,
    Watch,
    Channel,
    Required,
    DataModel,
    AsyncDataModel
}
