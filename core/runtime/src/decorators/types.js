import { ERR } from '@qutejs/commons';
import List from './list.js';
import Link from './link.js';

function toString(val) {
    return val == null ? val : String(val);
}

function toNumber(val) {
    if (val != null) {
        var n = Number(val);
        if (isNaN(n)) ERR('Expecting a number. Got: '+(typeof val)+': '+val);
        return n;
    }
    return val;
}

function toBoolean(val) {
    return val == null ? val : Boolean(val);
}

function toArray(val) {
    if (val != null && !Array.isArray(val)) ERR('Expected an array but got '+val);
    return val;
}
/*
function isPlainObject(val) {
    return typeof val === 'object' && val.constructor === Object;
}
*/
function toObject(val) {
    if (val != null && typeof val !== 'object') ERR('Expected an object but got '+val);
    return val;
}
function toFunction(val) {
    if (val != null && typeof val !== 'function') ERR('Expected a function but got '+val);
    return val;
}
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

const BaseType = {
    createProp(vm, key, value, arg) {
        this.checkArgs && this.checkArgs(key, value, arg);
        const setter = this.setter;
        this.init.call(vm, key, value, arg, setter);
        return this.descriptor.call(vm, key, arg, setter);
    },
    /**
     * Initialize default value
     * @param {*} _value
     * @param {*} _factory
     * @param {*} setter
     */
    init(key, value, arg, setter) {
        // initialize prop value
        this.$data[key] = setter ? setter.call(this, value, arg) : value;
    },
    /**
     * Get the property descriptor to be used with Object.defineProperty
     * @param {*} key
     * @param {*} arg
     * * @param {*} setter
     */
    descriptor(key, arg, setter) {
        return {
            get: function() {
                return this.$data[key];
            },
            set: function(value) {
                var old = this[key];
                if (setter) value = setter.call(this, value, arg);
                if (old !== value) {
                    this.$data[key] = value;
                    var watcher = this.$el && this.$watch && this.$watch[key]; // if not connected whatchers are not enabled
                    // avoid updating if watcher return false
                    if (watcher && watcher.call(this, value, old) === false) return;
                    this.update();
                }
            },
            enumerable: key.charCodeAt(0) !== 95 // keys starting with _ are not enumerable
        }
    }
}

function _detectType(val) {
    if (val != null) {
        const _type = typeof val;
        if (_type === 'string') {
            return TYPES.String;
        } else if (_type === 'number') {
            return TYPES.Number;
        } else if (_type === 'boolean') {
            return TYPES.Boolean;
        }
    }
    return null;
}

const AnyType = Object.create(BaseType);
AnyType.createProp = function(vm, key, value, arg) {
    const Type = _detectType(value);
    if (Type) return Type.createProp(vm, key, value, arg);
    // else setter is null
    const setter = null;
    this.init.call(vm, key, value, arg, setter);
    return this.descriptor.call(vm, key, arg, setter);
}

const TYPES = {};

function registerType(Type, def) {
    var typeObj = Object.assign(Object.create(BaseType), def || {});
    TYPES[Type.name] = typeObj;
    return typeObj;
}

registerType(String, {
    setter: toString
});
registerType(Boolean, {
    setter: toBoolean
});
registerType(Number, {
    setter: toNumber
});
registerType(Date, {
    setter: toDate
});
registerType(Array, {
    setter: toArray
});
registerType(Object, {
    setter: toObject
});
registerType(Function, {
    setter: toFunction
});
registerType(List, {
    setter(val, key) {
        if (val && !Array.isArray(val)) {
            ERR('Usupported value for list property: '+val);
        }
        return new List(this, key, val);
    },
    checkArgs(key, value, arg) {
        if(!arg) ERR('Reactive List properties must sepcify the list key as an argument!');
    }
});
registerType(Link, {
    createProp(vm, key, value, arg) {
        if (!arg) ERR('Link properties must specify the application data model key as an argument!');
        return vm.$app.prop(arg).bindVM(vm, key);
    }
});


function Property(Type, arg) {
    return function(vm, key, value) {
        vm.defineProp(Type, key, value, arg);
    }
}
Property.register = registerType;
Property.getType = function(Type) {
    if (Type) {
        const typeObj = TYPES[typeof Type === 'string' ? Type : Type.name];
        if (!typeObj) ERR('No such property type was found: '+Type);
        return typeObj;
    }
    return AnyType;
}

export {
    Property, Link, List
}
