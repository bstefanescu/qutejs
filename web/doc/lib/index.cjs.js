'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var window = require('@qutejs/window');
var window__default = _interopDefault(window);

/**
 * @this {Promise}
 */
function finallyConstructor(callback) {
  var constructor = this.constructor;
  return this.then(
    function(value) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function() {
        return value;
      });
    },
    function(reason) {
      // @ts-ignore
      return constructor.resolve(callback()).then(function() {
        // @ts-ignore
        return constructor.reject(reason);
      });
    }
  );
}

// Store setTimeout reference so promise-polyfill will be unaffected by
// other code modifying setTimeout (like sinon.useFakeTimers())
var setTimeoutFunc = setTimeout;

function isArray(x) {
  return Boolean(x && typeof x.length !== 'undefined');
}

function noop() {}

// Polyfill for Function.prototype.bind
function bind(fn, thisArg) {
  return function() {
    fn.apply(thisArg, arguments);
  };
}

/**
 * @constructor
 * @param {Function} fn
 */
function Promise(fn) {
  if (!(this instanceof Promise))
    throw new TypeError('Promises must be constructed via new');
  if (typeof fn !== 'function') throw new TypeError('not a function');
  /** @type {!number} */
  this._state = 0;
  /** @type {!boolean} */
  this._handled = false;
  /** @type {Promise|undefined} */
  this._value = undefined;
  /** @type {!Array<!Function>} */
  this._deferreds = [];

  doResolve(fn, this);
}

function handle(self, deferred) {
  while (self._state === 3) {
    self = self._value;
  }
  if (self._state === 0) {
    self._deferreds.push(deferred);
    return;
  }
  self._handled = true;
  Promise._immediateFn(function() {
    var cb = self._state === 1 ? deferred.onFulfilled : deferred.onRejected;
    if (cb === null) {
      (self._state === 1 ? resolve : reject)(deferred.promise, self._value);
      return;
    }
    var ret;
    try {
      ret = cb(self._value);
    } catch (e) {
      reject(deferred.promise, e);
      return;
    }
    resolve(deferred.promise, ret);
  });
}

function resolve(self, newValue) {
  try {
    // Promise Resolution Procedure: https://github.com/promises-aplus/promises-spec#the-promise-resolution-procedure
    if (newValue === self)
      throw new TypeError('A promise cannot be resolved with itself.');
    if (
      newValue &&
      (typeof newValue === 'object' || typeof newValue === 'function')
    ) {
      var then = newValue.then;
      if (newValue instanceof Promise) {
        self._state = 3;
        self._value = newValue;
        finale(self);
        return;
      } else if (typeof then === 'function') {
        doResolve(bind(then, newValue), self);
        return;
      }
    }
    self._state = 1;
    self._value = newValue;
    finale(self);
  } catch (e) {
    reject(self, e);
  }
}

function reject(self, newValue) {
  self._state = 2;
  self._value = newValue;
  finale(self);
}

function finale(self) {
  if (self._state === 2 && self._deferreds.length === 0) {
    Promise._immediateFn(function() {
      if (!self._handled) {
        Promise._unhandledRejectionFn(self._value);
      }
    });
  }

  for (var i = 0, len = self._deferreds.length; i < len; i++) {
    handle(self, self._deferreds[i]);
  }
  self._deferreds = null;
}

/**
 * @constructor
 */
function Handler(onFulfilled, onRejected, promise) {
  this.onFulfilled = typeof onFulfilled === 'function' ? onFulfilled : null;
  this.onRejected = typeof onRejected === 'function' ? onRejected : null;
  this.promise = promise;
}

/**
 * Take a potentially misbehaving resolver function and make sure
 * onFulfilled and onRejected are only called once.
 *
 * Makes no guarantees about asynchrony.
 */
function doResolve(fn, self) {
  var done = false;
  try {
    fn(
      function(value) {
        if (done) return;
        done = true;
        resolve(self, value);
      },
      function(reason) {
        if (done) return;
        done = true;
        reject(self, reason);
      }
    );
  } catch (ex) {
    if (done) return;
    done = true;
    reject(self, ex);
  }
}

Promise.prototype['catch'] = function(onRejected) {
  return this.then(null, onRejected);
};

Promise.prototype.then = function(onFulfilled, onRejected) {
  // @ts-ignore
  var prom = new this.constructor(noop);

  handle(this, new Handler(onFulfilled, onRejected, prom));
  return prom;
};

Promise.prototype['finally'] = finallyConstructor;

Promise.all = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.all accepts an array'));
    }

    var args = Array.prototype.slice.call(arr);
    if (args.length === 0) return resolve([]);
    var remaining = args.length;

    function res(i, val) {
      try {
        if (val && (typeof val === 'object' || typeof val === 'function')) {
          var then = val.then;
          if (typeof then === 'function') {
            then.call(
              val,
              function(val) {
                res(i, val);
              },
              reject
            );
            return;
          }
        }
        args[i] = val;
        if (--remaining === 0) {
          resolve(args);
        }
      } catch (ex) {
        reject(ex);
      }
    }

    for (var i = 0; i < args.length; i++) {
      res(i, args[i]);
    }
  });
};

Promise.resolve = function(value) {
  if (value && typeof value === 'object' && value.constructor === Promise) {
    return value;
  }

  return new Promise(function(resolve) {
    resolve(value);
  });
};

Promise.reject = function(value) {
  return new Promise(function(resolve, reject) {
    reject(value);
  });
};

Promise.race = function(arr) {
  return new Promise(function(resolve, reject) {
    if (!isArray(arr)) {
      return reject(new TypeError('Promise.race accepts an array'));
    }

    for (var i = 0, len = arr.length; i < len; i++) {
      Promise.resolve(arr[i]).then(resolve, reject);
    }
  });
};

// Use polyfill for setImmediate for performance gains
Promise._immediateFn =
  // @ts-ignore
  (typeof setImmediate === 'function' &&
    function(fn) {
      // @ts-ignore
      setImmediate(fn);
    }) ||
  function(fn) {
    setTimeoutFunc(fn, 0);
  };

Promise._unhandledRejectionFn = function _unhandledRejectionFn(err) {
  if (typeof console !== 'undefined' && console) {
    console.warn('Possible Unhandled Promise Rejection:', err); // eslint-disable-line no-console
  }
};

/* Polyfill from https://developer.mozilla.org/en-US/docs/Web/API/Element/classList */

// removed polyfill code for IE7-8 the target is IE>=9
if (!window__default.DOMException) { (window__default.DOMException = function(reason) {
    this.message = reason;
}).prototype = new Error; }

var wsRE = /[\11\12\14\15\40]/,
    wsIndex = 0,
    checkIfValidClassListEntry = function(O, V) {
        if (V === "") { throw new DOMException(
            "Failed to execute '" + O + "' on 'DOMTokenList': The token provided must not be empty."); }
        if ((wsIndex = V.search(wsRE)) !== -1) { throw new DOMException("Failed to execute '" + O + "' on 'DOMTokenList': " +
            "The token provided ('" + V[wsIndex] + "') contains HTML space characters, which are not valid in tokens."); }
    };

// 1. Implement the barebones DOMTokenList livelyness polyfill
if (typeof window__default.DOMTokenList !== "function") {
    var hasOwnProp = Object.prototype.hasOwnProperty;
    var defineProperty = Object.defineProperty,
        allowTokenListConstruction = 0,
        skipPropChange = 0;

    var DOMTokenList = function() {
        if (!allowTokenListConstruction) { throw TypeError("Illegal constructor"); } // internally let it through
    };
    DOMTokenList.prototype.toString = DOMTokenList.prototype.toLocaleString = function() {
        return this.value
    };
    DOMTokenList.prototype.add = function() {
        var arguments$1 = arguments;

        a: for (var v = 0, argLen = arguments.length, val = "", ele = this[" uCL"], proto = ele[" uCLp"]; v !== argLen; ++v) {
            val = arguments$1[v] + "", checkIfValidClassListEntry("add", val);
            for (var i = 0, Len = proto.length, resStr = val; i !== Len; ++i)
                { if (this[i] === val) { continue a; }
                else { resStr += " " + this[i]; } }
            this[Len] = val, proto.length += 1, proto.value = resStr;
        }
        skipPropChange = 1,
        ele.className = proto.value,
        skipPropChange = 0;
    };
    DOMTokenList.prototype.remove = function() {
        var arguments$1 = arguments;

        for (var v = 0, argLen = arguments.length, val = "", ele = this[" uCL"], proto = ele[" uCLp"]; v !== argLen; ++v) {
            val = arguments$1[v] + "", checkIfValidClassListEntry("remove", val);
            for (var i = 0, Len = proto.length, resStr = "", is = 0; i !== Len; ++i)
                { if (is) {
                    this[i - 1] = this[i];
                } else {
                    if (this[i] !== val) {
                        resStr += this[i] + " ";
                    } else {
                        is = 1;
                    }
                } }
            if (!is) { continue; }
            delete this[Len], proto.length -= 1, proto.value = resStr;
        }
        skipPropChange = 1, ele.className = proto.value, skipPropChange = 0;
    };
    window__default.DOMTokenList = DOMTokenList;

    var whenPropChanges = function() {
        var evt = window__default.event,
            prop = evt.propertyName;
        if (!skipPropChange && (prop === "className" || (prop === "classList" && !defineProperty))) {
            var target = evt.srcElement,
                protoObjProto = target[" uCLp"],
                strval = "" + target[prop];
            var tokens = strval.trim().split(wsRE),
                resTokenList = target[prop === "classList" ? " uCL" : "classList"];
            var oldLen = protoObjProto.length;
            a: for (var cI = 0, cLen = protoObjProto.length = tokens.length, sub = 0; cI !== cLen; ++cI) {
                for (var innerI = 0; innerI !== cI; ++innerI)
                    { if (tokens[innerI] === tokens[cI]) {
                        sub++;
                        continue a;
                    } }
                resTokenList[cI - sub] = tokens[cI];
            }
            for (var i = cLen - sub; i < oldLen; ++i) { delete resTokenList[i]; } //remove trailing indexs
            if (prop !== "classList") { return; }
            skipPropChange = 1, target.classList = resTokenList, target.className = strval;
            skipPropChange = 0, resTokenList.length = tokens.length - sub;
        }
    };

    var polyfillClassList = function(ele) {
        if (!ele || !("innerHTML" in ele)) { throw TypeError("Illegal invocation"); }
        ele.detachEvent("onpropertychange", whenPropChanges); // prevent duplicate handler infinite loop
        allowTokenListConstruction = 1;
        var protoObj = function() {};
        try {
            protoObj.prototype = new DOMTokenList();
        } finally {
            allowTokenListConstruction = 0;
        }
        var protoObjProto = protoObj.prototype,
            resTokenList = new protoObj();
        a: for (var toks = ele.className.trim().split(wsRE), cI = 0, cLen = toks.length, sub = 0; cI !== cLen; ++cI) {
            for (var innerI = 0; innerI !== cI; ++innerI)
                { if (toks[innerI] === toks[cI]) {
                    sub++;
                    continue a;
                } }
            this[cI - sub] = toks[cI];
        }
        protoObjProto.length = cLen - sub, protoObjProto.value = ele.className, protoObjProto[" uCL"] = ele;
        if (defineProperty) {
            defineProperty(ele, "classList", { // IE8 & IE9 allow defineProperty on the DOM
                enumerable: 1,
                get: function() {
                    return resTokenList
                },
                configurable: 0,
                set: function(newVal) {
                    skipPropChange = 1, ele.className = protoObjProto.value = (newVal += ""), skipPropChange = 0;
                    var toks = newVal.trim().split(wsRE),
                        oldLen = protoObjProto.length;
                    a: for (var cI = 0, cLen = protoObjProto.length = toks.length, sub = 0; cI !== cLen; ++cI) {
                        for (var innerI = 0; innerI !== cI; ++innerI)
                            { if (toks[innerI] === toks[cI]) {
                                sub++;
                                continue a;
                            } }
                        resTokenList[cI - sub] = toks[cI];
                    }
                    for (var i = cLen - sub; i < oldLen; ++i) { delete resTokenList[i]; } //remove trailing indexs
                }
            });
            defineProperty(ele, " uCLp", { // for accessing the hidden prototype
                enumerable: 0,
                configurable: 0,
                writeable: 0,
                value: protoObj.prototype
            });
            defineProperty(protoObjProto, " uCL", {
                enumerable: 0,
                configurable: 0,
                writeable: 0,
                value: ele
            });
        } else {
            ele.classList = resTokenList, ele[" uCL"] = resTokenList, ele[" uCLp"] = protoObj.prototype;
        }
        ele.attachEvent("onpropertychange", whenPropChanges);
    };
    window__default.Object.defineProperty(window__default.Element.prototype, "classList", {
        enumerable: 1,
        get: function(val) {
            if (!hasOwnProp.call(this, "classList")) { polyfillClassList(this); }
            return this.classList;
        },
        configurable: 0,
        set: function(val) {
            this.className = val;
        }
    });
}

// 2. Patch in unsupported methods in DOMTokenList
var DOMTokenListProto = window__default.DOMTokenList.prototype;
var testClass = window__default.document.createElement("div").classList;
if (!DOMTokenListProto.item) { DOMTokenListProto.item = function(i) {
    function NullCheck(n) {
        return n === void 0 ? null : n
    }
    return NullCheck(this[i]);
}; }
if (!DOMTokenListProto.toggle || testClass.toggle("a", 0) !== false) { DOMTokenListProto.toggle = function(val) {
    if (arguments.length > 1) { return (this[arguments[1] ? "add" : "remove"](val), !!arguments[1]); }
    var oldValue = this.value;
    return (this.remove(oldValue), oldValue === this.value && (this.add(val), true) /*|| false*/ );
}; }
if (!DOMTokenListProto.replace || typeof testClass.replace("a", "b") !== "boolean")
    { DOMTokenListProto.replace = function(oldToken, newToken) {
        checkIfValidClassListEntry("replace", oldToken), checkIfValidClassListEntry("replace", newToken);
        var oldValue = this.value;
        return (this.remove(oldToken), this.value !== oldValue && (this.add(newToken), true));
    }; }
