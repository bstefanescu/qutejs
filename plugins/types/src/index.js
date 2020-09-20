import {ERR} from '@qutejs/commons';

function BaseProp(value) {
    this.value = value;
    this._required = false;
}
BaseProp.prototype = {
    __qute_prop(vm, key) {
        vm.$data[key] = this.value;
        return vm.$createProp(key, this._setter);
    },
    required() {
        this._required = true;
        return this;
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
    Prop.factory = function(fn) {
        return new Prop(fn());
    }
    Prop.value = function(value) {
        return new Prop(value);
    }
    return Prop;
}

const HasSymbol = typeof Symbol === 'function';
const isIterable = HasSymbol ? function(obj) {
    return obj && (typeof obj[Symbol.iterator] === 'function');
} : function(obj) {
    return Array.isArray(obj);
}

const _String = createPropType(function(val) { return val == null ? val : String(val)});
const _Number = createPropType(function(val) { return val == null ? val : Number(val)});
const _Boolean = createPropType(function(val) { return val == null ? val : Boolean(val)});
const _Date = createPropType(function(val) {
    if (val) {
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
    if (val && !Array.isArray(val)) ERR('Expected an array but got '+val);
    return val;
});
const _Iterable = createPropType(function(val) {
    if (val && !isIterable(val)) ERR('Expected an iterable object but got '+val);
    return val;
});
const _Function = createPropType(function(val) {
    if (val && typeof val !== 'function') ERR('Expected a function but got '+val);
    return val;
});
const _Object = createPropType();
const _Any = _Object;

const _Link = function(appPropKey) {
    return {
        __qute_prop: function(vm, key) {
            return vm.$app.get(appPropKey).$bindVM(vm, key);
        }
    }
}

export {
    createPropType, _String, _Number, _Boolean, _Object, _Function, _Array, _Iterable, _Date, _Any, _Link
}
