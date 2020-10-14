/* To be shared by both class decorators in './index.js' and Qute facade */

/**
 * Helper fucntion to be used by the compiler to decorate a class member: field, method, getter.
 * In case of decorators which take arguments the decorator method should be the method
 * returened after passing the arguments.
 * Ex: `__decorate(MyComponent, Watch("myProp"), "watchMyProp")`
 */
export function __qute_decorate(theClass, decorator, name) {
    const proto = theClass.prototype;
    const r = decorator(proto, name, Object.getOwnPropertyDescriptor(proto, name));
    if (r) Object.defineProperty(proto, name, r);
}

/**
 * Assign a rendering function to the given ViewModel prototype
 * @param {*} VMProto
 * @param {*} fn
 */
export function _template(VMProto, renderFn) {
    VMProto.render = renderFn;
}

/**
 * Apply the given mixins to the ViewModel given its prototype.
 * @param {*} mixins
 */
export function _mixin(VMProto, mixins) {
    for (var i=0,l=mixins.length; i<l; i++) {
        Object.assign(VMProto, mixins[i]);
    }
}

/**
 * Define a watcher method on the given ViewwModel prototype
 * @param {*} VMProto
 * @param {*} prop
 * @param {*} fn
 */
export function _watch(VMProto, prop, fn) {
    if (!VMProto.$watch) Object.defineProperty(VMProto, '$watch', {value:{}});
    VMProto.$watch[prop] = fn;
}

/**
 * Define a DOM event listener to the given ViewModel prototype
 * @param {*} VMProto
 * @param {*} key
 * @param {*} selector
 * @param {*} cb
 */
export function _on(VMProto, key, selector, cb) {
    VMProto.$init = chainFnAfter(function(thisObj) {
        thisObj.$on(key, selector, cb);
    }, VMProto.$init);
}

/**
 * Define amessaging channel on the given ViewModel prototype.
 * @param {*} VMProto
 * @param {*} listenFn
 */
export function _channel(VMProto, listenFn) {
    VMProto.$channel = listenFn;
}

/**
 * Define reactive properties on a ViewModel given its prototype
 * The properties are either a plain object, either a factory function returning the properties object when called
 * @param {*} VMProto
 * @param {*} properties
 */
export function _properties(VMProto, properties) {
    VMProto.$props = properties;
}

/**
 * Define required properties given the ViewModel prototype and a list of property names
 * @param {*} VMProto
 * @param {*} names
 */
export function _require(VMProto, names) {
    VMProto.$require = Array.prototype.slice.call(names);
}
