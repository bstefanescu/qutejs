import {registerType, getType } from './types.js';
import './builtin-types.js'; // load all built-in types

export default function Property(Type, arg) {
    return function(vm, key, value) {
        vm.defineProp(Type, key, value, arg);
    }
}
Property.registerType = registerType;
Property.getType = getType;

