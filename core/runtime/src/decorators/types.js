import { ERR } from '@qutejs/commons';

const TYPES = {};

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
                    var watcher = this.$el && this['$watch_'+key]; // if not connected whatchers are not enabled
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


function registerType(Type, def) {
    const key = typeof Type === 'string' ? Type : Type.name;
    var typeObj = Object.assign(Object.create(BaseType), def || {});
    TYPES[key] = typeObj;
    return typeObj;
}

function getType(Type) {
    if (Type) {
        const typeObj = TYPES[typeof Type === 'string' ? Type : Type.name];
        if (!typeObj) ERR('No such property type was found: '+Type);
        return typeObj;
    }
    return AnyType;
}

export {
    registerType, getType
}
