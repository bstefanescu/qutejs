var Qute = (function (window) {
  'use strict';

  var window__default = 'default' in window ? window['default'] : window;

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

  function ERR() {
  	ERR.resolve.apply(null, arguments);
  }

  ERR.resolve = function() {
  	throw new Error('Qute Error: '+Array.prototype.slice.call(arguments));
  };

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
  	while (el && !el.__qute__) {
  		el = el.parentNode;
  	}
  	return el && el.__qute__;
  }

  // filter is a an array whoes first item is true or false. See compiler x-attrs encoding
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
  			if (++cnt > max) { ERR(30); }
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

  function Context(data) {
  	if (data) { Object.assign(this, data); }
  	this.$topics = {lifecycle:[]}; // lifecycle is a bultin topic
  }

  Context.prototype = {
  	post: function(topic, msg, data) {
  		var listeners = this.$topics[topic];
  		if (!listeners) { ERR(38, topic); }
  		for (var i=0,l=listeners.length;i<l;i++) {
  			if (listeners[i](msg, data) === false) {
  				break; // stop if one of the listeners returns false
  			}
  		}
  	},
  	postAsync: function(topic, msg, data) {
  		var self = this;
  		window__default.setTimeout(function() { self.post(topic, msg, data); }, 0);
  	},
  	subscribe: function(topic, listenerFn) {
  		var listeners = this.$topics[topic];
  		if (!listeners) {
  			this.$topics[topic] = listeners = [];
  		}
  		listeners.push(listenerFn);
  		return this;
  	},
  	subscribeOnce: function(topic, event, listenerFn) {
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
  	unsubscribe: function(topic, listenerFn) {
  		var listeners = this.$topics[topic];
  		if (listeners) {
  			var i = listeners.indexOf(listenerFn);
  			if (i > -1) {
  				listeners.splice(i, 1);
  			}
  		}
  	},
  	freeze: function() {
  		Object.freeze(this);
  	}
  };

  var VMS = {};
  var XTAGS = {};

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

  function createListeners(vm, $listeners) {
  	if ($listeners) {
  		for (var key in $listeners) {
  			$listeners[key] = createListener(vm, $listeners[key]);
  		}
  	}
  	return $listeners;
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

  function SetFuncAttrs($attrs, vm, filter) { // vm is the parent vm (i.e. current model)
  	return function() {
  		var vmAttrs = vm.$attrs;
  		if (vmAttrs) {
  			var keys = filterKeys(vmAttrs, filter);
  			for (var i=0,l=keys.length; i<l; i++) {
  				var key = keys[i];
  				$attrs[key] = vmAttrs[key];
  			}
  		}
  	}
  }

  function SetFuncAttr($attrs, vm, key, val) { // vm is the parent vm (i.e. current model)
  	return function() {
  		$attrs[key] = val(vm);
  	}
  }
  // TODO set $attrs on VMs
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

  // emitter prototype
  var Emitter = {
  	emit: function(event, data) {
  		if (!this.$el) { ERR(35); }
  		this.$el.dispatchEvent(new window__default.CustomEvent(event, {bubbles: true, detail: data === undefined ? this : data }));

  	},
  	emitAsync: function(event, data, timeout) {
  		var self = this;
  		window__default.setTimeout(function() { self.emit(event, data); }, timeout || 0);
  	}
  };

  function ViewRenderingContext(model, marker, isExpr, changeCb, noCache, xattrs, childrenFn) {

  	var cache = noCache ? null : {};
  	var r = null; // the view rendering context
  	var cview = null; // current element
  	return function(propKey, initialUpdate) {
  		var el, viewXTag = isExpr(model);
  		if (viewXTag !== cview) {
  			var parent = marker.parentNode;
  			if (r) {
  				r.$disconnect();
  				parent.removeChild(marker.previousSibling);
  			}
  			if (viewXTag) {
  				r = cache && cache[viewXTag];
  				if (!r) {
  					r = new Rendering(model);
  					if (cache) { cache[viewXTag] = r; }
  				}
  				el = r.r(viewXTag, xattrs, childrenFn(r));
  				parent.insertBefore(el, marker);
  				r.$connect();
  			} else {
  				r = null;
  			}

  			if (changeCb && !initialUpdate) { // avoid calling changeCb the first time the if is rendered
  				changeCb.call(model, el && el.__qute__);
  			}
  			cview = viewXTag;
  		} else if (r) {
  			// only update children
  			r.$update();
  		}
  	}
  }

  function evalIfChain(exprs, model) {
  	var i = 0;
  	for (var l=exprs.length-1; i<l; i++) {
  		if (exprs[i](model)) { return i; }
  	}
  	var lastExpr = exprs[i];
  	// if lastExpr is null is is corresponding to an else statement
  	return !lastExpr || lastExpr(model) ? i : -1;
  }


  function IfRenderingContext(model, start, end, exprs, kids, changeCb) {
  	var r = null; // the IF / ELSE-IF / ELSE rendering context
  	var state = -1; // the current case of IF / ELSE-IF / ELSE as the zero based index of the chain (0 for if, 1 for next else-if, ...)
  	return function(propKey, initialUpdate) {
  		var newState = evalIfChain(exprs, model);
  		if (newState !== state) {
  			r && r.$disconnect();
  			var parent = start.parentNode;
  			// remove current if branch
  			while (start.nextSibling && start.nextSibling !== end) {
  				parent.removeChild(start.nextSibling);
  			}
  			r = new Rendering(model); // create the IF / ELSE rendering context
  			state = newState;
  			if (state > -1) {
  				var children = kids[state](r);
  				for (var i=0,l=children.length; i<l; i++) {
  					parent.insertBefore(children[i], end);
  				}
  			}
  			r.$connect();
  			if (changeCb && !initialUpdate) { // avoid calling changeCb the first time the if is rendered
  				changeCb.call(model, state);
  			}
  		} else if (r) {
  			// only update children
  			r.$update();
  		}
  	}
  }

  function ForRenderingContext(model, start, end, listFn, iterationFn) {
  	var r = null; // the for rendering context
  	var list = null; // the current list
  	return function(propKey) {
  		var newList = listFn(model);
  		if (newList !== list) {
  			r && r.$disconnect();
  			var parent = start.parentNode;
  			// remove current for content
  			while (start.nextSibling && start.nextSibling !== end) {
  				parent.removeChild(start.nextSibling);
  			}
  			r = new Rendering(model); // create the FOR rendering context
  			list = newList;
  			// render content
  			if (list) {
  				if (!Array.isArray(list)) {
  					//if (list instanceof List) ERR(25);
  					if (list.$createListFragment) { ERR(25); }
  					list = Object.keys(list);
  				}
  				if (list.length > 0) {
  					var l = list.length-1;
  					for (var i=0; i<l; i++) {
  						var children = iterationFn(list[i], i, true);
  						if (children) {
  							for (var k=0,ll=children.length; k<ll; k++) {
  								parent.insertBefore(children[k], end);
  							}
  						}
  					}
  					var children = iterationFn(list[i], i, false);
  					if (children) {
  						for (var i=0,l=children.length; i<l; i++) {
  							parent.insertBefore(children[i], end);
  						}
  					}
  				}
  			}
  			r.$connect();
  		} else if (r) {
  			// just update children
  			r.$update();
  		}
  	}
  }

  function isVM(obj) {
  	return obj && obj.prototype && obj.prototype.__VM__;
  }

  function appendChildren(parent, children) {
  	for (var i=0, l=children.length; i<l; i++) { parent.appendChild(children[i]); }
  }

  function applyListeners(el, vm, listeners, doNotWrap) {
  	for (var key in listeners) {
  		var fn = listeners[key];
  		if (key === 'create') {
  			fn.call(vm, el);
  		} else {
  			el.addEventListener(key, doNotWrap ? fn : createListener(vm, fn));
  		}
  	}
  }

  function extractSlots(children) {
  	if (children && children.length) {
  		var namedSlots = {}, nestedCnt = 0, hasContent = false;
  		for (var i=0,l=children.length; i<l; i++) {
  			var child = children[i];
  			var nodeType = child.nodeType;
  			switch (nodeType) {
  				case 1:
  					if (child.nodeName === 'NESTED') { // select only 'nested' elements
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

  // ==============================================


  var RenderingProto = {
  	x: function(expr) { // expression {{ ... }}
  		var text = expr(this.vm);
  		var el = window.document.createTextNode(text);
  		this.up(SetText(el, this.vm, expr));
  		return el;
  	},
  	t: function(value) { // text
  		return window.document.createTextNode(value);
  	},
  	g: function(isFn, xattrs, children) { // dynamic tag using 'is'
  		var tag = isFn(this.vm);
  		var XTag = getVMOrTag(tag);
  		return XTag ? this.v(XTag, xattrs, children) : this.h(tag, xattrs, children);
  	},
  	h: function(tag, xattrs, children) { // dom node
  		var el = window.document.createElement(tag);
  		if (xattrs) {
  			var vm = this.vm;
  			for (var key in xattrs) {
  				var up = null;
  				var val = xattrs[key];
  				if (key.charCodeAt(0) === 36) { // $ - extended attribute
  					if (key === '$on') {
  						applyListeners(el, vm, val);
  					} else if (key === '$class') {
  						up = SetClass(el, vm, val);
  					} else if (key === '$style') {
  						up = SetStyle(el, vm, val);
  					} else if (key === '$show') {
  						up = SetDisplay(el, vm, val);
  					} else if (key === '$toggle') {
  						up = SetToggle(el, vm, val);
  					} else if (key === '$html') {
  						up = SetInnerHTML(el, vm, val);
  					} else if (key === '$attrs') {
  						up = SetDOMAttrs(el, vm, val);
  					} else if (key === '$listeners') {
  						//TODO filter like for $attrs
  						//TODO value must be a function ... and not use directly vm.$listeners
  						applyListeners(el, vm, vm.$listeners, true); // do not wrap listeners fns (already wrapped by the parent context)
  						//TODO
  					} else if (key === '$channel') {
  						ERR(28, tag);
  					} else {
  						ERR(26, key);
  					}
  				} else if (typeof val === 'function') { // a dynamic binding
  					up = SetAttr(el, vm, key, val);
  				} else {
  					el.setAttribute(key, val);
  				}
  				if (up) {
  					this.up(up)(); // push then execute
  				}
  			}
  		}
  		if (children) { appendChildren(el, children); }
  		return el;
  	},
  	// element with static children (innerHTML is set from the subtree)
  	hh:function(tag, xattrs, content, type) {
  		var el = this.h(tag, xattrs);
  		if (type) { // convert can be a function to convert the content before injecting in the dom
  			var converter = Context.Qute.converters[type];
  			if (!converter) {
  				ERR(27, type);
  			}
  			content = converter(content, this);
  		}
  		el.innerHTML = content;
  		return el;
  	},
  	r: function(tag, xattrs, children) {
  		var XTag = getVMOrTag(tag);
  		if (!XTag) { ERR(23, tag); }
  		return this._v(XTag, xattrs, extractSlots(children));
  	},
  	v: function(XTag, xattrs, children) { // xtag is specified as a func reference. TODO No more used
  		return this._v(XTag, xattrs, extractSlots(children));
  	},
  	// vm component
  	_v: function(XTag, xattrs, slots) { // a vm component (viewmodel)
  		if (isVM(XTag)) {
  			var vm = new XTag(this.vm.$ctx);
  			return vm.$create(this, xattrs, slots);
  		} else if (XTag.$compiled) { // a compiled template
  			var oldVm = this.vm;
  			this.vm = this.functx(this.vm, xattrs, slots);
  			var el = XTag(this, xattrs, slots); // pass xattrs and slots too?
  			this.vm.$el = el;
  			// apply root bindings if any (x-class, x-style or x-show)
  			if (this.vm.$bindings) {
  				var bindings = this.vm.$bindings;
  				for (var i=0,l=bindings.length; i<l; i+=2) {
  					var up = bindings[i](el, oldVm, bindings[i+1]);
  					this.up(up)();
  				}
  			}
  			if (this.vm.$listeners) { applyListeners(el, this.vm, this.vm.$listeners, true); }
  			this.vm = oldVm;
  			return el;
  		} else { // a hand written function
  			return XTag(this, xattrs, slots);
  		}
  	},
  	s: function(slotName, defaultChildren) {
  		var vm = this.vm;
  		var slots = vm.$slots;
  		var children = slots && slots[slotName || 'default'] || defaultChildren;
  		if (children) {
  			var frag = window.document.createDocumentFragment();
  			appendChildren(frag, children);
  			return frag;
  		}
  		return window.document.createComment('[slot/]'); // placeholder
  	},
  	w: function(isExpr, changeCb, noCache, xattrs, childrenFn) { // dynamic view
  		var marker = window.document.createComment('[view/]');
  		var frag = window.document.createDocumentFragment();
  		frag.appendChild(marker);
  		var viewFrag = ViewRenderingContext(this.vm, marker, isExpr, changeCb, noCache, xattrs, childrenFn);
  		marker.__qute__ = viewFrag;
  		viewFrag(null, true);
  		this.up(viewFrag);
  		return frag;
  	},
  	i: function(ifChain, kidsChain, changeCb) { // if / else-if / else
  		// ifChain is a list of if expression functions corresponding to if / if-else else chain.
  		// When 'else' is present - the last expression corresponding to the else will be null
  		// kidsChain is a list of children functions corresponding to if / else-if / else chain
  		// both lists have the same when length. When only 'if' is present the list is of length 1.
  		var start = window.document.createComment('[if]');
  		var end = window.document.createComment('[/if]');
  		var frag = window.document.createDocumentFragment();
  		frag.appendChild(start);
  		frag.appendChild(end);
  		var ieFrag = IfRenderingContext(this.vm, start, end, ifChain, kidsChain, changeCb);
  		start.__qute__ = ieFrag;
  		ieFrag(null, true);
  		this.up(ieFrag);
  		return frag;
  	},
  	// dynamic lists - which is tracking changes and update itself
  	l: function(listFn, iterationFn) {
  		var list = listFn(this.vm);
  		//if (!list instanceof List)) ERR(24);
  		if (!list.$createListFragment) { ERR(24); }
  		return list.$createListFragment(this, iterationFn);
  	},
  	// static array variant of lists - this cannot be updated it is rendered once at creation
  	a: function(listFn, iterationFn) {
  		var start = window.document.createComment('[for]');
  		var end = window.document.createComment('[/for]');
  		var frag = window.document.createDocumentFragment();
  		frag.appendChild(start);
  		frag.appendChild(end);
  		var forFrag = ForRenderingContext(this.vm, start, end, listFn, iterationFn);
  		start.__qute__ = forFrag;
  		forFrag(null);
  		this.up(forFrag);
  		return frag;
  	},
  	up: function(fn) { // register a live update function
  		this.ups.push(fn);
  //		this.ups[this.ups.length-1].push(fn);
  		return fn;
  	},
  	//======
  	// eval the value of an xattr given the key - if a fucntion invoke the function within the current context otherwise return the value as is
  	eval: function(xattr) {
  		return typeof xattr === 'function' ? xattr(this.vm) : xattr;
  	},

  	// connect all nested  VMs
  	$connect: function() {
  		if (!this.isc) {
  			var vms = this.vms;
  			for (var i=0,l=vms.length; i<l; i++) { vms[i].$connect(); }
  			this.isc = true;
  		}
  		return this;
  	},
  	// disconnect all nested VMs
  	$disconnect: function() {
  		if (this.isc) {
  			var vms = this.vms;
  			for (var i=0,l=vms.length; i<l; i++) { vms[i].$disconnect(); }
  			this.isc = false;
  		}
  		return this;
  	},
  	$push: function(r) { // push a sub-renderings
  		this.vms.push(r);
  		if (this.isc) { r.$connect(); }
  	},
  	// refresh the DOM - call all nested update functions
  	$update: function() {
  		var model = this.vm, ups = this.ups;
  		for (var i=0,l=ups.length;i<l;i++) { ups[i](model); }
  		return this;
  	},
  	functx: function(vm, xattrs, slots) { // functional context
  		var $attrs = {};
  		var ctx = {
  			$parent: vm,
  			$attrs: $attrs,
  			$listeners: null,
  			$slots: slots,
  			$el: null,
  			$bindings: null,
  			emit: Emitter.emit,
  			emitAsync: Emitter.emitAsync
  		};
  		var bindings = null;

  		if (xattrs) {
  			for (var key in xattrs) { // class, style and show, $attrs, $listeners are ignored
  				var val = xattrs[key];
  				if (key.charCodeAt(0) !== 36 || key === '$html') { // $ - extended attribute -> ignore all extended attrs but $html
  					if (typeof val === 'function') {
  						this.up(SetFuncAttr($attrs, vm, key, val))();
  					} else {
  						$attrs[key] = val;
  					}
  					//setFnContextAttr($attrs, vm, key, val);
  				} else if (key === '$attrs') {
  					if (vm.$attrs) {
  						// inject attributes in functional tags
  						// we need to create an update function to reinject attrs when model changes
  						// otherwise we loose the reactivity on func tags 'x-attrs' attribute
  						this.up(SetFuncAttrs($attrs, vm, val))();
  					}
  				} else if (key === '$on') {
  					ctx.$listeners = createListeners(vm, val);
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

  		ctx.$bindings = bindings;
  		return ctx;
  	}

  };

  function Rendering(vm) {
  	this.vm = vm; // defaults to current vm -> changed by functional views
  	this.ups = [];
  	// vms are usually ViewModels but can be any object providing $connect and $disconnect methods
  	// if you enrich the vms api you mustr check list.js since it register a ListFragment instance as a vm
  	this.vms = [];
  	this.isc = false; // is connected?
  }
  Rendering.prototype = RenderingProto;

  function ListFragment(rendering, listFn) {
  	this.start = window.document.createComment('[list]');
  	this.end = window.document.createComment('[/list]');
  	this.r = rendering;
  	this.listFn = listFn;
  	this.length = 0;

  	this.updateChildren = function(model) {
  		var first = this.start.nextSibling;
  		if (!first || first === this.end || !first.$up) { return; }
  		var n = first, end = this.end;
  		while (n && n !== end) {
  			if (n.$up) {
  				var ups = n.$up;
  				for (var i=0,l=ups.length;i<l;i++) {
  					ups[i](model);
  				}
  			}
  			n = n.nextSibling;
  		}
  	};

  	this.clear = function() {
  		var n = this.start;
  		var end = this.end;
  		var parent = n.parentNode;
  		while (n.nextSibling && n.nextSibling !== end) {
  			parent.removeChild(n.nextSibling);
  		}
  		if (!n.nextSibling) { ERR(10); }
  		this.length = 0;
  	};

  	this.get = function(index) {
  		if (index < 0 || index > this.length) {
  			return null;
  		}
  		var l = this.length, n = null;
  		if (index < l/2) { // from start
  			n = this.start.nextSibling;
  			while (index-- > 0) { n = n.nextSibling; }
  		} else { // from end
  			index = l - index - 1;
  			n = this.end.previousSibling;
  			while (index-- > 0) { n = n.previousSibling; }
  		}
  		return n;
  	};

  	this.getInsertion = function(index) {
  		if (index < 0 || index > this.length) { ERR(11, index, length); }
  		if (index === 0) {
  			return this.start.nextSibling;
  		}
  		if (index === this.length) {
  			return this.end;
  		}
  		return this.get(index);
  	};

  	this.createItem = function(r, item, index, hasNext) {
  		return listFn(r, item, index, hasNext);
  	};

  	this.insert = function(data, from, count) {
  		if (!from) { from = 0; } // if undefined null or 0
  		if (!count) { count = data.length - from; } // if undefined null or 0
  		if (count < 1) { return; }
  		var l = from+count;
  		var listFn = this.listFn;
  		var r = this.r;
  		var node = this.getInsertion(from);
  		if (!node) { ERR(12, index, this.length); }
  		//TODO redraw if list fragment is broken insted of throwing an error?
  		var childR, vm = r.vm, parent = node.parentNode;
  		var ll = l-1;
  		for (var i=from; i<ll; i++) {
  			// we need to wrapp each child in a rendering ctx to be able to disconnect when items are removed
  			childR = new Rendering(vm);
  			var child = this.createItem(childR, data[i], i, true);
  			if (child) {
  				parent.insertBefore(child, node);
  				r.$push(childR);
  				child.__qute_ctx__ = childR;
  			}
  		}
  		childR = new Rendering(vm);
  		var child = this.createItem(childR, data[ll], ll, l<data.length);
  		if (child) {
  			parent.insertBefore(child, node);
  			r.$push(childR);
  			child.__qute_ctx__ = childR;
  		}
  		this.length = data.length;
  	};

  	this.remove = function(from, count) {
  		if (from + count > this.length) {
  			// TODO enable only if debug mode
  			//throw new Error('Removed range exceed the list length: '+from+'#'+count+'. Length is '+this.length);
  			return;
  		}
  		var node = this.get(from);
  		if (!node) { ERR(13, from, this.length); }
  		var i=0, parent = this.start.parentNode;
  		node = node.previousSibling; // cannot be null
  		while (i++<count) {
  			var child = node.nextSibling;
  			child.__qute_ctx__ && child.__qute_ctx__.$disconnect();
  			parent.removeChild(child);
  		}
  		this.length -= count;
  	};

  	this.move = function(from, to) {
  		// TODO this can be optimized (we can search for the 2 nodes in the same time: get2(i1, i2))
  		var node = this.get(from);
  		if (!node) { ERR(14, from, this.length); }
  		var dstNode = this.get(to);
  		if (!dstNode) { ERR(15, to, this.length); }
  		dstNode = dstNode.nextSibling;
  		if (dstNode) {
  			dstNode.parentNode.insertBefore(node, dstNode);
  		} else {
  			dstNode.parentNode.append(node);
  		}
  	};
  }



  var AP = Array.prototype;
  var ListProto = {
  	$createListFragment: function(rendering, listFn) {
  		var listRendering = new Rendering(rendering.vm);
  		if (!this.lfs) { this.lfs = []; }
  		var lf = new ListFragment(listRendering, listFn);
  		var frag = window.document.createDocumentFragment();
  		frag.appendChild(lf.start);
  		frag.appendChild(lf.end);
  		lf.insert(this.$data); // initialize
  		rendering.up(lf.updateChildren.bind(lf)); // register children updates
  		this.lfs.push(lf);
  		rendering.$push(listRendering);
  		return frag;
  	},
  	/*
  	$destroy: function() { //TODO not used
  		this.lfs = null;
  	},
  	*/
  	$updateNow: function() {
  		if (this.lfs) {
  			var ops = this.ops;
  			var data = this.$data;
  			var lfs = this.lfs;
  			var l = lfs.length;
  			while (ops.length) {
  				var op = ops.shift();
  				for (var i=0,l=lfs.length; i<l; i++) {
  					op(lfs[i], data);
  				}
  			}
  		}
  	},
  	$update: function(op) {
  		if (this.lfs) {
  			if (this.ops.push(op) === 1) { // if queue is empty start an update task
  				var self = this;
  				UpdateQueue.push(function() {
  					self.$updateNow();
  				});
  			}
  		}
  	},
  	$redraw: function() {
  		this.$update(function(lf, data) {
  			lf.clear();
  			lf.insert(data);
  		});
  	},
  	$insert: function(from, count) {
  		this.$update(function(lf, data) {
  			lf.insert(data, from, count);
  		});
  	},
  	$remove: function(from, count) {
  		this.$update(function(lf, data) {
  			lf.remove(from, count);
  		});
  	},
  	$move: function(from, to) {
  		this.$update(function(lf, data) {
  			lf.move(from, to);
  		});
  	},

  	toJSON: function() {
  		return this.$data;
  	},
  	data: function() {
  		return this.$data;
  	},
  	newList: function() {
  		return new List(this.$data);
  	},

  	clear: function() {
  		this.replace([]);
  	},
  	replace: function (ar) {
  		this.$data = ar;
  		this.$redraw();
  	},

  	move: function(from, to) {
  		this.$data.splice(to, 0, this.$data.splice(from, 1)[0]);
  		this.$move(from, to);
  	},

  	remove: function(item) {
  		var i = this.$data.indexOf(item);
  		if (i > -1) {
  			return this.splice(i, 1);
  		}
  	},

  	push: function() {
  		var from = this.$data.length;
  		var r = AP.push.apply(this.$data, arguments);
  		this.$insert(from, arguments.length);
  		return r;
  	},
  	unshift: function() {
  		var from = this.$data.length;
  		var r = AP.unshift.apply(this.$data, arguments);
  		this.$insert(0, arguments.length);
  		return r;
  	},
  	pop: function() {
  		var r = AP.pop.apply(this.$data, arguments);
  		this.$remove(this.$data.length, 1);
  		return r;
  	},
  	shift: function() {
  		var r = AP.shift.apply(this.$data, arguments);
  		this.$remove(0, 1);
  		return r;
  	},
  	splice: function(start, deleteCount) {
  		var argsl = arguments.length;
  		var len = this.$data.length;
  		var r = AP.splice.apply(this.$data, arguments);
  		if (argsl === 1) {
  			this.$remove(start, len-start);
  		} else if (argsl === 2) {
  			this.$remove(start, deleteCount);
  		} else { // some inserted items
  			if (deleteCount) { this.$remove(start, deleteCount); }
  			this.$insert(start, argsl-2);
  		}
  		return r;
  	},
  	sort: function(cmp) {
  		this.$data.sort(cmp);
  		this.$redraw();
  		return this.$data;
  	},
  	reverse: function() {
  		this.$data.reverse();
  		this.$redraw();
  		return this.$data;
  	},
  	get: function(i) {
  		return this.$data[i];
  	},
  	slice: function() {
  		return AP.slice.apply(this.$data, arguments);
  	},
  	forEach: function(cb, thisArg) {
  		this.$data.forEach(cb, thisArg);
  	},
  	map: function(cb, thisArg) {
  		return this.$data.map(cb, thisArg);
  	},
  	filter: function(cb, thisArg) {
  		return this.$data.filter(cb, thisArg);
  	},
  	find: function(cb, thisArg) {
  		return this.$data.find(cb, thisArg);
  	},
  	findIndex: function(cb, thisArg) {
  		return this.$data.findIndex(cb, thisArg);
  	},
  	reduce: function(cb, initialValue) {
  		return this.$data.reduce(cb, initialValue);
  	},
  	reduceRight: function(cb, initialValue) {
  		return this.$data.reduceRight(cb, initialValue);
  	},
  	indexOf: function(elem, from) {
  		return this.$data.indexOf(elem, from || 0);
  	},
  	lastIndexOf: function(elem, from) {
  		return this.$data.lastIndexOf(elem, from || this.$data.length-1);
  	},
  	//TODO add some, every, ...
  };
  Object.defineProperty(ListProto, 'length', {get:function() {return this.$data.length}});

  function List(data) {
  	this.ops = []; // update operations queue
  	this.lfs = null; // the list fragment
  	this.$data = data || []; // the backed data
  }
  List.prototype = ListProto;

  function isEnumerable(key) {
  	return key.charCodeAt(0) !== 95; // keys starting with _ are not enumerable
  }

  function defProp(key) {
  	return {
  		get: function() {
  			return this.$data[key];
  		},
  		set: function(value) {
  			var old = this.$data[key];
  			if (old !== value) {
  				this.$data[key] = value;
  				var watcher = this.$el && this.$watch && this.$watch[key]; // if not connected whatchers are not enabled
  				// avoid updating if watcher return false
  				if (watcher && watcher.call(this, value, old) === false) { return; }
  				this.update(key);
  			}
  		},
  		enumerable: isEnumerable(key) // keys starting with _ are not enumerable
  	}
  }

  function listProp(key) {
  	return {
  		get: function() {
  			return this.$data[key];
  		},
  		set: function(value) {
  			var old = this.$data[key];
  			if (old !== value) {
  				if (!value) { // remove list content
  					this.$data[key].clear();
  				} else if (Array.isArray(value)) {
  					this.$data[key].replace(value);
  				} else if (value instanceof List) {
  					//TODO should we copy the data?
  					if (old) { old.$disconnect(); }
  					this.$data[key] = value;
  				} else {
  					ERR(31, value);
  				}
  				var watcher = this.$watch && this.$watch[key];
  				// avoid updating if watcher return false
  				if (watcher && watcher.call(this, value, old) === false) { return; }
  				this.update(key);
  			}
  		},
  		enumerable: isEnumerable(key) // keys starting with _ are not enumerable
  	}
  }

  function ViewModel(ctx, attrs) {
  	var prop = {};
  	// the attributes set on vm tag which are not declared as props
  	prop.value = {};
  	Object.defineProperty(this, '$attrs', prop);
  	// the app context if any
  	prop.value = ctx instanceof Context ? ctx : new Context(ctx);
  	Object.defineProperty(this, '$ctx', prop);
  	// the listeners registered on the vm tag
  	prop.value = null;
  	prop.writable = true;
  	// the associated rendering context
  	Object.defineProperty(this, '$r', prop);
  	// listeners injected through tag attributes (e.g. @click)
  	Object.defineProperty(this, '$listeners', prop);
  	// the slots injected by the caller
  	Object.defineProperty(this, '$slots', prop);
  	// the view root element
  	Object.defineProperty(this, '$el', prop);
  	// chained cleanup functions if any was registered
  	Object.defineProperty(this, '$clean', prop);
  	// States: 0 - initial, 1 - connected, 2 - updating
  	prop.value = 0;
  	Object.defineProperty(this, '$st', prop); // state: 0 - default, 1 updating , 2 frozen

  	var data = this.init(ctx) || {};
  	prop.value = data;
  	Object.defineProperty(this, '$data', prop);
  	if (data) {
  		for (var key in data) {
  			Object.defineProperty(this, key, data[key] instanceof List ? listProp(key) : defProp(key));
  		}
  	}

  	if (!this.render) { ERR(32); }

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
  	__VM__:true,
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
  	// subscribe to the given channel name - for use on root VMs
  	listen: function(channelName) {
  		if (!this.$channel) { ERR(39, this.$tag); }
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
  		if (!this.$el) { ERR(35); }
  		return closestVM(this.$el.parentNode);
  	},
  	$root: function() {
  		var parent = this.$parent();
  		return parent ? parent.$root() : this;
  	},
  	$connect: function() {
  		if (this.$st & 1) { return; } // ignore
  		this.$st |= 1; // set connected flag
  		// $init may be defined by the prototype to do automatic setup when connected
  		// (e.g. automatic installed listeners defined though VM definitioan 'on' property)
  		if (this.$init) {
  			this.$init(this);
  		}
  		if (this.$listeners) {
  			var listeners = this.$listeners;
  			for (var key in listeners) {
  				this.$on(key, listeners[key]);
  			}
  		}
  		// connect children vms
  		this.$r.$connect();
  		// call the connected callback
  		this.connected && this.connected();
  		return this;
  	},
  	$disconnect: function() {
  		if (!(this.$st & 1)) { return; } // ignore
  		this.$st ^= 1; // clear connected flag
  		if (this.$clean) {
  			this.$clean();
  			this.$clean = null;
  		}
  		this.$r.$disconnect(); // disconnect children vms
  		this.disconnected && this.disconnected();
  	},
  	// initialize a vm from tag raw data
  	$load: function(rendering, xattrs, slots) {
  		var bindings = null;
  		var parentVM = rendering.vm;
  		this.$slots = slots;
  		if (xattrs) {
  			for (var key in xattrs) {
  				var val = xattrs[key];
  				if (key.charCodeAt(0) === 36) { // $ - extended attribute
  					if (key === '$on') {
  						//TODO we should make a copy of val since it is modified by createListeners!!!
  						this.$listeners = createListeners(parentVM, val); // use parent vm when creating listeners
  					} else if (key === '$attrs') { // we must not delete keys from xattrs since it can break when vm is loaded by a dynamic component
  						//TODO DO WE NEED to add an update fn? x-attrs are static
  						rendering.up(SetVMAttrs(this, parentVM, val))();
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
  					} else {
  						ERR(26, key);
  					}
  				} else if (typeof val === 'function') { // a dynamic binding
  					rendering.up(SetProp(this, parentVM, key, val))();
  				} else { // static binding
  					this.$set(key, val);
  				}
  			}
  		}
  		return bindings;
  	},
  	$create: function(parentRendering, xattrs, slots) {
  		// load definition
  		var bindings = parentRendering && this.$load(parentRendering, xattrs, slots);
  		var rendering = new Rendering(this);
  		// must never return null - for non rendering components like popups we return a comment
  		var el = this.render(rendering) || window.document.createComment('<'+this.$tag+'/>');
  		this.$r = rendering;
  		el.__qute__ = this;
  		this.$el = el;
  		if (bindings) { for (var i=0,l=bindings.length; i<l; i+=2) {
  			var binding = bindings[i];
  			var up = bindings[i](el, parentRendering.vm, bindings[i+1]);
  			parentRendering.up(up)();
  		} }
  		this.created && this.created(el);
  		// this can trigger a connect if tree is already connected (for example when inserting a comp in a connected list)
  		parentRendering && parentRendering.$push(this);
  		return el;
  	},

  	// manual mount (only roots must be moutned this way)
  	mount: function(elOrId, insertBefore) {
  		if (this.$el) { ERR(33); } //TODO should check if connected and if not root
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
  		this.$connect();
  		// announce the tree was attached to the DOM
  		return this;
  	},
  	// only manually mounted vms can be unmounted
  	unmount: function() {
  		// a child vm?
  		//if (this.$p) ERR();
  		if (!this.$el) { ERR(34); } // TODO check if root and mounted
  		this.$disconnect();
  		this.$el.parentNode.removeChild(this.$el);
  	},
  	$update: function(key) {
  		if (this.$el) { // only if connected
  			this.$r.$update();
  		}
  	},
  	update: function(key) {
  		if (this.$st === 1) { // only if connected and not already scheduled to update
  			this.$st |= 2; // set updating flag
  			var self = this;
  			UpdateQueue.push(function() {
  				self.$update(key);
  				self.$st ^= 2; // remove updating flag
  			});
  		}
  	},
  	$on: function(type/*, selector, cb*/) {
  		if (!this.$el) { ERR(34); }
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
  	// -------- ctx event bus -------------
  	post: function(topic, msg, data) {
  		this.$ctx.post(topic, msg, data);
  	},
  	postAsync: function(topic, msg, data) {
  		this.$ctx.postAsync(topic, msg, data);
  	},
  	// subscribe and register cleanup to remove subscription at disconnect
  	subscribe: function(name, listenerFn) {
  		var ctx = this.$ctx;
  		ctx.subscribe(name, listenerFn.bind(this));
  		this.cleanup(function() {
  			ctx.unsubscribe(name, listenerFn);
  		});
  		return this;
  	},
  	subscribeOnce: function(topic, event, listenerFn) {
  		var ctx = this.$ctx;
  		var onceSubscription = ctx.subscribeOnce(topic, event, listenerFn.bind(this));
  		this.cleanup(function() {
  			ctx.unsubscribe(topic, onceSubscription);
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
  	if (!tag) { ERR(5); }

  	function ViewModelImpl(ctx, attrs) {
  		ViewModel.call(this, ctx, attrs);
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
  			ERR(36, tag);
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

  Qute.List = List;
  Qute.ViewModel = ViewModel;

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

  Qute.converters = {};
  Context.Qute = Qute; // we need this to access globals defined in Qute like converters
  Qute.Context = Context;
  Qute.UpdateQueue = UpdateQueue;
  Qute.Rendering = Rendering;
  // render a functional template given its tag name and a model
  Qute.render = function(xtagName, model) {
  	return getTag(xtagName)(new Rendering(model));
  };

  Qute.register = registerTag;
  Qute.template = getTag;
  Qute.snapshotRegistry = snapshotRegistry;
  Qute.restoreRegistry = restoreRegistry;
  Qute.vm = getVM;
  Qute.vmOrTemplate = getVMOrTag;

  Qute.runAfter = function(cb) { UpdateQueue.runAfter(cb); };
  Qute.closest = closestVM;
  Qute.ERR = ERR;

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

  function QuteRouter(bindings, quteCtx) {
  	Router.call(this, bindings);
  	this.ctx = null;
  	quteCtx && this.install(quteCtx);
  }

  var QuteRouterProto = Object.create(Router.prototype);
  QuteRouterProto.handlerFromString = function(path, to) {
  	if (to.substring(0, 5) === 'post:') {
  		if (!this.ctx) { throw new Error('Using "post:" protocol without a Qute context!'); }
  		var target = to.substring(5);
  		var i = target.indexOf('/');
  		if (i === -1) { throw new Error('Invalid message post target. Expecting "post:channel/message-name" but got '+to); }
  		var msg = target.substring(i+1);
  		var channel = target.substring(0,  i);
  		var ctx = this.ctx;
  		return function(path, params) {
  			ctx.postAsync(expandVars(channel, params), expandVars(msg, params), params);
  		}
  	}
  	return null;
  };
  QuteRouterProto.install = function(ctx) {
  	if (this.ctx) { throw new Error('Qute Router already installed!'); }
  	if (ctx.$ctx) { ctx = ctx.$ctx; } // accept Qute components too.
  	this.ctx = ctx;
  	ctx.router = this;
  	ctx.subscribe('route', function(msg, data) {
  		// data can be 'true' to replace the current entry in history
  		ctx.router.navigate(msg, data);
  	});
  	return this;
  };

  QuteRouter.prototype = QuteRouterProto;

  Qute.Router = QuteRouter;

  /*
  @see https://tympanus.net/codrops/2013/06/25/nifty-modal-window-effects/ for modal effects
  @see https://davidwalsh.name/css-vertical-center for vertical centering using translate
  */

  function toggleScroll(enable) {
  	var body = window.document.body;
  	if (enable) {
          Object.assign(body.style, {overflow: 'initial', height: 'initial'});
  	} else {
          Object.assign(body.style, {overflow: 'hidden', height: '100vh'});
  	}
  }

  function getFocusableElements(root) {
  	return (root || window.document).querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  }

  function createModal(id, content, effect) {
  	var container = window.document.createElement('DIV');
  	container.id = id;
  	var modal = window.document.createElement('DIV');
  	modal.className = effect ? 'md-modal md-effect-'+effect : 'md-modal';
  	modal.tabIndex = -1;
  	var contentEl = window.document.createElement('DIV');
  	contentEl.className = 'md-content';
  	modal.appendChild(contentEl);
  	var overlay = window.document.createElement('DIV');
  	overlay.className = 'md-overlay';
  	container.appendChild(modal);
  	container.appendChild(overlay);

  	if (content.jquery) {
  		contentEl.appendChild(content[0]);
  	} else if (typeof content === 'string') {
  		contentEl.innerHTML = content;
  	} else if (Array.isArray(content)) {
  		for (var i=0, l=content.length; i<l; i++) {
  			contentEl.appendChild(content[i]);
  		}
  	} else { // assume a element
  		contentEl.appendChild(content);
  	}

  	return container;
  }


  function Modal(name, content, settings) {
  	this.id = '--qute-modal-'+name;
  	this.settings = {
  		effect: null,
  		closeOnEsc: true,
  		closeOnClick: true,
  		disableScroll: true
  	};
  	if (settings) {
  		Object.assign(this.settings, settings);
  	}
  	this.el = createModal(this.id, content, settings.effect);
  	this.activeElement = null;
  	this.cleanup = null;
  }
  Modal.prototype = {
  	open: function() {
  		var modal = this.el.firstChild;
  		var cl = modal.classList;
  		if (cl.contains('md-show')) { return; } // already visible

  		var self = this;
  		var settings = this.settings;
  		settings.open && settings.open(this);

  		cl.add('md-show');
  		// 0. save focus status
  		this.activeElement = window.document.activeElement; // save the active element before opening
  		// 1. disable scroll
  		if (settings.disableScroll) { toggleScroll(false); }
  		// 2. add click listener to handle close and other actions
  		this.addListener(this.el, 'click', function(e) {
  			var handled = false, target = e.target;
  			if ((target === self.el.lastChild && settings.closeOnClick) || target.classList.contains('md-close')) {
  				// click on overlay or .md-close
  				self.close();
  				handled = true;
  			} else if (settings.action) {
  				var action = target.getAttribute('data-md-action');
  				if (action === 'close') {
  					self.close();
  					handled = true;
  				} else if (action) {
  					settings.action(action, target);
  					handled = true;
  				}
  			}
  			if (handled) {
  				e.preventDefault();
  				e.stopPropagation();
  			}
  		});
  		//3. add keydown listener to trap focus inside the modal and to handle close on escape
  		var focusable = getFocusableElements(modal);
  		var firstFocusable, lastFocusable;
  		if (focusable.length) {
  			firstFocusable = focusable[0];
  			lastFocusable = focusable[focusable.length-1];
  		}
  		this.addListener(modal, 'keydown', function(e) {
  			if (e.keyCode === 27) {
  				self.settings.closeOnEsc && self.close();
  			} else if (firstFocusable && e.keyCode === 9) {
  				var toFocus, focus = window.document.activeElement;
  				if (e.shiftKey) {
  					if (firstFocusable === focus) {
  						toFocus = lastFocusable;
  					}
  				} else if (lastFocusable === focus) {
  					toFocus = firstFocusable;
  				}
  				if (toFocus) {
  					toFocus.focus();
  					e.preventDefault();
  				}
  			}
  		});

  		// acquire focus - set focus on .md-focus marked element otherwise on the modal itself
  		var toFocus = modal.getElementsByClassName('md-focus')[0] || modal;
  		function acquireFocus() {
  			toFocus.focus();
  			settings.ready && settings.ready(this);
  		}
  		if (settings.effect) {
  			var transitionEnd = function() {
  				acquireFocus();
  				modal.firstChild.removeEventListener('transitionend', transitionEnd);
  			};
  			modal.firstChild.addEventListener('transitionend', transitionEnd);
  		} else {
  			acquireFocus();
  		}
  	},
  	close: function() {
  		this.el.firstChild.classList.remove('md-show');
  		this.settings.close && this.settings.close(this);
  		if (this.settings.disableScroll) { toggleScroll(true); }
  		if (this.activeElement) { this.activeElement.focus(); }
  		this.activeElement = null;
  		if (this.cleanup) {
  			this.cleanup();
  			this.cleanup = null;
  		}
  	},
  	addListener: function(el, name, fn) {
  		el.addEventListener(name, fn);
  		var nextCleanup = this.cleanup;
  		this.cleanup = function() {
  			el.removeEventListener(name, fn);
  			nextCleanup && nextCleanup();
  		};
  	},
  	// dinamically change the effect
  	effect: function(effect) {
  		this.settings.effect = effect;
  		if (this.el) {
  			this.el.firstChild.className = effect ? 'md-modal md-effect-'+effect : 'md-modal';
  		}
  	}

  };

  var css = "\n.md-close {\n\topacity: .5;\n}\n.md-close:hover {\n\topacity: .8;\n}\n.md-close:before {\n\tposition: absolute;\n\tright:0;\n\ttop:0;\n\tcursor: pointer;\n\tcontent: \"\\00d7\";\n\tfont-size: 24px;\n\tline-height: 24px;\n\tfont-weight: 500;\n\tpadding: 6px 14px;\n}\n\n.md-modal {\n\tposition: fixed;\n\ttop: 50%;\n\tleft: 50%;\n\twidth: 50%;\n\tmax-width: 630px;\n\tmin-width: 320px;\n\theight: auto;\n\tz-index: 2000;\n\tvisibility: hidden;\n\t-webkit-backface-visibility: hidden;\n\t-moz-backface-visibility: hidden;\n\tbackface-visibility: hidden;\n\t-webkit-transform: translateX(-50%) translateY(-50%);\n\t-moz-transform: translateX(-50%) translateY(-50%);\n\t-ms-transform: translateX(-50%) translateY(-50%);\n\ttransform: translateX(-50%) translateY(-50%);\n}\n.md-modal:focus {\n\toutline:none;\n}\n\n.md-show {\n\tvisibility: visible;\n}\n\n.md-overlay {\n\tposition: fixed;\n\twidth: 100%;\n\theight: 100%;\n\tvisibility: hidden;\n\ttop: 0;\n\tleft: 0;\n\tz-index: 1000;\n\topacity: 0;\n\tbackground: rgba(0,0,0,0.6);\n\t-webkit-transition: all 0.3s;\n\t-moz-transition: all 0.3s;\n\ttransition: all 0.3s;\n}\n\n.md-show ~ .md-overlay {\n\topacity: 1;\n\tvisibility: visible;\n}\n\n/* Content styles */\n.md-content {\n\tcolor: #333;\n\tbackground: white;\n\tposition: relative;\n\tborder-radius: 3px;\n\tmargin: 0 auto;\n}\n\n/* ---------------------- effects --------------------- */\n\n/* Effect 1: Fade in and scale up */\n.md-effect-scale-up .md-content {\n\t-webkit-transform: scale(0.7);\n\t-moz-transform: scale(0.7);\n\t-ms-transform: scale(0.7);\n\ttransform: scale(0.7);\n\topacity: 0;\n\t-webkit-transition: all 0.3s;\n\t-moz-transition: all 0.3s;\n\ttransition: all 0.3s;\n}\n\n.md-show.md-effect-scale-up .md-content {\n\t-webkit-transform: scale(1);\n\t-moz-transform: scale(1);\n\t-ms-transform: scale(1);\n\ttransform: scale(1);\n\topacity: 1;\n}\n\n/* Effect 2: Slide from the right */\n.md-effect-slide-right .md-content {\n\t-webkit-transform: translateX(20%);\n\t-moz-transform: translateX(20%);\n\t-ms-transform: translateX(20%);\n\ttransform: translateX(20%);\n\topacity: 0;\n\t-webkit-transition: all 0.3s cubic-bezier(0.25, 0.5, 0.5, 0.9);\n\t-moz-transition: all 0.3s cubic-bezier(0.25, 0.5, 0.5, 0.9);\n\ttransition: all 0.3s cubic-bezier(0.25, 0.5, 0.5, 0.9);\n}\n\n.md-show.md-effect-slide-right .md-content {\n\t-webkit-transform: translateX(0);\n\t-moz-transform: translateX(0);\n\t-ms-transform: translateX(0);\n\ttransform: translateX(0);\n\topacity: 1;\n}\n\n/* Effect 3: Slide from the bottom */\n.md-effect-slide-bottom .md-content {\n\t-webkit-transform: translateY(20%);\n\t-moz-transform: translateY(20%);\n\t-ms-transform: translateY(20%);\n\ttransform: translateY(20%);\n\topacity: 0;\n\t-webkit-transition: all 0.3s;\n\t-moz-transition: all 0.3s;\n\ttransition: all 0.3s;\n}\n\n.md-show.md-effect-slide-bottom .md-content {\n\t-webkit-transform: translateY(0);\n\t-moz-transform: translateY(0);\n\t-ms-transform: translateY(0);\n\ttransform: translateY(0);\n\topacity: 1;\n}\n\n/* Effect 4: Newspaper */\n.md-effect-newspaper .md-content {\n\t-webkit-transform: scale(0) rotate(720deg);\n\t-moz-transform: scale(0) rotate(720deg);\n\t-ms-transform: scale(0) rotate(720deg);\n\ttransform: scale(0) rotate(720deg);\n\topacity: 0;\n}\n\n.md-show.md-effect-newspaper ~ .md-overlay,\n.md-effect-newspaper .md-content {\n\t-webkit-transition: all 0.5s;\n\t-moz-transition: all 0.5s;\n\ttransition: all 0.5s;\n}\n\n.md-show.md-effect-newspaper .md-content {\n\t-webkit-transform: scale(1) rotate(0deg);\n\t-moz-transform: scale(1) rotate(0deg);\n\t-ms-transform: scale(1) rotate(0deg);\n\ttransform: scale(1) rotate(0deg);\n\topacity: 1;\n}\n\n/* Effect 5: fall */\n.md-effect-fall.md-modal {\n\t-webkit-perspective: 1300px;\n\t-moz-perspective: 1300px;\n\tperspective: 1300px;\n}\n\n.md-effect-fall .md-content {\n\t-webkit-transform-style: preserve-3d;\n\t-moz-transform-style: preserve-3d;\n\ttransform-style: preserve-3d;\n\t-webkit-transform: translateZ(600px) rotateX(20deg);\n\t-moz-transform: translateZ(600px) rotateX(20deg);\n\t-ms-transform: translateZ(600px) rotateX(20deg);\n\ttransform: translateZ(600px) rotateX(20deg);\n\topacity: 0;\n}\n\n.md-show.md-effect-fall .md-content {\n\t-webkit-transition: all 0.3s ease-in;\n\t-moz-transition: all 0.3s ease-in;\n\ttransition: all 0.3s ease-in;\n\t-webkit-transform: translateZ(0px) rotateX(0deg);\n\t-moz-transform: translateZ(0px) rotateX(0deg);\n\t-ms-transform: translateZ(0px) rotateX(0deg);\n\ttransform: translateZ(0px) rotateX(0deg);\n\topacity: 1;\n}\n\n/* Effect 6: side fall */\n.md-effect-side-fall.md-modal {\n\t-webkit-perspective: 1300px;\n\t-moz-perspective: 1300px;\n\tperspective: 1300px;\n}\n\n.md-effect-side-fall .md-content {\n\t-webkit-transform-style: preserve-3d;\n\t-moz-transform-style: preserve-3d;\n\ttransform-style: preserve-3d;\n\t-webkit-transform: translate(30%) translateZ(600px) rotate(10deg);\n\t-moz-transform: translate(30%) translateZ(600px) rotate(10deg);\n\t-ms-transform: translate(30%) translateZ(600px) rotate(10deg);\n\ttransform: translate(30%) translateZ(600px) rotate(10deg);\n\topacity: 0;\n}\n\n.md-show.md-effect-side-fall .md-content {\n\t-webkit-transition: all 0.3s ease-in;\n\t-moz-transition: all 0.3s ease-in;\n\ttransition: all 0.3s ease-in;\n\t-webkit-transform: translate(0%) translateZ(0) rotate(0deg);\n\t-moz-transform: translate(0%) translateZ(0) rotate(0deg);\n\t-ms-transform: translate(0%) translateZ(0) rotate(0deg);\n\ttransform: translate(0%) translateZ(0) rotate(0deg);\n\topacity: 1;\n}\n\n/* Effect 7:  slide and stick to top */\n.md-effect-sticky-up {\n\ttop: 0;\n\t-webkit-transform: translateX(-50%);\n\t-moz-transform: translateX(-50%);\n\t-ms-transform: translateX(-50%);\n\ttransform: translateX(-50%);\n}\n\n.md-effect-sticky-up .md-content {\n\t-webkit-transform: translateY(-200%);\n\t-moz-transform: translateY(-200%);\n\t-ms-transform: translateY(-200%);\n\ttransform: translateY(-200%);\n\t-webkit-transition: all .3s;\n\t-moz-transition: all .3s;\n\ttransition: all .3s;\n\topacity: 0;\n}\n\n.md-show.md-effect-sticky-up .md-content {\n\t-webkit-transform: translateY(0%);\n\t-moz-transform: translateY(0%);\n\t-ms-transform: translateY(0%);\n\ttransform: translateY(0%);\n\tborder-radius: 0 0 3px 3px;\n\topacity: 1;\n}\n\n\n";

  Qute.css(css);

  var modal_id = 0;

  /**
   */
  var index$1 = Qute("modal", {
  	init: function() {
  		return {
  			animation: null,
  			closeOnEsc: true,
  			closeOnClick: true,
  			disableScroll: true
  		 };
  	},
  	render: function() {
  		return document.createComment('[modal]');
  	},
  	created: function() {
  		var slots = this.$slots;
  		if (!slots || !slots.default) { throw new Error('<modal> requires a content!'); }

  		var self = this;
  		this.modal = new Modal('qute-modal-'+(modal_id++), slots.default, {
  			effect: this.animation,
  			closeOnEsc:this.closeOnEsc,
  			closeOnClick: this.closeOnClick,
  			disableScroll: this.disableScroll,
  			open: function(modal) {
  				self.emit("open", self.modal.el);
  			},
  			close: function(modal) {
  				self.emit("close", self.modal.el);
  			},
  			ready: function(modal) {
  				self.emit("ready", self.modal.el);
  			},
  			action: function(action, target) {
  				self.emit("action", {modal: self.modal.el, name: action, target: target});
  			}
  		});
  	},
  	connected: function() {
  		document.body.appendChild(this.modal.el);
  	},
  	disconnected: function() {
  		document.body.removeChild(this.modal.el);
  	},
  	open: function() {
  		this.modal.open();
  	},
  	close: function() {
  		this.modal.close();
  	}
  }).channel(function(msg) {
  	if (msg === 'open') {
  		this.open();
  	} else if (msg === 'close') {
  		this.close();
  	}
  }).watch('animation', function(value) {
  	this.modal.effect(value);
  	return false;
  }).watch('closeOnEsc', function(value) {
  	this.modal.settings.closeOnEsc = !!value;
  	return false;
  }).watch('closeOnClick', function(value) {
  	this.modal.settings.closeOnClick = !!value;
  	return false;
  }).watch('disableScroll', function(value) {
  	this.modal.settings.disableScroll = !!value;
  	return false;
  });

  //TODO: 1. add position classes to be able to adapt the effects: bottom, top, right, left
  // 2. remove popup.css and use some global animation css?
  // 3. use same api notations and styles with modal.js

  function toBottom(erect, rect, crect, out) {
  	out.top = rect.bottom;
  	if (out.top + erect.height > crect.bottom) { // flip to top
  		out.top = rect.top - erect.height;
  	}
  }

  function toTop(erect, rect, crect, out) {
  	out.top = rect.top - erect.height;
  	if (out.top < crect.top) { // flip to bottom
  		out.top = rect.bottom;
  	}
  }

  function toVStart(erect, rect, crect, out) {
  	out.top = rect.top;
  	if (out.top + erect.height > crect.bottom) { // flip
  		out.top = rect.bottom - erect.height;
  	}
  }

  function toVEnd(erect, rect, crect, out) {
  	out.top = rect.bottom - erect.height;
  	if (out.top < crect.top) { // flip
  		out.top = rect.top;
  	}
  }

  function toVCenter(erect, rect, crect, out) {
  	out.top = rect.top + (rect.height - erect.height) / 2;
  }

  function toRight(erect, rect, crect, out) {
  	out.left = rect.right;
  	if (out.left + erect.width > crect.right) { // flip to left
  		out.left = rect.left - erect.width;
  	}
  }

  function toLeft(erect, rect, crect, out) {
  	out.left = rect.left - erect.width;
  	if (out.left < crect.left) { // flip to right
  		out.left = rect.right;
  	}
  }


  function toHStart(erect, rect, crect, out) {
  	out.left = rect.left;
  	if (out.left + erect.width > crect.right) { // flip
  		out.left = rect.right - erect.width;
  	}
  }

  function toHEnd(erect, rect, crect, out) {
  	out.left = rect.right - erect.width;
  	if (out.left < crect.left) { // flip
  		out.left = rect.left;
  	}
  }

  function toHCenter(erect, rect, crect, out) {
  	out.left = rect.left + (rect.width - erect.width) / 2;
  }



  var POS_FNS = {
  	top: toTop,
  	bottom: toBottom,
  	left: toLeft,
  	right: toRight
  };

  var VALIGN_FNS = {
  	start: toVStart,
  	end: toVEnd,
  	center: toVCenter,
  	top: toTop,
  	bottom: toBottom
  };

  var HALIGN_FNS = {
  	start: toHStart,
  	end: toHEnd,
  	center: toHCenter,
  	left: toLeft,
  	right: toRight
  };



  /*
  * Get the visible client rect contenttaining the target - relative to viewport
  */
  function getVisibleClientRect(target, overflowingParents) {
  	var left=0, top=0, right = window__default.innerWidth, bottom = window__default.innerHeight;
  	if (overflowingParents.length) {
  		for (var i=0,l=overflowingParents.length; i<l; i++) {
  			var parent = overflowingParents[i];
  			// TODO bounding client rect includes the border -> use clientRect to remove border?
  			var prect = parent.getBoundingClientRect();
  			if (prect.left > left) { left = prect.left; }
  			if (prect.right < right) { right = prect.right; }
  			if (prect.top > top) { top = prect.top; }
  			if (prect.bottom < bottom) { bottom = prect.bottom; }
  		}
  	}
  	return {
  		left: left, top: top,
  		right: right, bottom: bottom,
  		width: right-left, height: bottom-top
  	};
  }

  function createPopup(content) {
  	var el = window.document.createElement('DIV');
  	el.className = 'qute-popup';
  	var style = el.style;
  	style.visibility = 'hidden';
  	style.position = 'absolute';
  	style.overflow = 'hidden'; // needed by some effects (e.g. slide in)

  	var contentEl = window.document.createElement('DIV');
  	contentEl.className = 'qute-popup-content';
  	contentEl.style.position = 'relative';
  	el.appendChild(contentEl);

  	if (content.jquery) {
  		contentEl.appendChild(content[0]);
  	} else if (typeof content === 'string') {
  		contentEl.innerHTML = content;
  	} else if (Array.isArray(content)) {
  		for (var i=0, l=content.length; i<l; i++) {
  			contentEl.appendChild(content[i]);
  		}
  	} else { // assume a element
  		contentEl.appendChild(content);
  	}
  	return el;
  }
  /*
   * options: closeOnClick, position, align
   */
  function Popup(content) {
  	this.el = createPopup(content);
  	this.pos = 'bottom';
  	this.align = 'start';
  	this.closeOnClickOpt = true;
  	this.effectName = null;
  }
  Popup.prototype = {
  	update: function(anchor) {
  		if (anchor.jquery) { anchor = anchor[0]; }
  		var crect = getVisibleClientRect(anchor, this.ofs);
  		var rect = anchor.getBoundingClientRect();
  		// if anchor is not hidden by the overflow then hide the popup
  		if (rect.top >= crect.bottom || rect.bottom <= crect.top
  			|| rect.left >= crect.right || rect.right <= crect.left) {
  			this.el.style.visibility = 'hidden';
  			return;
  		}

  		var style = this.el.style;
  		// first check for special modifier 'fill' (before getting the boundingclient rect since setting the height/width will modify the rect)
  		var align = this.align;
  		if (align === 'fill') {
  			if (this.pos ===  'bottom' || this.pos === 'top') {
  				style.width = anchor.offsetWidth+'px';
  			} else {
  				style.height = anchor.offsetHeight+'px';
  			}
  			align = 'start';
  		} else {
  			style.width && (style.width = '');
  			style.height && (style.height = '');
  		}


  		var erect = this.el.getBoundingClientRect(); // we only need width and height
  		var out = {};

  		var posFn = POS_FNS[this.pos];
  		if (!posFn) { throw new Error('Invalid position argument: '+this.pos+'. Expecting: top|bottom|left|right'); }
  		posFn(erect, rect, crect, out);

  		var ALIGN_FNS = out.top == null ? VALIGN_FNS : HALIGN_FNS;
  		var alignFn = ALIGN_FNS[align];
  		if (!alignFn) { throw new Error('Invalid vert align argument: '+align+'. Expecting: '+Object.keys(ALIGN_FNS).join('|')); }
  		alignFn(erect, rect, crect, out);

  		//var className = out.position+' '+out.align;
  		//if (this.className) className = this.className + ' ' + className;
  		//this.el.className = this.c


  		style.left = (out.left + window__default.pageXOffset)+'px';
  		style.top = (out.top + window__default.pageYOffset)+'px';
  		style.visibility = 'visible';

  		return this;
  	},
  	open: function(anchor) {
  		// compute overflowing parents and register scroll listeners
  		if (this.el.parentNode) { // already opened
  			return;
  		}
  		var updating = false, self = this;
  		var updateFn = function() {
  			if (!updating) {
  				window__default.requestAnimationFrame(function() {
  					self.update(anchor);
  					updating = false;
  				});
  				updating = true;
  			}
  		};
  		var ofs = [],
  			body = window.document.body,
  			parent = anchor.parentNode;
  		while (parent && parent !== body) {
  			if (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth) {
  				ofs.push(parent);
  				parent.addEventListener('scroll', updateFn);
  			}
  			parent = parent.parentNode;
  		}
  		window__default.addEventListener('scroll', updateFn);
  		window__default.addEventListener('resize', updateFn);
  		// TODO add resize listener

  		this.ofs = ofs;
  		// add close on click listener
  		var closeOnClick;
  		if (this.closeOnClickOpt) {
  			closeOnClick = function(e) {
  				if (!self.el.contains(e.target)) {
  					self.close();
  				}
  			};

  			window__default.setTimeout(function() {
  				window.document.addEventListener('click', closeOnClick);
  			}, 0);
  		}


  		this.cleanup = function() {
  			if (closeOnClick) {
  				window.document.removeEventListener('click', closeOnClick);
  			}
  			window__default.removeEventListener('resize', updateFn);
  			window__default.removeEventListener('scroll', updateFn);
  			for (var i=0,l=ofs.length; i<l; i++) {
  				ofs[i].removeEventListener('scroll', updateFn);
  			}
  		};

  		this.onOpen && this.onOpen(this);
  		// mount the popup
  		window.document.body.appendChild(this.el);
  		// show it
  		this.update(anchor);
  		this.el.classList.add('qute-show');
  	},
  	close: function() {
  		this.onClose && this.onClose(this);
  		this.cleanup();
  		var el = this.el;
  		el.classList.remove('qute-show');
  		if (this.effectName) {
  			var fn = function() {
  				el.style.visibility = 'hidden';
  				el.parentNode && el.parentNode.removeChild(el);
  				el.removeEventListener('transitionend', fn);
  			};
  			el.addEventListener('transitionend', fn);
  		} else {
  			el.style.visibility = 'hidden';
  			el.parentNode.removeChild(el);
  		}
  	},
  	position: function(position, align) {
  		if (align === undefined) {
  			position = position.trim();
  			var i = position.indexOf(' ');
  			if (i > -1) {
  				align = position.substring(i+1).trim();
  				position = position.substring(0, i);
  			}
  		}
  		this.pos = position;
  		if (align) { this.align = align; }
  		return this;
  	},
  	closeOnClick: function(closeOnClick) {
  		this.closeOnClickOpt = closeOnClick;
  		return this;
  	},
  	effect: function(effect) {
  		this.effectName = effect;
  		this.el.className = effect ? 'qute-popup qute-effect-'+effect : 'qute-popup';
  		return this;
  	}
  };

  var css$1 = "\n.qute-popup.qute-effect-fade .qute-popup-content {\n\topacity: 0;\n\t-webkit-transition: opacity 0.3s;\n\t-moz-transition: opacity 0.3s;\n\t-ms-transition: opacity 0.3s;\n\ttransition: opacity 0.3s;\n}\n.qute-popup.qute-effect-fade.qute-show .qute-popup-content {\n\topacity: 1;\n}\n\n\n.qute-popup.qute-effect-slide .qute-popup-content {\n\t-webkit-transform: translateY(-20%);\n\t-moz-transform: translateY(-20%);\n\t-ms-transform: translateY(-20%);\n\ttransform: translateY(-20%);\n\topacity: 0;\n\t-webkit-transition: opacity 0.3s, transform 0.3s;\n\t-moz-transition: opacity 0.3s, transform 0.3s;\n\t-ms-transition: opacity 0.3s, transform 0.3s;\n\ttransition: opacity 0.3s, transform 0.3s;\n}\n.qute-popup.qute-effect-slide.qute-show .qute-popup-content {\n\t-webkit-transform: translateY(0);\n\t-moz-transform: translateY(0);\n\t-ms-transform: translateY(0);\n\ttransform: translateY(0);\n\topacity: 1;\n}\n";

  Qute.css(css$1);

  /*
  Attributes:

  - animation: optional: is set can be one of fade or slidde
  - position is a string in the form of "position algin" where
  	position is one of: top, bottom, left, right
  	and align is one of: start, end, center, fill, top, bottom, left, right

  	left and right align are only valid for vertical positions.
  	top and bottom align are ony valid for horizontal positions

  - auto-close: boolean - toggle close on click. Defaults to true

  The defaults are: animation: null, position: "bottom start", auto-close: true
  */
  var index$2 = Qute('popup', {
  	init: function init() {
  		return {
  			position: 'bottom start',
  			animation: null,
  			autoClose: true
  		}
  	},
  	render: function() {
  		return document.createComment('[popup]');
  	},
  	created: function() {
  		var slots = this.$slots;
  		if (!slots || !slots.default) { throw new Error('<popup> requires a content!'); }
  		this.popup = new Popup(slots.default).effect(this.animation).position(this.position).closeOnClick(this.autoClose);
  		var self = this;
  		this.popup.onOpen = function() {
  			self.emit("open", self.popup.el);
  		};
  		this.popup.onClose = function() {
  			self.emit("close", self.popup.el);
  		};
  	},
  	open: function(target) {
  		this.popup.open(target);
  	},
  	close: function() {
  		this.popup.close();
  	}
  }).channel(function(msg, data) {
  	if (msg === 'open') {
  		this.open(data);
  	} else if (msg === 'close') {
  		this.close();
  	}
  }).watch('position', function(value) {
  	this.popup.position(value);
  	return false;
  }).watch('animation', function(value) {
  	this.popup.effect(value);
  	return false;
  }).watch('autoClose', function(value) {
  	this.popup.closeOnClick(!!value);
  	return false;
  });

  var css$2 = ".spinner {\n  margin: 0 auto;\n  text-align: center;\n}\n\n.spinner > div {\n  width: 18px;\n  height: 18px;\n  background-color: #333;\n\n  border-radius: 100%;\n  display: inline-block;\n  -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;\n  animation: sk-bouncedelay 1.4s infinite ease-in-out both;\n}\n\n.spinner .bounce1 {\n  -webkit-animation-delay: -0.32s;\n  animation-delay: -0.32s;\n}\n\n.spinner .bounce2 {\n  -webkit-animation-delay: -0.16s;\n  animation-delay: -0.16s;\n}\n\n@-webkit-keyframes sk-bouncedelay {\n  0%, 80%, 100% { -webkit-transform: scale(0) }\n  40% { -webkit-transform: scale(1.0) }\n}\n\n@keyframes sk-bouncedelay {\n  0%, 80%, 100% {\n    -webkit-transform: scale(0);\n    transform: scale(0);\n  } 40% {\n    -webkit-transform: scale(1.0);\n    transform: scale(1.0);\n  }\n}";

  Qute.css(css$2);

  /*
  Qute.register("loader-ellipsis", function($){return $.h("div",{"class":"spinner"},[$.t(" "),$.h("div",{"class":"bounce1"},null),$.t(" "),$.h("div",{"class":"bounce2"},null),$.t(" "),$.h("div",{"class":"bounce3"},null),$.t(" ")]);}, true);






  */

  function updateStyle(div, color, size) {
  	var style = div.style;
  	if (color) { style.backgroundColor = color; }
  	if (size) {
  		style.width = size;
  		style.height = size;
  	}
  }

  var ellipsis = Qute('spinner', function(r, xattrs) {
  	var color = xattrs && xattrs.color;
  	var size = xattrs && xattrs.size;

  	var loader = window.document.createElement('DIV');
  	loader.className = 'spinner';

  	var div = window.document.createElement('DIV');
  	updateStyle(div, color, size);
  	div.className = 'bounce1';
  	loader.appendChild(div);

  	div = window.document.createElement('DIV');
  	updateStyle(div, color, size);
  	div.className = 'bounce2';
  	loader.appendChild(div);

  	div = window.document.createElement('DIV');
      updateStyle(div, color, size);
  	div.className = 'bounce3';
  	loader.appendChild(div);

  	return loader;
  });

  return Qute;

}(window));
//# sourceMappingURL=qute-all-0.9.3.js.map