if (!DOMTokenListProto.contains) { DOMTokenListProto.contains = function(value) {
    for (var i = 0, Len = this.length; i !== Len; ++i)
        { if (this[i] === value) { return true; } }
    return false;
}; }
if (!DOMTokenListProto.forEach) { DOMTokenListProto.forEach = function(f) {
    if (arguments.length === 1)
        { for (var i = 0, Len = this.length; i !== Len; ++i) { f(this[i], i, this); } }
    else
        { for (var i = 0, Len = this.length, tArg = arguments[1]; i !== Len; ++i) { f.call(tArg, this[i], i, this); } }
}; }
if (!DOMTokenListProto.entries) { DOMTokenListProto.entries = function() {
    var nextIndex = 0,
        that = this;
    return {
        next: function() {
            return nextIndex < that.length ? {
                value: [nextIndex, that[nextIndex]],
                done: false
            } : {
                done: true
            };
        }
    };
}; }
if (!DOMTokenListProto.values) { DOMTokenListProto.values = function() {
    var nextIndex = 0,
        that = this;
    return {
        next: function() {
            return nextIndex < that.length ? {
                value: that[nextIndex],
                done: false
            } : {
                done: true
            };
        }
    };
}; }
if (!DOMTokenListProto.keys) { DOMTokenListProto.keys = function() {
    var nextIndex = 0,
        that = this;
    return {
        next: function() {
            return nextIndex < that.length ? {
                value: nextIndex,
                done: false
            } : {
                done: true
            };
        }
    };
}; }

/* Polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign */
if (typeof Object.assign !== 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      var arguments$1 = arguments;

      if (target === null || target === undefined) {
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments$1[index];

        if (nextSource !== null && nextSource !== undefined) {
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

/*
 * Polyfill from https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith
 */

if (!String.prototype.startsWith) {
    Object.defineProperty(String.prototype, 'startsWith', {
        value: function(search, rawPos) {
            var pos = rawPos > 0 ? rawPos|0 : 0;
            return this.substring(pos, pos + search.length) === search;
        }
    });
}

/*
 * Polyfill from https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent#Polyfills
 */

if ( typeof window__default.CustomEvent !== "function" ) {
	window__default.CustomEvent = function ( event, params ) {
		params = params || { bubbles: false, cancelable: false, detail: null };
		var evt = window__default.document.createEvent( 'CustomEvent' );
		evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
		return evt;
	};
}

/**
 * Polyfill from https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
 */

// matches polyfill
var Element = window__default.Element;
if (!Element.prototype.matches) {
  Element.prototype.matches =
      Element.prototype.matchesSelector ||
      Element.prototype.mozMatchesSelector ||
      Element.prototype.msMatchesSelector ||
      Element.prototype.oMatchesSelector ||
      Element.prototype.webkitMatchesSelector ||
      function(s) {
        var matches = (this.document || this.ownerDocument).querySelectorAll(s),
            i = matches.length;
        while (--i >= 0 && matches.item(i) !== this) {}
        return i > -1;
      };
}

// Polyfill from https://developer.mozilla.org/en-US/docs/Web/API/Element/closest
// closest polyfill
if (!Element.prototype.closest) {
  Element.prototype.closest = function(s) {
    var el = this;
    do {
      if (el.matches(s)) { return el; }
      el = el.parentElement || el.parentNode;
    } while (el !== null && el.nodeType === 1);
    return null;
  };
}

// Polyfill from MDN:
// https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Array/findIndex
if (!Array.prototype.findIndex) {
  Object.defineProperty(Array.prototype, 'findIndex', {
    value: function(predicate) {
     // 1. Let O be ? ToObject(this value).
      if (this == null) {
        throw new TypeError('"this" is null or not defined');
      }

      var o = Object(this);

      // 2. Let len be ? ToLength(? Get(O, "length")).
      var len = o.length >>> 0;

      // 3. If IsCallable(predicate) is false, throw a TypeError exception.
      if (typeof predicate !== 'function') {
        throw new TypeError('predicate must be a function');
      }

      // 4. If thisArg was supplied, let T be thisArg; else let T be undefined.
      var thisArg = arguments[1];

      // 5. Let k be 0.
      var k = 0;

      // 6. Repeat, while k < len
      while (k < len) {
        // a. Let Pk be ! ToString(k).
        // b. Let kValue be ? Get(O, Pk).
        // c. Let testResult be ToBoolean(? Call(predicate, T, « kValue, k, O »)).
        // d. If testResult is true, return k.
        var kValue = o[k];
        if (predicate.call(thisArg, kValue, k, o)) {
          return k;
        }
        // e. Increase k by 1.
        k++;
      }

      // 7. Return -1.
      return -1;
    },
    configurable: true,
    writable: true
  });
}

if (!window__default.Promise) {
  window__default.Promise = Promise;
} else if (!window__default.Promise.prototype['finally']) {
  window__default.Promise.prototype['finally'] = Promise.prototype['finally'];
}

function capitalizeFirst(value) {
	return value[0].toUpperCase()+value.substring(1);
}

function kebabToCamel(value) {
	var i = value.indexOf('-');
	if (i == -1) { return value; }
	var out = value.substring(0, i);
	var s = i+1;
	i = value.indexOf('-', s);
	while (i > -1) {
		out += capitalizeFirst(value.substring(s, i));
		s = i+1;
		i = value.indexOf('-', s);
	}
	if (s < value.length) {
		out += capitalizeFirst(value.substring(s));
	}
	return out;
}

var PRINT_RX = /%s/g;
function print(text) {
	var i = 1, args = arguments;
	return text.replace(PRINT_RX, function(match, p1) {
		return args[i++];
	});
}

function ERR() {
	throw new Error(print.apply(null, Array.prototype.slice.call(arguments)))
}

function stopEvent(e) {
	e.preventDefault();
	e.stopPropagation();
}

function chainFnAfter(fn, prevFn) {
	return prevFn ? function(arg) {
		prevFn(arg);
		return fn(arg);
	} : fn;
}

function closestVM(el) {
	while (el && !(el.__qute__ && el.__qute__.__VM__)) {
		el = el.parentNode;
	}
	return el && el.__qute__;
}

function closestComp(el) {
	while (el && !el.__qute__) {
		el = el.parentNode;
	}
	return el && el.__qute__;
}

// find the closest list item rendering context
function closestListItem(el) {
	while (el && !el.__qute_ctx__) {
		el = el.parentNode;
	}
	return el && el.__qute_ctx__;
}

// filter is a an array whoes first item is true or false. See compiler q:attrs encoding
function filterKeys(obj, filter) {
	var keys = Object.keys(obj);
	if (filter) {
		var incl = filter[0]; // true: include, false: exclude
		return keys.filter(function(key) {
			return (filter.indexOf(key, 1) > -1) === incl;
		});
	} else {
		return keys;
	}
}

var UpdateQueue = {
	maxNestedLoops: 50,
	queue: [],
	after: null, // routines to run after the queue is processed
	push: function(op) {
		if (!this.queue.length) { // schedule
			var self = this;
			window__default.setTimeout(function() {
				self.run();
			}, 0);
		}
		this.queue.push(op);
	},
	// Add a callback to be invoked after the current queue run. If the queue is empty then the callback is immediately run
	// As queue tasks may push tasks into the queue, pushing a regular task in the queue after an update does not guarantee
	// the task will be run at the end.
	// This is usefull to test (to make assertion after all the uopdates where done)
	// Usually this method is called after an update
	runAfter: function(runAfterCb) {
		if (!this.queue.length) {
			runAfterCb();
		} else {
			if (!this.after) { this.after = [runAfterCb]; }
			else { this.after.push(runAfterCb); }
		}
	},
	run: function() {
		var queue = this.queue;
		var cnt = queue.length;
		var max = cnt+this.maxNestedLoops; // allowed iteration to avoid infintite loops
		while (queue.length > 0) {
			queue[0]();
			// remove from queue after execution
			queue.shift();
			if (++cnt > max) { ERR("Possible infinite loop detected"); }
		}

		// run the 'after' routines if any
		if (this.after) {
			var after = this.after;
			for (var i=0,l=after.length; i<l; i++) {
				after[i]();
			}
			this.after = null; // clear the after array
		}
	}

};

function createProp(prop) {
	return {
		get: function get() {
			return prop.value;
		},
		set: function set(value) {
			prop.set(value);
		},
		enumerable: true
	};
}

var PropProto = {
	set: function set(value) {
		if (value !== this.value) {
			var old = this.value;
			this.value = value;
			this.app.post('model:'+this.key, value, old);
		}
	},
	get: function get() {
		return this.value;
	},

	addChangeListener: function addChangeListener(fn) {
		this.app.subscribe('model:'+this.key, fn);
		return fn;
	},

	removeChangeListener: function removeChangeListener(fn) {
		this.app.unsubscribe('model:'+this.key, fn);
	},

	link: function link(target, name) {
		Object.defineProperty(target, name, createProp(this));
		return this;
	},

	$bindVM: function $bindVM(vm, key) {
		var self = this;
		vm.$data[key] = this.value; // set the initial value
		vm.setup(function() {
			vm.subscribe('model:'+self.key, function(value, old) {
				var watcher = this.$el && this.$watch && this.$watch[key]; // if not connected whatchers are not enabled
				// avoid updating if watcher return false
				if (watcher && watcher.call(this, value, old) === false) { return; }
				this.update();
			});
		});
		return createProp(this);
	}
};

var AsyncPropProto = Object.assign({_set: PropProto.set}, PropProto);
AsyncPropProto.set = function(value) {
	if (value && value.then) {
		var self = this;
		this.pending = true;
		this.error = null;
		value.then(function(value) { // resolved
			self._set(value);
			self.pending = false;
		}, function(err) { // rejected
			this.error = err;
			this.pending = false;
		});
	} else {
		this.pending = false;
		this.error = null;
		this._set(value);
	}
};

function Prop(app, key, defValue) {
	this.app = app;
	this.key = key;
	this.value = defValue;
	app.data[key] = this;
}
Prop.prototype = PropProto;


function AsyncProp(app, key, defValue) {
	this.app = app;
	this.key = key;
	this.value = defValue;
	app.data[key] = this;
	new Prop(app, key+'/pending').link(this, 'pending');
	new Prop(app, key+'/error').link(this, 'error');
}
AsyncProp.prototype = AsyncPropProto;

function App(data) {
	this.topics = {};
	this.data = {};
	data && this.putAll(data);
}

App.prototype = {
	post: function post(topic, msg, data) {
		var listeners = this.topics[topic];
		if (listeners) { for (var i=0,l=listeners.length;i<l;i++) {
			if (listeners[i](msg, data) === false) {
				break; // stop if one of the listeners returns false
			}
		} }
	},
	postAsync: function postAsync(topic, msg, data) {
		var self = this;
		window__default.setTimeout(function() { self.post(topic, msg, data); }, 0);
	},
	subscribe: function subscribe(topic, listenerFn) {
		var listeners = this.topics[topic];
		if (!listeners) {
			this.topics[topic] = listeners = [];
		}
		listeners.push(listenerFn);
		return this;
	},
	subscribeOnce: function subscribeOnce(topic, event, listenerFn) {
		var self = this;
		var onceSubscription = function(msg, data) {
			if (msg === event) {
				listenerFn(msg, data);
				self.unsubscribe(topic, onceSubscription);
			}
		};
		this.subscribe(topic, onceSubscription);
		return onceSubscription;
	},
	unsubscribe: function unsubscribe(topic, listenerFn) {
		var listeners = this.topics[topic];
		if (listeners) {
			var i = listeners.indexOf(listenerFn);
			if (i > -1) {
				listeners.splice(i, 1);
			}
		}
	},

	prop: function prop(key) {
		var prop = this.data[key];
		if (!prop) {
			ERR("No model property named '%s' was found!", key);
		}
		return prop;
	},

	defineProp: function defineProp(key, value) {
		return new Prop(this, key, value);
	},

	defineAsyncProp: function defineAsyncProp(key, value) {
		return new AsyncProp(this, key, value);
	},

	defineProps: function defineProps(props) {
		var data = this.data;
		for (var key in props) {
			data[key] = new Prop(this, key, props[key]);
		}
	},

	view: function view(VM) {
		return new VM(this);
	}
};

App.Prop = Prop;
App.AsyncProp = AsyncProp;

var VMS = {};
var XTAGS = {};
var ATTRS = {};

var converters = {};

function QName(tag) {
	var i = tag.indexOf(':');
	if (i > -1) {
		var prefix = tag.substring(0, i);
		this.prefix = prefix;
		this.localName = tag.substring(i+1);
		this.name = tag;
		this.defaultNs = prefix === 'q';
	} else {
		this.prefix = 'q';
		this.localName = tag;
		this.name = 'q:'+tag;
		this.defaultNs = true;
	}
}

function getTag(tag) {
	return XTAGS[tag];
}


function registerTag(tag, templateFn, isCompiled) {
	var qname = new QName(tag);
	templateFn.$qname = qname;
	templateFn.$compiled = !!isCompiled;
	templateFn.$tag = tag;
	XTAGS[qname.name] = templateFn;
	if (qname.defaultNs) {
		XTAGS[qname.localName] = templateFn;
	}
	return templateFn;
}

function getVM(tag) {
	return VMS[tag];
}

function registerVM(tag, vm) {
	var qname = new QName(tag);
	VMS[qname.name] = vm;
	if (qname.defaultNs) {
		VMS[qname.localName] = vm;
	}
	return qname;
}

function getVMOrTag(tag) {
	return VMS[tag] || XTAGS[tag];
}

function findDirective(tag, name) {
	return ATTRS[tag+':'+name] || ATTRS[name];
}

function registerDirective(/*[tag, ]name, dirFn*/) {
	if (arguments.length === 3) {
		ATTRS[arguments[0]+':'+arguments[1]] = arguments[2];
	} else {
		ATTRS[arguments[0]] = arguments[1];
	}
}

function snapshotRegistry() {
	return {VMS: Object.assign({}, VMS), XTAGS: Object.assign({}, XTAGS)};
}

function restoreRegistry(snapshot) {
	VMS = snapshot.VMS;
	XTAGS = snapshot.XTAGS;
}

function addClassMap(cl, value) {
	var keys = Object.keys(value);
	for (var i=0,l=keys.length; i<l; i++) {
		var key = keys[i];
		var val = value[key];
		if (val) { cl.add(key); } else { cl.remove(key); }
	}
}

function bindClass(elt, value) {
	if (!value) { return; }
	var cl = elt.classList;
	if (Array.isArray(value)) {
		for (var i=0,l=value.length; i<l; i++) {
			var val = value[i];
			if (val) {
				if (typeof val === 'string') {
					cl.add(val);
				} else { // an object?
					addClassMap(cl, val);
				}
			}
		}
	} else { // an object
		addClassMap(cl, value);
	}
}

function bindStyle(elt, value) {
	if (!value) { return; }
	var style = elt.style;
	if (Array.isArray(value)) {
		for (var i=0,l=value.length; i<l; i++) {
			Object.assign(style, value[i]);
		}
	} else { // an object
		Object.assign(style, value);
	}

}

// the listeners injected from a vm to a nested functional view
// must run in parent vm, context not in fucntional view context!
// This is why we need to use the vm from the closure scope when the listener was created
function createListener(vm, fn) {
	return function(e) {
		if (fn.call(vm, e) === false) {
			stopEvent(e);
		}
	};
}

function applyListeners(el, vm, listeners) {
	for (var key in listeners) {
		var fn = listeners[key];
		el.addEventListener(key, createListener(vm, fn));
	}
}


function SetText(el, model, expr) {
	return function() {
		var val = expr(model);
		if (val !== el.nodeValue) {
			el.nodeValue = val;
		}
	}
}

function SetAttr(el, model, key, valFn) {
	return function(changedKey) {
		//if (!changedKey || changedKey === key) {
			var val = valFn(model);
			if (el.getAttribute(key) !== val) {
				if (val == null) {
					el.removeAttribute(key);
				} else {
					el.setAttribute(key, val);
				}
			}
		//}
	}
}

/*
export function SetBindings(el, model, bindFn) {
	return function(changedKey) {
		var bindings = bindFn(model);
		for (var key in bindings) {
			var val = bindings[key];
			if (el.getAttribute(key) !== val) {
				el.setAttribute(key, val);
			}
		}
	}
}
*/
function SetInnerHTML(el, model, valFn) {
	return function() {
		var val = valFn(model);
		if (el.innerHTML !== val) {
			el.innerHTML = val || '';
		}
	}
}

function SetDisplay(el, model, valFn) {
	return function() {
		var val = valFn(model);
		var display = el.style.display;
		// backup the current diaply when toggliong OFF to be able to restore if needed
		if (val) {
			if (display === 'none') {
				el.style.display = el.__qute_display || ''; // remove 'none'
			}
		} else if (display !== 'none') {
			if (el.__qute_display == null) { el.__qute_display = display; }
			el.style.display = 'none';
		}
	}
}


function SetToggle(el, model, valFn) {
	// valFn returns a map of attr keys to values
	return function() {
		var attrs = valFn(model);
		var keys = Object.keys(attrs);
		for (var i=0,l=keys.length;i<l;i++) {
			var key = keys[i];
			if (attrs[key]) {
				el.setAttribute(key, key);
			} else {
				el.removeAttribute(key);
			}
		}
	}
}

function SetClass(el, model, valFn) {
	return function() {
		//TODO only if modified
		bindClass(el, valFn(model));
	}
}

function SetStyle(el, model, valFn) {
	return function() {
		//TODO only if modified
		bindStyle(el, valFn(model));
	}
}

function SetProp(vm, model, key, valFn) {
	return function(changedKey) {
		//if (!changedKey || changedKey === key) {
			vm.$set(key, valFn(model));
		//}
	}
}



function retargetEvent(el, model, srcEvent, toEvent, detailFn, isAsync) {
	el.addEventListener(srcEvent, function(e) {
		// avoid infinite loop when emiting from a component root element a
		// custom event with the same name of the original event
		if (e.$originalEvent && e.$originalTarget === el) {
			if (e.$originalEvent.type === srcEvent) { return; }
		}

		var comp = closestComp(el);
		if (comp) {
			var targetEl = comp.$el;
			var newEvent = new window__default.CustomEvent(toEvent, {
				bubbles: e.bubbles,
				detail: detailFn ? detailFn(model) : e
			});
			newEvent.$originalEvent = e;
			newEvent.$originalTarget = el;
			e.stopImmediatePropagation();
			e.preventDefault();
			if (isAsync) {
				window__default.setTimeout(function() {
					targetEl.dispatchEvent(newEvent);
				}, 0);
			} else {
				targetEl.dispatchEvent(newEvent);
			}
		}
	});
}

function applyEmiters(el, model, ar) {
	for (var i=0,l=ar.length; i<l; i+=4) {
		retargetEvent(el, model, ar[i+1], ar[i], ar[i+2], ar[i+3]);
	}
}

// emitter prototype
var Emitter = {
	emit: function(event, data) {
		this.$el.dispatchEvent(new window__default.CustomEvent(event, {bubbles: true, detail: data === undefined ? this : data }));
	},
	emitAsync: function(event, data, timeout) {
		var self = this;
		window__default.setTimeout(function() { self.emit(event, data); }, timeout || 0);
	}
};

// el is defined only when called on a DOM element
function applyUserDirectives(rendering, tag, xattrs, compOrEl) {
	var xcall, fns = [], directives = xattrs.$use;
	for (var key in directives) {
		var val = directives[key];
		if (key === '@') { // an q:call
			xcall = val;
		} else {
			var userDir = findDirective(tag, key);
			if (!userDir) {
				ERR("Unknown user attribute directive: '%s'", key);
			}
			var fn = userDir.call(rendering, xattrs, val===true?undefined:val, compOrEl);
			if (fn) { fns.push(fn); }
		}
	}
	return (xcall || fns.length) && function(rendering, el) {
		if (xcall) { xcall.call(rendering.model, el); }
		for (var i=0,l=fns.length; i<l; i++) {
			fns[i].call(rendering, el);
		}
	}
}

var CLEAR = 0;
var SET = 1;
var REMOVE = 2;
var INSERT = 3;
var APPEND = 4;
var MOVE = 5;

function valueAsKey(item) {
	return String(item);
}

function ArrayDiff(key) {
	this.ar = null;
	this.map = null;
	if (key === '.') {
		this.keyOf = valueAsKey;
	} else if (typeof key === 'string') {
		this.keyOf = function(item) { return item[key] };
	} else if (key) { // expect a fn
		this.keyOf = key;
	} else {
		this.keyOf = null;
	}
}
ArrayDiff.prototype = {
	clear: function clear() {
		var wasSet = !!(this.ar && this.ar.length > 0);
		this.ar = null;
		this.map = {};
		return wasSet ? [ CLEAR ] : null;
	},
	set: function set(from) {
		if (!from || !from.length) {
			return this.clear();
		}
		var keyOf = this.keyOf;
		if (keyOf) {
			var map = {};
			for (var i=0,l=from.length; i<l; i++) {
				map[keyOf(from[i])] = true;
			}
			this.map = map;
			this.keyOf = keyOf;
		} else {
			this.map = {};
		}
		this.ar = from.slice(0); // store a copy
		return [ SET, this.ar, keyOf ];
	},
	update: function update(from) {
		if (this.ar === from) {
			return null;
		}
		if (from == null || !from.length) {
			return this.clear();
		}
		if (!this.ar || !this.ar.length) {
			return this.set(from);
		}
		var keyOf = this.keyOf;
		if (!keyOf) { // reset
			return this.set(from);
		}
		var ar = this.ar;
		var map = this.map;
		var fromMap = {};
		var l1 = ar.length;
		var l2 = from.length;
		var moved = {};
		var diff = [];

		// build an index for the from array
		for (var i=0; i<l2; i++) {
			fromMap[keyOf(from[i])] = true;
		}

		var i = 0, j = 0;
		for (; j<l1 && i<l2; i++) {
			var it2 = from[i];
			var key2 = keyOf(it2);
			var key1 = keyOf(ar[j]);

			if (moved[key1]) {
				j++; // skip moved items from dst array
				i--; // repeat current item
				continue;
			}

			if (moved[key2]) {
				// it2 already processed (moved) - skip and continue
				continue;
			}

			if (!map[key2]) {
				// a new item - insert
				if (j < l1) {
					diff.push(INSERT, it2, key2, key1);
				}
			} else {
				// item already exists
				if (key1 === key2) {
					// unchanged - continue
					j++;
				} else if (fromMap[key1]) {
					// items differs - moved
					moved[key2] = true;
					diff.push(MOVE, key2, key1);
				} else {
					// item removed
					diff.push(REMOVE, key1);
					i--; // repeat the item
					j++;
				}
			}
		}

		if (i < l2) {
			// 'ar' consumed but 'from' not consumed
			// all the remaining 'from' items must be appended if not already moved
			for (;i<l2;i++) {
				var item = from[i];
				var key = keyOf(item);
				if (!map[key]) {
					diff.push(APPEND, item, key);
				}
			}
		} else if (j < l1) {
			// 'from' consumed but 'ar' not consumed
			// remove remaining 'ar' items if they are not in from
			for (;j<l1;j++) {
				var key = keyOf(ar[j]);
				if (!fromMap[key]) {
					// item removed
					diff.push(REMOVE, keyOf(ar[j]));
				}
			}
		}

		if (diff.length) {
			this.ar = from.slice(0); // store a copy
			this.map = fromMap;
		} // else unchanged

		return diff;
	}
};


ArrayDiff.run = function(OPS, diff) {
	if (diff) {
		for (var i=0,l=diff.length; i<l;) {
			switch (diff[i]) {
				case APPEND: // append(item, key)
					OPS.append(diff[i+1], diff[i+2]);
					i+=3;
					break;
				case INSERT: // insert(item, key, beforeKey)
					OPS.insert(diff[i+1], diff[i+2], diff[i+3]);
					i+=4;
					break;
				case REMOVE: // remove(key)
					OPS.remove(diff[i+1]);
					i+=2;
					break;
				case MOVE: // move(key, beforeKey)
					OPS.move(diff[i+1], diff[i+2]);
					i+=3;
					break;
				case SET: // set(array, keyOf)
					OPS.set(diff[i+1], diff[i+2]);
					i+=3;
					break;
				case CLEAR: // clear()
					OPS.clear();
					i++;
					break;
				default: throw new Error('Invalid diff op '+diff[i]);
			}
		}
	}
};

/*
Reqs:

1. Item need to be added/removed at runtime without causing leaks.
Each item should register its updaters to its own context so that when it is removed the
updaters are automatically removed.

Solution: use a rendering context per item. Store the context as a DOM element prop: __qute_ctx__,
so that we can easily retrieve the rendering context when removing an element.

2. Items must be notified when parent rendering connects / disconnects

Solution: the ListFragment itself implements the connect / disconnect contract of Rendering and register itself as a sub-rendering
(even if it is not a real rendering instance). It will be then called easch time the parent connect / disconnect, and will be able to connect disconnect each item rendering.
To retrieve item renderings we need to store each rendering context (from 1.) into a element property '__qute_ctx__'
this way we can connect/disconnect items by iterating over the DOM children elements.

3. Only the list expr is bound to the parent rendering model. All the other item properties will be bound to its own model (the iteration model)
The model is stored as usually in the rendering instance linked corresponding to the item (from 1.)

4. To be able to quickly update the DOM we need to store [key -> itemEElement] pairs
to quiclky retrieve an element using its key.

Solution: 1. we can keep a map or we can store the key as an element 'data-qute-key' property and use querySelector to retrieve the item.
We implement 1. for now.

5. List diff is computed only when parent context is updating and the list expression
returns a different list instance that the current rendered one.

NOTE: If you wantt to be able to update the DOM when the curren list changes (e.g. list.push(..) called)
without cloning and setting a new instance of the list then we need to impl some sort of version mechanism:
list.$version=0 which we need to increment and then manually call vm.update() to force a DOM rendering

WARN: If list is not defining an item key then updates will be costly and will render the entire list fragment. and not only the differences
(you can use '.' for primitive sets to use the value as the key)
*/

function ListFragment(rendering, listFn, itemFn, key) {
	this.r = rendering;
	this.listFn = listFn;
	this.itemFn = itemFn;
	this.adiff = new ArrayDiff(key);
	this.items = {};
	this.start = window.document.createComment('[q:if]');
	this.end = window.document.createComment('[/q:if]');
}

ListFragment.prototype = {
	$create: function $create() {
		var frag = window.document.createDocumentFragment();
		frag.appendChild(this.start);
		frag.appendChild(this.end);
		// add the update function to the parent rendering updaters and trigger an update
		this.r.up(this.update.bind(this))();
		// register the list fragments as a sub context to be notified for connect / disconnect events.
		this.r.$push(this);
		return frag;
	},
	callItemR: function callItemR(methodName) {
		var end = this.end;
		var next = this.start.nextSibling;
		while (next && next !== end) {
			next.__qute_ctx__ && next.__qute_ctx__[methodName]();
			next = next.nextSibling;
		}
	},
	// life cycle hooks
	connect: function connect() {
		this.callItemR('connect');
	},
	disconnect: function disconnect() {
		this.callItemR('disconnect');
	},
	refresh: function refresh() {
		this.callItemR('refresh');
	},
	// TODO not uet used
	uupdateItems: function uupdateItems() {
		this.callItemR('update');
	},

	renderItem: function renderItem(r, items, key, item) {
		var itemR = r.spawn();
		var el = this.itemFn(itemR, item);
		el.__qute_ctx__ = itemR;
		if (key) { items[key] = el; }
		r.isc && itemR.connect();
		return el;
	},
	// update the list
	update: function update() {
		var list = this.listFn(this.r.model);
		var diff = this.adiff.update(list);
		if (diff) {
			ArrayDiff.run(this, diff);
		}
		//TODO
		//update item contexts too? or keep them isolated from parent updates?
		//this.updateItems();
	},

	// --------- ArrayDiff operations ---------
	clear: function clear() {
		//console.log('ListFragment:clear');
		this.items = null;
		var isc = this.r.isc;
		var end = this.end, start = this.start;
		var parent = end.parentNode;
		while (start.nextSibling !== end) {
			var el = start.nextSibling;
			isc && el.__qute_ctx__ && el.__qute_ctx__.disconnect();
			parent.removeChild(el);
		}
	},
	set: function set(ar, keyOf) {
		//console.log('ListFragment:set', ar, keyOf);
		this.clear();
		if (!ar || !ar.length) { return; }
		var r = this.r;
		var end = this.end;
		var parent = end.parentNode;
		if (!keyOf) {
			keyOf = function() {};
		}
		var i=0,items = {};
		for (var l=ar.length; i<l; i++) {
			var item = ar[i];
			var itemEl = this.renderItem(r, items, keyOf(item), item);
			parent.insertBefore(itemEl, end);
		}
		this.items = items;
	},
	remove: function remove(key) {
		//console.log('ListFragment:remove', key);
		var itemEl = this.items && this.items[key];
		if (itemEl) {
			itemEl.parentNode.removeChild(itemEl);
			this.r.isc && itemEl.__qute_ctx__ && itemEl.__qute_ctx__.disconnect();
			delete this.items[key];
		} else {
			console.error('cannot find cached element', key); // TODO
		}
	},
	_insert: function _insert(item, key, beforeEl) {
		var itemEl = this.renderItem(this.r, this.items, key, item, -1, false);
		beforeEl.parentNode.insertBefore(itemEl, beforeEl);
	},
	insert: function insert(item, key, beforeKey) {
		//console.log('ListFragment:insert', item, key, beforeKey);
		var beforeEl = this.items && this.items[beforeKey];
		if (beforeEl) {
			this._insert(item, key, beforeEl);
		} else {
			console.error('cannot find cached element', beforeKey); // TODO
		}
	},
	append: function append(item, key) {
		//console.log('ListFragment:append', item, key);
		this._insert(item, key, this.end);
	},
	move: function move(key, beforeKey) {
		//console.log('ListFragment:move', key, beforeKey);
		var beforeEl = this.items && this.items[beforeKey];
		var el = this.items && this.items[key];
		if (beforeEl && el) {
			beforeEl.parentNode.insertBefore(el, beforeEl);
		} else {
			console.error('cannot find cached element', key, beforeKey); // TODO
		}
	}
};

/*
	- exprFn - is a model binding fn (i.e. takes a model as argument) that returns a key
	- render - is a cunftion that takes a rendering and a key as argument and return a DOM node or an array of nodes
*/
function SwitchFragment(rendering, name, exprFn, render, changeCb, nocache) {
	this.key = null; // the active case key
	this.caseR = null;
	this.cache = nocache ? null : {}; // key to rendering instance cache if cache is used.
	this.r = rendering;
	this.exprFn = exprFn;
	this.render = render;
	this.changeCb = changeCb;
	this.start = window.document.createComment('['+name+']');
	this.end = window.document.createComment('[/'+name+']');
}

SwitchFragment.prototype = {
	$create: function $create() {
		var frag = window.document.createDocumentFragment();
		frag.appendChild(this.start);
		frag.appendChild(this.end);
		// add the update function to the parent rendering updaters and trigger an update
		this.r.up(this.update.bind(this))(this.r.model, true);
		// register the list fragments as a sub context to be notified for connect / disconnect events.
		this.r.$push(this);
		return frag;
	},
	// ---- rendering hooks ---------
	connect: function connect() {
		this.caseR && this.caseR.connect();
	},
	disconnect: function disconnect() {
		this.caseR && this.caseR.disconnect();
	},
	refresh: function refresh() {
		this.caseR && this.caseR.refresh();
	},
	// --- end rendering hooks ------
	clear: function clear() {
		var end = this.end, start = this.start;
		var parent = end.parentNode;
		while (start.nextSibling !== end) {
			var el = start.nextSibling;
			parent.removeChild(el);
		}
		this.r.isc && this.caseR && this.caseR.disconnect();
		this.caseR = null;
	},
	update: function update(model, initialUpdate) {
		var key = this.exprFn(this.r.model);
		if (this.key !== key) { // case changed -> render case
			this.clear(); // remove existing content
			var cache = this.cache;
			var r = cache && cache[key];
			if (!r) {
				r = this.r.spawn();
				var nodes = this.render(r, key);
				if (nodes && !Array.isArray(nodes)) {
					nodes = [nodes];
				}
				r.$nodes = nodes;
				if (cache) { cache[key] = r; }
			}
			// render nodes
			var nodes = r.$nodes;
			if (nodes) {
				var end = this.end;
				var parent = end.parentNode;
				for (var i=0,l=nodes.length; i<l; i++) {
					parent.insertBefore(nodes[i], end);
				}
			}
			this.caseR = r;
			this.key = key;
			this.r.isc && r.connect();
			if (!initialUpdate) {
				//TODO how we can automatically detect dirty states?
				this.caseR.update(); // force an update?
			}

			if (this.changeCb && !initialUpdate) { // avoid calling changeCb the first time the if is rendered
				this.changeCb.call(this.r.model, key);
			}
		} else if (this.caseR) {
			this.caseR.update(); // udpate
		}
	}
};

function ForFragment(rendering, listFn, iterationFn) {
	this.r = rendering;
	this.listFn = listFn;
	this.iterationFn = iterationFn;
	this.list = null;
	this.listR = null;
	this.start = window.document.createComment('[for]');
	this.end = window.document.createComment('[/for]');
}

ForFragment.prototype = {
	$create: function $create() {
		var frag = window.document.createDocumentFragment();
		frag.appendChild(this.start);
		frag.appendChild(this.end);
		// add the update function to the parent rendering updaters and trigger an update
		this.r.up(this.update.bind(this))(this.r.model, true);
		// register the list fragments as a sub context to be notified for connect / disconnect events.
		this.r.$push(this);
		return frag;
	},
	// ---- rendering hooks ---------
	connect: function connect() {
		this.listR && this.listR.connect();
	},
	disconnect: function disconnect() {
		this.listR && this.listR.disconnect();
	},
	refresh: function refresh() {
		this.listR && this.listR.refresh();
	},
	// --- end rendering hooks ------
	clear: function clear() {
		var end = this.end, start = this.start;
		var parent = end.parentNode;
		while (start.nextSibling !== end) {
			var el = start.nextSibling;
			parent.removeChild(el);
		}
		this.r.isc && this.listR && this.listR.disconnect();
		this.listR = null;
		this.list = null;
	},
	update: function update(model, initialUpdate) {

		var list = this.listFn(this.r.model);
		if (!list) {
			this.clear();
			return;
		}
		if (list !== this.list) {
			// remove current list
			this.clear();
			this.list = list;
			if (list) {
				if (!Array.isArray(list)) {
					list = Object.keys(list);
				}
				if (list.length > 0) {
					var r = this.r.spawn();
					var iterationFn = this.iterationFn;
					var end = this.end;
					var parent = end.parentNode;
					var l = list.length-1;
					for (var i=0; i<l; i++) {
						var children = iterationFn(list[i], i, true);
						if (children) {
							for (var k=0,ll=children.length; k<ll; k++) {
								parent.insertBefore(children[k], end);
							}
						}
					}
					// append last item
					var children = iterationFn(list[l], l, false);
					if (children) {
						for (var k=0,ll=children.length; k<ll; k++) {
							parent.insertBefore(children[k], end);
						}
					}
					this.listR = r;
				}
			}
		} else if (this.listR) {
			this.listR.update();
		}
	}
};

/*
functional components
*/

function SetFuncAttrs(func, vm, filter) { // vm is the parent vm (i.e. current model)
	return function() {
		var vmAttrs = vm.$attrs;
		if (vmAttrs) {
			var keys = filterKeys(vmAttrs, filter);
			for (var i=0,l=keys.length; i<l; i++) {
				var key = keys[i];
				func.set(key, vmAttrs[key]);
			}
		}
	}
}

function SetFuncAttr(func, vm, key, val) { // vm is the parent vm (i.e. current model)
	return function() {
		func.set(key, val(vm));
	}
}

function FunComp() {
	this.$app = null;
	this.$r = null;
	this.$el = null;
	this.$attrs = {};
	this.$slots = null;
	this.$uq = false; // updayte queued
}

FunComp.prototype = {
	set: function(key, val) {
		var oldVal = this.$attrs[key];
		if (val !== oldVal) {
			this.$attrs[key] = val;
			this.update();
		}
	},
	update: function() {
		if (this.$el && !this.$uq) {
			this.$uq = true;
			var self = this;
			UpdateQueue.push(function() {
				self.$r.update();
				self.$uq = false;
			});
		}
	},
	emit: Emitter.emit,
	emitAsync: Emitter.emitAsync,
	render: function(rendering, XTag, xattrs, slots) {
		this.$r = rendering.spawn(this);
		this.$slots = slots;

		var model = rendering.model, attrs = this.$attrs, $use,
			bindings, listeners;

		if (model) {
			this.$app = model.$app;
		}

		if (xattrs) {
			if (xattrs.$use) {
				$use = applyUserDirectives(rendering, XTag.$tag, xattrs, this);
			}

			for (var key in xattrs) { // class, style and show, $attrs, $listeners are ignored
				var val = xattrs[key];
				if (key.charCodeAt(0) !== 36 || key === '$html') { // $ - extended attribute -> ignore all extended attrs but $html
					if (typeof val === 'function') {
						rendering.up(SetFuncAttr(this, model, key, val));
						val = val(model);
					}
					attrs[key] = val;
				} else if (key === '$attrs') {
					if (model.$attrs) {
						// inject attributes in functional tags
						// we need to create an update function to reinject attrs when model changes
						// otherwise we loose the reactivity on func tags 'q:attrs' attribute
						rendering.up(SetFuncAttrs(this, model, val))();
					}
				} else if (key === '$on') {
					listeners = val;
				} else if (key === '$class') {
					if (!bindings) { bindings = []; }
					bindings.push(SetClass, val);
				} else if (key === '$style') {
					if (!bindings) { bindings = []; }
					bindings.push(SetStyle, val);
				} else if (key === '$show') {
					if (!bindings) { bindings = []; }
					bindings.push(SetDisplay, val);
				} else if (key === '$toggle') {
					if (!bindings) { bindings = []; }
					bindings.push(SetToggle, val);
				}
			}
		}

		var el = XTag(this.$r, xattrs, slots);
		this.$el = el;
		el.__qute__ = this; // to be used by Qute.closestComp

		// apply root bindings if any (q:class, q:style or q:show)
		if (bindings) {
			for (var i=0,l=bindings.length; i<l; i+=2) {
				var up = bindings[i](el, model, bindings[i+1]);
				rendering.up(up)();
			}
		}

		// apply listeners if any
		if (listeners) {
			applyListeners(el, model, listeners);
		}

		// call user directives if any
		if ($use) {
			$use(rendering, el);
		}

		// we must push the rendering context of the fun comp
		// to propagate connect / disconnect handlers
		rendering && rendering.$push(this.$r);

		return el;
	}
};

function SetDOMAttrs(el, model, filter) {
	return function() {
		var $attrs = model.$attrs;
		if ($attrs) {
			var keys = filterKeys($attrs, filter);
			for (var i=0,l=keys.length; i<l; i++) {
				var key = keys[i];
				el.setAttribute(key, $attrs[key]);
			}
		}
	}
}

function isVM(obj) {
	return obj && obj.prototype && obj.prototype.__VM__;
}

function appendChildren(parent, children) {
	for (var i=0, l=children.length; i<l; i++) { parent.appendChild(children[i]); }
}

function extractSlots(children) {
	if (children && children.length) {
		var namedSlots = {}, nestedCnt = 0, hasContent = false;
		for (var i=0,l=children.length; i<l; i++) {
			var child = children[i];
			var nodeType = child.nodeType;
			switch (nodeType) {
				case 1:
					if (child.nodeName === 'NESTED' || child.nodeName === 'Q:NESTED') { // select only 'nested' elements
						var slot = child.getAttribute('name') || 'default';
						var slotChildren = [];
						var node = child.firstChild;
						while (node) {
							slotChildren.push(node);
							node = node.nextSibling;
						}
						namedSlots[slot] = slotChildren;
						nestedCnt++;
					} else {
						hasContent = true;
					}
					break;
				case 3:
					if (child.nodeValue.trim()) { hasContent = true; }
					break;
			}
		}
		if (nestedCnt) {
			return namedSlots;
		} else if (hasContent) { // default slot
			namedSlots.default = children;
			return namedSlots;
		}
	}
	return null;
}



var RenderingProto = {
	x: function(expr) { // expression {{ ... }}
		var text = expr(this.model);
		var el = window.document.createTextNode(text);
		this.up(SetText(el, this.model, expr));
		return el;
	},
	t: function(value) { // text
		return window.document.createTextNode(value);
	},
	g: function(isFn, xattrs, children) { // dynamic tag using 'is'
		var tag = isFn(this.model);
		var XTag = getVMOrTag(tag);
		return XTag ? this.v(XTag, xattrs, children) : this.h(tag, xattrs, children);
	},
	h: function(tag, xattrs, children) { // dom node
		var el = window.document.createElement(tag), $use = null;
		if (xattrs) {
			var model = this.model;
			if (xattrs.$use) {
				$use = applyUserDirectives(this, tag, xattrs, el);
			}
			for (var key in xattrs) {
				var up = null;
				var val = xattrs[key];
				if (key.charCodeAt(0) === 36) { // $ - extended attribute
					if (key === '$on') {
						applyListeners(el, model, val);
					} else if (key === '$class') {
						up = SetClass(el, model, val);
					} else if (key === '$style') {
						up = SetStyle(el, model, val);
					} else if (key === '$show') {
						up = SetDisplay(el, model, val);
					} else if (key === '$toggle') {
						up = SetToggle(el, model, val);
					} else if (key === '$html') {
						up = SetInnerHTML(el, model, val);
					} else if (key === '$attrs') {
						up = SetDOMAttrs(el, model, val);
					} else if (key === '$emit') {
						applyEmiters(el, model, val);
					} else if (key === '$channel') {
						ERR("q:channel cannot be used on regular DOM elements: %s", tag);
					}
				} else if (typeof val === 'function') { // a dynamic binding
					up = SetAttr(el, model, key, val);
				} else {
					el.setAttribute(key, val);
				}
				if (up) {
					this.up(up)(); // push then execute
				}
			}
		}
		if (children) { appendChildren(el, children); }
		// we should apply any user directive after the children are added.
		if ($use) {
			$use(this, el);
		}
		return el;
	},
	// element with static children (innerHTML is set from the subtree)
	hh:function(tag, xattrs, content, type) {
		var el = this.h(tag, xattrs);
		if (type) { // convert can be a function to convert the content before injecting in the dom
			var converter = converters[type];
			if (!converter) {
				ERR("Unknown converter: %s", type);
			}
			content = converter(content, this);
		}
		el.innerHTML = content;
		return el;
	},
	r: function(tag, xattrs, children) {
		var XTag = getVMOrTag(tag);
		if (!XTag) { ERR("Could not resolve component for tag: '%s'", tag); }
		return this._v(XTag, xattrs, extractSlots(children));
	},
	v: function(XTag, xattrs, children) { // xtag is specified as a func reference. TODO No more used
		return this._v(XTag, xattrs, extractSlots(children));
	},
	// vm component
	_v: function(XTag, xattrs, slots) { // a vm component (viewmodel)
		if (isVM(XTag)) {
			var vm = new XTag(this.model.$app);
			return vm.$create(this, xattrs, slots);
		} else if (XTag.$compiled) { // a compiled template
			return new FunComp().render(this, XTag, xattrs, slots);
		} else { // a hand written function
			return XTag(this, xattrs, slots);
		}
	},
	s: function(slotName, defaultChildren) {
		var model = this.model;
		var slots = model.$slots;
		var children = slots && slots[slotName || 'default'] || defaultChildren;
		if (children) {
			var frag = window.document.createDocumentFragment();
			appendChildren(frag, children);
			return frag;
		}
		return window.document.createComment('[slot/]'); // placeholder
	},
	w: function(isExpr, changeCb, noCache, xattrs, childrenFn) { // dynamic view
		var renderFn = function(r, key) {
			return key ? r.r(key, xattrs, childrenFn(r)) : null;
		};
		return new SwitchFragment(this, 'view', isExpr, renderFn, changeCb, noCache).$create();
	},
	i: function(ifChain, kidsChain, changeCb) { // if / else-if / else
		// ifChain is a list of if expression functions corresponding to if / if-else else chain.
		// When 'else' is present - the last expression corresponding to the else will be null
		// kidsChain is a list of children functions corresponding to if / else-if / else chain
		// both lists have the same when length. When only 'if' is present the list is of length 1.
		var exprFn = function(model) {
			var i = 0;
			for (var l=ifChain.length-1; i<l; i++) {
				if (ifChain[i](model)) { return i; }
			}
			var lastExpr = ifChain[i];
			// if lastExpr is null is is corresponding to an else statement
			return !lastExpr || lastExpr(model) ? i : -1;
		};
		var renderFn = function(r, key) {
			return key > -1 ? kidsChain[key](r) : null;
		};
		return new SwitchFragment(this, 'if', exprFn, renderFn, changeCb).$create();
	},
	// dynamic lists - which is updating only items that changed
	l: function(listFn, iterationFn, key) {
		if (!key) {
			console.warn("Reactive list used without a 'q:key' attribute: Performance will suffer!");
		}
		return new ListFragment(this, listFn, iterationFn, key).$create();
	},
	// static array variant of lists - this cannot be updated it is rendered once at creation
	a: function(listFn, iterationFn) {
		return new ForFragment(this, listFn, iterationFn).$create();
	},
	up: function(fn) { // register a live update function
		this.ups.push(fn);
		return fn;
	},
	// eval the value of an xattr given the key - if a function invoke the function within the current context otherwise return the value as is
	eval: function(xattr) {
		return typeof xattr === 'function' ? xattr(this.model) : xattr;
	},

	// connect all nested renderings
	connect: function() {
		if (!this.isc) {
			var vm = this.vm;
			// before connect
			vm && vm.willConnect && vm.willConnect();
			var kids = this.kids;
			for (var i=0,l=kids.length; i<l; i++) { kids[i].connect(); }
			this.isc = true;
			// after connect
			vm && vm.connected && vm.connected();
		}
		return this;
	},
	// disconnect all nested renderings
	disconnect: function() {
		if (this.isc) {
			var vm = this.vm;
			// before disconnect
			vm && vm.willDisconnect && vm.willDisconnect();
			var kids = this.kids;
			for (var i=0,l=kids.length; i<l; i++) { kids[i].disconnect(); }
			this.isc = false;
			vm && vm.disconnected && vm.disconnected();
		}
		return this;
	},
	$push: function(r) { // push a sub-renderings
		this.kids.push(r);
		if (this.isc) { r.connect(); }
	},
	// refresh the DOM - call all nested update functions
	update: function() {
		var model = this.model, ups = this.ups;
		for (var i=0,l=ups.length;i<l;i++) { ups[i](model); }
		return this;
	},

	// run dom update recursively on each nested rendering
	refresh: function() {
		this.update();
		var kids = this.kids;
		for (var i=0,l=kids.length; i<l; i++) {
			var kid = kids[i];
			kid.refresh && kid.refresh();
		}
	},

	// create a child rendering
	spawn: function(model) {
		return new Rendering(this, model || this.model);
	},

	// get the closest VM in current rendering, ignore renderings which are not bound to ViewModel objects (functional compjents etc)
	closestVM: function() {
		var r = this;
		do {
			if (r.vm) { return r.vm; }
			r = r.parent;
		} while (r);
		return null;
	},

};

function Rendering(parent, model) {
	this.parent = parent;
	/*
	 the model to use when rendering. The model should provide the following props:
	 	$app,
	 	$attrs,
	 	$slots
	 	and other data properties
	 */
	this.model = model;
	/*
	The associated ViewModel component if any. The VM contract is to provide the following methods:
	1. willConnect
	2. connected
	3. willDisconnect
	4. disconnected
	*/
	this.vm;
	this.ups = []; // the update listeners
	/*
	  Sub-rendering objects if any
	  A rendering object must provide the following functions:
	  	connect
	  	disconnect
	  	$update
	  	refresh
	*/
	this.kids = [];
	this.isc = false; // is connected?
}
Rendering.prototype = RenderingProto;

Rendering.FunComp = FunComp;
// make the bindings visible to component implementors
// add more bindigns here if needed
Rendering.SetAttr = SetAttr;
Rendering.SetDisplay = SetDisplay;

function _prop(key, convert) {
	return {
		get: function() {
			return this.$data[key];
		},
		set: function(value) {
			if (convert) { value = convert(value); }
			var old = this.$data[key];
			if (old !== value) {
				this.$data[key] = value;
				var watcher = this.$el && this.$watch && this.$watch[key]; // if not connected whatchers are not enabled
				// avoid updating if watcher return false
				if (watcher && watcher.call(this, value, old) === false) { return; }
				this.update();
			}
		},
		enumerable: key.charCodeAt(0) !== 95 // keys starting with _ are not enumerable
	}
}

function createProp$1(vm, key, val) {
	if (val == null) { return _prop(key); }

	var type = typeof val;
	if (type === 'number') {
		return _prop(key, Number);
	} else if (type === 'boolean') {
		return _prop(key, Boolean);
	} else if (val.$convert) {
		this.$data[key] = val.value;
		return _prop(key, val.$convert);
	} else if (val.$bindVM) {
		return val.$bindVM(vm, key);
	}
	return _prop(key);
}

function NumberProp(value) {
	this.value = value;
}
NumberProp.prototype.$convert = Number;
function StringProp(value) {
	this.value = value;
}
StringProp.prototype.$convert = String;
function BooleanProp(value) {
	this.value = value;
}
BooleanProp.prototype.$convert = Boolean;

/*
A helper for reactive lists udpates
*/

function List(vm, propName, keyField) {
	this.vm = vm;
	this.name = propName;
	this.keyFn = keyField && keyField != '.' ? function(item) { return item[keyField] } : function(item) { return item; };
	var list = vm[propName];
	this.array = list ? list.slice() : [];
}
List.prototype = {
	getIndex: function getIndex(key) {
		var keyFn = this.keyFn;
		return this.array.findIndex(function(item) {
			return key === keyFn(item);
		});
	},
	get: function get(key) {
		var i = this.getIndex(key);
		return i > -1 ? this.array[i] : undefined;
	},
	remove: function remove(key) {
		var i = this.getIndex(key);
		if (i > -1) {
			this.array.splice(i, 1);
			this.save();
		}
		return this;
	},
	push: function push(item) {
		var r = this.array.push.apply(this.array, arguments);
		this.save();
		return this;
	},
	pop: function pop() {
		var r = this.array.pop();
		this.save();
		return r;
	},
	shift: function shift() {
		var r = this.array.shift();
		this.save();
		return r;
	},
	unshift: function unshift() {
		var r = this.array.unshift.apply(this.array, arguments);
		this.save();
		return r;
	},
	splice: function splice() {
		var r = this.array.splice.apply(this.array, arguments);
		this.save();
		return r;
	},
	forEach: function forEach(cb, thisArg) {
		this.array.forEach(cb, thisArg);
	},
	sort: function sort(cmpFn) {
		var r = this.array.sort(cmpFn);
		this.save();
		return r;
	},
	save: function save() {
		this.vm[this.name] = this.array;
		return this;
	},
	updateItem: function updateItem(el) {
		var rendering = closestListItem(el);
		rendering && rendering.update();
	}
};

// set $attrs on VMs
function SetVMAttrs(vm, parentVM, filter) {
	return function() {
		var parentAttrs = parentVM.$attrs;
		if (parentAttrs) {
			var keys = filterKeys(parentAttrs, filter);
			for (var i=0,l=keys.length; i<l; i++) {
				var key = keys[i];
				vm.$set(key, parentAttrs[key]);
			}
		}
	}
}

function ViewModel(app, attrs) {
	if (!app) { app = new App(app); }
	var prop = {};
	// the attributes set on vm tag which are not declared as props
	prop.value = {};
	Object.defineProperty(this, '$attrs', prop);
	// the app context if any
	prop.value = app;
	Object.defineProperty(this, '$app', prop);
	// the listeners registered on the vm tag
	prop.value = null;
	prop.writable = true;
	// the associated rendering context
	Object.defineProperty(this, '$r', prop);
	// the slots injected by the caller
	Object.defineProperty(this, '$slots', prop);
	// the view root element
	Object.defineProperty(this, '$el', prop);
	// chained cleanup functions if any was registered
	Object.defineProperty(this, '$clean', prop);
	// States: 0 - initial, 1 - connected, 2 - updating
	prop.value = 0;
	Object.defineProperty(this, '$st', prop); // state: 0 - default, bit 1 - connected, bit 2 - update queued

	var data = this.init(app) || {};
	prop.value = data;
	Object.defineProperty(this, '$data', prop);
	if (data) {
		for (var key in data) {
			var val = data[key];
			Object.defineProperty(this, key, createProp$1(this, key, val));
		}
	}

	if (!this.render) { ERR("No render function defined for the ViewModel!"); }

	// initialize data model from attributes if any - this will not trigger an update
	if (attrs) {
		var $data = this.$data;
		var $attrs = this.$attrs;
		Object.keys(attrs).forEach(function(key) {
			var value = attrs[key];
			if (key in $data) { // a declared property
				$data[key] = value;
			} else {
				var camelKey = kebabToCamel(key);
				if (camelKey !== key && camelKey in $data) {
					$data[camelKey] = value;
				} else if ($attrs[key] !== value) {
					// attributes are not camelized
					$attrs[key] = value;
				}
			}
		});
	}
}

ViewModel.prototype = {
	__VM__: true,
	toString: function() {
		return 'ViewModel <'+this.$tag+'/>';
	},
	// set an attribute value (can be either a free property (i.e $attrs[key]) or managed property (i.e. $data[key]))
	$set: function(key, value) {
		if (key in this.$data) { // a declared property
			this[key] = value;
		} else {
			var camelKey = kebabToCamel(key);
			if (camelKey !== key && camelKey in this.$data) {
				this[camelKey] = value;
			} else if (this.$attrs[key] !== value) {
				// attributes are not camelized
				this.$attrs[key] = value;
				this.update();
			}
		}
	},
	getList: function(listName, keyField) {
		if (!(listName in this)) { ERR("No reactive list property found: "+listName); }
		return new List(this, listName, keyField);
	},
	// subscribe to the given channel name - for use on root VMs
	listen: function(channelName) {
		if (!this.$channel) { ERR("q:channel used on a VM not defining channels: %s", this.$tag); }
		// add an init function
		this.$init = chainFnAfter(function(thisObj) {
			thisObj.subscribe(channelName, thisObj.$channel);
		}, this.$init);
		return this;
	},
	//TODO use setup in listen and $on
	setup: function(setupFn) {
		this.$init = chainFnAfter(setupFn, this.$init);
		return this;
	},
	cleanup: function(fn) { // register a cleanup function when component is disconnected
		this.$clean = chainFnAfter(fn, this.$clean);
		return this;
	},
	$parent: function() {
		if (!this.$r) { return null; }
		return this.$r.closestVM();
	},
	$root: function() {
		var parent = this.$parent();
		return parent ? parent.$root() : this;
	},
	connect: function() {
		this.$r && this.$r.connect();
	},
	disconnect: function() {
		this.$r && this.$r.disconnect();
	},
	refresh: function() {
		this.$r && this.$r.refresh();
	},
	willConnect: function() {
		// TODO the connected flag is no mor euseful since we can use $r.isc
		if (this.$st & 1) { return; } // ignore
		this.$st |= 1; // set connected flag
		// $init may be defined by the prototype to do automatic setup when connected
		// (e.g. automatic installed listeners defined though VM definitioan 'on' property)
		if (this.$init) {
			this.$init(this);
		}

		// call the connected callback
		//this.connected && this.connected();
		return this;
	},
	willDisconnect: function() {
		if (!(this.$st & 1)) { return; } // ignore
		this.$st ^= 1; // clear connected flag
		if (this.$clean) {
			this.$clean();
			this.$clean = null;
		}
	},
	// initialize a vm from tag raw data
	$load: function(rendering, xattrs, slots) {
		var bindings = null;
		var model = rendering.model;
		this.$slots = slots;
		if (xattrs) {
			for (var key in xattrs) {
				var val = xattrs[key];
				if (key.charCodeAt(0) === 36) { // $ - extended attribute
					if (key === '$attrs') { // we must not delete keys from xattrs since it can break when vm is loaded by a dynamic component
						//TODO DO WE NEED to add an update fn? q:attrs are static
						rendering.up(SetVMAttrs(this, model, val))();
					} else if (key === '$class') {
						if (!bindings) { bindings = []; }
						bindings.push(SetClass, val);
					} else if (key === '$style') {
						if (!bindings) { bindings = []; }
						bindings.push(SetStyle, val);
					} else if (key === '$show') {
						if (!bindings) { bindings = []; }
						bindings.push(SetDisplay, val);
					} else if (key === '$toggle') {
						if (!bindings) { bindings = []; }
						bindings.push(SetToggle, val);
					} else if (key === '$channel') {
						this.listen(val);
					}
				} else if (typeof val === 'function') { // a dynamic binding
					rendering.up(SetProp(this, model, key, val))();
				} else { // static binding
					this.$set(key, val);
				}
			}
		}
		return bindings;
	},
	$create: function(parentRendering, xattrs, slots) {
		var $use,
			model = parentRendering && parentRendering.model,
			listeners = xattrs && xattrs.$on;
		if (xattrs && xattrs.$use) {
			$use = applyUserDirectives(parentRendering, this.$tag, xattrs, this);
		}
		// load definition
		var bindings = parentRendering && this.$load(parentRendering, xattrs, slots);
		var rendering = new Rendering(parentRendering, this);
		rendering.vm = this;
		this.$r = rendering;
		// must never return null - for non rendering components like popups we return a comment
		var el = this.render(rendering) || window.document.createComment('<'+this.$tag+'/>');
		el.__qute__ = this;
		this.$el = el;
		if (bindings) { for (var i=0,l=bindings.length; i<l; i+=2) {
			var binding = bindings[i];
			var up = bindings[i](el, model, bindings[i+1]);
			parentRendering.up(up)();
		} }

		if (listeners) {
			applyListeners(el, model, listeners);
		}

		this.created && this.created(el);
		// should use parent vm as context for custom directives
		if ($use) { $use(parentRendering, el); }

		// this can trigger a connect if tree is already connected (for example when inserting a comp in a connected list)
		parentRendering && parentRendering.$push(rendering);

		return el;
	},

	// manual mount (only roots must be moutned this way)
	mount: function(elOrId, insertBefore) {
		if (this.$r) { ERR("VM is already mounted"); }
		var target;
		if (elOrId) {
			target = typeof elOrId === 'string' ? window.document.getElementById(elOrId) : elOrId;
		} else {
			target = window.document.body;
		}
		var el = this.$create();
		if (insertBefore) {
			target.parentNode.insertBefore(el, target);
		} else {
			target.appendChild(el);
		}
		this.connect();
		// announce the tree was attached to the DOM
		return this;
	},
	// only manually mounted vms can be unmounted
	unmount: function() {
		// a child vm?
		if (!this.r) { ERR("VM is not mounted"); }
		this.disconnect();
		this.$el.parentNode.removeChild(this.$el);
		this.$el = null;
	},
	$update: function() {
		if (this.$r) { // TODO only if connected
			this.$r.update();
		}
	},
	update: function() {
		if (this.$st === 1) { // only if connected and not already scheduled to update
			this.$st |= 2; // set updating flag
			var self = this;
			UpdateQueue.push(function() {
				self.$update();
				self.$st ^= 2; // remove updating flag
			});
		}
	},
	$on: function(type/*, selector, cb*/) {
		if (!this.$el) { ERR("View not connected"); }
		//if (!this.$clean) this.$clean = [];
		var selector, cb;
		if (arguments.length === 3) {
			selector = arguments[1];
			cb = arguments[2];
			if (!cb) {
				cb = selector;
				selector = null;
				if (!cb) { throw new Error('on function requires a callback argument'); }
			}
		} else if (arguments.length === 2) {
			cb = arguments[1];
		} else {
			throw new Error('on function takes 2 or 3 arguments: eventType[, seelctor], callback');
		}
		var self = this;
		var wrapper = function(e) {
			if (!selector || e.target.matches(selector)) {
				if (cb.call(self, e) === false) {
					stopEvent(e);
				}
			}
		};
		this.$el.addEventListener(type, wrapper);
		this.cleanup(function() {
			self.$el.removeEventListener(type, wrapper);
		});
		//this.$clean.push(type, wrapper);
	},
	emit: Emitter.emit,
	emitAsync: Emitter.emitAsync,
	// -------- app event bus -------------
	post: function(topic, msg, data) {
		this.$app.post(topic, msg, data);
	},
	postAsync: function(topic, msg, data) {
		this.$app.postAsync(topic, msg, data);
	},
	// subscribe and register cleanup to remove subscription at disconnect
	subscribe: function(name, listenerFn) {
		var app = this.$app;
		app.subscribe(name, listenerFn.bind(this));
		this.cleanup(function() {
			app.unsubscribe(name, listenerFn);
		});
		return this;
	},
	subscribeOnce: function(topic, event, listenerFn) {
		var app = this.$app;
		var onceSubscription = app.subscribeOnce(topic, event, listenerFn.bind(this));
		this.cleanup(function() {
			app.unsubscribe(topic, onceSubscription);
		});
		return this;
	},
	toHTML: function() {
		return this.$el && this.$el.outerHTML;
	},
	// ---------------------------------------------
	init: function() {} // do nothing
};

/**
 * We cannot use Object.assign since getter are lost. So we copy the prop def itself
 */
function assignPropDefs(dst, src) {
	var keys = Object.keys(src);
    for(var i=0,l=keys.length; i<l; i++) {
      var key = keys[i];
      Object.defineProperty(dst, key, Object.getOwnPropertyDescriptor(src, key));
    }
    return dst;
}

function Qute(tag, def, BaseVm) {
	if (!tag) { ERR("Usage: Qute(tag[, VM_Definition, Base_VM])"); }

	function ViewModelImpl(app, attrs) {
		ViewModel.call(this, app, attrs);
	}

	var VMType, VMProto;
	if (typeof def === 'function') {
		if (def.prototype instanceof ViewModel)	{
			// VM is defined as a class
			VMType = def;
			VMProto = VMType.prototype;
		} else {
			// a rendering function - we simply register the rendering fucntion for the given tag
			return registerTag(tag, def);
		}
	} else { // VM definition object
		if (!BaseVm) { BaseVm = ViewModel; }
		VMProto = Object.create(BaseVm.prototype, {
			constructor: {value:ViewModelImpl},
		});
		if (def) { assignPropDefs(VMProto, def); } // this is preserving getters
		VMProto.$super = BaseVm.prototype; // to be able to override methods and call the super method if needed
		ViewModelImpl.prototype = VMProto;

		VMType = ViewModelImpl;
	}

	// add the rendering method of the tag if no one was provided
	if (!VMProto.render) {
		VMProto.render = Qute.template(tag);
		if (!VMProto.render) {
			ERR("No template found for tag '%s'", tag);
		}
	}
	// add the tag meta property
	VMProto.$tag = tag;
	VMProto.$qname = registerVM(tag, VMType);

	VMType.watch = function(prop, fn) {
		if (!VMProto.$watch) { Object.defineProperty(VMProto, '$watch', {value:{}}); }
		VMProto.$watch[prop] = fn;
		return VMType;
	};
	VMType.on = function(key, selector, cb) {
		VMProto.$init = chainFnAfter(function(thisObj) {
			thisObj.$on(key, selector, cb);
		}, VMProto.$init);
		return VMType;
	};
	VMType.channel = function(listenFn) {
		VMProto.$channel = listenFn;
		return this;
	};

	return VMType;
}

// A place where plugins may expose custom API
// A plugin named @qutejs/plugin-name should use `pluginName` as the key (in camel case format)
Qute.$ = {};

Qute.ViewModel = ViewModel;
Qute.isVM = function(obj) {
	return obj instanceof ViewModel;
};

// link a viewmodel to a template. Usefull for classes where defining prototype methods is not part of the class syntax
Qute.link = function(VMType, renderFn) {
	VMType.prototype.render = renderFn;
};


var QUTE_STYLE=null;
Qute.css = function(css) {
	var doc = window__default.document;
	if (!QUTE_STYLE) {
		var style = doc.getElementById('--qute-inline-styles');
		if (!style) {
			style = doc.createElement('STYLE');
			style.id = '--qute-inline-styles';
			style.type = 'text/css';
			style.textContent = "\n";
			doc.head.insertBefore(style, doc.head.firstChild);
		}
		QUTE_STYLE = style;
	}
	QUTE_STYLE.textContent += css;
};

Qute.converters = converters;
Qute.App = App;
Qute.UpdateQueue = UpdateQueue;
Qute.Rendering = Rendering;
// render a functional template given its tag name and a model
Qute.render = function(xtagName, model) {
	return getTag(xtagName)(new Rendering(null, model));
};
Qute.defineMethod = function(name, fn) {
	//define method on both ViewModel and Functional components prototype
	ViewModel.prototype[name] = fn;
    Rendering.FunComp.prototype[name] = fn;
};

Qute.register = registerTag;
Qute.template = getTag;
Qute.snapshotRegistry = snapshotRegistry;
Qute.restoreRegistry = restoreRegistry;
Qute.vm = getVM;
Qute.vmOrTemplate = getVMOrTag;
Qute.registerDirective = registerDirective;

Qute.runAfter = function(cb) { UpdateQueue.runAfter(cb); };
Qute.closest = closestVM;
Qute.closestListItem = closestListItem;
Qute.ERR = ERR;

// prop types
Qute.string = function(value) { return new StringProp(value) };
Qute.number = function(value) { return new NumberProp(value) };
Qute.boolean = function(value) { return new BooleanProp(value) };

var css = ".spinner {\n  margin: 0 auto;\n  text-align: center;\n}\n\n.spinner > div {\n  width: 18px;\n  height: 18px;\n  background-color: #333;\n\n  border-radius: 100%;\n  display: inline-block;\n  -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;\n  animation: sk-bouncedelay 1.4s infinite ease-in-out both;\n}\n\n.spinner .bounce1 {\n  -webkit-animation-delay: -0.32s;\n  animation-delay: -0.32s;\n}\n\n.spinner .bounce2 {\n  -webkit-animation-delay: -0.16s;\n  animation-delay: -0.16s;\n}\n\n@-webkit-keyframes sk-bouncedelay {\n  0%, 80%, 100% { -webkit-transform: scale(0) }\n  40% { -webkit-transform: scale(1.0) }\n}\n\n@keyframes sk-bouncedelay {\n  0%, 80%, 100% {\n    -webkit-transform: scale(0);\n    transform: scale(0);\n  } 40% {\n    -webkit-transform: scale(1.0);\n    transform: scale(1.0);\n  }\n}";

Qute.css(css);

/*
<x-tag name='loader-ellipsis' static>
<div class="spinner">
  <div class="bounce1"></div>
  <div class="bounce2"></div>
  <div class="bounce3"></div>
</div>
</x-tag>
*/

function updateStyle(div, color, size) {
	var style = div.style;
	if (color) { style.backgroundColor = color; }
	if (size) {
		style.width = size;
		style.height = size;
	}
}

var Spinner = Qute('spinner', function(r, xattrs) {
	var el = window.document.createElement('DIV');

	var color, size, classes = 'spinner';
	if (xattrs) {
		color = xattrs.color;
		size = xattrs.size;
		if (xattrs.style) {
			el.setAttribute('style', xattrs.style);
		}
		if (xattrs.inline) {
			el.style.display = 'inline-block';
		}
		if (xattrs.class) {
			classes = xattrs.class+' '+classes;
		}
		if (xattrs.$show) {
			r.up(Qute.Rendering.SetDisplay(el, r.model, xattrs.$show))();
		}
	}
	el.setAttribute('class', classes);

	var div = window.document.createElement('DIV');
	updateStyle(div, color, size);
	div.className = 'bounce1';
	el.appendChild(div);

	div = window.document.createElement('DIV');
	updateStyle(div, color, size);
	div.className = 'bounce2';
	el.appendChild(div);

	div = window.document.createElement('DIV');
    updateStyle(div, color, size);
	div.className = 'bounce3';
	el.appendChild(div);

	return el;
});

Qute.Spinner = Spinner;

/*
* Extracted from Backbone.js History 1.1.0
*/

//helper functions
var objectAssign = Object.assign ? Object.assign : function extend(obj, source) {
  for (var prop in source) {
    obj[prop] = source[prop];
  }
  return obj;
};
function on(obj, type, fn) {
  if (obj.attachEvent) {
    obj['e'+type+fn] = fn;
    obj[type+fn] = function(){ obj['e'+type+fn]( window__default.event ); };
    obj.attachEvent( 'on'+type, obj[type+fn] );
  } else {
    obj.addEventListener( type, fn, false );
  }
}
function off(obj, type, fn) {
  if (obj.detachEvent) {
    obj.detachEvent('on'+type, obj[type+fn]);
    obj[type+fn] = null;
  } else {
    obj.removeEventListener(type, fn, false);
  }
}

// handlers were removed - we simply use listeners without regex matching
//
// Backbone.History
// ----------------

// Handles cross-browser history management, based on either
// [pushState](http://diveintohtml5.info/history.html) and real URLs, or
// [onhashchange](https://developer.mozilla.org/en-US/docs/DOM/window.onhashchange)
// and URL fragments.
var History = function() {
  this.listeners = [];

  var self = this;
  var checkUrl = this.checkUrl;
  this.checkUrl = function () {
    checkUrl.apply(self, arguments);
  };

  // Ensure that `History` can be used outside of the browser.
  if (typeof window__default !== 'undefined') {
    this.location = window__default.location;
    this.history = window__default.history;
  }
};

// Cached regex for stripping a leading hash/slash and trailing space.
var routeStripper = /^[#\/]|\s+$/g;

// Cached regex for stripping leading and trailing slashes.
var rootStripper = /^\/+|\/+$/g;

// Cached regex for removing a trailing slash.
var trailingSlash = /\/$/;

// Cached regex for stripping urls of hash.
var pathStripper = /#.*$/;

// MODIFICATION OF ORIGINAL BACKBONE.HISTORY
// Has the history handling already been started?
// History.started = false;

// Set up all inheritable **Backbone.History** properties and methods.
objectAssign(History.prototype, {

  // Are we at the app root?
  atRoot: function() {
    return this.location.pathname.replace(/[^\/]$/, '$&/') === this.root;
  },

  // Gets the true hash value. Cannot use location.hash directly due to bug
  // in Firefox where location.hash will always be decoded.
  getHash: function(window) {
    var match = (window || this).location.href.match(/#(.*)$/);
    return match ? match[1] : '';
  },

  // Get the cross-browser normalized URL fragment, either from the URL,
  // the hash, or the override.
  getFragment: function(fragment, forcePushState) {
    if (fragment == null) {
      if (this._hasPushState || !this._wantsHashChange || forcePushState) {
        fragment = decodeURI(this.location.pathname + this.location.search);
        var root = this.root.replace(trailingSlash, '');
        if (!fragment.indexOf(root)) { fragment = fragment.slice(root.length); }
      } else {
        fragment = this.getHash();
      }
    }
    return fragment.replace(routeStripper, '');
  },

  // Start the hash change handling, returning `true` if the current URL matches
  // an existing route, and `false` otherwise.
  start: function(options) {
    // MODIFICATION OF ORIGINAL BACKBONE.HISTORY
    // if (History.started) throw new Error("LocationBar has already been started");
    // History.started = true;
    this.started = true;

    // Figure out the initial configuration.
    // Is pushState desired ... is it available?
    this.options          = objectAssign({root: '/'}, options);
    this.location         = this.options.location || this.location;
    this.history          = this.options.history || this.history;
    this.root             = this.options.root;
    this._wantsHashChange = this.options.hashChange !== false;
    this._wantsPushState  = !!this.options.pushState;
    this._hasPushState    = !!(this.options.pushState && this.history && this.history.pushState);
    var fragment          = this.getFragment();

    // Normalize root to always include a leading and trailing slash.
    this.root = ('/' + this.root + '/').replace(rootStripper, '/');

    // Depending on whether we're using pushState or hashes, and whether
    // 'onhashchange' is supported, determine how we check the URL state.
    if (this._hasPushState) {
      on(window__default, 'popstate', this.checkUrl);
    } else {
      on(window__default, 'hashchange', this.checkUrl);
    }

    // Determine if we need to change the base url, for a pushState link
    // opened by a non-pushState browser.
    this.fragment = fragment;
    var loc = this.location;

    // Transition from hashChange to pushState or vice versa if both are
    // requested.
    if (this._wantsHashChange && this._wantsPushState) {

      // If we've started off with a route from a `pushState`-enabled
      // browser, but we're currently in a browser that doesn't support it...
      if (!this._hasPushState && !this.atRoot()) {
        this.fragment = this.getFragment(null, true);
        this.location.replace(this.root + '#' + this.fragment);
        // Return immediately as browser will do redirect to new url
        return true;

      // Or if we've started out with a hash-based route, but we're currently
      // in a browser where it could be `pushState`-based instead...
      } else if (this._hasPushState && this.atRoot() && loc.hash) {
        this.fragment = this.getHash().replace(routeStripper, '');
        this.history.replaceState({}, window.document.title, this.root + this.fragment);
      }

    }

    if (!this.options.silent) { return this.loadUrl(); }
  },

  // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
  // but possibly useful for unit testing Routers.
  stop: function() {
    off(window__default, 'popstate', this.checkUrl);
    off(window__default, 'hashchange', this.checkUrl);
    this.started = false;
  },


  // Checks the current URL to see if it has changed, and if it has,
  // calls `loadUrl`.
  checkUrl: function() {
    var current = this.getFragment();
    if (current === this.fragment) { return false; }
    this.loadUrl();
  },

  // Attempt to load the current URL fragment. If a route succeeds with a
  // match, returns `true`. If no defined routes matches the fragment,
  // returns `false`.
  loadUrl: function(fragment) {
    fragment = this.fragment = this.getFragment(fragment);
    var listeners = this.listeners;
    for (var i=0,l=listeners.length; i<l; i++) {
      listeners[i](fragment);
    }
  },

  // Save a fragment into the hash history, or replace the URL state if the
  // 'replace' option is passed. You are responsible for properly URL-encoding
  // the fragment in advance.
  //
  // The options object can contain `trigger: true` if you wish to have the
  // route callback be fired (not usually desirable), or `replace: true`, if
  // you wish to modify the current URL without adding an entry to the history.
  navigate: function(fragment, options) {
    if (!this.started) { return false; }
    if (!options || options === true) { options = {trigger: !!options}; }

    var url = this.root + (fragment = this.getFragment(fragment || ''));

    // Strip the hash for matching.
    fragment = fragment.replace(pathStripper, '');

    if (this.fragment === fragment) { return; }
    this.fragment = fragment;

    // Don't include a trailing slash on the root.
    if (fragment === '' && url !== '/') { url = url.slice(0, -1); }

    // If pushState is available, we use it to set the fragment as a real URL.
    if (this._hasPushState) {
      this.history[options.replace ? 'replaceState' : 'pushState']({}, window.document.title, url);

    // If hash changes haven't been explicitly disabled, update the hash
    // fragment to store history.
    } else if (this._wantsHashChange) {
      this._updateHash(this.location, fragment, options.replace);
    // If you've told us that you explicitly don't want fallback hashchange-
    // based history, then `navigate` becomes a page refresh.
    } else {
      return this.location.assign(url);
    }
    if (options.trigger) { return this.loadUrl(fragment); }
  },

  // Update the hash location, either replacing the current entry, or adding
  // a new one to the browser history.
  _updateHash: function(location, fragment, replace) {
    if (replace) {
      var href = location.href.replace(/(javascript:|#).*$/, '');
      location.replace(href + '#' + fragment);
    } else {
      // Some browsers require that `hash` contains a leading #.
      location.hash = '#' + fragment;
    }
  }

});



// add some features to History

// a more intuitive alias for navigate
History.prototype.update = function () {
  this.navigate.apply(this, arguments);
};

// a generic callback for any changes
History.prototype.onChange = function (callback) {
  this.listeners.push(callback);
};

// checks if the browser has pushstate support
History.prototype.hasPushState = function () {
  // MODIFICATION OF ORIGINAL BACKBONE.HISTORY
  if (!this.started) {
    throw new Error("only available after LocationBar.start()");
  }
  return this._hasPushState;
};

var VARS_RX = /\$\{([a-zA-Z_$][a-zA-Z_0-9$]*)\}/g;

function expandVars$1(text, vars) {
	return text.replace(VARS_RX, function(m, p1) {
		var val = vars[p1];
		return val === undefined ? m : String(val);
	})
}

function absPath(path) {
	return path.charCodeAt(0) !== 47 ? '/'+path : path;
}

var VARS_RX$1 = /<([^>:]*)(?:\:([^>]*))?>/;

function RxMatcher(rx, vars) {
	return function(segment, params) {
		var m = rx.exec(segment);
		if (m) {
			for (var i=1, l=m.length; i<l; i++) {
				var v = vars[i-1];
				if (v) {
					var param = m[i];
					if (param) {
						if (v.mod) { // remove leading / if any
							if (param.charCodeAt(0) === 47) {
								param = param.substring(1);
							}
						}
						params[v.name] = param;
					}
				}
			}
			return true;
		}
		return false;
	}
}

function TextMatcher(text) {
	return function(segment, params) {
		return segment === text;
	}
}

function ANY() { return true; }
ANY.$vars = 100000; // should be the last when sorting

function PathBinding(pattern, value) {

	function isModifier(path, index) {
		if (path.length === index+1 || path.charCodeAt(index+1) === 47) { // next is / or end of path
			switch (path.charCodeAt(index)) {
				case 63: return 1; // ?
				case 42: return 2; // *
				case 43: return 3; // +
			}
		}
		return 0;
	}

	function compilePath(path) {
		if (path === '/*') { return ANY; }
		var i = path.indexOf('<');
		if (i === -1) { return TextMatcher(path); }

		var m = VARS_RX$1.exec(path);

		if (!m) { return TextMatcher(path); }

		var out = '', vars = [];
		while (m) {
			var prefix = m.index > 0 ? path.substring(0, m.index).replace(/\.\(\)\$\^\[\]\?\*\+/g, '\\$1') : null;
			var nextIndex = m.index+m[0].length, rx = m[2] || '[^/]+';
			var nextCh = path.charCodeAt(nextIndex);
			var mod = isModifier(path, nextIndex);
			// if next chars are +/, */, ?/ or +, *, ?
			if (mod) { // ?+* modifier is present
				if (prefix && prefix.charCodeAt(prefix.length-1) === 47) {
					// remove trailing / since it will be included in the rx
					prefix = prefix.substring(0, prefix.length-1);
				} else {
					throw new Error('Modifier +, * and ? can be used only on named path segments: '+path);
				}
				// remove modifier char from path
				nextIndex++;
				if (mod === 1) {
					rx = '((?:/'+rx+')?)';
				} else if (mod === 2) {
					rx = '((?:/'+rx+')*)';
				} else if (mod === 3) {
					rx = '((?:/'+rx+')+)';
				}
			} else {
				rx = '('+rx+')';
			}
			vars.push({name: m[1].trim(), mod: mod});
			out += prefix ? prefix+rx : rx;
			path = path.substring(nextIndex);
			m = VARS_RX$1.exec(path);
		}
		if (path.length) {
			out += path.replace(/\.\(\)\$\^\[\]\?\*\+/g, '\\$1');
		}
		var matcher = RxMatcher(new RegExp(out), vars);
		matcher.$vars = vars.length;
		return matcher;
	}

	this.pattern = absPath(pattern);
	this.match = compilePath(this.pattern);
	this.vars = this.match.$vars || 0; // how many vars in pattern
	this.value = value;
}

function PathMapping(bindings) {
	this.bindings = [];
	bindings && this.map(bindings);
}

PathMapping.prototype = {
	add: function(path, value) {
		this.bindings.push(new PathBinding(path, value));
	},
	map: function(bindings) {
		if (bindings) {
			var self = this;
			Object.keys(bindings).forEach(function(key) {
				self.add(key, bindings[key]);
			});
			// sort bindings
			this.sort();
		}
	},
	sort: function() {
		this.bindings.sort(function(a, b) {
			var r = a.vars - b.vars;
			return r ? r : b.pattern.localeCompare(a.pattern);
		});
	},
	get: function(path) {
		path = absPath(path);
		var params = {};
		var bindings = this.bindings;
		for (var i=0,l=bindings.length; i<l; i++) {
			var binding = bindings[i];
			if (binding.match(path, params)) {
				return [binding.value, params];
			}
		}
		return null;
	}
};

function detectCycles(redirects, from) {
	var visited = {};
	visited[from] = true;
	var to = redirects[from];
	while (to) {
		if (visited[to]) { throw new Error('Found a redirection cycle: ['+from+"] -> ["+to+"]"); }
		visited[to] = true;
		to = redirects[to];
	}
}

function Router(bindings) {

	this.navigo = new History();
	this.routes = new PathMapping();
	this.redirects = {};

	bindings && this.map(bindings);
}

Router.prototype = {
	handlerFromString: function(to) {
		return null;
	},
	createRedirect: function(path, to) {
		to = absPath(to);
		this.redirects[path] = to;
		detectCycles(this.redirects);
		var self = this;
		return function(path, params) {
			self.navigate(expandVars$1(to, params), true); // replace the existing entry
		}
	},
	map: function(bindings) {
		if (bindings) {
			var self = this;
			Object.keys(bindings).forEach(function(key) {
				self.add(key, bindings[key]);
			});
		}
		return this;
	},
	add: function(path, to) {
		path = absPath(path);
		var handler = null;
		if (typeof to === 'string') {
			handler = this.handlerFromString(path, to);
			if (!handler) { // a redirect?
				handler = this.createRedirect(path, to);
			}
		}
		if (!handler) {
			handler = to;
		}
		this.routes.add(path, handler);
		return this;
	},
	start: function(settings) {
		if (!this.routes.bindings.length) { throw new Error('No routes set!'); }
		this.routes.sort();

		var self = this;
		this.navigo.onChange(function(path) {
			var r = self.routes.get(path);
			if (r) {
				r[0](path, r[1]);
			} else {
				throw new Error('No route found for "'+path+'"');
			}
		});
		var loadCb = function() {
			self.navigo.start(settings);
			window__default.removeEventListener('load', loadCb);
		};
		window__default.addEventListener('load', loadCb);
		return this;
	},
	stop: function() {
		this.navigo.stop();
	},
	navigate: function(path, replace) {
		path = absPath(path);
		if (!this.navigo.hasPushState()) {
			path = '#'+path;
		}
		this.navigo.navigate(path, replace ? {replace:true} : undefined);
	},
	route: function(path, replace) { // an alias to navigate
		this.navigate(path, replace);
	},
	onChange: function(callback) {
		this.navigo.onChange(function(path) {
			callback(absPath(path));
		});
	},
	path: function() {
		return absPath(this.navigo.getFragment());
	}
};

function QuteRouter(quteApp, bindings) {
	Router.call(this, bindings);
	if (quteApp.$app) { quteApp = quteApp.$app; } // accept Qute components too.
	this.app = quteApp;
	quteApp.router = this;
	quteApp.subscribe('route', function(msg, data) {
		// data can be 'true' to replace the current entry in history
		quteApp.router.navigate(msg, data);
	});

}

var QuteRouterProto = Object.create(Router.prototype);
QuteRouterProto.handlerFromString = function(path, to) {
	var i = path.indexOf(':');
	if (i < 0) { return null; }
	var key = path.substring(0, i);
	if (key === 'model') {
		var target = to.substring(i+1).trim();
		var i = target.indexOf('=');
		if (i === -1) { throw new Error('Invalid message post target. Expecting "model:propKey=value" but got '+to); }
		var propKey = target.substring(0, i).trim();
		var value = target.substring(0, i+1).trim();
		return function(path, params) {
			app.prop(expandVars(propKey, params)).set(JSON.parse(expandVars(value, params)));
		}
	} else if (key === 'post') {
		var target = to.substring(i+1).trim();
		var i = target.indexOf('/');
		if (i === -1) { throw new Error('Invalid message post target. Expecting "post:channel/message-name" but got '+to); }
		var msg = target.substring(i+1);
		var channel = target.substring(0,  i);
		var app = this.app;
		return function(path, params) {
			app.postAsync(expandVars(channel, params), expandVars(msg, params), params);
		}
	}
	return null;
};

QuteRouter.prototype = QuteRouterProto;

Qute.Router = QuteRouter;

Qute.register("toc-item", function($){return $.h("li",{"class":"toc-item","id":function(_){return ("toc_item:/"+_.$attrs.href)}},[$.t(" "),$.h("a",{"href":function(_){return (_.$attrs.href)},"$html":function(_){return (_.$attrs.title)}},null),$.t(" ")]);}, true);



Qute.register("toc-section", function($){return $.h("li",{"class":"toc-section"},[$.t(" "),$.h("a",{"href":"#","$html":function(_){return (_.$attrs.title)}},null),$.t(" "),$.h("div",{"class":"toc-items","$class":function(_){return ({expanded: _.$attrs.expand})}},[$.t(" "),$.h("ul",null,[$.t(" "),$.a(function(_){return (_.$attrs.items)},function(item,$2,$3){return [$.t(" "),$.i([function(_){return (item.items)},null],[function($){return [$.t(" "),$.r("toc-section",{"title":function(_){return (item.title)},"items":function(_){return (item.items)},"expand":function(_){return (item.expand)}},null),$.t(" ")]},function($){return [$.t(" "),$.r("toc-item",{"href":function(_){return (item.href)},"title":function(_){return (item.title)}},null),$.t(" ")]}],null),$.t(" ")]}),$.t(" ")]),$.t(" ")]),$.t(" ")]);}, true);














Qute.register("toc", function($){return $.h("ul",{"class":"toc"},[$.t(" "),$.a(function(_){return (_.$attrs.items)},function(item,$2,$3){return [$.t(" "),$.i([function(_){return (item.items)},null],[function($){return [$.t(" "),$.r("toc-section",{"title":function(_){return (item.title)},"items":function(_){return (item.items)},"expand":function(_){return (item.expand)}},null),$.t(" ")]},function($){return [$.t(" "),$.r("toc-item",{"href":function(_){return (item.href)},"title":function(_){return (item.title)}},null),$.t(" ")]}],null),$.t(" ")]}),$.t(" ")]);}, true);









Qute.register("app", function($){return $.h("div",{"class":"app"},[$.t(" "),$.h("div",{"class":"topbar clearfix"},[$.t(" "),$.h("div",{"class":"pull-left"},[$.t(" "),$.h("a",{"href":"#","id":"sidebar-toggle","$on":{"click":function($1){return this.toggleSidebar($1)}}},[$.h("i",{"class":"fas fa-bars"},null)]),$.t(" ")]),$.t(" "),$.h("div",{"class":"logo","id":"logo"},[$.t(" "),$.h("a",{"href":"./index.html"},[$.t("\n\t\t    \n\t\t    Qute.js\n\t\t\t")]),$.t(" ")]),$.t(" "),$.h("div",{"class":"pull-right","id":"topnav"},[$.t(" "),$.h("a",{"href":"../playground/index.html","target":"_blank"},[$.t("playground")]),$.t("\n\t\t\t/\n\t\t\t"),$.h("a",{"href":"https://github.com/bstefanescu/qutejs","target":"_blank"},[$.t("github")]),$.t("\n\t\t\t/\n\t\t\t"),$.h("a",{"href":"../download","target":"_blank","rel":"nofollow"},[$.t("download")]),$.t(" ")]),$.t(" ")]),$.t(" "),$.h("div",{"id":"sidebar"},[$.t(" "),$.h("div",{"class":"sidebar-nav"},[$.t(" "),$.r("toc",{"$channel":"toc","items":function(_){return (_.toc)},"$on":{"select":function($1){return this.openTocItem($1)}}},null),$.t(" ")]),$.t(" ")]),$.t(" "),$.h("div",{"id":"main"},[$.t(" "),$.h("div",{"class":"main"},[$.t(" "),$.i([function(_){return (_.docPageContent)},null],[function($){return [$.t(" "),$.h("div",{"class":"markdown-body","$html":function(_){return (_.docPageContent)}},null),$.t(" ")]},function($){return [$.t(" "),$.r("spinner",null,null),$.t(" ")]}],null),$.t(" ")]),$.t(" ")]),$.t(" ")]);}, true);






































var iOS = !!window.navigator.platform && /iPad|iPhone|iPod/.test(window.navigator.platform);

function lockBodyScroll() {
	window.document.body.style.overflow = 'hidden';
	if (iOS) { window.document.body.style.position = 'fixed'; }
}

function unlockBodyScroll() {
	window.document.body.style.overflow = '';
	if (iOS) { window.document.body.style.position = ''; }
}

function fetchPage(url, cb) {
  	var xhttp = new XMLHttpRequest();
  	xhttp.onreadystatechange = function() {
    	if (this.readyState == 4) {
    		cb(this.responseText, this.status);
    	}
  	};
  	xhttp.open("GET", url, true);
  	xhttp.send();
}

Qute.converters.markdown = marked;

var TOC = [
	{ title: 'Overview', expand: true, items: [
		{ title: 'Introduction', href: 'introduction'},
		{ title: 'Getting Started', href: 'getting-started'},
		{ title: 'Templates', href: 'templates'},
		{ title: 'Components', href: 'components'} ]},
	{ title: 'Application Model', expand: true, items: [
		{ title: 'Application Instance', href: 'app/instance'},
		{ title: 'Message Bus', href: 'app/bus'},
		{ title: 'Data Model', href: 'app/data'},
		{ title: 'Internationalization', href: 'app/i18n'},
		{ title: 'Example', href: 'app/example'} ]},
	{ title: 'Component Model', expand: true, items: [
		{ title: 'Properties', href: 'model/properties'},
		{ title: 'Watchers', href: 'model/watchers'},
		{ title: 'Events', href: 'model/events'},
		{ title: 'Life Cycle', href: 'model/lifecycle'},
		{ title: 'Class Syntax', href: 'model/class'} ]},
	{ title: 'Directives', expand: true, items: [
		{ title: 'if', href: 'directives/if' },
		{ title: 'for', href: 'directives/for' },
		{ title: 'slot', href: 'directives/slot' },
		{ title: 'nested', href: 'directives/nested' },
		{ title: 'tag', href: 'directives/tag' },
		{ title: 'view', href: 'directives/view' },

		{ title: 'q:class', href: 'attributes/q-class' },
		{ title: 'q:style', href: 'attributes/q-style' },
		{ title: 'q:show', href: 'attributes/q-show' },
		{ title: 'q:for', href: 'attributes/q-for' },
		{ title: 'q:html', href: 'attributes/q-html' },
		{ title: 'q:markdown', href: 'attributes/q-markdown' },
		{ title: 'q:attrs', href: 'attributes/q-attrs' },
		{ title: 'q:emit', href: 'attributes/q-emit' },
		{ title: 'q:async-emit', href: 'attributes/q-async-emit' },
		{ title: 'q:channel', href: 'attributes/q-channel' },
		{ title: 'q:call', href: 'attributes/q-call' },
		{ title: 'q:toggle', href: 'attributes/q-toggle' },
		{ title: 'q:bind', href: 'attributes/q-bind' },
		{ title: 'q:on', href: 'attributes/q-on' },
		{ title: 'Custom Attributes', href: 'attributes/q' }
	]},
	{ title: 'Plugins', expand: true, items: [
		{ title: 'Routing', href: 'plugins/routing' },
		{ title: 'Form', href: 'plugins/form' },
		{ title: 'Actions Group', href: 'plugins/group' },
		{ title: 'Internationalization', href: 'plugins/i18n' } ]},
	{ title: 'Basic Components', expand: true, items: [
		{ title: 'modal', href: 'components/modal' },
		{ title: 'popup', href: 'components/popup' },
		{ title: 'spinner', href: 'components/spinner' } ]},
	{ title: 'Advanced', expand: true, items: [
		{ title: 'Qute API', href: 'advanced/api'},
		{ title: 'JSQ File Format', href: 'advanced/jsq'} ]},
	{ title: 'Examples', expand: true, items: [
		{ title: 'Hello World', href: 'examples/hello'},
		{ title: 'Timer', href: 'examples/timer'},
		{ title: 'Custom Form Control', href: 'examples/counter'},
		{ title: 'Todo List', href: 'examples/todo'},
		{ title: 'Tab Bar', href: 'examples/tabs'},
		{ title: 'Using Existing Libraries', href: 'examples/using-existing-libs'},
		{ title: 'Popup Demo', href: 'examples/popup-demo'},
		{ title: 'Modal Demo', href: 'examples/modal-demo'} ]}
];

function toggleSection(target) {
	var items = target.querySelector('.toc-items');
	items.classList.toggle('expanded');
}
function expandSection(target) {
	var items = target.querySelector('.toc-items');
	items.classList.add('expanded');
}

function highlightItem(root, target) {
	//console.log('HIGHLIGHT', target);
	var active = root.querySelector('li.toc-item.active');
	active && active.classList.remove('active');
	target.classList.add('active');
}
var Toc = new Qute('toc').on('click', 'a', function(e) {
		var parentNode = e.target.parentNode;
		if (parentNode.matches('li.toc-section')) {
			var href = e.target.getAttribute('href');
			if (href && href !== '#') {
				this.emit('select', href);
			} else {
				toggleSection(parentNode);
			}
		} else {
			highlightItem(this.$el, parentNode);
			this.emit('select', e.target.getAttribute('href'));
		}
		return false;
}).channel(function(msg, data) {
	if (msg === 'select') {
		var item = window.document.getElementById('toc_item:'+data);
		if (item) {
			var cl = item.classList;
			if (!cl.contains('active')) {
				var section = item.closest('.toc-section');
				section && expandSection(section);
				highlightItem(this.$el, item);
				if (!isInViewport(item)) {
					item.scrollIntoView();
				}
			}
		}
	}
});

var App$1 = new Qute('app', {
	get docPageContent() {
		return this.docPage ? this.docPages[this.docPage] : '';
	},
	init: function(app) {
		var self = this;
		this.docPages = {};
		this.toc = TOC;
		this.router = new QuteRouter(app, {
			'*': function(path) {
				self.updateDocPage(path);
			},
			'/': 'introduction'
		}).start();

		this.router.onChange(function(path) {
			self.postAsync('toc', 'select', path);
		});
//TODO
		this.subscribe('app#page', function(page) {
			this.router.navigate(page);
			//this.updateDocPage(page); // no need to use self
		});
		//this.updateDocPage('overview')
	},
	connected: function() {
		function runSnippet(btn) {
			var code = btn.closest('pre').querySelector('code.language-jsq').textContent;
			localStorage.setItem('qute.playground.snippet', code);
			window__default.open("../playground/index.html", 'qute.playground');
		}
		this.$on('click', 'button.run-snippet', function(e) {
			runSnippet(e.target);
			return false;
		});
		this.$on('click', 'button.run-snippet > i', function(e) {
			runSnippet(e.target.parentNode);
			return false;
		});
	},
	updateDocPage: function(page) {
		var pageKey = 'docs/'+page+'.md';
		if (this.docPage === pageKey) { return; }
		var self = this;
		this.docPage = pageKey;
		this.update(); // force an update - the spinner will be shown if no content is available
		Qute.UpdateQueue.runAfter(function() {
			createRunSnippets();
			// scroll to top
			window__default.scrollTo(0,0);
		});
		if (!(pageKey in this.docPages)) {
			//console.log('FETCH',pageKey)
			fetchPage(pageKey, function(data, status) {
				self.docPages[pageKey] = marked(data);
				self.update(); // force an update
				Qute.UpdateQueue.runAfter(function() {
					createRunSnippets();
				});
			});
		}
	},
	openTocItem: function(e) {
		if (window__default.SIDEBAR_ON) { hideSidebar(); }
		this.router.navigate(e.detail);
	},
	toggleSidebar: function toggleSidebar() {
		var sidebar = window.document.getElementById('sidebar');
		if (!sidebar.clientWidth) {
			showSidebar();
		} else {
			hideSidebar();
		}
	}
});


function parseJsq(text, textHandler, tagHandler) {
	var START_TAG = /\s*<\s*(?:(q\:template)|(q\:style))(?:\s[^>]*)?>/;
	var END_XTAG = /\s*<\/\s*q\:template\s*>/;
	var END_STYLE = /\s*<\/\s*q\:style\s*>/;

	while (text) {
		var m = START_TAG.exec(text);
		if (!m) { break; }
		var i = m.index, l = m[0].length;
		textHandler(text.substring(0, i));
		var tag, stag = m[0];
		text = text.substring(i+l);
		if (m[1]) { // q:template
			m = END_XTAG.exec(text);
			tag = 'q:template';
		} else if (m[2]) { // style
			m = END_STYLE.exec(text);
			tag = 'q:style';
		} else { // cannot happen
			throw new Error('cannot happen');
		}
		if (m) {
			var i = m.index, l = m[0].length;
			tagHandler(tag, stag, text.substring(0, i), text.substring(i, i+l));
			text = text.substring(i+l);
		} else { // unclosed tag?
			console.log('unclosed tag', tag);
			tagHandler(tag, stag, text, '');
			text = null;
		}
	}
	if (text) {
		textHandler(text);
	}
}

function highlighJsq(code) {
	var out = '';
	parseJsq(code, function(text) {
		if (text.trim()) {
			out += Prism.highlight(text, Prism.languages.javascript, 'javascript');
		} else {
			out += text;
		}
	}, function(tag, start, text, end) {
		if (tag === 'q:template') {
			out += Prism.highlight(start+text+end, Prism.languages.markup, 'xml');
		} else if (tag === 'q:style') {
			out += Prism.highlight(start+text+end, Prism.languages.markup, 'xml');
		}
	});
	return out;
}

function createRunSnippets() {
	var codeEls = window.document.querySelectorAll('pre > code');
	for (var i=0,l=codeEls.length; i<l; i++) {
		var codeEl = codeEls[i];
		if (codeEl.className === 'language-jsq') {
			createRunSnippetButton(codeEl);
			codeEl.innerHTML = highlighJsq(codeEl.textContent);
		} else if (codeEl.className === 'language-jsq-norun') {
			codeEl.innerHTML = highlighJsq(codeEl.textContent);
		} else {
			Prism.highlightElement(codeEl);
		}

	}
}
function createRunSnippetButton(codeEl) {
	var snippet = codeEl.textContent;
	var pre = codeEl.parentNode;
	pre.style.position = 'relative';
	var btn = window.document.createElement('button');
	btn.className = 'btn btn-success run-snippet';
	var btnStyle = btn.style;
	btnStyle.position = 'absolute';
	btnStyle.top = '10px';
	btnStyle.right = '20px';
	btn.innerHTML = "<i class='far fa-play-circle'></i> Run";
	btn.setAttribute('title', 'Run snippet in Qute Playground');
	pre.appendChild(btn);
}


// sidebar toggle

function showSidebar(container) {
	(container || window.document.body).classList.add('show-sidebar');
	var sidebar = window.document.getElementById('sidebar');
	var main = window.document.getElementById('main');
	sidebar.style.width = '250px';
	//main.style.marginLeft = '250px';
	window__default.SIDEBAR_ON = true;
	lockBodyScroll();
}

function hideSidebar(container) {
	(container || window.document.body).classList.remove('show-sidebar');
	var sidebar = window.document.getElementById('sidebar');
	var main = window.document.getElementById('main');
	sidebar.style.width = '0px';
	main.style.marginLeft = '0px';
	window__default.SIDEBAR_ON = false;
	unlockBodyScroll();
}



/*!
 * Determine if an element is in the viewport
 * (c) 2017 Chris Ferdinandi, MIT License, https://gomakethings.com
 * @param  {Node}    elem The element
 * @return {Boolean}      Returns true if element is in the viewport
 */
function isInViewport(elem) {
	var distance = elem.getBoundingClientRect();
	return (
		distance.top >= 0 &&
		distance.left >= 0 &&
		distance.bottom <= (window__default.innerHeight || window.document.documentElement.clientHeight) &&
		distance.right <= (window__default.innerWidth || window.document.documentElement.clientWidth)
	);
}

new App$1().mount();

module.exports = App$1;
//# sourceMappingURL=index.cjs.js.map
