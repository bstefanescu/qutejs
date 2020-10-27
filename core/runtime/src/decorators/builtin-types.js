// the built-in types
import { registerType } from './types.js';
import { ERR } from '@qutejs/commons';
import List from '../list.js';
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

