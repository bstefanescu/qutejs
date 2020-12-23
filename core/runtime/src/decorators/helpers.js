/* To be shared by both class decorators in './index.js' and Qute facade */

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
    Object.defineProperty(VMProto, '$watch_'+prop, {value: fn});
}

/**
 * Define a DOM event listener to the given ViewModel prototype
 * @param {*} VMProto
 * @param {*} key
 * @param {*} selector
 * @param {*} cb
 */
export function _on(VMProto, key, selector, cb) {
    VMProto.setup(function(thisObj) {
        thisObj.$on(key, selector, cb);
    });
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
 * Define required properties given the ViewModel prototype and a list of property names
 * @param {*} VMProto
 * @param {*} names
 */
export function _require(VMProto, names) {
    VMProto.$require = Array.prototype.slice.call(names);
}
