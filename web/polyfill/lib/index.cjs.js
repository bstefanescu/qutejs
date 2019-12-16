'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var window = _interopDefault(require('@qutejs/window'));

/* Polyfill from https://developer.mozilla.org/en-US/docs/Web/API/Element/classList */

// removed polyfill code for IE7-8 the target is IE>=9
if (!window.DOMException) { (window.DOMException = function(reason) {
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
if (typeof window.DOMTokenList !== "function") {
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
    window.DOMTokenList = DOMTokenList;

    var whenPropChanges = function() {
        var evt = window.event,
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
    window.Object.defineProperty(window.Element.prototype, "classList", {
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
var DOMTokenListProto = window.DOMTokenList.prototype;
var testClass = window.document.createElement("div").classList;
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

if ( typeof window.CustomEvent !== "function" ) {
	window.CustomEvent = function ( event, params ) {
		params = params || { bubbles: false, cancelable: false, detail: null };
		var evt = window.document.createEvent( 'CustomEvent' );
		evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
		return evt;
	};
}

/**
 * Polyfill from https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
 */

// matches polyfill
var Element = window.Element;
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
//# sourceMappingURL=index.cjs.js.map
