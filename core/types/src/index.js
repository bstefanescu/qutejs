import { ERR, toString, toBoolean, toNumber } from '@qutejs/commons';
import List from './list.js';

function _default() {
    return this.value;
}
function _defaultFromFactory(vm) {
    return this.value(vm.$app);
}
function __qute_prop(vm, key) {
    var val = this._default(vm);
    vm.$data[key] = this._assign ? this._assign(val) : val;
    return vm.$createProp(key, this._assign);
}

// ------------ String
function StringProp(value) {
    this.value = toString(value);
}
StringProp.prototype = {
    __qute_prop: __qute_prop,
    _default: _default,
    _assign: toString
}
function _String(value) {
    return new StringProp(value);
}

// ------------ Number
function NumberProp(value) {
    this.value = toNumber(value);
}
NumberProp.prototype = {
    __qute_prop: __qute_prop,
    _default: _default,
    _assign: toNumber
}
function _Number(value) {
    return new NumberProp(value);
}

// ------------ Boolean
function BooleanProp(value) {
    this.value = toBoolean(value);
}
BooleanProp.prototype = {
    __qute_prop: __qute_prop,
    _default: _default,
    _assign: toBoolean
}
function _Boolean(value) {
    return new BooleanProp(value);
}

// ------------ Function
function checkFunction(val) {
    if (val != null && typeof val !== 'function') ERR('Expected a function but got '+val);
    return val;
}
function FunctionProp(value) {
    this.value = checkFunction(value);
}
FunctionProp.prototype = {
    __qute_prop: __qute_prop,
    _default: _default,
    _assign: checkFunction
}
function _Function(value) {
    return new FunctionProp(value);
}

// ------------ Date
function toDate(val) {
    if (val != null) {
        if (val instanceof Date) {
            return val;
        } else {
            const type = typeof val;
            if (type === 'number' || type === 'string') {
                return new Date(val); // a string or a number
            }
        }
        ERR('Expecting a date value but got '+val);
    }
    return val;
}
function DateProp(value) {
    this.value = toDate(value);
}
DateProp.prototype = {
    __qute_prop: __qute_prop,
    _default: _default,
    _assign: toDate
}
function _Date(value) {
    return new DateProp(value);
}

// ------------ Array
function toArray(val) {
    if (val != null && !Array.isArray(val)) ERR('Expected an array but got '+val);
    return val;
}
function ArrayProp(value) {
    this.value = toArray(value);
}
ArrayProp.prototype = {
    __qute_prop: __qute_prop,
    _default: function() {
        var v = toArray(this.value);
        return v ? v.slice() : v; // make a copy
    },
    _assign: toArray
}
function _Array(value) {
    return new ArrayProp(value);
}

// ------------ Object
function isPlainObject(val) {
    return typeof val === 'object' && val.constructor === Object;
}
function checkObject(val) {
    if (val != null && typeof val !== 'object') ERR('Expected an object but got '+val);
    return val;
}

function ObjectProp(value) {
    this.value = checkPlainObject(value);
}
ObjectProp.prototype = {
    __qute_prop: __qute_prop,
    _default: _default,
    _assign: checkObject,
    assign(fn) {
        this._assign = fn;
        return this;
    }
}
function _Object(value) {
    var prop = new ObjectProp(value);
    if (typeof value === 'function') {
        prop._default = _defaultFromFactory;
    } else if (isPlainObject(value)) {
        prop._default = function() { return Object.assign({}, this.value); }
    }
    return prop;
}

// ------------ Any
function AnyProp(value) {
    this.value = value;
}
AnyProp.prototype = {
    __qute_prop: __qute_prop,
    _default: _default,
    assign(fn) {
        this._assign = fn;
        return this;
    }
}
function _Any(value) {
    var prop = new AnyProp(value);
    if (typeof value === 'function') {
        prop._default = _defaultFromFactory;
    }
    return prop;
}

// ------------ List
function ListProp(key, val) {
    if (!key) ERR('The key argument is required');
    if (val && !Array.isArray(val)) ERR('Expecting an array. Got '+val);
    this.key = key;
    this.val = val;
}
ListProp.prototype = {
    __qute_prop(vm, key) {
        var listKey = this.key;
        // the List is always making a copy of the input value
        vm.$data[key] = new List(vm, listKey, this.val);
        return vm.$createProp(key, function(val) {
            return new List(vm, listKey, val);
        });
    }
}
function _List(key, val) {
    return new ListProp(key, val);
}

// ------------ Link
function _Link(appPropKey) {
    return {
        __qute_prop: function(vm, key) {
            return vm.$app.prop(appPropKey).bindVM(vm, key);
        }
    }
}

export {
    _String, _Number, _Boolean, _Object, _Function, _Array, _Date, _Link, _List, _Any
}
