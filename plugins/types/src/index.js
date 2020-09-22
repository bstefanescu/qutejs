import { ERR, toString, toBoolean, toNumber } from '@qutejs/commons';
import List from './list.js';

function initFromFactory(vm, key) {
    vm.$data[key] = this.value();
}

function BaseProp(value) {
    this.value = value;
}
BaseProp.prototype = {
    __qute_prop(vm, key) {
        this.init(vm, key);
        return vm.$createProp(key, this._setter);
    },
    init(vm, key) {
        vm.$data[key] = this.value;
    },
    setter(fn) {
        this._setter = fn;
        return this;
    }
}

function createPropType(setter) {
    function Prop(value) {
        BaseProp.call(this, value);
    }
    Prop.prototype = Object.create(BaseProp.prototype);
    if (setter) Prop.prototype._setter = setter;
    function PropType(value) {
        return new Prop(value);
    }
    PropType.factory = function(fn) {
        var prop = new Prop(fn);
        prop.init = initFromFactory;
        return prop;
    }
    PropType.value = function(value) {
        return new Prop(value);
    }
    return PropType;
}


const HasSymbol = typeof Symbol === 'function';
const isIterable = HasSymbol ? function(obj) {
    return obj && (typeof obj[Symbol.iterator] === 'function');
} : function(obj) {
    return Array.isArray(obj);
}

const _String = createPropType(toString);
const _Number = createPropType(toNumber);
const _Boolean = createPropType(toBoolean);
const _Date = createPropType(function(val) {
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
});
const _Array = createPropType(function(val) {
    if (val != null && !Array.isArray(val)) ERR('Expected an array but got '+val);
    return val;
});
const _Iterable = createPropType(function(val) {
    if (val != null && !isIterable(val)) ERR('Expected an iterable object but got '+val);
    return val;
});
const _Function = createPropType(function(val) {
    if (val != null && typeof val !== 'function') ERR('Expected a function but got '+val);
    return val;
});
const _Object = createPropType();
const _Any = _Object;

const _Link = function(appPropKey) {
    return vm.$app.prop(appPropKey);
}

function ListProp(key, val) {
    if (arguments.length === 1 && Array.isArray(key)) {
        val = key; key = null;
    }
    this.key = key;
    this.val = val;
}
ListProp.prototype = {
    __qute_prop(vm, key) {
        var listKey = this.key;
        // the List is always making a copy of the input value
        vm.$data[key] = new List(vm, listKey, this.val);
        return vm.$createProp(key, function(val) {
            return new List(vm, listKey, val)
        });
    }
}
function _List(key, val) {
    return new ListProp(key, val);
}

export {
    createPropType, _String, _Number, _Boolean, _Object, _Function, _Array, _Iterable, _Date, _Any, _Link, _List
}
