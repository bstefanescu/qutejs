import {ERR} from '@qutejs/commons';

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

const _String = createPropType(function(val) { return val == null ? val : String(val)});
const _Number = createPropType(function(val) {
    if (val != null) {
        var n = Number(val);
        if (isNaN(n)) ERR('Expecting a number. Got: '+(typeof val)+': '+val);
        return n;
    }
    return val;
});
const _Boolean = createPropType(function(val) { return val == null ? val : Boolean(val)});
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
    return {
        __qute_prop: function(vm, key) {
            return vm.$app.get(appPropKey).$bindVM(vm, key);
        }
    }
}

export {
    createPropType, _String, _Number, _Boolean, _Object, _Function, _Array, _Iterable, _Date, _Any, _Link
}
