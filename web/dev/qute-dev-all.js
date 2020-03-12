var Qute = (function (window$1) {
  'use strict';

  var window$1__default = 'default' in window$1 ? window$1['default'] : window$1;

  /* Polyfill from https://developer.mozilla.org/en-US/docs/Web/API/Element/classList */

  // removed polyfill code for IE7-8 the target is IE>=9
  if (!window$1__default.DOMException) { (window$1__default.DOMException = function(reason) {
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
  if (typeof window$1__default.DOMTokenList !== "function") {
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
      window$1__default.DOMTokenList = DOMTokenList;

      var whenPropChanges = function() {
          var evt = window$1__default.event,
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
      window$1__default.Object.defineProperty(window$1__default.Element.prototype, "classList", {
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
  var DOMTokenListProto = window$1__default.DOMTokenList.prototype;
  var testClass = window$1__default.document.createElement("div").classList;
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

  if ( typeof window$1__default.CustomEvent !== "function" ) {
  	window$1__default.CustomEvent = function ( event, params ) {
  		params = params || { bubbles: false, cancelable: false, detail: null };
  		var evt = window$1__default.document.createEvent( 'CustomEvent' );
  		evt.initCustomEvent( event, params.bubbles, params.cancelable, params.detail );
  		return evt;
  	};
  }

  /**
   * Polyfill from https://developer.mozilla.org/en-US/docs/Web/API/Element/matches
   */

  // matches polyfill
  var Element = window$1__default.Element;
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
  			window$1__default.setTimeout(function() {
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
  		window$1__default.setTimeout(function() { self.post(topic, msg, data); }, 0);
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
  			var newEvent = new window$1__default.CustomEvent(toEvent, {
  				bubbles: e.bubbles,
  				detail: detailFn ? detailFn(model) : e
  			});
  			newEvent.$originalEvent = e;
  			newEvent.$originalTarget = el;
  			e.stopImmediatePropagation();
  			e.preventDefault();
  			if (isAsync) {
  				window$1__default.setTimeout(function() {
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
  		this.$el.dispatchEvent(new window$1__default.CustomEvent(event, {bubbles: true, detail: data === undefined ? this : data }));
  	},
  	emitAsync: function(event, data, timeout) {
  		var self = this;
  		window$1__default.setTimeout(function() { self.emit(event, data); }, timeout || 0);
  	}
  };

  // el is defined only when called on a DOM element
  function applyUserDirectives(rendering, tag, xattrs, compOrEl) {
  	var xcall, fns = [], directives = xattrs.$use;
  	for (var key in directives) {
  		var val = directives[key];
  		if (key === '@') { // an x-call
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
  	this.start = window$1.document.createComment('[x-if]');
  	this.end = window$1.document.createComment('[/x-if]');
  }

  ListFragment.prototype = {
  	$create: function $create() {
  		var frag = window$1.document.createDocumentFragment();
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
  	this.start = window$1.document.createComment('['+name+']');
  	this.end = window$1.document.createComment('[/'+name+']');
  }

  SwitchFragment.prototype = {
  	$create: function $create() {
  		var frag = window$1.document.createDocumentFragment();
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
  	this.start = window$1.document.createComment('[for]');
  	this.end = window$1.document.createComment('[/for]');
  }

  ForFragment.prototype = {
  	$create: function $create() {
  		var frag = window$1.document.createDocumentFragment();
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
  						// otherwise we loose the reactivity on func tags 'x-attrs' attribute
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

  		// apply root bindings if any (x-class, x-style or x-show)
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
  		var el = window$1.document.createTextNode(text);
  		this.up(SetText(el, this.model, expr));
  		return el;
  	},
  	t: function(value) { // text
  		return window$1.document.createTextNode(value);
  	},
  	g: function(isFn, xattrs, children) { // dynamic tag using 'is'
  		var tag = isFn(this.model);
  		var XTag = getVMOrTag(tag);
  		return XTag ? this.v(XTag, xattrs, children) : this.h(tag, xattrs, children);
  	},
  	h: function(tag, xattrs, children) { // dom node
  		var el = window$1.document.createElement(tag), $use = null;
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
  						ERR("x-channel cannot be used on regular DOM elements: %s", tag);
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
  			var frag = window$1.document.createDocumentFragment();
  			appendChildren(frag, children);
  			return frag;
  		}
  		return window$1.document.createComment('[slot/]'); // placeholder
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
  			console.warn("Reactive list used without a 'x-key' attribute: Performance will suffer!");
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
  		if (!this.$channel) { ERR("x-channel used on a VM not defining channels: %s", this.$tag); }
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
  						//TODO DO WE NEED to add an update fn? x-attrs are static
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
  		var el = this.render(rendering) || window$1.document.createComment('<'+this.$tag+'/>');
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
  			target = typeof elOrId === 'string' ? window$1.document.getElementById(elOrId) : elOrId;
  		} else {
  			target = window$1.document.body;
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
  	var doc = window$1__default.document;
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

  function splitList(text) {
  	if (!text) { return undefined; }
  	text = text.trim();
  	if (!text) { return undefined; }
  	var rx = text.indexOf(',') > -1 ? /\s*,\s*/ : /\s+/;
  	return makeSymbols(text.split(rx));
  }

  function makeSymbols(keys) {
  	return keys.reduce(function(acc, value) {
  		acc[value] = true;
  		return acc;
  	}, {});
  }

  function ERR$1(msg) {
  	throw new Error(msg);
  }

  var ATTR_KEY = /\s*([A-Za-z0-9_@#\?:-]+)(\s*=\s*)?/g;
  var ATTR_V_Q = /\\*'/g;
  var ATTR_V_DQ = /\\*"/g;
  var ATTR_V_EXPR = /\{|\}/g;
  var WS = /\s+/g;

  function parseQuotedAttrValue(rx, text, index, attr) {
      rx.lastIndex = index+1;
      var m = rx.exec(text);
      while (m) {
          if (m[0].length & 1) { // odd
              // end of quoted string
              attr.value = text.substring(index+1, rx.lastIndex-1);
              return rx.lastIndex;
          } // else continue
          m = rx.exec(text);
      }
      var qlabel = rx === ATTR_V_DQ ? "double quoted" : "quoted";
      throw new Error('Unmatched end quote for '+qlabel+' attribute value: "'+ text+'" at index '+index);
  }

  function parseExprAttrValue(text, index, attr) {
      ATTR_V_EXPR.lastIndex = index+1;
      var open = 1, m = ATTR_V_EXPR.exec(text);
      while (m) {
          if (m[0].charCodeAt(0) === 123) { // a {
              open++;
          } else { // a }
              open--;
          }
          if (!open) {
              attr.expr = true;
              attr.value = text.substring(index+1, ATTR_V_EXPR.lastIndex-1);
              return ATTR_V_EXPR.lastIndex;
          }
          m = ATTR_V_EXPR.exec(text);
      }
      throw new Error('Unmatched end curly brace for expression attribute value: "'+ text+'" at index '+index);
  }

  function parseUnquotedAttrValue(text, index, attr) {
      WS.lastIndex = index;
      var m = WS.exec(text);
      if (m) {
          attr.value = text.substring(index, m.lastIndex);
          return m.lastIndex;
      } else {
          attr.value = text.substring(index);
          return text.length;
      }
  }

  function parseAttrValue(text, index, attr) {
      var first = text.charCodeAt(index);
      if (first === 34) { // "
          return parseQuotedAttrValue(ATTR_V_DQ, text, index, attr);
      } else if (first === 39) { // '
          return parseQuotedAttrValue(ATTR_V_Q, text, index, attr);
      } else if (first === 123) { // {
          return parseExprAttrValue(text, index, attr);
      } else { // stop at first whitespace
          return parseUnquotedAttrValue(text, index, attr);
      }
  }

  function parseAttrs(text, from) {
      text = text.trim();
      if (!text) { return []; }

      var attrs = [], lastIndex = from || 0;
      ATTR_KEY.lastIndex = lastIndex;
      var m = ATTR_KEY.exec(text);
      while (m) {
          var attr = { name: m[1], value: null, expr: false };
          if (m[2]) { // read value
              ATTR_KEY.lastIndex = parseAttrValue(text, ATTR_KEY.lastIndex, attr);
          } else { // boolean attr
              attr.value = true;
              var c = text[ATTR_KEY.lastIndex];
          }
          attrs.push(attr);
          lastIndex = ATTR_KEY.lastIndex;
          m = ATTR_KEY.exec(text);
      }
      if (lastIndex < text.length) {
          var lastAttr = attrs.length ? attrs[attrs.length-1] : null;
          if (lastAttr) { lastAttr = lastAttr.name+'='+lastAttr.value; } else { lastAttr = 'N/A'; }
          throw new Error('Invalid attributes in "'+text+'" . Last parsed attribute: "'+lastAttr+'"');
      }
      return attrs;
  }

  // A regex HTML PARSER extended to support special attr names (inspired from https://johnresig.com/blog/pure-javascript-html-parser/)

  var STAG_RX = /^<([-A-Za-z0-9_:]+)((?:\s+[-\w@#\?:]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|(?:\{.*\})|[^>\s]+))?)*)\s*(\/?)>/,
      ETAG_RX = /^<\/([-A-Za-z0-9_:]+)[^>]*>/;

  var voids = {else:true, case:true, area:true, base:true, br:true, col:true, embed:true, hr:true, img:true, input:true, link:true, meta:true, param:true, source:true, track:true, wbr:true};

  function parseHTML(html, handler) {
      function handleStartTag(tagName, attrsDecl, isVoid) { // void elements are tags with no close tag
          tagName = tagName.toLowerCase();
          isVoid = isVoid || voids[tagName];
          if (!isVoid) { stack.push(tagName); }

          var attrs = parseAttrs(attrsDecl);

          handler.start(tagName, attrs, !!isVoid);
      }

      function handleEndTag(tagName) {
          tagName = tagName.toLowerCase();
          var top = stack.pop();
          if (top !== tagName) { throw new Error('Unmatched close tag. Current Open tag is <'+top+'> but found </'+tagName+'>') }
          handler.end(tagName);
      }

      var text = '', match = null, stack = [];
      while (html) {
          var i = html.indexOf('<');
          if (i === -1) {
              text += html;
              html = null; // exit
          } else if (i > 0) {
              text += html.substring(0, i);
              html = html.substring(i);
          } else { // i === 0
              var c = html.charAt(i+1);
              if (c === '!' && html.substring(i+2, i+4) === '--') { // <!--
                  if (text && handler.text) { handler.text(text); text = ''; }
                  var k = html.indexOf('-->', i+3);
                  if (k === -1) {
                      throw new Error('Parse error: comment not closed');
                  }
                  if (handler.comment) { handler.comment(html.substring(i+3, k)); }
                  html = html.substring(k+3);
              } else if (c === '/' && (match = ETAG_RX.exec(html))) { // end tag
                  if (text && handler.text) { handler.text(text); text = ''; }
                  html = html.substring(i+match[0].length);
                  handleEndTag(match[1]);
              } else if (match = STAG_RX.exec(html)) { // start tag
                  if (text && handler.text) { handler.text(text); text = ''; }
                  html = html.substring(i+match[0].length);
                  handleStartTag(match[1], match[2], match[3]);
              } else { // not a html tag
                  // get the next <
                  var next = html.indexOf('<', i+1);
                  if (next === -1) {
                      text += html;
                      html = null;
                  } else {
                      text += html.substring(i, next);
                      html = html.substring(next);
                  }
              }
          }
      }
      if (text && handler.text) { handler.text(text); }
      if (stack.length > 0) {
          throw new Error("Unclosed tag: "+stack[0]);
      }
  }

  /**
   * Transform jsq files to js files
   * No map file is required since the transformation preserve original code lines
   */


  var TAG_RX = /(?:^|\n)\s*<(?:(x-tag)|(x-style))(\s+[^>]*)?>/;
  var TAG_END_RX = /\s*<\/(?:(x-tag)|(x-style))\s*>/;
  var ATTR_RX = /([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;
  var CNT_LINES_RX = /\n/g;

  function getTagName(match) {
      if (match[1]) { return 'x-tag'; }
      if (match[2]) { return 'x-style'; }
      ERR$1("Bug?");
  }


  function parseAttrs$1(attrsDecl) {
      var attrs = {};
      ATTR_RX.lastIndex = 0;
      var m = ATTR_RX.exec(attrsDecl);
      while (m) {
          // preserve empty values like: "" or ''. If attribute with no value then the boolean true is used as the value
          attrs[m[1]] = m[2] != null ? m[2] : (m[3] != null ? m[3] : (m[4] != null ? m[4] : true));
          m = ATTR_RX.exec(attrsDecl);
      }
      return attrs;
  }

  function newLines(text) { // remove any characters but new lines from given text
  	var ar = text.match(CNT_LINES_RX);
      return ar ? ar.join('') : '';
  }

  function parseXTags(source, handler) {
      var m = TAG_RX.exec(source);
      while (m) {
      	var lfs = newLines(m[0]);
          var partText = source.substring(0, m.index);
          if (partText) {
              handler.text(partText+lfs);
          }
          source = source.substring(m.index+m[0].length);
          var stag = getTagName(m);
          var attrs = m[3];
          if (attrs) { attrs = attrs.trim(); }
          m = TAG_END_RX.exec(source);
          if (!m) { ERR$1(("Invalid qute file: No closing </" + stag + "> found.")); }

          var etag = getTagName(m);
          if (etag !== stag) { ERR$1(("Invalid qute file: Found closing tag '" + etag + "'. Expecting '" + stag + "'")); }

          partText = source.substring(0, m.index);
          handler.tag(stag, attrs ? parseAttrs$1(attrs) : null, partText);

          source = source.substring(m.index+m[0].length);
          m = TAG_RX.exec(source);
      }
      // scan for imports on the remaining text
      if (source)  {
          handler.text(source);
      }
  }


  // ======================= transform JSQ to JS =====================

  function handleTemplate(compiler, attrs, text) {
  	if (!attrs || !attrs.name) { ERR$1("x-tag attribute 'name' is required"); }
      var name = attrs.name;
      //var fname = kebabToCamel(name);
      var imports = attrs.import || null;

      var compiledFn = compiler.compile(text, splitList(imports));
      return 'Qute.register("'+name+'", '+compiledFn+', true);\n';
  }

  function handleStyle(compiler, attrs, text) {
      return 'Qute.css('+JSON.stringify(text.trim())+');\n';
  }

  function transpile(compiler, source, opts) {
      // We do not validate source -> If the source is not including a import Qute from ... then
      // a syntgax error will be trown by javascript (since Qute symbol will not be found)

  	var out = '';
      parseXTags(source, {
          tag: function(tag, attrs, text) {
              if (text) {
                  if (tag === 'x-tag') {
                      out += handleTemplate(compiler, attrs, text);
                  } else if (tag === 'x-style') {
                      out += handleStyle(compiler, attrs, text);
                  } else {
                  	ERR$1(("Unsupported tag: '" + tag + "'"));
                  }
                  if (!(opts && opts.removeNewLines)) { out += newLines(text); }
              }
          },
          text: function(text) {
          	if (text) {
                  // js can be used to transform fragments
                  out += opts && opts.js ? opts.js(text) : text;
              }
          }
      });

      return out;
  }

  /*
    cb is a callback which will be called when an xtag was parsed:
    cb(xtagName, xtagFn, isCompiled)
   */
  function loadXTags(compiler, source, cb) {
      parseXTags(source, {
          tag: function(tag, attrs, text) {
              if (tag !== 'x-tag') { ERR$1(("Unsupported tag: '" + tag + "'")); }
              if (!attrs || !attrs.name) { ERR$1("x-tag attribute 'name' is required"); }
              var fn = compiler.compileFn(text, splitList(attrs.import));
              cb(attrs.name, fn, !attrs.static);
          },
          text: function(){} // ignore
      });
  }

  var HTML_ENT_MAP = {
  	"amp":   0x0026,
  	"lt":    0x003C,
  	"gt":    0x003E,
  	"nbsp":  0x00A0,
  	"copy":  0x00A9,
  	"laquo": 0x00AB,
  	"reg":   0x00AE,
  	"raquo": 0x00BB,
  	"times": 0x00D7,
  	"bull":  0x2022
  };

  /*
  attrs: {key: value, $, @}

  h(tag, attrs[, bindings, events], children) - output dom node
  v(expr) - variable text
  t(text) - static text
  f(list, item, index, hasNext, node) - for
  x(expr, ifFragment, elseFragment) - if
  c(tag, attrs, children) - view
  */



  /*
  1. Rewrite var names inside a literal object representation: we need to avoid rewriting words inside simple or double quoted strings or unquoted keys (which looks like vars)

  QSTR:
  '(?:\\.|[^'])*'
  DQSTR:
  "(?:\\.|[^"])*"
  VAR:
  [a-zA-Z_\$][0-9a-zA-Z_\$]*
  KEY:
  [\{,]\s*[a-zA-Z_\$][0-9a-zA-Z_\$]*\s*\:

  ((?:QSTR)|(?:DQSTR)|(?:KEY))|(VAR)
  => p1: ignore (String or key), p2: var

  2. Rewrite var names in expressions (no literal obj reprentation)
  We can do this using the same regex as above like this:
  ((?:QSTR)|(?:DQSTR))|(VAR)
  => p1: ignore (String), p2: var
  */
  var VAR_RX = /^[a-zA-Z_\$][0-9a-zA-Z_\$]*$/;
  var EXPR_RX = /((?:'(?:\\.|[^'])*')|(?:"(?:\\.|[^"])*"))|([a-zA-Z_\$][0-9a-zA-Z_\$\.]*)/g;
  var OBJ_RX = /((?:'(?:\\.|[^'])*')|(?:"(?:\\.|[^"])*")|(?:[\{,]\s*[a-zA-Z_\$][0-9a-zA-Z_\$\.]*\s*\:))|([a-zA-Z_\$][0-9a-zA-Z_\$\.]*)/g;

  var ARROW_FN_RX = /^(\(?)\s*((?:[a-zA-Z_$][a-zA-Z_$0-9]*)(?:\s*,\s*[a-zA-Z_$][a-zA-Z_$0-9]*)*)(\)?)\s*=>\s*(.*)$/;
  // nested is a special tag we added for convenience in the regular html tags - it is used as a more meaningful replacement of template or div
  var HTML_TAGS = makeSymbols("nested html head meta link title base body style nav header footer main aside article section h1 h2 h3 h4 h5 h6 div p pre blockquote hr ul ol li dl dt dd span a em strong b i u s del ins mark small sup sub dfn code var samp kbd q cite ruby rt rp br wbr bdo bdi table caption tr td th thead tfoot tbody colgroup col img figure figcaption map area video audio source track script noscript object param embed iframe canvas abbr address meter progress time form button input textarea select option optgroup label fieldset legend datalist menu output details summary command keygen acronym applet bgsound basefont big center dir font frame frameset noframes strike tt xmp template".split(" "));

  var HTML_ENT_RX = /&(?:([a-zA-Z]+)|(#[0-9]+)|(#x[abcdefABCDEF0-9]+));/g;

  function _html_ent(text) {
  	if (!text) { return text; }
  	return text.replace(HTML_ENT_RX, function(m, p1, p2, p3) {
  		var code = null;
  		if (p1) {
  			// loookup in entities table
  			code = HTML_ENT_MAP[p1];
  		} else if (p2) {
  			code = parseInt(p2.substring(1));
  		} else if (p3) {
  			code = parseInt('0'+p3.substring(1), 16);
  		}
  		return isNaN(code) ? m : String.fromCharCode(code);
  	});
  }

  function _s(val) {
      return JSON.stringify(val);
  }

  function _key(match) {
  	var i = match.indexOf('.');
  	return i > 0 ? match.substring(0,i) : match;
  }
  // write expr (without literal objects) by rewriting vars
  function __x(expr, ctx) {
      return expr.replace(EXPR_RX, function(match, p1, p2) {
      	if (!p2) { return match; }
      	if (p2 === 'this') { // replace by '_'
      		return '_';
      	} else if (p2.startsWith('this.')) {
      		return '_'+p2.substring(4);
      	}
      	return !ctx.symbols[_key(match)] ? '_.'+p2 : match;
      });
  }
  function _x(expr, ctx) {
      return '(' + __x(expr, ctx) + ')';
  }
  // write literal object by rewriting vars
  function _o(expr, ctx) {
      return '(' + expr.replace(OBJ_RX, function(match, p1, p2) {
      	if (!p2) { return match; }
      	if (p2 === 'this') { // replace by '_'
      		return '_';
      	} else if (p2.startsWith('this.')) {
      		return '_'+p2.substring(4);
      	}
      	return !ctx.symbols[_key(match)] ? '_.'+p2 : match;
      }) + ')';
  }
  function _xo(expr, ctx) {
  	if (expr == null) { return 'null'; }
  	var c = expr.charAt(0);
  	return (c === '{' || c === '[' ? _o : _x)(expr, ctx);
  }
  // used to wrap a compiled expr in a lambda function
  function _v(expr) {
  	return 'function(_){return '+expr+'}';
  }
  function _r(expr) { // a sub-rendering context fn
  	return 'function($){return '+expr+'}';
  }

  function getArrowFn(expr, ctx) {
  	var m = ARROW_FN_RX.exec(expr);
  	if (m) {
  		var open = m[1];
  		var args = m[2].trim();
  		var close = m[3];
  		var body = m[4].trim();

  		if (!!open !== !!close) {
  			ERR$1('Invalid arrow function syntax: '+expr);
  		}
  		if (!body) {
  			ERR$1('Invalid arrow function syntax: '+expr);
  		}
  		// 123 = { and 125 = }
  		var bs = body.charCodeAt(0);
  		var be = body.charCodeAt(body.length-1);
  		if (bs === 123) {
  			if (be !== 125) {
  				ERR$1('Invalid arrow function syntax: '+expr);
  			} // else body is in the form { ... }
  		} else if (be === 125) {
  			ERR$1('Invalid arrow function syntax: '+expr);
  		} else { // no { ... }
  			body = '{'+body+';}';
  		}
  		// push in ctx.symbols  the local vars
  		var symbols = ctx.symbols;
  		var localSymbols = Object.assign({},symbols);
  		args.split(/\s*,\s*/).forEach(function (key) { localSymbols[key] = true; });
  		ctx.symbols = localSymbols;
  		var r = '(function('+args+')'+__x(body, ctx)+')($1,_)'; // call the inline fn with the _ (this) and the $1 argument
  		ctx.symbols = symbols; // restore symbols
  		return r;
  		// pop from ctx symbols the local vars
  	}
  	return null;
  }
  // write a callback (e.g. they are used by events)
  // if the event is a var name => we generate a fn: function(e) { expr(e) }
  // otherwise we generate a function: function() { expr }
  function _cb(expr, ctx) {
  	if (VAR_RX.test(expr)) {
  		// event listeners will be called with args:
  		// 1. for functions: VM.callback(event) - where this is the VM
  		// 2. for vm methods: VM.callback(event) - where this is the VM
  		// 3. for expressions: $1 - the event, this - the vm
  		// the event cb function must always be called with the element as the 'this' object
  		if (ctx.imports[expr]) { // an imported function
  			return "function($1){return "+expr+".call(this, $1)}";
  		} else { // a vm method
  			return "function($1){return this."+expr+"($1)}";
  		}
  	} else {
  		var arrowFn = getArrowFn(expr, ctx);
  		if (arrowFn) {
  			//return "function(this,$1){"+arrowFn+"}";
  			return "function($1){var _=this;"+arrowFn+"}";
  		} else {
  			return "function($1){var _=this;"+_x(expr, ctx)+"}";
  		}
  	}
  }

  function _fn(name) {
  	//TODO '$' must not be used as a for argument!!
  	var r = '$.'+name+'(';
  	if (arguments.length>1) {
  		r += Array.prototype.slice.call(arguments, 1).join(',');
  	}
  	return r+')';
  }
  function _node(xattrs, ctx) {
  	return xattrs ? xattrs.compile(ctx) : 'null';
  }
  function _nodes(children, ctx) {
  	if (!children || !children.length) { return 'null'; }
  	return '['+children.map(function(child) {
  		return child.compile(ctx);
  	}).join(',')+']';
  }
  /*
  function _bindings(bindings, ctx) {
  	var out = [];
  	for (var key in bindings) {
  		out.push(_s(key)+':'+_v(_xo(bindings[key], ctx)));
  	}
  	return out.length ? '{'+out.join(',')+'}' : null;
  }
  */
  /*
  function _bindings(bindings, ctx) {
  	var out = [];
  	for (var key in bindings) {
  		out.push(_s(key)+':'+_xo(bindings[key], ctx));
  	}
  	return out.length ? _v('{'+out.join(',')+'}') : null;
  }
  */
  function _events(events, ctx) {
  	var out = [];
  	for (var key in events) {
  		out.push(_s(key)+':'+_cb(events[key], ctx));
  	}
  	return out.length ? '{'+out.join(',')+'}' : null;
  }
  function _directives(directives, ctx) { // apply custom directives
  	var out = [];
  	for (var key in directives) {
  		// we store the attr itself - we need to know if the directive value is an expression or not using expr
  		var val, attr = directives[key];
  		if (key === '@') {
  			// @ is used for x-call
  			val = _cb(attr.value, ctx);
  		} else if (attr.expr) {
  			val = _v(_xo(attr.value, ctx));
  		} else {
  			var attrVal = attr.value;
  			var first = attrVal[0], last = attrVal[attrVal.length-1];
  				if ((first === '{' && last === '}') || (first === '[' && last === ']')) {
  				// an object?
  				val = _o(attrVal);
  			} else {
  				val = _s(attrVal);
  			}
  		}
  		out.push(_s(key)+':'+val);
  	}
  	return out.length ? '{'+out.join(',')+'}' : null;
  }
  /*
  function _attrs(attrs) {
  	var out = null;
  	if (attrs) {
  		out = [];
  		for (var key in attrs) {
  			out.push(_s(key)+':'+_s(attrs[key]));
  		}
  	}
  	return out && out.length ? '{'+out.join(',')+'}' : 'null';
  }
  */
  /*
  ol impl which compile each binding as a function
  function _xattrs(bindings, events, ctx) {
  	var out = null;
  	if (bindings) {
  		out = [];
  		for (var key in bindings) {
  			// TODO use v(..) only if not a literal to optimize literal assignment like boolean or number (do not enclose in a function)
  			out.push(_s(key)+':'+_v(_xo(bindings[key], ctx)));
  		}
  	}
  	if (events) {
  		out || (out = []);
  		var v = _events(events, ctx);
  		if (v) out.push('"$on":'+v);
  	}
  	return out && out.length ? '{'+out.join(',')+'}' : 'null';
  }
  */
  function _xattrs(attrs, bindings, xattrs, directives, events, ctx) {
  	var out = null;
  	if (attrs) {
  		out = [];
  		for (var key in attrs) {
  			out.push(_s(key)+':'+_s(attrs[key]));
  		}
  	}
  	if (bindings) {
  		out || (out = []);
  		for (var key in bindings) {
  			out.push(_s(key)+':'+_v(_xo(bindings[key], ctx)));
  		}
  	}
  	if (xattrs) {
  		out || (out = []);
  		for (var key in xattrs) {
  			var val;
  			if (key === '$attrs') {
  				val = xattrs[key];
  			} else if (key === '$toggle') { // toggle is an object
  				var ar = [];
  				var $toggle = xattrs[key];
  				for (var k in $toggle) {
  					ar.push(_s(k)+':'+_xo($toggle[k], ctx));
  				}
  				val =_v('{'+ ar.join(',')+'}');
  			} else if (key === '$emit') {
  				var $emit = xattrs[key];
  				var emitOut = [];
  				for (var i=0,l=$emit.length; i<l; i+=4) {
  					var detail = $emit[i+2];
  					emitOut.push(
  						_s($emit[i]),
  						_s($emit[i+1]),
  						detail ? _v(_xo(detail, ctx)) : _s(detail), _s(!!$emit[i+3])
  					);
  				}
  				val = "["+emitOut.join(',')+"]";
  			} else {
  				val = _v(_xo(xattrs[key], ctx));
  			}
  			out.push(_s(key)+':'+val);
  		}
  	}
  	if (directives) {
  		out || (out = []);
  		var v = _directives(directives, ctx);
  		if (v) { out.push('"$use":'+v); } // extra directives
  	}
  	if (events) {
  		out || (out = []);
  		var v = _events(events, ctx);
  		if (v) { out.push('"$on":'+v); }
  	}
  	return out && out.length ? '{'+out.join(',')+'}' : 'null';
  }

  function attrValue(attr) {
  	return attr.value === true ? attr.name : attr.value;
  }

  function RootNode() {
  	this.name = 'root';
  	this.children = [];
  	this.append = function(child) {
          this.children.push(child);
  	};
  	this.lastChild = function() {
  		return this.children[this.children.length-1];
  	};
  	this.compile = function(ctx) {
  		var children = this.children;
  		if (children.length !== 1) { ERR$1("the root node must have a single children element"); }
  		return this.children[0].compile(ctx);
  	};
  	// trim the children (remove trailing and leading blank nodes)
  	this.trim = function() {
  		var children = this.children;
  		if (children.length > 1) {
  			var child = children[0];
  			if (child instanceof TextNode && child.isBlank) { children.shift(); }
  			child = children[children.length-1];
  			if (child instanceof TextNode && child.isBlank) {
  				child.pop();
  			}
  		}
  		return this;
  	};
  }

  function DomNode(name, attrs) {
  	this.name = name;
  	this.attrs = null;
  	this.bindings = null;
  	this.xattrs = null; // directives like x-show
  	// for future use (not yet used)
  	// directives are custom attrs that can be  contirbuted by apps
  	// They are treated like xattrs but are output as is (as they are encoded at read time)
  	this.directives = null;
  	this.events = null;
  	this.children = [];

  	this.attr = function(name, value) {
  		if (!this.attrs) { this.attrs = {}; }
  		this.attrs[name] = value;
  	};
  	this.bind = function(name, value) {
  		var bindings = this.bindings || (this.bindings = {});
  		bindings[name] = value.trim();
  	};
  	this.toggle = function(name, value) {
  		if (!this.xattrs) { this.xattrs = {}; }
  		var xattrs = this.xattrs;
  		if (!xattrs.$toggle) { xattrs.$toggle = {}; }
  		xattrs.$toggle[name] = value;
  	};
  	this.xattr = function(name, value) {
  		if (!this.xattrs) { this.xattrs = {}; }
  		this.xattrs[name] = value.trim();
  	};
  	this.directive = function(name, value) {
  		if (!this.directives) { this.directives = {}; }
  		this.directives[name] = value === true ? "true" : value;
  	};
  	this.emit = function(name, value, isAsync) {
  		var i = name.indexOf('@');
  		if (i < -1) {
  			i = name.indexOf(':');
  		}
  		var eventName = name;
  		var targetEvent = name;
  		if (i > -1) {
  			// use the same name for source event and target event
  			eventName = name.substring(0, i);
  			targetEvent = name.substring(i+1);
  		} // else use the same name for source and targetg events
  		if (!this.xattrs) { this.xattrs = {}; }
  		var xattrs = this.xattrs;
  		if (!xattrs.$emit) {
  			xattrs.$emit = [];
  		}
  		xattrs.$emit.push(eventName, targetEvent, value === true ? null : value, isAsync);
  	};
  	this.on = function(name, value) {
  		var events = this.events || (this.events = {});
  		events[name] = value.trim();
  	};

  	this.append = function(node) {
  		this.children.push(node);
  	};

  	this.compile = function(ctx) {
  		if (this.name === 'tag' || this.name === 'q:tag') {
  			var isAttr, attrs = this.attrs, bindings = this.bindings;
  			if (bindings && bindings.is) {
  				isAttr = _v(_x(bindings.is, ctx));
  				delete bindings.is;
  			}
  			if (!isAttr && attrs && attrs.is) {
  				isAttr = _v(_x(attrs.is, ctx));
  				delete attrs.is;
  			}
  			if (!isAttr) {
  				ERR$1("<tag> requires an 'is' attribute");
  			}

  			return _fn('g', isAttr, // g from tag
  				//_attrs(this.attrs),
  				_xattrs(this.attrs, this.bindings, this.xattrs, this.directives, this.events, ctx),
  				_nodes(this.children, ctx));
  		}
  		if (this.name === 'view' || this.name === 'q:view') {
  			var isAttr, attrs = this.attrs, bindings = this.bindings;
  			if (bindings && bindings.is) {
  				isAttr = _v(_x(bindings.is, ctx));
  				delete bindings.is;
  			}
  			if (!isAttr && attrs && attrs.is) {
  				isAttr = _v(_x(attrs.is, ctx));
  				delete attrs.is;
  			}
  			if (!isAttr) {
  				ERR$1("<view> requires an 'is' attribute");
  			}

  			var noCache = 'false';
  			var onChange = 'null';
  			if (attrs) {
  				if ('x-nocache' in attrs) {
  					delete attrs['x-nocache'];
  					noCache = 'true';
  				}
  				if ('x-change' in attrs) {
  					onChange = _cb(attrs['x-change'], ctx);
  					delete attrs['x-change'];
  				}
  			}
  			return _fn('w', // w from view ?
  				isAttr,
  				onChange,
  				noCache,
  				_xattrs(this.attrs, this.bindings, this.xattrs, this.directives, this.events, ctx), //xattrs
  				_r(_nodes(this.children, ctx)) // childrenFn
  			);
  		}
  		var fname, tag;
  		//if (ctx.isXTag(this.name))
  		if (this.name in HTML_TAGS) { // a dom element
  			fname = 'h'; // h from html
  			tag = _s(this.name);
  		} else { // a component
  			var tag = ctx.resolve(this.name);
  			if (tag) { // resolved compile time
  				fname = 'v'; // v from view model
  			} else { // should resolve at runtime
  				fname = 'r'; // r from runtime
  				tag = _s(this.name);
  			}
  		}
  		if (this.name==='pre') {
  			ctx = ctx.push();
  			ctx.pre = true;
  		}
  		return _fn(fname, tag,
  			//_attrs(this.attrs),
  			_xattrs(this.attrs, this.bindings, this.xattrs, this.directives, this.events, ctx),
  			_nodes(this.children, ctx));
  	};

  	this.xcontent = function(type, attr) {
  		if (attr.value === true) {
  			return new StaticNode(this, type);
  		} else {
  			//TODO: use type ...
      		this.xattr('$html', attr.value);
      	}
      	return this;
  	};

  	function parseXAttrs(val) {
  		if (val === true) { return 'null'; }
  		var first = true;
  		if (val.charCodeAt(0) === 33) { // a ! -> exclude rule
  			val = val.substring(1);
  			first = false;
  		}
  		var ar;
  		val = val.trim();
  		if (val.indexOf(',') > -1) {
  			ar = val.split(/\s*,\s*/);
  		} else {
  			ar = val.split(/\s+/);
  		}
  		ar.unshift(first); // insert the filter type (true for inclusion, false for exclusion) as the first item
  		return _s(ar);
  	}

  	this.parseAttrs = function(attrs) {
  		var r = this;
  		for (var i=0,l=attrs.length; i<l; i++) {
  	    	var attr = attrs[i];
  	    	var name = attr.name;
  	        var c = name[0];
  	        if (c === ':') {
  	        	this.bind(name.substring(1), attr.value);
  	        } else if (c === '@') {
  	        	this.on(name.substring(1), attr.value);
  	        } else if (c === '?') { // x-toggle alias
  	        	this.toggle(name.substring(1), attr.value);
  	        } else if (c === '#') { // 'q:'' alias
                 this.directive(name.substring(1), attr);
  	        } else if ('x-for' === name) {
  	        	r = new ListNode(attr.value, this);
  	        } else if ('x-attrs' === name) {
  	        	this.xattr('$attrs', parseXAttrs(attr.value));
  	        } else if ('x-channel' === name) {
  	        	this.attr('$channel', attr.value); // use a regular attr since valkue is always a string literal
  			} else if ('x-show' === name) {
  				this.xattr('$show', attr.value);
  			} else if ('x-class' === name) {
  				this.xattr('$class', attr.value);
  			} else if ('x-style' === name) {
  				this.xattr('$style', attr.value);
  			} else if ('x-html' === name) {
  				if (attr.value === true) {
  					r = new StaticNode(this, null);
  				} else {
      				this.xattr('$html', attr.value);
      			}
  			} else if ('x-markdown' === name) {
  				r = new StaticNode(this, 'markdown');
  	        } else if (name.startsWith('x-content-')) {
  	        	var ctype = name.substring('x-content-'.length);
  	        	r = new StaticNode(this, ctype !== 'html' ? ctype : null);
  	    	} else if (name === 'x-call') {
  	    		this.directive('@', attr);
  	    	} else if (name.startsWith('x-bind:')) {
  	    		this.bind(name.substring(7), attr.value);
  	    	} else if (name.startsWith('x-on:')) {
  	    		this.on(name.substring(5), attr.value);
  	    	} else if (name.startsWith('x-emit:')) {
  	    		this.emit(name.substring(7), attr.value, false);
  	    	} else if (name.startsWith('x-emit-async:')) {
  	    		this.emit(name.substring(13), attr.value, true);
  	    	} else if (name.startsWith('q:')) {
  	    		// we store the attr itself for directives - we need to access attr.expr
  	    		this.directive(name.substring(2), attr);
  	    	} else if (name.startsWith('x-use:')) { // alias for 'q:'
  	    		// we store the attr itself for directives - we need to access attr.expr
  	    		this.directive(name.substring(6), attr);
  	    	} else if (name.startsWith('x-toggle:')) {
  	    		this.toggle(name.substring(9), attr.value);
  	        } else if (attr.expr) {
  	    		this.bind(name, attr.value);
  	        } else {
  	        	this.attr(name, attrValue(attr));
  	        }
  		}
  		return r;
  	};

  	return this.parseAttrs(attrs);
  }
  // a DomNode that has static children (set with innerHTML from the template content)
  function StaticNode(node, type) {
  	this.node = node;
  	this.compile = function(ctx) {
  		return _fn('hh', _s(this.node.name),
  			//_attrs(this.node.attrs),
  			_xattrs(this.node.attrs, this.node.bindings, this.node.xattrs, this.node.directives, this.node.events, ctx),
  			_s(this.html.join('')),
  			_s(type)
  		);
  	};

  	// compile logic
  	this.tag = node.name;
  	this.stack = [];
  	this.html = [];
  	this.start = function(tagName, attrs, isVoid) {
  		var html = this.html;
  		html.push('<', tagName);
  		for (var i=0,l=attrs.length; i<l; i++) {
  			var attr = attrs[i];
  			html.push(' ', attr.name);
  			if (attr.value !== true) {
  				html.push('="', attr.value, '"');
  			}
  		}
  		html.push(isVoid?'/>':'>');
  		if (!isVoid) { this.stack.push(tagName); }
  	};
  	this.end = function(tagName) {
  		var tag = this.stack.pop();
  		if (tag) { // subtree traversed
  			if (tag !== tagName) { ERR$1(("Closing tag '" + tagName + "' doesn't match the start tag '" + tag + "'")); }
  			this.html.push('</', tagName, '>');
  		} else {
  			return true; // finished
  		}
  	};
  	this.text = function(text) {
  		this.html.push(text);
  	};
  }

  function TextNode(value) {
  	this.value = value;
  	this.isBlank = value.trim().length===0;
  	this.compile = function(ctx) {
  		var value = this.isBlank && !ctx.pre ? this.value.trim()+' ' : this.value;
  		return _fn('t', _s(_html_ent(value)));
  	};
  	this.append = function(text) {
  		this.value += text;
  		if (this.isBlank) { this.isBlank = this.value.trim().length===0; }
  	};
  }

  function ExprNode() {
  	this.parts = [];
  	this.text = function(text) {
  		this.parts.push(false, text);
  	};
  	this.expr = function(expr) {
  		this.parts.push(true, expr);
  	};
  	this.compile = function(ctx) {
  		var parts = this.parts;
  		var out = [];
  		for (var i=0,l=parts.length; i<l; i+=2) {
  			if (parts[i]) { out.push(_x(parts[i+1], ctx)); }
  			else { out.push(_s(parts[i+1])); }
  		}
  		return _fn('x', _v(out.join('+')));
  	};
  }

  var FOR_RX = /^\s*(.+)\s+in\s+(.+)\s*$/;
  function parseForExpr(listNode, expr) {
  	var m = FOR_RX.exec(expr);
  	if (!m) { ERR$1("Invalid for expression"); }
  	listNode.list = m[2].trim();
  	var item = m[1].trim();
  	if (item.indexOf(',') > -1) {
  		var args = item.split(/\s*,\s*/);
  		listNode.item = args[0];
  		listNode.index = args[1];
  		if (args.length > 2) { listNode.hasNext = args[2]; }
  	} else {
  		listNode.item = item;
  	}
  }
  function ListNode(expr, node) {
  	this.node = node;
  	this.list = null;
  	this.item = null;

  	// parse expr
  	parseForExpr(this, expr);

  	if (this.index || this.hasNext) {
  		ERR$1("reactive lists doesn't support index and hasNext iteration properties");
  	}

  	this.append = function(node) {
  		this.node.append(node);
  	};

  	this.compile = function(ctx) {
  		// look for a x-key attr
  		var attrs = this.node.attrs;
  		var key = attrs && attrs['x-key'];
  		if (key) {
  			// encode key
  			var keyFn = getArrowFn(key, ctx);
  			if (keyFn) {
  				key = keyFn;
  			} else {
  				key = _s(key);
  			}
  			delete attrs['x-key'];
  		}
  		if (!key) {
  			key = 'null';
  		}

  		// 1. compile children and avoid rewriting iteration vars
  		var forCtx = ctx.push();
  		var forSymbols = forCtx.symbols;
  		forSymbols[this.item] = true;
  		var children = _node(this.node, forCtx);
  		// 2. wrap children
  		var childrenFn = 'function($,'+this.item+'){return '+children+'}';
  		return _fn('l', _v(_x(this.list, ctx)), childrenFn, key);
  	};

  }

  function ForNode(tag, attrs) {
  	this.list = null;
  	this.item = null;
  	this.index = '$2';
  	this.hasNext = '$3';

  	this.children = [];
  	this.append = function(child) {
          this.children.push(child);
  	};
  	this.lastChild = function() {
  		return this.children[this.children.length-1];
  	};
  	this.compile = function(ctx) {
  		// we wrap children in a inline fucntion def so that item, index and has_next are resolved inside the children nodes
  		// also, _x function must not rewrite item, index and has_next variable ...
  		// 1. compile children and avoid rewriting iteration vars
  		var forCtx = ctx.push();
  		var forSymbols = forCtx.symbols;
  		forSymbols[this.item] = true;
  		forSymbols[this.index] = true;
  		forSymbols[this.hasNext] = true;
  		var children = _nodes(this.children, forCtx);
  		// 2. wrap children
  		var childrenFn = 'function('+this.item+','+this.index+','+this.hasNext+'){return '+children+'}';
  		return _fn('a', _v(_x(this.list, ctx)), childrenFn);
  	};

  	if (attrs.length !== 1) { ERR$1("For directive take exatcly one attribute"); }
  	parseForExpr(this, attrs[0].value);
  }

  function IfNode(tag, attrs) {
  	this.children = [];
  	this.cases = null; // array of if-else / if nodes.
  	this.change = null; // onchange event handler if any
  	this.expr = null;

  	// we don't check the attr name - any name may be used (not only 'value')
  	var valueAttr = attrs[0];
  	if (attrs.length === 2) {
  		var changeAttr = attrs[1];
  		if (valueAttr.name === 'x-change') {
  			changeAttr = valueAttr;
  			valueAttr = attrs[1];
  		} else if (changeAttr.name !== 'x-change') {
  			ERR$1(("Invalid if attribute '" + (changeAttr.name) + "'. You may want to use x-change?"));
  		}
  		this.change = changeAttr.value;
  	} else if (attrs.length !== 1) {
  		ERR$1("if has only one required attribute: value='expr' and an optional one: x-change='onChangeHandler'");
  	}
  	this.expr = attrValue(valueAttr);

  	this.append = function(node) {
  		if (node instanceof ElseNode) {
  			if (this.cases) {
  				var lastCase = this.cases[this.cases.length-1];
  				if (lastCase.expr === null) { ERR$1('Invalid if/else-id/else tags: else must be the last one in the chain.'); }
  			} else {
  				this.cases = [];
  			}
  			this.cases.push(node);
  		} else if (this.cases) {
  			var lastCase = this.cases[this.cases.length-1];
  			lastCase.children.push(node);
  		} else {
  			this.children.push(node);
  		}
  	};

  	this.compile = function(ctx) {
  		// if/else-if/else signature: 'i', list_of_exprs, list_of_children, changeCb
  		// else expr is null
  		// if only if is present the a list of size is used.
  		var change = this.change ? _cb(this.change, ctx) : 'null';

  		var exprs = [ _v(_x(this.expr, ctx)) ], kids = [ _r(_nodes(this.children, ctx)) ];
  		if (this.cases) {
  			var cases = this.cases;
  			for (var i=0,l=cases.length; i<l; i++) {
  				var ifCase = cases[i];
  				exprs.push(ifCase.expr ? _v(_x(ifCase.expr, ctx)) : 'null');
  				kids.push(_r(_nodes(ifCase.children, ctx)));
  			}
  		}
  		return _fn('i', '['+exprs.join(',')+']', '['+kids.join(',')+']', change);
  	};
  }

  function ElseNode(tag, attrs) {
  	this.children = [];
  	this.expr === null;
  	if (tag === 'else-if') {
  		if (attrs.length !== 1) {
  			ERR$1("the else-if tag must have a 'value' attribute");
  		}
  		// we don't check the attr name...
  		this.expr = attrValue(attrs[0]);
  	} //else the else tag: no attributes
  }

  //TODO
  function SlotNode(tagName, attrs) {
  	this.name = tagName;
  	this.children = [];
  	this.append = function(child) {
          this.children.push(child);
  	};
  	//TODO is this needed?
  	this.lastChild = function() {
  		return this.children[this.children.length-1];
  	};
  	this.process = function(processor) {
  		return processor.processSlot(this);
  	};
  	this.compile = function(ctx) {
  		return _fn('s', _s(this.slotName), _nodes(this.children, ctx));
  	};
  	if (attrs.length > 1) { ERR$1("slot node take zero or one 'name' parameter"); }
  	this.slotName = attrs.length ? attrValue(attrs[0]) : null;
  }


  var MUSTACHE_RX = /\{\{([^\}]+)\}\}/g;
  //var BLANK_RX = /^\s*$/;

  var NODES = {
  	'if':  IfNode, 'q:if': IfNode,
  	'else':  ElseNode, 'q:else': ElseNode,
  	'else-if': ElseNode, 'q:else-if': ElseNode,
  	'for':  ForNode, 'q:for':  ForNode,
  	'slot': SlotNode, 'q:slot': SlotNode,
  };

  var SYMBOLS = {
  	"true": true, "false": true, "undefined": true, "null": true, "void": true,
  	"$0": true, "$1": true, "$2": true, "$3": true,
  	"$": true, "this": true, "_": true,
  	"JSON": true, "Object": true, "console": true, "window": true
  };



  function Compiler() {
  	function Context(symbols, imports, resolve, pre) {
  		this.pre = pre; // if pre then do not compact spaces in TextNodes
  		this.resolve = resolve;
  		this.symbols = symbols;
  		this.imports = imports;
  		this.push = function() {
  			return new Context(Object.assign({}, this.symbols), this.imports, this.resolve, this.pre);
  		};
  	}
  	// collector is used only when static html should be collected sue to an x-html attribute
  	// See StaticNode
  	this.collector = null;
  	this.top = null;
  	this.stack = [];
  	this.lastText = null; // used to merge adjacent text nodes

  	this.resolve = function(tag) {
  		return null;// the default is to resolve at runtime
  	};

  	this.pushText = function(text) {
  		if (this.lastText) { this.lastText.append(text); }
  		else {
  			var node = new TextNode(text);
  			this.push(node, true);
  			this.lastText = node;
  		}
  	};

  	this.push = function(node, isVoid) {
  		this.lastText = null;
  		this.top.append(node);
  		if (!isVoid) {
  			this.stack.push(this.top);
  			this.top = node;
  		}
  	};

  	this.pop = function() {
  		this.lastText = null;
          var top = this.top;
          this.top = this.stack.pop();
          return top;
  	};


  	this.text = function(text) {
  		if (this.collector) {
  			this.collector.text(text);
  			return;
  		}
  	    var i = text.indexOf('{{'), s = 0;
  	    if (i > -1) {
  	        MUSTACHE_RX.lastIndex = i;
  	        var match = MUSTACHE_RX.exec(text);
  	        if (match) {
  	           	var node = new ExprNode();
  	            do {
  	                var index = match.index;
  	                if (index > s) {
  	                    node.text(text.substring(s, index));
  	                }
  	                node.expr(match[1]);
  	                s = MUSTACHE_RX.lastIndex;
  	                match = MUSTACHE_RX.exec(text);
  	            } while (match);
  	            if (s < text.length) {
  	                node.text(text.substring(s));
  	            }
  	            this.push(node, true);
  	            return;
  	        }
  	    }
  	    this.pushText(text);
  	};

  	this.start = function(tagName, attrs, isVoid) {
  		if (this.collector) {
  			this.collector.start(tagName, attrs, isVoid);
  		} else {
  			var NodeType = NODES[tagName];
  			var node;
  			if (NodeType) {
  				node = new NodeType(tagName, attrs, isVoid);
  			} else {
  				node = new DomNode(tagName, attrs, isVoid);
  				if (node instanceof StaticNode) {
  					// allow <div x-conent-{random} />
  					//if (isVoid) ERR("Static node (x-html) must have some content");
  					this.collector = node;
  				}
  			}
  			this.push(node, isVoid);
  		}
  	};

  	this.end = function(tagName) {
  		if (this.collector) {
  			if (!this.collector.end(tagName)) {
  				return
  			}
  			// subtree traversed - remove collector
  			this.collector = null;
  		}
  		this.pop();
  	};

  	this.parse = function(text) {
  		this.top = new RootNode();
  		parseHTML(text.trim(), {
  			start: this.start.bind(this),
  			end: this.end.bind(this),
  			text: this.text.bind(this)
  		});
  		// "trim" the root node (blank text mnodes mayt appear because of comments)
  		return this.top.trim();
  	};

      this.compile = function(text, imports, pre) { // r is the Renderer
      	var ctx = new Context(Object.assign(imports || {}, SYMBOLS), imports || {}, this.resolve, pre);
      	var r = this.parse(text).compile(ctx);
      	//console.log("COMPILED:",r);
          return 'function($){return '+r+';}';
      };

  	this.compileFn = function(text, imports, pre) {
  		var ctx = new Context(Object.assign(imports || {}, SYMBOLS), imports || {}, this.resolve, pre);
      	var r = this.parse(text).compile(ctx);
      	//console.log("COMPILED:",r);
  		return new Function('$', 'return '+r+';');
  	};

  	this.transpile = function(source, opts) {
  		return transpile(this, source, opts);
  	};

  	this.loadXTags = function(source, cb) {
  		return loadXTags(this, source, cb);
  	};

  }

  Compiler.parseHTML = parseHTML;

  var commonjsGlobal = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  function commonjsRequire () {
  	throw new Error('Dynamic requires are not currently supported by rollup-plugin-commonjs');
  }

  function unwrapExports (x) {
  	return x && x.__esModule && Object.prototype.hasOwnProperty.call(x, 'default') ? x['default'] : x;
  }

  function createCommonjsModule(fn, module) {
  	return module = { exports: {} }, fn(module, module.exports), module.exports;
  }

  function getCjsExportFromNamespace (n) {
  	return n && n['default'] || n;
  }

  var regjsgen = createCommonjsModule(function (module, exports) {
  (function() {

    // Used to determine if values are of the language type `Object`.
    var objectTypes = {
      'function': true,
      'object': true
    };

    // Used as a reference to the global object.
    var root = (objectTypes[typeof window] && window) || this;

    // Detect free variable `exports`.
    var freeExports = objectTypes['object'] && exports && !exports.nodeType && exports;

    // Detect free variable `module`.
    var hasFreeModule = objectTypes['object'] && module && !module.nodeType;

    // Detect free variable `global` from Node.js or Browserified code and use it as `root`.
    var freeGlobal = freeExports && hasFreeModule && typeof commonjsGlobal == 'object' && commonjsGlobal;
    if (freeGlobal && (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal || freeGlobal.self === freeGlobal)) {
      root = freeGlobal;
    }

    // Used to check objects for own properties.
    var hasOwnProperty = Object.prototype.hasOwnProperty;

    /*--------------------------------------------------------------------------*/

    // Generates a string based on the given code point.
    // Based on https://mths.be/fromcodepoint by @mathias.
    function fromCodePoint() {
      var codePoint = Number(arguments[0]);

      if (
        !isFinite(codePoint) || // `NaN`, `+Infinity`, or `-Infinity`
        codePoint < 0 || // not a valid Unicode code point
        codePoint > 0x10FFFF || // not a valid Unicode code point
        Math.floor(codePoint) != codePoint // not an integer
      ) {
        throw RangeError('Invalid code point: ' + codePoint);
      }

      if (codePoint <= 0xFFFF) {
        // BMP code point
        return String.fromCharCode(codePoint);
      } else {
        // Astral code point; split in surrogate halves
        // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
        codePoint -= 0x10000;
        var highSurrogate = (codePoint >> 10) + 0xD800;
        var lowSurrogate = (codePoint % 0x400) + 0xDC00;
        return String.fromCharCode(highSurrogate, lowSurrogate);
      }
    }

    /*--------------------------------------------------------------------------*/

    // Ensures that nodes have the correct types.
    var assertTypeRegexMap = {};
    function assertType(type, expected) {
      if (expected.indexOf('|') == -1) {
        if (type == expected) {
          return;
        }

        throw Error('Invalid node type: ' + type + '; expected type: ' + expected);
      }

      expected = hasOwnProperty.call(assertTypeRegexMap, expected)
        ? assertTypeRegexMap[expected]
        : (assertTypeRegexMap[expected] = RegExp('^(?:' + expected + ')$'));

      if (expected.test(type)) {
        return;
      }

      throw Error('Invalid node type: ' + type + '; expected types: ' + expected);
    }

    /*--------------------------------------------------------------------------*/

    // Generates a regular expression string based on an AST.
    function generate(node) {
      var type = node.type;

      if (hasOwnProperty.call(generators, type)) {
        return generators[type](node);
      }

      throw Error('Invalid node type: ' + type);
    }

    /*--------------------------------------------------------------------------*/

    function generateAlternative(node) {
      assertType(node.type, 'alternative');

      var terms = node.body,
          i = -1,
          length = terms.length,
          result = '';

      while (++i < length) {
        result += generateTerm(terms[i]);
      }

      return result;
    }

    function generateAnchor(node) {
      assertType(node.type, 'anchor');

      switch (node.kind) {
        case 'start':
          return '^';
        case 'end':
          return '$';
        case 'boundary':
          return '\\b';
        case 'not-boundary':
          return '\\B';
        default:
          throw Error('Invalid assertion');
      }
    }

    function generateAtom(node) {
      assertType(node.type, 'anchor|characterClass|characterClassEscape|dot|group|reference|value');

      return generate(node);
    }

    function generateCharacterClass(node) {
      assertType(node.type, 'characterClass');

      var classRanges = node.body,
          i = -1,
          length = classRanges.length,
          result = '';

      if (node.negative) {
        result += '^';
      }

      while (++i < length) {
        result += generateClassAtom(classRanges[i]);
      }

      return '[' + result + ']';
    }

    function generateCharacterClassEscape(node) {
      assertType(node.type, 'characterClassEscape');

      return '\\' + node.value;
    }

    function generateUnicodePropertyEscape(node) {
      assertType(node.type, 'unicodePropertyEscape');

      return '\\' + (node.negative ? 'P' : 'p') + '{' + node.value + '}';
    }

    function generateCharacterClassRange(node) {
      assertType(node.type, 'characterClassRange');

      var min = node.min,
          max = node.max;

      if (min.type == 'characterClassRange' || max.type == 'characterClassRange') {
        throw Error('Invalid character class range');
      }

      return generateClassAtom(min) + '-' + generateClassAtom(max);
    }

    function generateClassAtom(node) {
      assertType(node.type, 'anchor|characterClassEscape|characterClassRange|dot|value');

      return generate(node);
    }

    function generateDisjunction(node) {
      assertType(node.type, 'disjunction');

      var body = node.body,
          i = -1,
          length = body.length,
          result = '';

      while (++i < length) {
        if (i != 0) {
          result += '|';
        }
        result += generate(body[i]);
      }

      return result;
    }

    function generateDot(node) {
      assertType(node.type, 'dot');

      return '.';
    }

    function generateGroup(node) {
      assertType(node.type, 'group');

      var result = '';

      switch (node.behavior) {
        case 'normal':
          if (node.name) {
            result += '?<' + generateIdentifier(node.name) + '>';
          }
          break;
        case 'ignore':
          result += '?:';
          break;
        case 'lookahead':
          result += '?=';
          break;
        case 'negativeLookahead':
          result += '?!';
          break;
        case 'lookbehind':
          result += '?<=';
          break;
        case 'negativeLookbehind':
          result += '?<!';
          break;
        default:
          throw Error('Invalid behaviour: ' + node.behaviour);
      }

      var body = node.body,
          i = -1,
          length = body.length;

      while (++i < length) {
        result += generate(body[i]);
      }

      return '(' + result + ')';
    }

    function generateIdentifier(node) {
      assertType(node.type, 'identifier');

      return node.value;
    }

    function generateQuantifier(node) {
      assertType(node.type, 'quantifier');

      var quantifier = '',
          min = node.min,
          max = node.max;

      if (max == null) {
        if (min == 0) {
          quantifier = '*';
        } else if (min == 1) {
          quantifier = '+';
        } else {
          quantifier = '{' + min + ',}';
        }
      } else if (min == max) {
        quantifier = '{' + min + '}';
      } else if (min == 0 && max == 1) {
        quantifier = '?';
      } else {
        quantifier = '{' + min + ',' + max + '}';
      }

      if (!node.greedy) {
        quantifier += '?';
      }

      return generateAtom(node.body[0]) + quantifier;
    }

    function generateReference(node) {
      assertType(node.type, 'reference');

      if (node.matchIndex) {
        return '\\' + node.matchIndex;
      }
      if (node.name) {
        return '\\k<' + generateIdentifier(node.name) + '>';
      }

      throw new Error('Unknown reference type');
    }

    function generateTerm(node) {
      assertType(node.type, 'anchor|characterClass|characterClassEscape|empty|group|quantifier|reference|unicodePropertyEscape|value|dot');

      return generate(node);
    }

    function generateValue(node) {
      assertType(node.type, 'value');

      var kind = node.kind,
          codePoint = node.codePoint;

      if (typeof codePoint != 'number') {
        throw new Error('Invalid code point: ' + codePoint);
      }

      switch (kind) {
        case 'controlLetter':
          return '\\c' + fromCodePoint(codePoint + 64);
        case 'hexadecimalEscape':
          return '\\x' + ('00' + codePoint.toString(16).toUpperCase()).slice(-2);
        case 'identifier':
          return '\\' + fromCodePoint(codePoint);
        case 'null':
          return '\\' + codePoint;
        case 'octal':
          return '\\' + codePoint.toString(8);
        case 'singleEscape':
          switch (codePoint) {
            case 0x0008:
              return '\\b';
            case 0x0009:
              return '\\t';
            case 0x000A:
              return '\\n';
            case 0x000B:
              return '\\v';
            case 0x000C:
              return '\\f';
            case 0x000D:
              return '\\r';
            default:
              throw Error('Invalid code point: ' + codePoint);
          }
        case 'symbol':
          return fromCodePoint(codePoint);
        case 'unicodeEscape':
          return '\\u' + ('0000' + codePoint.toString(16).toUpperCase()).slice(-4);
        case 'unicodeCodePointEscape':
          return '\\u{' + codePoint.toString(16).toUpperCase() + '}';
        default:
          throw Error('Unsupported node kind: ' + kind);
      }
    }

    /*--------------------------------------------------------------------------*/

    // Used to generate strings for each node type.
    var generators = {
      'alternative': generateAlternative,
      'anchor': generateAnchor,
      'characterClass': generateCharacterClass,
      'characterClassEscape': generateCharacterClassEscape,
      'characterClassRange': generateCharacterClassRange,
      'unicodePropertyEscape': generateUnicodePropertyEscape,
      'disjunction': generateDisjunction,
      'dot': generateDot,
      'group': generateGroup,
      'quantifier': generateQuantifier,
      'reference': generateReference,
      'value': generateValue
    };

    /*--------------------------------------------------------------------------*/

    // Export regjsgen.
    var regjsgen = {
      'generate': generate
    };

    // Some AMD build optimizers, like r.js, check for condition patterns like the following:
    if (freeExports && hasFreeModule) {
      // Export for CommonJS support.
      freeExports.generate = generate;
    }
    else {
      // Export to the global object.
      root.regjsgen = regjsgen;
    }
  }.call(commonjsGlobal));
  });

  var parser = createCommonjsModule(function (module) {
  // regjsparser
  //
  // ==================================================================
  //
  // See ECMA-262 Standard: 15.10.1
  //
  // NOTE: The ECMA-262 standard uses the term "Assertion" for /^/. Here the
  //   term "Anchor" is used.
  //
  // Pattern ::
  //      Disjunction
  //
  // Disjunction ::
  //      Alternative
  //      Alternative | Disjunction
  //
  // Alternative ::
  //      [empty]
  //      Alternative Term
  //
  // Term ::
  //      Anchor
  //      Atom
  //      Atom Quantifier
  //
  // Anchor ::
  //      ^
  //      $
  //      \ b
  //      \ B
  //      ( ? = Disjunction )
  //      ( ? ! Disjunction )
  //      ( ? < = Disjunction )
  //      ( ? < ! Disjunction )
  //
  // Quantifier ::
  //      QuantifierPrefix
  //      QuantifierPrefix ?
  //
  // QuantifierPrefix ::
  //      *
  //      +
  //      ?
  //      { DecimalDigits }
  //      { DecimalDigits , }
  //      { DecimalDigits , DecimalDigits }
  //
  // Atom ::
  //      PatternCharacter
  //      .
  //      \ AtomEscape
  //      CharacterClass
  //      ( GroupSpecifier Disjunction )
  //      ( ? : Disjunction )
  //
  // PatternCharacter ::
  //      SourceCharacter but not any of: ^ $ \ . * + ? ( ) [ ] { } |
  //
  // AtomEscape ::
  //      DecimalEscape
  //      CharacterEscape
  //      CharacterClassEscape
  //      k GroupName
  //
  // CharacterEscape[U] ::
  //      ControlEscape
  //      c ControlLetter
  //      HexEscapeSequence
  //      RegExpUnicodeEscapeSequence[?U] (ES6)
  //      IdentityEscape[?U]
  //
  // ControlEscape ::
  //      one of f n r t v
  // ControlLetter ::
  //      one of
  //          a b c d e f g h i j k l m n o p q r s t u v w x y z
  //          A B C D E F G H I J K L M N O P Q R S T U V W X Y Z
  //
  // IdentityEscape ::
  //      SourceCharacter but not c
  //
  // DecimalEscape ::
  //      DecimalIntegerLiteral [lookahead ∉ DecimalDigit]
  //
  // CharacterClassEscape ::
  //      one of d D s S w W
  //
  // CharacterClass ::
  //      [ [lookahead ∉ {^}] ClassRanges ]
  //      [ ^ ClassRanges ]
  //
  // ClassRanges ::
  //      [empty]
  //      NonemptyClassRanges
  //
  // NonemptyClassRanges ::
  //      ClassAtom
  //      ClassAtom NonemptyClassRangesNoDash
  //      ClassAtom - ClassAtom ClassRanges
  //
  // NonemptyClassRangesNoDash ::
  //      ClassAtom
  //      ClassAtomNoDash NonemptyClassRangesNoDash
  //      ClassAtomNoDash - ClassAtom ClassRanges
  //
  // ClassAtom ::
  //      -
  //      ClassAtomNoDash
  //
  // ClassAtomNoDash ::
  //      SourceCharacter but not one of \ or ] or -
  //      \ ClassEscape
  //
  // ClassEscape ::
  //      DecimalEscape
  //      b
  //      CharacterEscape
  //      CharacterClassEscape
  //
  // GroupSpecifier ::
  //      [empty]
  //      ? GroupName
  //
  // GroupName ::
  //      < RegExpIdentifierName >
  //
  // RegExpIdentifierName ::
  //      RegExpIdentifierStart
  //      RegExpIdentifierName RegExpIdentifierContinue
  //
  // RegExpIdentifierStart ::
  //      UnicodeIDStart
  //      $
  //      _
  //      \ RegExpUnicodeEscapeSequence
  //
  // RegExpIdentifierContinue ::
  //      UnicodeIDContinue
  //      $
  //      _
  //      \ RegExpUnicodeEscapeSequence
  //      <ZWNJ>
  //      <ZWJ>

  (function() {

    var fromCodePoint = String.fromCodePoint || (function() {
      // Implementation taken from
      // https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/fromCodePoint

      var stringFromCharCode = String.fromCharCode;
      var floor = Math.floor;

      return function fromCodePoint() {
        var arguments$1 = arguments;

        var MAX_SIZE = 0x4000;
        var codeUnits = [];
        var highSurrogate;
        var lowSurrogate;
        var index = -1;
        var length = arguments.length;
        if (!length) {
          return '';
        }
        var result = '';
        while (++index < length) {
          var codePoint = Number(arguments$1[index]);
          if (
            !isFinite(codePoint) ||       // `NaN`, `+Infinity`, or `-Infinity`
            codePoint < 0 ||              // not a valid Unicode code point
            codePoint > 0x10FFFF ||       // not a valid Unicode code point
            floor(codePoint) != codePoint // not an integer
          ) {
            throw RangeError('Invalid code point: ' + codePoint);
          }
          if (codePoint <= 0xFFFF) { // BMP code point
            codeUnits.push(codePoint);
          } else { // Astral code point; split in surrogate halves
            // http://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
            codePoint -= 0x10000;
            highSurrogate = (codePoint >> 10) + 0xD800;
            lowSurrogate = (codePoint % 0x400) + 0xDC00;
            codeUnits.push(highSurrogate, lowSurrogate);
          }
          if (index + 1 == length || codeUnits.length > MAX_SIZE) {
            result += stringFromCharCode.apply(null, codeUnits);
            codeUnits.length = 0;
          }
        }
        return result;
      };
    }());

    function parse(str, flags, features) {
      if (!features) {
        features = {};
      }
      function addRaw(node) {
        node.raw = str.substring(node.range[0], node.range[1]);
        return node;
      }

      function updateRawStart(node, start) {
        node.range[0] = start;
        return addRaw(node);
      }

      function createAnchor(kind, rawLength) {
        return addRaw({
          type: 'anchor',
          kind: kind,
          range: [
            pos - rawLength,
            pos
          ]
        });
      }

      function createValue(kind, codePoint, from, to) {
        return addRaw({
          type: 'value',
          kind: kind,
          codePoint: codePoint,
          range: [from, to]
        });
      }

      function createEscaped(kind, codePoint, value, fromOffset) {
        fromOffset = fromOffset || 0;
        return createValue(kind, codePoint, pos - (value.length + fromOffset), pos);
      }

      function createCharacter(matches) {
        var _char = matches[0];
        var first = _char.charCodeAt(0);
        if (hasUnicodeFlag) {
          if (_char === '}') {
            bail("unescaped or unmatched closing brace");
          }
          if (_char === ']') {
            bail("unescaped or unmatched closing bracket");
          }
          var second;
          if (_char.length === 1 && first >= 0xD800 && first <= 0xDBFF) {
            second = lookahead().charCodeAt(0);
            if (second >= 0xDC00 && second <= 0xDFFF) {
              // Unicode surrogate pair
              pos++;
              return createValue(
                  'symbol',
                  (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000,
                  pos - 2, pos);
            }
          }
        }
        return createValue('symbol', first, pos - 1, pos);
      }

      function createDisjunction(alternatives, from, to) {
        return addRaw({
          type: 'disjunction',
          body: alternatives,
          range: [
            from,
            to
          ]
        });
      }

      function createDot() {
        return addRaw({
          type: 'dot',
          range: [
            pos - 1,
            pos
          ]
        });
      }

      function createCharacterClassEscape(value) {
        return addRaw({
          type: 'characterClassEscape',
          value: value,
          range: [
            pos - 2,
            pos
          ]
        });
      }

      function createReference(matchIndex) {
        return addRaw({
          type: 'reference',
          matchIndex: parseInt(matchIndex, 10),
          range: [
            pos - 1 - matchIndex.length,
            pos
          ]
        });
      }

      function createNamedReference(name) {
        return addRaw({
          type: 'reference',
          name: name,
          range: [
            name.range[0] - 3,
            pos
          ]
        });
      }

      function createGroup(behavior, disjunction, from, to) {
        return addRaw({
          type: 'group',
          behavior: behavior,
          body: disjunction,
          range: [
            from,
            to
          ]
        });
      }

      function createAlternative(terms, from, to) {
        return addRaw({
          type: 'alternative',
          body: terms,
          range: [
            from,
            to
          ]
        });
      }

      function createCharacterClass(classRanges, negative, from, to) {
        return addRaw({
          type: 'characterClass',
          body: classRanges,
          negative: negative,
          range: [
            from,
            to
          ]
        });
      }

      function createClassRange(min, max, from, to) {
        // See 15.10.2.15:
        if (min.codePoint > max.codePoint) {
          bail('invalid range in character class', min.raw + '-' + max.raw, from, to);
        }

        return addRaw({
          type: 'characterClassRange',
          min: min,
          max: max,
          range: [
            from,
            to
          ]
        });
      }

      function flattenBody(body) {
        if (body.type === 'alternative') {
          return body.body;
        } else {
          return [body];
        }
      }

      function incr(amount) {
        amount = (amount || 1);
        var res = str.substring(pos, pos + amount);
        pos += (amount || 1);
        return res;
      }

      function skip(value) {
        if (!match(value)) {
          bail('character', value);
        }
      }

      function match(value) {
        if (str.indexOf(value, pos) === pos) {
          return incr(value.length);
        }
      }

      function lookahead() {
        return str[pos];
      }

      function current(value) {
        return str.indexOf(value, pos) === pos;
      }

      function next(value) {
        return str[pos + 1] === value;
      }

      function matchReg(regExp) {
        var subStr = str.substring(pos);
        var res = subStr.match(regExp);
        if (res) {
          res.range = [];
          res.range[0] = pos;
          incr(res[0].length);
          res.range[1] = pos;
        }
        return res;
      }

      function parseDisjunction() {
        // Disjunction ::
        //      Alternative
        //      Alternative | Disjunction
        var res = [], from = pos;
        res.push(parseAlternative());

        while (match('|')) {
          res.push(parseAlternative());
        }

        if (res.length === 1) {
          return res[0];
        }

        return createDisjunction(res, from, pos);
      }

      function parseAlternative() {
        var res = [], from = pos;
        var term;

        // Alternative ::
        //      [empty]
        //      Alternative Term
        while (term = parseTerm()) {
          res.push(term);
        }

        if (res.length === 1) {
          return res[0];
        }

        return createAlternative(res, from, pos);
      }

      function parseTerm() {
        // Term ::
        //      Anchor
        //      Atom
        //      Atom Quantifier

        if (pos >= str.length || current('|') || current(')')) {
          return null; /* Means: The term is empty */
        }

        var anchor = parseAnchor();

        if (anchor) {
          return anchor;
        }

        var atom = parseAtom();
        if (!atom) {
          bail('Expected atom');
        }
        return atom;
      }

      function parseGroup(matchA, typeA, matchB, typeB) {
        var type = null, from = pos;

        if (match(matchA)) {
          type = typeA;
        } else if (match(matchB)) {
          type = typeB;
        } else {
          return false;
        }

        return finishGroup(type, from);
      }

      function finishGroup(type, from) {
        var body = parseDisjunction();
        if (!body) {
          bail('Expected disjunction');
        }
        skip(')');
        var group = createGroup(type, flattenBody(body), from, pos);

        if (type == 'normal') {
          // Keep track of the number of closed groups. This is required for
          // parseDecimalEscape(). In case the string is parsed a second time the
          // value already holds the total count and no incrementation is required.
          if (firstIteration) {
            closedCaptureCounter++;
          }
        }
        return group;
      }

      function parseAnchor() {

        if (match('^')) {
          return createAnchor('start', 1 /* rawLength */);
        } else if (match('$')) {
          return createAnchor('end', 1 /* rawLength */);
        } else if (match('\\b')) {
          return createAnchor('boundary', 2 /* rawLength */);
        } else if (match('\\B')) {
          return createAnchor('not-boundary', 2 /* rawLength */);
        } else {
          return parseGroup('(?=', 'lookahead', '(?!', 'negativeLookahead');
        }
      }

      function parseAtom() {
        // Atom ::
        //      PatternCharacter
        //      .
        //      \ AtomEscape
        //      CharacterClass
        //      ( GroupSpecifier Disjunction )
        //      ( ? : Disjunction )

        var res;

        // jviereck: allow ']', '}' here as well to be compatible with browser's
        //   implementations: ']'.match(/]/);
        // if (res = matchReg(/^[^^$\\.*+?()[\]{}|]/)) {
        if (res = matchReg(/^[^^$\\.*+?(){[|]/)) {
          //      PatternCharacter
          return createCharacter(res);
        }
        else if (match('.')) {
          //      .
          return createDot();
        }
        else if (match('\\')) {
          //      \ AtomEscape
          res = parseAtomEscape();
          if (!res) {
            if (!hasUnicodeFlag && lookahead() == 'c') {
              // B.1.4 ExtendedAtom
              // \[lookahead = c]
              return createValue('symbol', 92, pos - 1, pos);
            }
            bail('atomEscape');
          }
          return res;
        }
        else if (res = parseCharacterClass()) {
          return res;
        }
        else if (features.lookbehind && (res = parseGroup('(?<=', 'lookbehind', '(?<!', 'negativeLookbehind'))) {
          return res;
        }
        else if (features.namedGroups && match("(?<")) {
          var name = parseIdentifier();
          skip(">");
          var group = finishGroup("normal", name.range[0] - 3);
          group.name = name;
          return group;
        }
        else {
          //      ( Disjunction )
          //      ( ? : Disjunction )
          return parseGroup('(?:', 'ignore', '(', 'normal');
        }
      }

      function parseUnicodeSurrogatePairEscape(firstEscape) {
        if (hasUnicodeFlag) {
          var first, second;
          if (firstEscape.kind == 'unicodeEscape' &&
            (first = firstEscape.codePoint) >= 0xD800 && first <= 0xDBFF &&
            current('\\') && next('u') ) {
            var prevPos = pos;
            pos++;
            var secondEscape = parseClassEscape();
            if (secondEscape.kind == 'unicodeEscape' &&
              (second = secondEscape.codePoint) >= 0xDC00 && second <= 0xDFFF) {
              // Unicode surrogate pair
              firstEscape.range[1] = secondEscape.range[1];
              firstEscape.codePoint = (first - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
              firstEscape.type = 'value';
              firstEscape.kind = 'unicodeCodePointEscape';
              addRaw(firstEscape);
            }
            else {
              pos = prevPos;
            }
          }
        }
        return firstEscape;
      }

      function parseClassEscape() {
        return parseAtomEscape(true);
      }

      function parseAtomEscape(insideCharacterClass) {
        // AtomEscape ::
        //      DecimalEscape
        //      CharacterEscape
        //      CharacterClassEscape
        //      k GroupName

        var res, from = pos;

        res = parseDecimalEscape() || parseNamedReference();
        if (res) {
          return res;
        }

        // For ClassEscape
        if (insideCharacterClass) {
          //     b
          if (match('b')) {
            // 15.10.2.19
            // The production ClassEscape :: b evaluates by returning the
            // CharSet containing the one character <BS> (Unicode value 0008).
            return createEscaped('singleEscape', 0x0008, '\\b');
          } else if (match('B')) {
            bail('\\B not possible inside of CharacterClass', '', from);
          } else if (!hasUnicodeFlag && (res = matchReg(/^c([0-9])/))) {
            // B.1.4
            // c ClassControlLetter
            return createEscaped('controlLetter', res[1] + 16, res[1], 2);
          }
          //     [+U] -
          if (match('-') && hasUnicodeFlag) {
            return createEscaped('singleEscape', 0x002d, '\\-');
          }
        }

        res = parseCharacterEscape();

        return res;
      }


      function parseDecimalEscape() {
        // DecimalEscape ::
        //      DecimalIntegerLiteral [lookahead ∉ DecimalDigit]
        //      CharacterClassEscape :: one of d D s S w W

        var res, match;

        if (res = matchReg(/^(?!0)\d+/)) {
          match = res[0];
          var refIdx = parseInt(res[0], 10);
          if (refIdx <= closedCaptureCounter) {
            // If the number is smaller than the normal-groups found so
            // far, then it is a reference...
            return createReference(res[0]);
          } else {
            // ... otherwise it needs to be interpreted as a octal (if the
            // number is in an octal format). If it is NOT octal format,
            // then the slash is ignored and the number is matched later
            // as normal characters.

            // Recall the negative decision to decide if the input must be parsed
            // a second time with the total normal-groups.
            backrefDenied.push(refIdx);

            // Reset the position again, as maybe only parts of the previous
            // matched numbers are actual octal numbers. E.g. in '019' only
            // the '01' should be matched.
            incr(-res[0].length);
            if (res = matchReg(/^[0-7]{1,3}/)) {
              return createEscaped('octal', parseInt(res[0], 8), res[0], 1);
            } else {
              // If we end up here, we have a case like /\91/. Then the
              // first slash is to be ignored and the 9 & 1 to be treated
              // like ordinary characters. Create a character for the
              // first number only here - other number-characters
              // (if available) will be matched later.
              res = createCharacter(matchReg(/^[89]/));
              return updateRawStart(res, res.range[0] - 1);
            }
          }
        }
        // Only allow octal numbers in the following. All matched numbers start
        // with a zero (if the do not, the previous if-branch is executed).
        // If the number is not octal format and starts with zero (e.g. `091`)
        // then only the zeros `0` is treated here and the `91` are ordinary
        // characters.
        // Example:
        //   /\091/.exec('\091')[0].length === 3
        else if (res = matchReg(/^[0-7]{1,3}/)) {
          match = res[0];
          if (/^0{1,3}$/.test(match)) {
            // If they are all zeros, then only take the first one.
            return createEscaped('null', 0x0000, '0', match.length + 1);
          } else {
            return createEscaped('octal', parseInt(match, 8), match, 1);
          }
        } else if (res = matchReg(/^[dDsSwW]/)) {
          return createCharacterClassEscape(res[0]);
        }
        return false;
      }

      function parseNamedReference() {
        if (features.namedGroups && matchReg(/^k<(?=.*?>)/)) {
          var name = parseIdentifier();
          skip('>');
          return createNamedReference(name);
        }
      }

      function parseRegExpUnicodeEscapeSequence() {
        var res;
        if (res = matchReg(/^u([0-9a-fA-F]{4})/)) {
          // UnicodeEscapeSequence
          return parseUnicodeSurrogatePairEscape(
            createEscaped('unicodeEscape', parseInt(res[1], 16), res[1], 2)
          );
        } else if (hasUnicodeFlag && (res = matchReg(/^u\{([0-9a-fA-F]+)\}/))) {
          // RegExpUnicodeEscapeSequence (ES6 Unicode code point escape)
          return createEscaped('unicodeCodePointEscape', parseInt(res[1], 16), res[1], 4);
        }
      }

      function parseCharacterEscape() {
        // CharacterEscape ::
        //      ControlEscape
        //      c ControlLetter
        //      HexEscapeSequence
        //      UnicodeEscapeSequence
        //      IdentityEscape

        var res;
        var from = pos;
        if (res = matchReg(/^[fnrtv]/)) {
          // ControlEscape
          var codePoint = 0;
          switch (res[0]) {
            case 't': codePoint = 0x009; break;
            case 'n': codePoint = 0x00A; break;
            case 'v': codePoint = 0x00B; break;
            case 'f': codePoint = 0x00C; break;
            case 'r': codePoint = 0x00D; break;
          }
          return createEscaped('singleEscape', codePoint, '\\' + res[0]);
        } else if (res = matchReg(/^c([a-zA-Z])/)) {
          // c ControlLetter
          return createEscaped('controlLetter', res[1].charCodeAt(0) % 32, res[1], 2);
        } else if (res = matchReg(/^x([0-9a-fA-F]{2})/)) {
          // HexEscapeSequence
          return createEscaped('hexadecimalEscape', parseInt(res[1], 16), res[1], 2);
        } else if (res = parseRegExpUnicodeEscapeSequence()) {
          if (!res || res.codePoint > 0x10FFFF) {
            bail('Invalid escape sequence', null, from, pos);
          }
          return res;
        } else if (features.unicodePropertyEscape && hasUnicodeFlag && (res = matchReg(/^([pP])\{([^\}]+)\}/))) {
          // https://github.com/jviereck/regjsparser/issues/77
          return addRaw({
            type: 'unicodePropertyEscape',
            negative: res[1] === 'P',
            value: res[2],
            range: [res.range[0] - 1, res.range[1]],
            raw: res[0]
          });
        } else {
          // IdentityEscape
          return parseIdentityEscape();
        }
      }

      function parseIdentifierAtom(check) {
        var ch = lookahead();
        var from = pos;
        if (ch === '\\') {
          incr();
          var esc = parseRegExpUnicodeEscapeSequence();
          if (!esc || !check(esc.codePoint)) {
            bail('Invalid escape sequence', null, from, pos);
          }
          return fromCodePoint(esc.codePoint);
        }
        var code = ch.charCodeAt(0);
        if (code >= 0xD800 && code <= 0xDBFF) {
          ch += str[pos + 1];
          var second = ch.charCodeAt(1);
          if (second >= 0xDC00 && second <= 0xDFFF) {
            // Unicode surrogate pair
            code = (code - 0xD800) * 0x400 + second - 0xDC00 + 0x10000;
          }
        }
        if (!check(code)) { return; }
        incr();
        if (code > 0xFFFF) { incr(); }
        return ch;
      }

      function parseIdentifier() {
        // RegExpIdentifierName ::
        //      RegExpIdentifierStart
        //      RegExpIdentifierName RegExpIdentifierContinue
        //
        // RegExpIdentifierStart ::
        //      UnicodeIDStart
        //      $
        //      _
        //      \ RegExpUnicodeEscapeSequence
        //
        // RegExpIdentifierContinue ::
        //      UnicodeIDContinue
        //      $
        //      _
        //      \ RegExpUnicodeEscapeSequence
        //      <ZWNJ>
        //      <ZWJ>

        var start = pos;
        var res = parseIdentifierAtom(isIdentifierStart);
        if (!res) {
          bail('Invalid identifier');
        }

        var ch;
        while (ch = parseIdentifierAtom(isIdentifierPart)) {
          res += ch;
        }

        return addRaw({
          type: 'identifier',
          value: res,
          range: [start, pos]
        });
      }

      function isIdentifierStart(ch) {
        // Generated by `tools/generate-identifier-regex.js`.
        var NonAsciiIdentifierStart = /[\$A-Z_a-z\xAA\xB5\xBA\xC0-\xD6\xD8-\xF6\xF8-\u02C1\u02C6-\u02D1\u02E0-\u02E4\u02EC\u02EE\u0370-\u0374\u0376\u0377\u037A-\u037D\u037F\u0386\u0388-\u038A\u038C\u038E-\u03A1\u03A3-\u03F5\u03F7-\u0481\u048A-\u052F\u0531-\u0556\u0559\u0560-\u0588\u05D0-\u05EA\u05EF-\u05F2\u0620-\u064A\u066E\u066F\u0671-\u06D3\u06D5\u06E5\u06E6\u06EE\u06EF\u06FA-\u06FC\u06FF\u0710\u0712-\u072F\u074D-\u07A5\u07B1\u07CA-\u07EA\u07F4\u07F5\u07FA\u0800-\u0815\u081A\u0824\u0828\u0840-\u0858\u0860-\u086A\u08A0-\u08B4\u08B6-\u08BD\u0904-\u0939\u093D\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098C\u098F\u0990\u0993-\u09A8\u09AA-\u09B0\u09B2\u09B6-\u09B9\u09BD\u09CE\u09DC\u09DD\u09DF-\u09E1\u09F0\u09F1\u09FC\u0A05-\u0A0A\u0A0F\u0A10\u0A13-\u0A28\u0A2A-\u0A30\u0A32\u0A33\u0A35\u0A36\u0A38\u0A39\u0A59-\u0A5C\u0A5E\u0A72-\u0A74\u0A85-\u0A8D\u0A8F-\u0A91\u0A93-\u0AA8\u0AAA-\u0AB0\u0AB2\u0AB3\u0AB5-\u0AB9\u0ABD\u0AD0\u0AE0\u0AE1\u0AF9\u0B05-\u0B0C\u0B0F\u0B10\u0B13-\u0B28\u0B2A-\u0B30\u0B32\u0B33\u0B35-\u0B39\u0B3D\u0B5C\u0B5D\u0B5F-\u0B61\u0B71\u0B83\u0B85-\u0B8A\u0B8E-\u0B90\u0B92-\u0B95\u0B99\u0B9A\u0B9C\u0B9E\u0B9F\u0BA3\u0BA4\u0BA8-\u0BAA\u0BAE-\u0BB9\u0BD0\u0C05-\u0C0C\u0C0E-\u0C10\u0C12-\u0C28\u0C2A-\u0C39\u0C3D\u0C58-\u0C5A\u0C60\u0C61\u0C80\u0C85-\u0C8C\u0C8E-\u0C90\u0C92-\u0CA8\u0CAA-\u0CB3\u0CB5-\u0CB9\u0CBD\u0CDE\u0CE0\u0CE1\u0CF1\u0CF2\u0D05-\u0D0C\u0D0E-\u0D10\u0D12-\u0D3A\u0D3D\u0D4E\u0D54-\u0D56\u0D5F-\u0D61\u0D7A-\u0D7F\u0D85-\u0D96\u0D9A-\u0DB1\u0DB3-\u0DBB\u0DBD\u0DC0-\u0DC6\u0E01-\u0E30\u0E32\u0E33\u0E40-\u0E46\u0E81\u0E82\u0E84\u0E87\u0E88\u0E8A\u0E8D\u0E94-\u0E97\u0E99-\u0E9F\u0EA1-\u0EA3\u0EA5\u0EA7\u0EAA\u0EAB\u0EAD-\u0EB0\u0EB2\u0EB3\u0EBD\u0EC0-\u0EC4\u0EC6\u0EDC-\u0EDF\u0F00\u0F40-\u0F47\u0F49-\u0F6C\u0F88-\u0F8C\u1000-\u102A\u103F\u1050-\u1055\u105A-\u105D\u1061\u1065\u1066\u106E-\u1070\u1075-\u1081\u108E\u10A0-\u10C5\u10C7\u10CD\u10D0-\u10FA\u10FC-\u1248\u124A-\u124D\u1250-\u1256\u1258\u125A-\u125D\u1260-\u1288\u128A-\u128D\u1290-\u12B0\u12B2-\u12B5\u12B8-\u12BE\u12C0\u12C2-\u12C5\u12C8-\u12D6\u12D8-\u1310\u1312-\u1315\u1318-\u135A\u1380-\u138F\u13A0-\u13F5\u13F8-\u13FD\u1401-\u166C\u166F-\u167F\u1681-\u169A\u16A0-\u16EA\u16EE-\u16F8\u1700-\u170C\u170E-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176C\u176E-\u1770\u1780-\u17B3\u17D7\u17DC\u1820-\u1878\u1880-\u18A8\u18AA\u18B0-\u18F5\u1900-\u191E\u1950-\u196D\u1970-\u1974\u1980-\u19AB\u19B0-\u19C9\u1A00-\u1A16\u1A20-\u1A54\u1AA7\u1B05-\u1B33\u1B45-\u1B4B\u1B83-\u1BA0\u1BAE\u1BAF\u1BBA-\u1BE5\u1C00-\u1C23\u1C4D-\u1C4F\u1C5A-\u1C7D\u1C80-\u1C88\u1C90-\u1CBA\u1CBD-\u1CBF\u1CE9-\u1CEC\u1CEE-\u1CF1\u1CF5\u1CF6\u1D00-\u1DBF\u1E00-\u1F15\u1F18-\u1F1D\u1F20-\u1F45\u1F48-\u1F4D\u1F50-\u1F57\u1F59\u1F5B\u1F5D\u1F5F-\u1F7D\u1F80-\u1FB4\u1FB6-\u1FBC\u1FBE\u1FC2-\u1FC4\u1FC6-\u1FCC\u1FD0-\u1FD3\u1FD6-\u1FDB\u1FE0-\u1FEC\u1FF2-\u1FF4\u1FF6-\u1FFC\u2071\u207F\u2090-\u209C\u2102\u2107\u210A-\u2113\u2115\u2118-\u211D\u2124\u2126\u2128\u212A-\u2139\u213C-\u213F\u2145-\u2149\u214E\u2160-\u2188\u2C00-\u2C2E\u2C30-\u2C5E\u2C60-\u2CE4\u2CEB-\u2CEE\u2CF2\u2CF3\u2D00-\u2D25\u2D27\u2D2D\u2D30-\u2D67\u2D6F\u2D80-\u2D96\u2DA0-\u2DA6\u2DA8-\u2DAE\u2DB0-\u2DB6\u2DB8-\u2DBE\u2DC0-\u2DC6\u2DC8-\u2DCE\u2DD0-\u2DD6\u2DD8-\u2DDE\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303C\u3041-\u3096\u309B-\u309F\u30A1-\u30FA\u30FC-\u30FF\u3105-\u312F\u3131-\u318E\u31A0-\u31BA\u31F0-\u31FF\u3400-\u4DB5\u4E00-\u9FEF\uA000-\uA48C\uA4D0-\uA4FD\uA500-\uA60C\uA610-\uA61F\uA62A\uA62B\uA640-\uA66E\uA67F-\uA69D\uA6A0-\uA6EF\uA717-\uA71F\uA722-\uA788\uA78B-\uA7B9\uA7F7-\uA801\uA803-\uA805\uA807-\uA80A\uA80C-\uA822\uA840-\uA873\uA882-\uA8B3\uA8F2-\uA8F7\uA8FB\uA8FD\uA8FE\uA90A-\uA925\uA930-\uA946\uA960-\uA97C\uA984-\uA9B2\uA9CF\uA9E0-\uA9E4\uA9E6-\uA9EF\uA9FA-\uA9FE\uAA00-\uAA28\uAA40-\uAA42\uAA44-\uAA4B\uAA60-\uAA76\uAA7A\uAA7E-\uAAAF\uAAB1\uAAB5\uAAB6\uAAB9-\uAABD\uAAC0\uAAC2\uAADB-\uAADD\uAAE0-\uAAEA\uAAF2-\uAAF4\uAB01-\uAB06\uAB09-\uAB0E\uAB11-\uAB16\uAB20-\uAB26\uAB28-\uAB2E\uAB30-\uAB5A\uAB5C-\uAB65\uAB70-\uABE2\uAC00-\uD7A3\uD7B0-\uD7C6\uD7CB-\uD7FB\uF900-\uFA6D\uFA70-\uFAD9\uFB00-\uFB06\uFB13-\uFB17\uFB1D\uFB1F-\uFB28\uFB2A-\uFB36\uFB38-\uFB3C\uFB3E\uFB40\uFB41\uFB43\uFB44\uFB46-\uFBB1\uFBD3-\uFD3D\uFD50-\uFD8F\uFD92-\uFDC7\uFDF0-\uFDFB\uFE70-\uFE74\uFE76-\uFEFC\uFF21-\uFF3A\uFF41-\uFF5A\uFF66-\uFFBE\uFFC2-\uFFC7\uFFCA-\uFFCF\uFFD2-\uFFD7\uFFDA-\uFFDC]|\uD800[\uDC00-\uDC0B\uDC0D-\uDC26\uDC28-\uDC3A\uDC3C\uDC3D\uDC3F-\uDC4D\uDC50-\uDC5D\uDC80-\uDCFA\uDD40-\uDD74\uDE80-\uDE9C\uDEA0-\uDED0\uDF00-\uDF1F\uDF2D-\uDF4A\uDF50-\uDF75\uDF80-\uDF9D\uDFA0-\uDFC3\uDFC8-\uDFCF\uDFD1-\uDFD5]|\uD801[\uDC00-\uDC9D\uDCB0-\uDCD3\uDCD8-\uDCFB\uDD00-\uDD27\uDD30-\uDD63\uDE00-\uDF36\uDF40-\uDF55\uDF60-\uDF67]|\uD802[\uDC00-\uDC05\uDC08\uDC0A-\uDC35\uDC37\uDC38\uDC3C\uDC3F-\uDC55\uDC60-\uDC76\uDC80-\uDC9E\uDCE0-\uDCF2\uDCF4\uDCF5\uDD00-\uDD15\uDD20-\uDD39\uDD80-\uDDB7\uDDBE\uDDBF\uDE00\uDE10-\uDE13\uDE15-\uDE17\uDE19-\uDE35\uDE60-\uDE7C\uDE80-\uDE9C\uDEC0-\uDEC7\uDEC9-\uDEE4\uDF00-\uDF35\uDF40-\uDF55\uDF60-\uDF72\uDF80-\uDF91]|\uD803[\uDC00-\uDC48\uDC80-\uDCB2\uDCC0-\uDCF2\uDD00-\uDD23\uDF00-\uDF1C\uDF27\uDF30-\uDF45]|\uD804[\uDC03-\uDC37\uDC83-\uDCAF\uDCD0-\uDCE8\uDD03-\uDD26\uDD44\uDD50-\uDD72\uDD76\uDD83-\uDDB2\uDDC1-\uDDC4\uDDDA\uDDDC\uDE00-\uDE11\uDE13-\uDE2B\uDE80-\uDE86\uDE88\uDE8A-\uDE8D\uDE8F-\uDE9D\uDE9F-\uDEA8\uDEB0-\uDEDE\uDF05-\uDF0C\uDF0F\uDF10\uDF13-\uDF28\uDF2A-\uDF30\uDF32\uDF33\uDF35-\uDF39\uDF3D\uDF50\uDF5D-\uDF61]|\uD805[\uDC00-\uDC34\uDC47-\uDC4A\uDC80-\uDCAF\uDCC4\uDCC5\uDCC7\uDD80-\uDDAE\uDDD8-\uDDDB\uDE00-\uDE2F\uDE44\uDE80-\uDEAA\uDF00-\uDF1A]|\uD806[\uDC00-\uDC2B\uDCA0-\uDCDF\uDCFF\uDE00\uDE0B-\uDE32\uDE3A\uDE50\uDE5C-\uDE83\uDE86-\uDE89\uDE9D\uDEC0-\uDEF8]|\uD807[\uDC00-\uDC08\uDC0A-\uDC2E\uDC40\uDC72-\uDC8F\uDD00-\uDD06\uDD08\uDD09\uDD0B-\uDD30\uDD46\uDD60-\uDD65\uDD67\uDD68\uDD6A-\uDD89\uDD98\uDEE0-\uDEF2]|\uD808[\uDC00-\uDF99]|\uD809[\uDC00-\uDC6E\uDC80-\uDD43]|[\uD80C\uD81C-\uD820\uD840-\uD868\uD86A-\uD86C\uD86F-\uD872\uD874-\uD879][\uDC00-\uDFFF]|\uD80D[\uDC00-\uDC2E]|\uD811[\uDC00-\uDE46]|\uD81A[\uDC00-\uDE38\uDE40-\uDE5E\uDED0-\uDEED\uDF00-\uDF2F\uDF40-\uDF43\uDF63-\uDF77\uDF7D-\uDF8F]|\uD81B[\uDE40-\uDE7F\uDF00-\uDF44\uDF50\uDF93-\uDF9F\uDFE0\uDFE1]|\uD821[\uDC00-\uDFF1]|\uD822[\uDC00-\uDEF2]|\uD82C[\uDC00-\uDD1E\uDD70-\uDEFB]|\uD82F[\uDC00-\uDC6A\uDC70-\uDC7C\uDC80-\uDC88\uDC90-\uDC99]|\uD835[\uDC00-\uDC54\uDC56-\uDC9C\uDC9E\uDC9F\uDCA2\uDCA5\uDCA6\uDCA9-\uDCAC\uDCAE-\uDCB9\uDCBB\uDCBD-\uDCC3\uDCC5-\uDD05\uDD07-\uDD0A\uDD0D-\uDD14\uDD16-\uDD1C\uDD1E-\uDD39\uDD3B-\uDD3E\uDD40-\uDD44\uDD46\uDD4A-\uDD50\uDD52-\uDEA5\uDEA8-\uDEC0\uDEC2-\uDEDA\uDEDC-\uDEFA\uDEFC-\uDF14\uDF16-\uDF34\uDF36-\uDF4E\uDF50-\uDF6E\uDF70-\uDF88\uDF8A-\uDFA8\uDFAA-\uDFC2\uDFC4-\uDFCB]|\uD83A[\uDC00-\uDCC4\uDD00-\uDD43]|\uD83B[\uDE00-\uDE03\uDE05-\uDE1F\uDE21\uDE22\uDE24\uDE27\uDE29-\uDE32\uDE34-\uDE37\uDE39\uDE3B\uDE42\uDE47\uDE49\uDE4B\uDE4D-\uDE4F\uDE51\uDE52\uDE54\uDE57\uDE59\uDE5B\uDE5D\uDE5F\uDE61\uDE62\uDE64\uDE67-\uDE6A\uDE6C-\uDE72\uDE74-\uDE77\uDE79-\uDE7C\uDE7E\uDE80-\uDE89\uDE8B-\uDE9B\uDEA1-\uDEA3\uDEA5-\uDEA9\uDEAB-\uDEBB]|\uD869[\uDC00-\uDED6\uDF00-\uDFFF]|\uD86D[\uDC00-\uDF34\uDF40-\uDFFF]|\uD86E[\uDC00-\uDC1D\uDC20-\uDFFF]|\uD873[\uDC00-\uDEA1\uDEB0-\uDFFF]|\uD87A[\uDC00-\uDFE0]|\uD87E[\uDC00-\uDE1D]/;

        return (ch === 36) || (ch === 95) ||  // $ (dollar) and _ (underscore)
          (ch >= 65 && ch <= 90) ||         // A..Z
          (ch >= 97 && ch <= 122) ||        // a..z
          ((ch >= 0x80) && NonAsciiIdentifierStart.test(fromCodePoint(ch)));
      }

      // Taken from the Esprima parser.
      function isIdentifierPart(ch) {
        // Generated by `tools/generate-identifier-regex.js`.
        var NonAsciiIdentifierPartOnly = /[0-9_\xB7\u0300-\u036F\u0387\u0483-\u0487\u0591-\u05BD\u05BF\u05C1\u05C2\u05C4\u05C5\u05C7\u0610-\u061A\u064B-\u0669\u0670\u06D6-\u06DC\u06DF-\u06E4\u06E7\u06E8\u06EA-\u06ED\u06F0-\u06F9\u0711\u0730-\u074A\u07A6-\u07B0\u07C0-\u07C9\u07EB-\u07F3\u07FD\u0816-\u0819\u081B-\u0823\u0825-\u0827\u0829-\u082D\u0859-\u085B\u08D3-\u08E1\u08E3-\u0903\u093A-\u093C\u093E-\u094F\u0951-\u0957\u0962\u0963\u0966-\u096F\u0981-\u0983\u09BC\u09BE-\u09C4\u09C7\u09C8\u09CB-\u09CD\u09D7\u09E2\u09E3\u09E6-\u09EF\u09FE\u0A01-\u0A03\u0A3C\u0A3E-\u0A42\u0A47\u0A48\u0A4B-\u0A4D\u0A51\u0A66-\u0A71\u0A75\u0A81-\u0A83\u0ABC\u0ABE-\u0AC5\u0AC7-\u0AC9\u0ACB-\u0ACD\u0AE2\u0AE3\u0AE6-\u0AEF\u0AFA-\u0AFF\u0B01-\u0B03\u0B3C\u0B3E-\u0B44\u0B47\u0B48\u0B4B-\u0B4D\u0B56\u0B57\u0B62\u0B63\u0B66-\u0B6F\u0B82\u0BBE-\u0BC2\u0BC6-\u0BC8\u0BCA-\u0BCD\u0BD7\u0BE6-\u0BEF\u0C00-\u0C04\u0C3E-\u0C44\u0C46-\u0C48\u0C4A-\u0C4D\u0C55\u0C56\u0C62\u0C63\u0C66-\u0C6F\u0C81-\u0C83\u0CBC\u0CBE-\u0CC4\u0CC6-\u0CC8\u0CCA-\u0CCD\u0CD5\u0CD6\u0CE2\u0CE3\u0CE6-\u0CEF\u0D00-\u0D03\u0D3B\u0D3C\u0D3E-\u0D44\u0D46-\u0D48\u0D4A-\u0D4D\u0D57\u0D62\u0D63\u0D66-\u0D6F\u0D82\u0D83\u0DCA\u0DCF-\u0DD4\u0DD6\u0DD8-\u0DDF\u0DE6-\u0DEF\u0DF2\u0DF3\u0E31\u0E34-\u0E3A\u0E47-\u0E4E\u0E50-\u0E59\u0EB1\u0EB4-\u0EB9\u0EBB\u0EBC\u0EC8-\u0ECD\u0ED0-\u0ED9\u0F18\u0F19\u0F20-\u0F29\u0F35\u0F37\u0F39\u0F3E\u0F3F\u0F71-\u0F84\u0F86\u0F87\u0F8D-\u0F97\u0F99-\u0FBC\u0FC6\u102B-\u103E\u1040-\u1049\u1056-\u1059\u105E-\u1060\u1062-\u1064\u1067-\u106D\u1071-\u1074\u1082-\u108D\u108F-\u109D\u135D-\u135F\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17B4-\u17D3\u17DD\u17E0-\u17E9\u180B-\u180D\u1810-\u1819\u18A9\u1920-\u192B\u1930-\u193B\u1946-\u194F\u19D0-\u19DA\u1A17-\u1A1B\u1A55-\u1A5E\u1A60-\u1A7C\u1A7F-\u1A89\u1A90-\u1A99\u1AB0-\u1ABD\u1B00-\u1B04\u1B34-\u1B44\u1B50-\u1B59\u1B6B-\u1B73\u1B80-\u1B82\u1BA1-\u1BAD\u1BB0-\u1BB9\u1BE6-\u1BF3\u1C24-\u1C37\u1C40-\u1C49\u1C50-\u1C59\u1CD0-\u1CD2\u1CD4-\u1CE8\u1CED\u1CF2-\u1CF4\u1CF7-\u1CF9\u1DC0-\u1DF9\u1DFB-\u1DFF\u200C\u200D\u203F\u2040\u2054\u20D0-\u20DC\u20E1\u20E5-\u20F0\u2CEF-\u2CF1\u2D7F\u2DE0-\u2DFF\u302A-\u302F\u3099\u309A\uA620-\uA629\uA66F\uA674-\uA67D\uA69E\uA69F\uA6F0\uA6F1\uA802\uA806\uA80B\uA823-\uA827\uA880\uA881\uA8B4-\uA8C5\uA8D0-\uA8D9\uA8E0-\uA8F1\uA8FF-\uA909\uA926-\uA92D\uA947-\uA953\uA980-\uA983\uA9B3-\uA9C0\uA9D0-\uA9D9\uA9E5\uA9F0-\uA9F9\uAA29-\uAA36\uAA43\uAA4C\uAA4D\uAA50-\uAA59\uAA7B-\uAA7D\uAAB0\uAAB2-\uAAB4\uAAB7\uAAB8\uAABE\uAABF\uAAC1\uAAEB-\uAAEF\uAAF5\uAAF6\uABE3-\uABEA\uABEC\uABED\uABF0-\uABF9\uFB1E\uFE00-\uFE0F\uFE20-\uFE2F\uFE33\uFE34\uFE4D-\uFE4F\uFF10-\uFF19\uFF3F]|\uD800[\uDDFD\uDEE0\uDF76-\uDF7A]|\uD801[\uDCA0-\uDCA9]|\uD802[\uDE01-\uDE03\uDE05\uDE06\uDE0C-\uDE0F\uDE38-\uDE3A\uDE3F\uDEE5\uDEE6]|\uD803[\uDD24-\uDD27\uDD30-\uDD39\uDF46-\uDF50]|\uD804[\uDC00-\uDC02\uDC38-\uDC46\uDC66-\uDC6F\uDC7F-\uDC82\uDCB0-\uDCBA\uDCF0-\uDCF9\uDD00-\uDD02\uDD27-\uDD34\uDD36-\uDD3F\uDD45\uDD46\uDD73\uDD80-\uDD82\uDDB3-\uDDC0\uDDC9-\uDDCC\uDDD0-\uDDD9\uDE2C-\uDE37\uDE3E\uDEDF-\uDEEA\uDEF0-\uDEF9\uDF00-\uDF03\uDF3B\uDF3C\uDF3E-\uDF44\uDF47\uDF48\uDF4B-\uDF4D\uDF57\uDF62\uDF63\uDF66-\uDF6C\uDF70-\uDF74]|\uD805[\uDC35-\uDC46\uDC50-\uDC59\uDC5E\uDCB0-\uDCC3\uDCD0-\uDCD9\uDDAF-\uDDB5\uDDB8-\uDDC0\uDDDC\uDDDD\uDE30-\uDE40\uDE50-\uDE59\uDEAB-\uDEB7\uDEC0-\uDEC9\uDF1D-\uDF2B\uDF30-\uDF39]|\uD806[\uDC2C-\uDC3A\uDCE0-\uDCE9\uDE01-\uDE0A\uDE33-\uDE39\uDE3B-\uDE3E\uDE47\uDE51-\uDE5B\uDE8A-\uDE99]|\uD807[\uDC2F-\uDC36\uDC38-\uDC3F\uDC50-\uDC59\uDC92-\uDCA7\uDCA9-\uDCB6\uDD31-\uDD36\uDD3A\uDD3C\uDD3D\uDD3F-\uDD45\uDD47\uDD50-\uDD59\uDD8A-\uDD8E\uDD90\uDD91\uDD93-\uDD97\uDDA0-\uDDA9\uDEF3-\uDEF6]|\uD81A[\uDE60-\uDE69\uDEF0-\uDEF4\uDF30-\uDF36\uDF50-\uDF59]|\uD81B[\uDF51-\uDF7E\uDF8F-\uDF92]|\uD82F[\uDC9D\uDC9E]|\uD834[\uDD65-\uDD69\uDD6D-\uDD72\uDD7B-\uDD82\uDD85-\uDD8B\uDDAA-\uDDAD\uDE42-\uDE44]|\uD835[\uDFCE-\uDFFF]|\uD836[\uDE00-\uDE36\uDE3B-\uDE6C\uDE75\uDE84\uDE9B-\uDE9F\uDEA1-\uDEAF]|\uD838[\uDC00-\uDC06\uDC08-\uDC18\uDC1B-\uDC21\uDC23\uDC24\uDC26-\uDC2A]|\uD83A[\uDCD0-\uDCD6\uDD44-\uDD4A\uDD50-\uDD59]|\uDB40[\uDD00-\uDDEF]/;

        return isIdentifierStart(ch) ||
          (ch >= 48 && ch <= 57) ||         // 0..9
          ((ch >= 0x80) && NonAsciiIdentifierPartOnly.test(fromCodePoint(ch)));
      }

      function parseIdentityEscape() {
        // IdentityEscape ::
        //      [+U] SyntaxCharacter
        //      [+U] /
        //      [~U] SourceCharacterIdentityEscape[?N]
        // SourceCharacterIdentityEscape[?N] ::
        //      [~N] SourceCharacter but not c
        //      [+N] SourceCharacter but not one of c or k


        var tmp;
        var l = lookahead();
        if (
          (hasUnicodeFlag && /[\^\$\.\*\+\?\(\)\\\[\]\{\}\|\/]/.test(l)) ||
          (!hasUnicodeFlag && l !== "c")
        ) {
          if (l === "k" && features.lookbehind) {
            return null;
          }
          tmp = incr();
          return createEscaped('identifier', tmp.charCodeAt(0), tmp, 1);
        }

        return null;
      }

      function parseCharacterClass() {
        // CharacterClass ::
        //      [ [lookahead ∉ {^}] ClassRanges ]
        //      [ ^ ClassRanges ]

        var res, from = pos;
        if (res = matchReg(/^\[\^/)) {
          res = parseClassRanges();
          skip(']');
          return createCharacterClass(res, true, from, pos);
        } else if (match('[')) {
          res = parseClassRanges();
          skip(']');
          return createCharacterClass(res, false, from, pos);
        }

        return null;
      }

      function parseClassRanges() {
        // ClassRanges ::
        //      [empty]
        //      NonemptyClassRanges

        var res;
        if (current(']')) {
          // Empty array means nothing insinde of the ClassRange.
          return [];
        } else {
          res = parseNonemptyClassRanges();
          if (!res) {
            bail('nonEmptyClassRanges');
          }
          return res;
        }
      }

      function parseHelperClassRanges(atom) {
        var from, to, res;
        if (current('-') && !next(']')) {
          // ClassAtom - ClassAtom ClassRanges
          skip('-');

          res = parseClassAtom();
          if (!res) {
            bail('classAtom');
          }
          to = pos;
          var classRanges = parseClassRanges();
          if (!classRanges) {
            bail('classRanges');
          }
          from = atom.range[0];
          if (classRanges.type === 'empty') {
            return [createClassRange(atom, res, from, to)];
          }
          return [createClassRange(atom, res, from, to)].concat(classRanges);
        }

        res = parseNonemptyClassRangesNoDash();
        if (!res) {
          bail('nonEmptyClassRangesNoDash');
        }

        return [atom].concat(res);
      }

      function parseNonemptyClassRanges() {
        // NonemptyClassRanges ::
        //      ClassAtom
        //      ClassAtom NonemptyClassRangesNoDash
        //      ClassAtom - ClassAtom ClassRanges

        var atom = parseClassAtom();
        if (!atom) {
          bail('classAtom');
        }

        if (current(']')) {
          // ClassAtom
          return [atom];
        }

        // ClassAtom NonemptyClassRangesNoDash
        // ClassAtom - ClassAtom ClassRanges
        return parseHelperClassRanges(atom);
      }

      function parseNonemptyClassRangesNoDash() {
        // NonemptyClassRangesNoDash ::
        //      ClassAtom
        //      ClassAtomNoDash NonemptyClassRangesNoDash
        //      ClassAtomNoDash - ClassAtom ClassRanges

        var res = parseClassAtom();
        if (!res) {
          bail('classAtom');
        }
        if (current(']')) {
          //      ClassAtom
          return res;
        }

        // ClassAtomNoDash NonemptyClassRangesNoDash
        // ClassAtomNoDash - ClassAtom ClassRanges
        return parseHelperClassRanges(res);
      }

      function parseClassAtom() {
        // ClassAtom ::
        //      -
        //      ClassAtomNoDash
        if (match('-')) {
          return createCharacter('-');
        } else {
          return parseClassAtomNoDash();
        }
      }

      function parseClassAtomNoDash() {
        // ClassAtomNoDash ::
        //      SourceCharacter but not one of \ or ] or -
        //      \ ClassEscape

        var res;
        if (res = matchReg(/^[^\\\]-]/)) {
          return createCharacter(res[0]);
        } else if (match('\\')) {
          res = parseClassEscape();
          if (!res) {
            bail('classEscape');
          }

          return parseUnicodeSurrogatePairEscape(res);
        }
      }

      function bail(message, details, from, to) {
        from = from == null ? pos : from;
        to = to == null ? from : to;

        var contextStart = Math.max(0, from - 10);
        var contextEnd = Math.min(to + 10, str.length);

        // Output a bit of context and a line pointing to where our error is.
        //
        // We are assuming that there are no actual newlines in the content as this is a regular expression.
        var context = '    ' + str.substring(contextStart, contextEnd);
        var pointer = '    ' + new Array(from - contextStart + 1).join(' ') + '^';

        throw SyntaxError(message + ' at position ' + from + (details ? ': ' + details : '') + '\n' + context + '\n' + pointer);
      }

      var backrefDenied = [];
      var closedCaptureCounter = 0;
      var firstIteration = true;
      var hasUnicodeFlag = (flags || "").indexOf("u") !== -1;
      var pos = 0;

      // Convert the input to a string and treat the empty string special.
      str = String(str);
      if (str === '') {
        str = '(?:)';
      }

      var result = parseDisjunction();

      if (result.range[1] !== str.length) {
        bail('Could not parse entire input - got stuck', '', result.range[1]);
      }

      // The spec requires to interpret the `\2` in `/\2()()/` as backreference.
      // As the parser collects the number of capture groups as the string is
      // parsed it is impossible to make these decisions at the point when the
      // `\2` is handled. In case the local decision turns out to be wrong after
      // the parsing has finished, the input string is parsed a second time with
      // the total number of capture groups set.
      //
      // SEE: https://github.com/jviereck/regjsparser/issues/70
      for (var i = 0; i < backrefDenied.length; i++) {
        if (backrefDenied[i] <= closedCaptureCounter) {
          // Parse the input a second time.
          pos = 0;
          firstIteration = false;
          return parseDisjunction();
        }
      }

      return result;
    }

    var regjsparser = {
      parse: parse
    };

    if ( module.exports) {
      module.exports = regjsparser;
    } else {
      window.regjsparser = regjsparser;
    }

  }());
  });

  var regenerate = createCommonjsModule(function (module, exports) {
  (function(root) {

  	// Detect free variables `exports`.
  	var freeExports =  exports;

  	// Detect free variable `module`.
  	var freeModule =  module &&
  		module.exports == freeExports && module;

  	// Detect free variable `global`, from Node.js/io.js or Browserified code,
  	// and use it as `root`.
  	var freeGlobal = typeof commonjsGlobal == 'object' && commonjsGlobal;
  	if (freeGlobal.global === freeGlobal || freeGlobal.window === freeGlobal) {
  		root = freeGlobal;
  	}

  	/*--------------------------------------------------------------------------*/

  	var ERRORS = {
  		'rangeOrder': 'A range\u2019s `stop` value must be greater than or equal ' +
  			'to the `start` value.',
  		'codePointRange': 'Invalid code point value. Code points range from ' +
  			'U+000000 to U+10FFFF.'
  	};

  	// https://mathiasbynens.be/notes/javascript-encoding#surrogate-pairs
  	var HIGH_SURROGATE_MIN = 0xD800;
  	var HIGH_SURROGATE_MAX = 0xDBFF;
  	var LOW_SURROGATE_MIN = 0xDC00;
  	var LOW_SURROGATE_MAX = 0xDFFF;

  	// In Regenerate output, `\0` is never preceded by `\` because we sort by
  	// code point value, so let’s keep this regular expression simple.
  	var regexNull = /\\x00([^0123456789]|$)/g;

  	var object = {};
  	var hasOwnProperty = object.hasOwnProperty;
  	var extend = function(destination, source) {
  		var key;
  		for (key in source) {
  			if (hasOwnProperty.call(source, key)) {
  				destination[key] = source[key];
  			}
  		}
  		return destination;
  	};

  	var forEach = function(array, callback) {
  		var index = -1;
  		var length = array.length;
  		while (++index < length) {
  			callback(array[index], index);
  		}
  	};

  	var toString = object.toString;
  	var isArray = function(value) {
  		return toString.call(value) == '[object Array]';
  	};
  	var isNumber = function(value) {
  		return typeof value == 'number' ||
  			toString.call(value) == '[object Number]';
  	};

  	// This assumes that `number` is a positive integer that `toString()`s nicely
  	// (which is the case for all code point values).
  	var zeroes = '0000';
  	var pad = function(number, totalCharacters) {
  		var string = String(number);
  		return string.length < totalCharacters
  			? (zeroes + string).slice(-totalCharacters)
  			: string;
  	};

  	var hex = function(number) {
  		return Number(number).toString(16).toUpperCase();
  	};

  	var slice = [].slice;

  	/*--------------------------------------------------------------------------*/

  	var dataFromCodePoints = function(codePoints) {
  		var index = -1;
  		var length = codePoints.length;
  		var max = length - 1;
  		var result = [];
  		var isStart = true;
  		var tmp;
  		var previous = 0;
  		while (++index < length) {
  			tmp = codePoints[index];
  			if (isStart) {
  				result.push(tmp);
  				previous = tmp;
  				isStart = false;
  			} else {
  				if (tmp == previous + 1) {
  					if (index != max) {
  						previous = tmp;
  						continue;
  					} else {
  						isStart = true;
  						result.push(tmp + 1);
  					}
  				} else {
  					// End the previous range and start a new one.
  					result.push(previous + 1, tmp);
  					previous = tmp;
  				}
  			}
  		}
  		if (!isStart) {
  			result.push(tmp + 1);
  		}
  		return result;
  	};

  	var dataRemove = function(data, codePoint) {
  		// Iterate over the data per `(start, end)` pair.
  		var index = 0;
  		var start;
  		var end;
  		var length = data.length;
  		while (index < length) {
  			start = data[index];
  			end = data[index + 1];
  			if (codePoint >= start && codePoint < end) {
  				// Modify this pair.
  				if (codePoint == start) {
  					if (end == start + 1) {
  						// Just remove `start` and `end`.
  						data.splice(index, 2);
  						return data;
  					} else {
  						// Just replace `start` with a new value.
  						data[index] = codePoint + 1;
  						return data;
  					}
  				} else if (codePoint == end - 1) {
  					// Just replace `end` with a new value.
  					data[index + 1] = codePoint;
  					return data;
  				} else {
  					// Replace `[start, end]` with `[startA, endA, startB, endB]`.
  					data.splice(index, 2, start, codePoint, codePoint + 1, end);
  					return data;
  				}
  			}
  			index += 2;
  		}
  		return data;
  	};

  	var dataRemoveRange = function(data, rangeStart, rangeEnd) {
  		if (rangeEnd < rangeStart) {
  			throw Error(ERRORS.rangeOrder);
  		}
  		// Iterate over the data per `(start, end)` pair.
  		var index = 0;
  		var start;
  		var end;
  		while (index < data.length) {
  			start = data[index];
  			end = data[index + 1] - 1; // Note: the `- 1` makes `end` inclusive.

  			// Exit as soon as no more matching pairs can be found.
  			if (start > rangeEnd) {
  				return data;
  			}

  			// Check if this range pair is equal to, or forms a subset of, the range
  			// to be removed.
  			// E.g. we have `[0, 11, 40, 51]` and want to remove 0-10 → `[40, 51]`.
  			// E.g. we have `[40, 51]` and want to remove 0-100 → `[]`.
  			if (rangeStart <= start && rangeEnd >= end) {
  				// Remove this pair.
  				data.splice(index, 2);
  				continue;
  			}

  			// Check if both `rangeStart` and `rangeEnd` are within the bounds of
  			// this pair.
  			// E.g. we have `[0, 11]` and want to remove 4-6 → `[0, 4, 7, 11]`.
  			if (rangeStart >= start && rangeEnd < end) {
  				if (rangeStart == start) {
  					// Replace `[start, end]` with `[startB, endB]`.
  					data[index] = rangeEnd + 1;
  					data[index + 1] = end + 1;
  					return data;
  				}
  				// Replace `[start, end]` with `[startA, endA, startB, endB]`.
  				data.splice(index, 2, start, rangeStart, rangeEnd + 1, end + 1);
  				return data;
  			}

  			// Check if only `rangeStart` is within the bounds of this pair.
  			// E.g. we have `[0, 11]` and want to remove 4-20 → `[0, 4]`.
  			if (rangeStart >= start && rangeStart <= end) {
  				// Replace `end` with `rangeStart`.
  				data[index + 1] = rangeStart;
  				// Note: we cannot `return` just yet, in case any following pairs still
  				// contain matching code points.
  				// E.g. we have `[0, 11, 14, 31]` and want to remove 4-20
  				// → `[0, 4, 21, 31]`.
  			}

  			// Check if only `rangeEnd` is within the bounds of this pair.
  			// E.g. we have `[14, 31]` and want to remove 4-20 → `[21, 31]`.
  			else if (rangeEnd >= start && rangeEnd <= end) {
  				// Just replace `start`.
  				data[index] = rangeEnd + 1;
  				return data;
  			}

  			index += 2;
  		}
  		return data;
  	};

  	 var dataAdd = function(data, codePoint) {
  		// Iterate over the data per `(start, end)` pair.
  		var index = 0;
  		var start;
  		var end;
  		var lastIndex = null;
  		var length = data.length;
  		if (codePoint < 0x0 || codePoint > 0x10FFFF) {
  			throw RangeError(ERRORS.codePointRange);
  		}
  		while (index < length) {
  			start = data[index];
  			end = data[index + 1];

  			// Check if the code point is already in the set.
  			if (codePoint >= start && codePoint < end) {
  				return data;
  			}

  			if (codePoint == start - 1) {
  				// Just replace `start` with a new value.
  				data[index] = codePoint;
  				return data;
  			}

  			// At this point, if `start` is `greater` than `codePoint`, insert a new
  			// `[start, end]` pair before the current pair, or after the current pair
  			// if there is a known `lastIndex`.
  			if (start > codePoint) {
  				data.splice(
  					lastIndex != null ? lastIndex + 2 : 0,
  					0,
  					codePoint,
  					codePoint + 1
  				);
  				return data;
  			}

  			if (codePoint == end) {
  				// Check if adding this code point causes two separate ranges to become
  				// a single range, e.g. `dataAdd([0, 4, 5, 10], 4)` → `[0, 10]`.
  				if (codePoint + 1 == data[index + 2]) {
  					data.splice(index, 4, start, data[index + 3]);
  					return data;
  				}
  				// Else, just replace `end` with a new value.
  				data[index + 1] = codePoint + 1;
  				return data;
  			}
  			lastIndex = index;
  			index += 2;
  		}
  		// The loop has finished; add the new pair to the end of the data set.
  		data.push(codePoint, codePoint + 1);
  		return data;
  	};

  	var dataAddData = function(dataA, dataB) {
  		// Iterate over the data per `(start, end)` pair.
  		var index = 0;
  		var start;
  		var end;
  		var data = dataA.slice();
  		var length = dataB.length;
  		while (index < length) {
  			start = dataB[index];
  			end = dataB[index + 1] - 1;
  			if (start == end) {
  				data = dataAdd(data, start);
  			} else {
  				data = dataAddRange(data, start, end);
  			}
  			index += 2;
  		}
  		return data;
  	};

  	var dataRemoveData = function(dataA, dataB) {
  		// Iterate over the data per `(start, end)` pair.
  		var index = 0;
  		var start;
  		var end;
  		var data = dataA.slice();
  		var length = dataB.length;
  		while (index < length) {
  			start = dataB[index];
  			end = dataB[index + 1] - 1;
  			if (start == end) {
  				data = dataRemove(data, start);
  			} else {
  				data = dataRemoveRange(data, start, end);
  			}
  			index += 2;
  		}
  		return data;
  	};

  	var dataAddRange = function(data, rangeStart, rangeEnd) {
  		if (rangeEnd < rangeStart) {
  			throw Error(ERRORS.rangeOrder);
  		}
  		if (
  			rangeStart < 0x0 || rangeStart > 0x10FFFF ||
  			rangeEnd < 0x0 || rangeEnd > 0x10FFFF
  		) {
  			throw RangeError(ERRORS.codePointRange);
  		}
  		// Iterate over the data per `(start, end)` pair.
  		var index = 0;
  		var start;
  		var end;
  		var added = false;
  		var length = data.length;
  		while (index < length) {
  			start = data[index];
  			end = data[index + 1];

  			if (added) {
  				// The range has already been added to the set; at this point, we just
  				// need to get rid of the following ranges in case they overlap.

  				// Check if this range can be combined with the previous range.
  				if (start == rangeEnd + 1) {
  					data.splice(index - 1, 2);
  					return data;
  				}

  				// Exit as soon as no more possibly overlapping pairs can be found.
  				if (start > rangeEnd) {
  					return data;
  				}

  				// E.g. `[0, 11, 12, 16]` and we’ve added 5-15, so we now have
  				// `[0, 16, 12, 16]`. Remove the `12,16` part, as it lies within the
  				// `0,16` range that was previously added.
  				if (start >= rangeStart && start <= rangeEnd) {
  					// `start` lies within the range that was previously added.

  					if (end > rangeStart && end - 1 <= rangeEnd) {
  						// `end` lies within the range that was previously added as well,
  						// so remove this pair.
  						data.splice(index, 2);
  						index -= 2;
  						// Note: we cannot `return` just yet, as there may still be other
  						// overlapping pairs.
  					} else {
  						// `start` lies within the range that was previously added, but
  						// `end` doesn’t. E.g. `[0, 11, 12, 31]` and we’ve added 5-15, so
  						// now we have `[0, 16, 12, 31]`. This must be written as `[0, 31]`.
  						// Remove the previously added `end` and the current `start`.
  						data.splice(index - 1, 2);
  						index -= 2;
  					}

  					// Note: we cannot return yet.
  				}

  			}

  			else if (start == rangeEnd + 1) {
  				data[index] = rangeStart;
  				return data;
  			}

  			// Check if a new pair must be inserted *before* the current one.
  			else if (start > rangeEnd) {
  				data.splice(index, 0, rangeStart, rangeEnd + 1);
  				return data;
  			}

  			else if (rangeStart >= start && rangeStart < end && rangeEnd + 1 <= end) {
  				// The new range lies entirely within an existing range pair. No action
  				// needed.
  				return data;
  			}

  			else if (
  				// E.g. `[0, 11]` and you add 5-15 → `[0, 16]`.
  				(rangeStart >= start && rangeStart < end) ||
  				// E.g. `[0, 3]` and you add 3-6 → `[0, 7]`.
  				end == rangeStart
  			) {
  				// Replace `end` with the new value.
  				data[index + 1] = rangeEnd + 1;
  				// Make sure the next range pair doesn’t overlap, e.g. `[0, 11, 12, 14]`
  				// and you add 5-15 → `[0, 16]`, i.e. remove the `12,14` part.
  				added = true;
  				// Note: we cannot `return` just yet.
  			}

  			else if (rangeStart <= start && rangeEnd + 1 >= end) {
  				// The new range is a superset of the old range.
  				data[index] = rangeStart;
  				data[index + 1] = rangeEnd + 1;
  				added = true;
  			}

  			index += 2;
  		}
  		// The loop has finished without doing anything; add the new pair to the end
  		// of the data set.
  		if (!added) {
  			data.push(rangeStart, rangeEnd + 1);
  		}
  		return data;
  	};

  	var dataContains = function(data, codePoint) {
  		var index = 0;
  		var length = data.length;
  		// Exit early if `codePoint` is not within `data`’s overall range.
  		var start = data[index];
  		var end = data[length - 1];
  		if (length >= 2) {
  			if (codePoint < start || codePoint > end) {
  				return false;
  			}
  		}
  		// Iterate over the data per `(start, end)` pair.
  		while (index < length) {
  			start = data[index];
  			end = data[index + 1];
  			if (codePoint >= start && codePoint < end) {
  				return true;
  			}
  			index += 2;
  		}
  		return false;
  	};

  	var dataIntersection = function(data, codePoints) {
  		var index = 0;
  		var length = codePoints.length;
  		var codePoint;
  		var result = [];
  		while (index < length) {
  			codePoint = codePoints[index];
  			if (dataContains(data, codePoint)) {
  				result.push(codePoint);
  			}
  			++index;
  		}
  		return dataFromCodePoints(result);
  	};

  	var dataIsEmpty = function(data) {
  		return !data.length;
  	};

  	var dataIsSingleton = function(data) {
  		// Check if the set only represents a single code point.
  		return data.length == 2 && data[0] + 1 == data[1];
  	};

  	var dataToArray = function(data) {
  		// Iterate over the data per `(start, end)` pair.
  		var index = 0;
  		var start;
  		var end;
  		var result = [];
  		var length = data.length;
  		while (index < length) {
  			start = data[index];
  			end = data[index + 1];
  			while (start < end) {
  				result.push(start);
  				++start;
  			}
  			index += 2;
  		}
  		return result;
  	};

  	/*--------------------------------------------------------------------------*/

  	// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
  	var floor = Math.floor;
  	var highSurrogate = function(codePoint) {
  		return parseInt(
  			floor((codePoint - 0x10000) / 0x400) + HIGH_SURROGATE_MIN,
  			10
  		);
  	};

  	var lowSurrogate = function(codePoint) {
  		return parseInt(
  			(codePoint - 0x10000) % 0x400 + LOW_SURROGATE_MIN,
  			10
  		);
  	};

  	var stringFromCharCode = String.fromCharCode;
  	var codePointToString = function(codePoint) {
  		var string;
  		// https://mathiasbynens.be/notes/javascript-escapes#single
  		// Note: the `\b` escape sequence for U+0008 BACKSPACE in strings has a
  		// different meaning in regular expressions (word boundary), so it cannot
  		// be used here.
  		if (codePoint == 0x09) {
  			string = '\\t';
  		}
  		// Note: IE < 9 treats `'\v'` as `'v'`, so avoid using it.
  		// else if (codePoint == 0x0B) {
  		// 	string = '\\v';
  		// }
  		else if (codePoint == 0x0A) {
  			string = '\\n';
  		}
  		else if (codePoint == 0x0C) {
  			string = '\\f';
  		}
  		else if (codePoint == 0x0D) {
  			string = '\\r';
  		}
  		else if (codePoint == 0x2D) {
  			// https://mathiasbynens.be/notes/javascript-escapes#hexadecimal
  			// Note: `-` (U+002D HYPHEN-MINUS) is escaped in this way rather
  			// than by backslash-escaping, in case the output is used outside
  			// of a character class in a `u` RegExp. /\-/u throws, but
  			// /\x2D/u is fine.
  			string = '\\x2D';
  		}
  		else if (codePoint == 0x5C) {
  			string = '\\\\';
  		}
  		else if (
  			codePoint == 0x24 ||
  			(codePoint >= 0x28 && codePoint <= 0x2B) ||
  			codePoint == 0x2E || codePoint == 0x2F ||
  			codePoint == 0x3F ||
  			(codePoint >= 0x5B && codePoint <= 0x5E) ||
  			(codePoint >= 0x7B && codePoint <= 0x7D)
  		) {
  			// The code point maps to an unsafe printable ASCII character;
  			// backslash-escape it. Here’s the list of those symbols:
  			//
  			//     $()*+./?[\]^{|}
  			//
  			// This matches SyntaxCharacters as well as `/` (U+002F SOLIDUS).
  			// https://tc39.github.io/ecma262/#prod-SyntaxCharacter
  			string = '\\' + stringFromCharCode(codePoint);
  		}
  		else if (codePoint >= 0x20 && codePoint <= 0x7E) {
  			// The code point maps to one of these printable ASCII symbols
  			// (including the space character):
  			//
  			//      !"#%&',/0123456789:;<=>@ABCDEFGHIJKLMNO
  			//     PQRSTUVWXYZ_`abcdefghijklmnopqrstuvwxyz~
  			//
  			// These can safely be used directly.
  			string = stringFromCharCode(codePoint);
  		}
  		else if (codePoint <= 0xFF) {
  			string = '\\x' + pad(hex(codePoint), 2);
  		}
  		else { // `codePoint <= 0xFFFF` holds true.
  			// https://mathiasbynens.be/notes/javascript-escapes#unicode
  			string = '\\u' + pad(hex(codePoint), 4);
  		}

  		// There’s no need to account for astral symbols / surrogate pairs here,
  		// since `codePointToString` is private and only used for BMP code points.
  		// But if that’s what you need, just add an `else` block with this code:
  		//
  		//     string = '\\u' + pad(hex(highSurrogate(codePoint)), 4)
  		//     	+ '\\u' + pad(hex(lowSurrogate(codePoint)), 4);

  		return string;
  	};

  	var codePointToStringUnicode = function(codePoint) {
  		if (codePoint <= 0xFFFF) {
  			return codePointToString(codePoint);
  		}
  		return '\\u{' + codePoint.toString(16).toUpperCase() + '}';
  	};

  	var symbolToCodePoint = function(symbol) {
  		var length = symbol.length;
  		var first = symbol.charCodeAt(0);
  		var second;
  		if (
  			first >= HIGH_SURROGATE_MIN && first <= HIGH_SURROGATE_MAX &&
  			length > 1 // There is a next code unit.
  		) {
  			// `first` is a high surrogate, and there is a next character. Assume
  			// it’s a low surrogate (else it’s invalid usage of Regenerate anyway).
  			second = symbol.charCodeAt(1);
  			// https://mathiasbynens.be/notes/javascript-encoding#surrogate-formulae
  			return (first - HIGH_SURROGATE_MIN) * 0x400 +
  				second - LOW_SURROGATE_MIN + 0x10000;
  		}
  		return first;
  	};

  	var createBMPCharacterClasses = function(data) {
  		// Iterate over the data per `(start, end)` pair.
  		var result = '';
  		var index = 0;
  		var start;
  		var end;
  		var length = data.length;
  		if (dataIsSingleton(data)) {
  			return codePointToString(data[0]);
  		}
  		while (index < length) {
  			start = data[index];
  			end = data[index + 1] - 1; // Note: the `- 1` makes `end` inclusive.
  			if (start == end) {
  				result += codePointToString(start);
  			} else if (start + 1 == end) {
  				result += codePointToString(start) + codePointToString(end);
  			} else {
  				result += codePointToString(start) + '-' + codePointToString(end);
  			}
  			index += 2;
  		}
  		return '[' + result + ']';
  	};

  	var createUnicodeCharacterClasses = function(data) {
  		// Iterate over the data per `(start, end)` pair.
  		var result = '';
  		var index = 0;
  		var start;
  		var end;
  		var length = data.length;
  		if (dataIsSingleton(data)) {
  			return codePointToStringUnicode(data[0]);
  		}
  		while (index < length) {
  			start = data[index];
  			end = data[index + 1] - 1; // Note: the `- 1` makes `end` inclusive.
  			if (start == end) {
  				result += codePointToStringUnicode(start);
  			} else if (start + 1 == end) {
  				result += codePointToStringUnicode(start) + codePointToStringUnicode(end);
  			} else {
  				result += codePointToStringUnicode(start) + '-' + codePointToStringUnicode(end);
  			}
  			index += 2;
  		}
  		return '[' + result + ']';
  	};

  	var splitAtBMP = function(data) {
  		// Iterate over the data per `(start, end)` pair.
  		var loneHighSurrogates = [];
  		var loneLowSurrogates = [];
  		var bmp = [];
  		var astral = [];
  		var index = 0;
  		var start;
  		var end;
  		var length = data.length;
  		while (index < length) {
  			start = data[index];
  			end = data[index + 1] - 1; // Note: the `- 1` makes `end` inclusive.

  			if (start < HIGH_SURROGATE_MIN) {

  				// The range starts and ends before the high surrogate range.
  				// E.g. (0, 0x10).
  				if (end < HIGH_SURROGATE_MIN) {
  					bmp.push(start, end + 1);
  				}

  				// The range starts before the high surrogate range and ends within it.
  				// E.g. (0, 0xD855).
  				if (end >= HIGH_SURROGATE_MIN && end <= HIGH_SURROGATE_MAX) {
  					bmp.push(start, HIGH_SURROGATE_MIN);
  					loneHighSurrogates.push(HIGH_SURROGATE_MIN, end + 1);
  				}

  				// The range starts before the high surrogate range and ends in the low
  				// surrogate range. E.g. (0, 0xDCFF).
  				if (end >= LOW_SURROGATE_MIN && end <= LOW_SURROGATE_MAX) {
  					bmp.push(start, HIGH_SURROGATE_MIN);
  					loneHighSurrogates.push(HIGH_SURROGATE_MIN, HIGH_SURROGATE_MAX + 1);
  					loneLowSurrogates.push(LOW_SURROGATE_MIN, end + 1);
  				}

  				// The range starts before the high surrogate range and ends after the
  				// low surrogate range. E.g. (0, 0x10FFFF).
  				if (end > LOW_SURROGATE_MAX) {
  					bmp.push(start, HIGH_SURROGATE_MIN);
  					loneHighSurrogates.push(HIGH_SURROGATE_MIN, HIGH_SURROGATE_MAX + 1);
  					loneLowSurrogates.push(LOW_SURROGATE_MIN, LOW_SURROGATE_MAX + 1);
  					if (end <= 0xFFFF) {
  						bmp.push(LOW_SURROGATE_MAX + 1, end + 1);
  					} else {
  						bmp.push(LOW_SURROGATE_MAX + 1, 0xFFFF + 1);
  						astral.push(0xFFFF + 1, end + 1);
  					}
  				}

  			} else if (start >= HIGH_SURROGATE_MIN && start <= HIGH_SURROGATE_MAX) {

  				// The range starts and ends in the high surrogate range.
  				// E.g. (0xD855, 0xD866).
  				if (end >= HIGH_SURROGATE_MIN && end <= HIGH_SURROGATE_MAX) {
  					loneHighSurrogates.push(start, end + 1);
  				}

  				// The range starts in the high surrogate range and ends in the low
  				// surrogate range. E.g. (0xD855, 0xDCFF).
  				if (end >= LOW_SURROGATE_MIN && end <= LOW_SURROGATE_MAX) {
  					loneHighSurrogates.push(start, HIGH_SURROGATE_MAX + 1);
  					loneLowSurrogates.push(LOW_SURROGATE_MIN, end + 1);
  				}

  				// The range starts in the high surrogate range and ends after the low
  				// surrogate range. E.g. (0xD855, 0x10FFFF).
  				if (end > LOW_SURROGATE_MAX) {
  					loneHighSurrogates.push(start, HIGH_SURROGATE_MAX + 1);
  					loneLowSurrogates.push(LOW_SURROGATE_MIN, LOW_SURROGATE_MAX + 1);
  					if (end <= 0xFFFF) {
  						bmp.push(LOW_SURROGATE_MAX + 1, end + 1);
  					} else {
  						bmp.push(LOW_SURROGATE_MAX + 1, 0xFFFF + 1);
  						astral.push(0xFFFF + 1, end + 1);
  					}
  				}

  			} else if (start >= LOW_SURROGATE_MIN && start <= LOW_SURROGATE_MAX) {

  				// The range starts and ends in the low surrogate range.
  				// E.g. (0xDCFF, 0xDDFF).
  				if (end >= LOW_SURROGATE_MIN && end <= LOW_SURROGATE_MAX) {
  					loneLowSurrogates.push(start, end + 1);
  				}

  				// The range starts in the low surrogate range and ends after the low
  				// surrogate range. E.g. (0xDCFF, 0x10FFFF).
  				if (end > LOW_SURROGATE_MAX) {
  					loneLowSurrogates.push(start, LOW_SURROGATE_MAX + 1);
  					if (end <= 0xFFFF) {
  						bmp.push(LOW_SURROGATE_MAX + 1, end + 1);
  					} else {
  						bmp.push(LOW_SURROGATE_MAX + 1, 0xFFFF + 1);
  						astral.push(0xFFFF + 1, end + 1);
  					}
  				}

  			} else if (start > LOW_SURROGATE_MAX && start <= 0xFFFF) {

  				// The range starts and ends after the low surrogate range.
  				// E.g. (0xFFAA, 0x10FFFF).
  				if (end <= 0xFFFF) {
  					bmp.push(start, end + 1);
  				} else {
  					bmp.push(start, 0xFFFF + 1);
  					astral.push(0xFFFF + 1, end + 1);
  				}

  			} else {

  				// The range starts and ends in the astral range.
  				astral.push(start, end + 1);

  			}

  			index += 2;
  		}
  		return {
  			'loneHighSurrogates': loneHighSurrogates,
  			'loneLowSurrogates': loneLowSurrogates,
  			'bmp': bmp,
  			'astral': astral
  		};
  	};

  	var optimizeSurrogateMappings = function(surrogateMappings) {
  		var result = [];
  		var tmpLow = [];
  		var addLow = false;
  		var mapping;
  		var nextMapping;
  		var highSurrogates;
  		var lowSurrogates;
  		var nextHighSurrogates;
  		var nextLowSurrogates;
  		var index = -1;
  		var length = surrogateMappings.length;
  		while (++index < length) {
  			mapping = surrogateMappings[index];
  			nextMapping = surrogateMappings[index + 1];
  			if (!nextMapping) {
  				result.push(mapping);
  				continue;
  			}
  			highSurrogates = mapping[0];
  			lowSurrogates = mapping[1];
  			nextHighSurrogates = nextMapping[0];
  			nextLowSurrogates = nextMapping[1];

  			// Check for identical high surrogate ranges.
  			tmpLow = lowSurrogates;
  			while (
  				nextHighSurrogates &&
  				highSurrogates[0] == nextHighSurrogates[0] &&
  				highSurrogates[1] == nextHighSurrogates[1]
  			) {
  				// Merge with the next item.
  				if (dataIsSingleton(nextLowSurrogates)) {
  					tmpLow = dataAdd(tmpLow, nextLowSurrogates[0]);
  				} else {
  					tmpLow = dataAddRange(
  						tmpLow,
  						nextLowSurrogates[0],
  						nextLowSurrogates[1] - 1
  					);
  				}
  				++index;
  				mapping = surrogateMappings[index];
  				highSurrogates = mapping[0];
  				lowSurrogates = mapping[1];
  				nextMapping = surrogateMappings[index + 1];
  				nextHighSurrogates = nextMapping && nextMapping[0];
  				nextLowSurrogates = nextMapping && nextMapping[1];
  				addLow = true;
  			}
  			result.push([
  				highSurrogates,
  				addLow ? tmpLow : lowSurrogates
  			]);
  			addLow = false;
  		}
  		return optimizeByLowSurrogates(result);
  	};

  	var optimizeByLowSurrogates = function(surrogateMappings) {
  		if (surrogateMappings.length == 1) {
  			return surrogateMappings;
  		}
  		var index = -1;
  		var innerIndex = -1;
  		while (++index < surrogateMappings.length) {
  			var mapping = surrogateMappings[index];
  			var lowSurrogates = mapping[1];
  			var lowSurrogateStart = lowSurrogates[0];
  			var lowSurrogateEnd = lowSurrogates[1];
  			innerIndex = index; // Note: the loop starts at the next index.
  			while (++innerIndex < surrogateMappings.length) {
  				var otherMapping = surrogateMappings[innerIndex];
  				var otherLowSurrogates = otherMapping[1];
  				var otherLowSurrogateStart = otherLowSurrogates[0];
  				var otherLowSurrogateEnd = otherLowSurrogates[1];
  				if (
  					lowSurrogateStart == otherLowSurrogateStart &&
  					lowSurrogateEnd == otherLowSurrogateEnd
  				) {
  					// Add the code points in the other item to this one.
  					if (dataIsSingleton(otherMapping[0])) {
  						mapping[0] = dataAdd(mapping[0], otherMapping[0][0]);
  					} else {
  						mapping[0] = dataAddRange(
  							mapping[0],
  							otherMapping[0][0],
  							otherMapping[0][1] - 1
  						);
  					}
  					// Remove the other, now redundant, item.
  					surrogateMappings.splice(innerIndex, 1);
  					--innerIndex;
  				}
  			}
  		}
  		return surrogateMappings;
  	};

  	var surrogateSet = function(data) {
  		// Exit early if `data` is an empty set.
  		if (!data.length) {
  			return [];
  		}

  		// Iterate over the data per `(start, end)` pair.
  		var index = 0;
  		var start;
  		var end;
  		var startHigh;
  		var startLow;
  		var endHigh;
  		var endLow;
  		var surrogateMappings = [];
  		var length = data.length;
  		while (index < length) {
  			start = data[index];
  			end = data[index + 1] - 1;

  			startHigh = highSurrogate(start);
  			startLow = lowSurrogate(start);
  			endHigh = highSurrogate(end);
  			endLow = lowSurrogate(end);

  			var startsWithLowestLowSurrogate = startLow == LOW_SURROGATE_MIN;
  			var endsWithHighestLowSurrogate = endLow == LOW_SURROGATE_MAX;
  			var complete = false;

  			// Append the previous high-surrogate-to-low-surrogate mappings.
  			// Step 1: `(startHigh, startLow)` to `(startHigh, LOW_SURROGATE_MAX)`.
  			if (
  				startHigh == endHigh ||
  				startsWithLowestLowSurrogate && endsWithHighestLowSurrogate
  			) {
  				surrogateMappings.push([
  					[startHigh, endHigh + 1],
  					[startLow, endLow + 1]
  				]);
  				complete = true;
  			} else {
  				surrogateMappings.push([
  					[startHigh, startHigh + 1],
  					[startLow, LOW_SURROGATE_MAX + 1]
  				]);
  			}

  			// Step 2: `(startHigh + 1, LOW_SURROGATE_MIN)` to
  			// `(endHigh - 1, LOW_SURROGATE_MAX)`.
  			if (!complete && startHigh + 1 < endHigh) {
  				if (endsWithHighestLowSurrogate) {
  					// Combine step 2 and step 3.
  					surrogateMappings.push([
  						[startHigh + 1, endHigh + 1],
  						[LOW_SURROGATE_MIN, endLow + 1]
  					]);
  					complete = true;
  				} else {
  					surrogateMappings.push([
  						[startHigh + 1, endHigh],
  						[LOW_SURROGATE_MIN, LOW_SURROGATE_MAX + 1]
  					]);
  				}
  			}

  			// Step 3. `(endHigh, LOW_SURROGATE_MIN)` to `(endHigh, endLow)`.
  			if (!complete) {
  				surrogateMappings.push([
  					[endHigh, endHigh + 1],
  					[LOW_SURROGATE_MIN, endLow + 1]
  				]);
  			}

  			index += 2;
  		}

  		// The format of `surrogateMappings` is as follows:
  		//
  		//     [ surrogateMapping1, surrogateMapping2 ]
  		//
  		// i.e.:
  		//
  		//     [
  		//       [ highSurrogates1, lowSurrogates1 ],
  		//       [ highSurrogates2, lowSurrogates2 ]
  		//     ]
  		return optimizeSurrogateMappings(surrogateMappings);
  	};

  	var createSurrogateCharacterClasses = function(surrogateMappings) {
  		var result = [];
  		forEach(surrogateMappings, function(surrogateMapping) {
  			var highSurrogates = surrogateMapping[0];
  			var lowSurrogates = surrogateMapping[1];
  			result.push(
  				createBMPCharacterClasses(highSurrogates) +
  				createBMPCharacterClasses(lowSurrogates)
  			);
  		});
  		return result.join('|');
  	};

  	var createCharacterClassesFromData = function(data, bmpOnly, hasUnicodeFlag) {
  		if (hasUnicodeFlag) {
  			return createUnicodeCharacterClasses(data);
  		}
  		var result = [];

  		var parts = splitAtBMP(data);
  		var loneHighSurrogates = parts.loneHighSurrogates;
  		var loneLowSurrogates = parts.loneLowSurrogates;
  		var bmp = parts.bmp;
  		var astral = parts.astral;
  		var hasLoneHighSurrogates = !dataIsEmpty(loneHighSurrogates);
  		var hasLoneLowSurrogates = !dataIsEmpty(loneLowSurrogates);

  		var surrogateMappings = surrogateSet(astral);

  		if (bmpOnly) {
  			bmp = dataAddData(bmp, loneHighSurrogates);
  			hasLoneHighSurrogates = false;
  			bmp = dataAddData(bmp, loneLowSurrogates);
  			hasLoneLowSurrogates = false;
  		}

  		if (!dataIsEmpty(bmp)) {
  			// The data set contains BMP code points that are not high surrogates
  			// needed for astral code points in the set.
  			result.push(createBMPCharacterClasses(bmp));
  		}
  		if (surrogateMappings.length) {
  			// The data set contains astral code points; append character classes
  			// based on their surrogate pairs.
  			result.push(createSurrogateCharacterClasses(surrogateMappings));
  		}
  		// https://gist.github.com/mathiasbynens/bbe7f870208abcfec860
  		if (hasLoneHighSurrogates) {
  			result.push(
  				createBMPCharacterClasses(loneHighSurrogates) +
  				// Make sure the high surrogates aren’t part of a surrogate pair.
  				'(?![\\uDC00-\\uDFFF])'
  			);
  		}
  		if (hasLoneLowSurrogates) {
  			result.push(
  				// It is not possible to accurately assert the low surrogates aren’t
  				// part of a surrogate pair, since JavaScript regular expressions do
  				// not support lookbehind.
  				'(?:[^\\uD800-\\uDBFF]|^)' +
  				createBMPCharacterClasses(loneLowSurrogates)
  			);
  		}
  		return result.join('|');
  	};

  	/*--------------------------------------------------------------------------*/

  	// `regenerate` can be used as a constructor (and new methods can be added to
  	// its prototype) but also as a regular function, the latter of which is the
  	// documented and most common usage. For that reason, it’s not capitalized.
  	var regenerate = function(value) {
  		if (arguments.length > 1) {
  			value = slice.call(arguments);
  		}
  		if (this instanceof regenerate) {
  			this.data = [];
  			return value ? this.add(value) : this;
  		}
  		return (new regenerate).add(value);
  	};

  	regenerate.version = '1.3.3';

  	var proto = regenerate.prototype;
  	extend(proto, {
  		'add': function(value) {
  			var $this = this;
  			if (value == null) {
  				return $this;
  			}
  			if (value instanceof regenerate) {
  				// Allow passing other Regenerate instances.
  				$this.data = dataAddData($this.data, value.data);
  				return $this;
  			}
  			if (arguments.length > 1) {
  				value = slice.call(arguments);
  			}
  			if (isArray(value)) {
  				forEach(value, function(item) {
  					$this.add(item);
  				});
  				return $this;
  			}
  			$this.data = dataAdd(
  				$this.data,
  				isNumber(value) ? value : symbolToCodePoint(value)
  			);
  			return $this;
  		},
  		'remove': function(value) {
  			var $this = this;
  			if (value == null) {
  				return $this;
  			}
  			if (value instanceof regenerate) {
  				// Allow passing other Regenerate instances.
  				$this.data = dataRemoveData($this.data, value.data);
  				return $this;
  			}
  			if (arguments.length > 1) {
  				value = slice.call(arguments);
  			}
  			if (isArray(value)) {
  				forEach(value, function(item) {
  					$this.remove(item);
  				});
  				return $this;
  			}
  			$this.data = dataRemove(
  				$this.data,
  				isNumber(value) ? value : symbolToCodePoint(value)
  			);
  			return $this;
  		},
  		'addRange': function(start, end) {
  			var $this = this;
  			$this.data = dataAddRange($this.data,
  				isNumber(start) ? start : symbolToCodePoint(start),
  				isNumber(end) ? end : symbolToCodePoint(end)
  			);
  			return $this;
  		},
  		'removeRange': function(start, end) {
  			var $this = this;
  			var startCodePoint = isNumber(start) ? start : symbolToCodePoint(start);
  			var endCodePoint = isNumber(end) ? end : symbolToCodePoint(end);
  			$this.data = dataRemoveRange(
  				$this.data,
  				startCodePoint,
  				endCodePoint
  			);
  			return $this;
  		},
  		'intersection': function(argument) {
  			var $this = this;
  			// Allow passing other Regenerate instances.
  			// TODO: Optimize this by writing and using `dataIntersectionData()`.
  			var array = argument instanceof regenerate ?
  				dataToArray(argument.data) :
  				argument;
  			$this.data = dataIntersection($this.data, array);
  			return $this;
  		},
  		'contains': function(codePoint) {
  			return dataContains(
  				this.data,
  				isNumber(codePoint) ? codePoint : symbolToCodePoint(codePoint)
  			);
  		},
  		'clone': function() {
  			var set = new regenerate;
  			set.data = this.data.slice(0);
  			return set;
  		},
  		'toString': function(options) {
  			var result = createCharacterClassesFromData(
  				this.data,
  				options ? options.bmpOnly : false,
  				options ? options.hasUnicodeFlag : false
  			);
  			if (!result) {
  				// For an empty set, return something that can be inserted `/here/` to
  				// form a valid regular expression. Avoid `(?:)` since that matches the
  				// empty string.
  				return '[]';
  			}
  			// Use `\0` instead of `\x00` where possible.
  			return result.replace(regexNull, '\\0$1');
  		},
  		'toRegExp': function(flags) {
  			var pattern = this.toString(
  				flags && flags.indexOf('u') != -1 ?
  					{ 'hasUnicodeFlag': true } :
  					null
  			);
  			return RegExp(pattern, flags || '');
  		},
  		'valueOf': function() { // Note: `valueOf` is aliased as `toArray`.
  			return dataToArray(this.data);
  		}
  	});

  	proto.toArray = proto.valueOf;

  	// Some AMD build optimizers, like r.js, check for specific condition patterns
  	// like the following:
  	if (freeExports && !freeExports.nodeType) {
  		if (freeModule) { // in Node.js, io.js, or RingoJS v0.8.0+
  			freeModule.exports = regenerate;
  		} else { // in Narwhal or RingoJS v0.7.0-
  			freeExports.regenerate = regenerate;
  		}
  	} else { // in Rhino or a web browser
  		root.regenerate = regenerate;
  	}

  }(commonjsGlobal));
  });

  var unicodeCanonicalPropertyNamesEcmascript = new Set([
  	// Non-binary properties:
  	'General_Category',
  	'Script',
  	'Script_Extensions',
  	// Binary properties:
  	'Alphabetic',
  	'Any',
  	'ASCII',
  	'ASCII_Hex_Digit',
  	'Assigned',
  	'Bidi_Control',
  	'Bidi_Mirrored',
  	'Case_Ignorable',
  	'Cased',
  	'Changes_When_Casefolded',
  	'Changes_When_Casemapped',
  	'Changes_When_Lowercased',
  	'Changes_When_NFKC_Casefolded',
  	'Changes_When_Titlecased',
  	'Changes_When_Uppercased',
  	'Dash',
  	'Default_Ignorable_Code_Point',
  	'Deprecated',
  	'Diacritic',
  	'Emoji',
  	'Emoji_Component',
  	'Emoji_Modifier',
  	'Emoji_Modifier_Base',
  	'Emoji_Presentation',
  	'Extended_Pictographic',
  	'Extender',
  	'Grapheme_Base',
  	'Grapheme_Extend',
  	'Hex_Digit',
  	'ID_Continue',
  	'ID_Start',
  	'Ideographic',
  	'IDS_Binary_Operator',
  	'IDS_Trinary_Operator',
  	'Join_Control',
  	'Logical_Order_Exception',
  	'Lowercase',
  	'Math',
  	'Noncharacter_Code_Point',
  	'Pattern_Syntax',
  	'Pattern_White_Space',
  	'Quotation_Mark',
  	'Radical',
  	'Regional_Indicator',
  	'Sentence_Terminal',
  	'Soft_Dotted',
  	'Terminal_Punctuation',
  	'Unified_Ideograph',
  	'Uppercase',
  	'Variation_Selector',
  	'White_Space',
  	'XID_Continue',
  	'XID_Start'
  ]);

  // Generated using `npm run build`. Do not edit!
  var unicodePropertyAliasesEcmascript = new Map([
  	['scx', 'Script_Extensions'],
  	['sc', 'Script'],
  	['gc', 'General_Category'],
  	['AHex', 'ASCII_Hex_Digit'],
  	['Alpha', 'Alphabetic'],
  	['Bidi_C', 'Bidi_Control'],
  	['Bidi_M', 'Bidi_Mirrored'],
  	['Cased', 'Cased'],
  	['CI', 'Case_Ignorable'],
  	['CWCF', 'Changes_When_Casefolded'],
  	['CWCM', 'Changes_When_Casemapped'],
  	['CWKCF', 'Changes_When_NFKC_Casefolded'],
  	['CWL', 'Changes_When_Lowercased'],
  	['CWT', 'Changes_When_Titlecased'],
  	['CWU', 'Changes_When_Uppercased'],
  	['Dash', 'Dash'],
  	['Dep', 'Deprecated'],
  	['DI', 'Default_Ignorable_Code_Point'],
  	['Dia', 'Diacritic'],
  	['Ext', 'Extender'],
  	['Gr_Base', 'Grapheme_Base'],
  	['Gr_Ext', 'Grapheme_Extend'],
  	['Hex', 'Hex_Digit'],
  	['IDC', 'ID_Continue'],
  	['Ideo', 'Ideographic'],
  	['IDS', 'ID_Start'],
  	['IDSB', 'IDS_Binary_Operator'],
  	['IDST', 'IDS_Trinary_Operator'],
  	['Join_C', 'Join_Control'],
  	['LOE', 'Logical_Order_Exception'],
  	['Lower', 'Lowercase'],
  	['Math', 'Math'],
  	['NChar', 'Noncharacter_Code_Point'],
  	['Pat_Syn', 'Pattern_Syntax'],
  	['Pat_WS', 'Pattern_White_Space'],
  	['QMark', 'Quotation_Mark'],
  	['Radical', 'Radical'],
  	['RI', 'Regional_Indicator'],
  	['SD', 'Soft_Dotted'],
  	['STerm', 'Sentence_Terminal'],
  	['Term', 'Terminal_Punctuation'],
  	['UIdeo', 'Unified_Ideograph'],
  	['Upper', 'Uppercase'],
  	['VS', 'Variation_Selector'],
  	['WSpace', 'White_Space'],
  	['space', 'White_Space'],
  	['XIDC', 'XID_Continue'],
  	['XIDS', 'XID_Start']
  ]);

  var matchProperty = function(property) {
  	if (unicodeCanonicalPropertyNamesEcmascript.has(property)) {
  		return property;
  	}
  	if (unicodePropertyAliasesEcmascript.has(property)) {
  		return unicodePropertyAliasesEcmascript.get(property);
  	}
  	throw new Error(("Unknown property: " + property));
  };

  var unicodeMatchPropertyEcmascript = matchProperty;

  var mappings = new Map([
  	['General_Category', new Map([
  		['C', 'Other'],
  		['Cc', 'Control'],
  		['cntrl', 'Control'],
  		['Cf', 'Format'],
  		['Cn', 'Unassigned'],
  		['Co', 'Private_Use'],
  		['Cs', 'Surrogate'],
  		['L', 'Letter'],
  		['LC', 'Cased_Letter'],
  		['Ll', 'Lowercase_Letter'],
  		['Lm', 'Modifier_Letter'],
  		['Lo', 'Other_Letter'],
  		['Lt', 'Titlecase_Letter'],
  		['Lu', 'Uppercase_Letter'],
  		['M', 'Mark'],
  		['Combining_Mark', 'Mark'],
  		['Mc', 'Spacing_Mark'],
  		['Me', 'Enclosing_Mark'],
  		['Mn', 'Nonspacing_Mark'],
  		['N', 'Number'],
  		['Nd', 'Decimal_Number'],
  		['digit', 'Decimal_Number'],
  		['Nl', 'Letter_Number'],
  		['No', 'Other_Number'],
  		['P', 'Punctuation'],
  		['punct', 'Punctuation'],
  		['Pc', 'Connector_Punctuation'],
  		['Pd', 'Dash_Punctuation'],
  		['Pe', 'Close_Punctuation'],
  		['Pf', 'Final_Punctuation'],
  		['Pi', 'Initial_Punctuation'],
  		['Po', 'Other_Punctuation'],
  		['Ps', 'Open_Punctuation'],
  		['S', 'Symbol'],
  		['Sc', 'Currency_Symbol'],
  		['Sk', 'Modifier_Symbol'],
  		['Sm', 'Math_Symbol'],
  		['So', 'Other_Symbol'],
  		['Z', 'Separator'],
  		['Zl', 'Line_Separator'],
  		['Zp', 'Paragraph_Separator'],
  		['Zs', 'Space_Separator'],
  		['Other', 'Other'],
  		['Control', 'Control'],
  		['Format', 'Format'],
  		['Unassigned', 'Unassigned'],
  		['Private_Use', 'Private_Use'],
  		['Surrogate', 'Surrogate'],
  		['Letter', 'Letter'],
  		['Cased_Letter', 'Cased_Letter'],
  		['Lowercase_Letter', 'Lowercase_Letter'],
  		['Modifier_Letter', 'Modifier_Letter'],
  		['Other_Letter', 'Other_Letter'],
  		['Titlecase_Letter', 'Titlecase_Letter'],
  		['Uppercase_Letter', 'Uppercase_Letter'],
  		['Mark', 'Mark'],
  		['Spacing_Mark', 'Spacing_Mark'],
  		['Enclosing_Mark', 'Enclosing_Mark'],
  		['Nonspacing_Mark', 'Nonspacing_Mark'],
  		['Number', 'Number'],
  		['Decimal_Number', 'Decimal_Number'],
  		['Letter_Number', 'Letter_Number'],
  		['Other_Number', 'Other_Number'],
  		['Punctuation', 'Punctuation'],
  		['Connector_Punctuation', 'Connector_Punctuation'],
  		['Dash_Punctuation', 'Dash_Punctuation'],
  		['Close_Punctuation', 'Close_Punctuation'],
  		['Final_Punctuation', 'Final_Punctuation'],
  		['Initial_Punctuation', 'Initial_Punctuation'],
  		['Other_Punctuation', 'Other_Punctuation'],
  		['Open_Punctuation', 'Open_Punctuation'],
  		['Symbol', 'Symbol'],
  		['Currency_Symbol', 'Currency_Symbol'],
  		['Modifier_Symbol', 'Modifier_Symbol'],
  		['Math_Symbol', 'Math_Symbol'],
  		['Other_Symbol', 'Other_Symbol'],
  		['Separator', 'Separator'],
  		['Line_Separator', 'Line_Separator'],
  		['Paragraph_Separator', 'Paragraph_Separator'],
  		['Space_Separator', 'Space_Separator']
  	])],
  	['Script', new Map([
  		['Adlm', 'Adlam'],
  		['Aghb', 'Caucasian_Albanian'],
  		['Ahom', 'Ahom'],
  		['Arab', 'Arabic'],
  		['Armi', 'Imperial_Aramaic'],
  		['Armn', 'Armenian'],
  		['Avst', 'Avestan'],
  		['Bali', 'Balinese'],
  		['Bamu', 'Bamum'],
  		['Bass', 'Bassa_Vah'],
  		['Batk', 'Batak'],
  		['Beng', 'Bengali'],
  		['Bhks', 'Bhaiksuki'],
  		['Bopo', 'Bopomofo'],
  		['Brah', 'Brahmi'],
  		['Brai', 'Braille'],
  		['Bugi', 'Buginese'],
  		['Buhd', 'Buhid'],
  		['Cakm', 'Chakma'],
  		['Cans', 'Canadian_Aboriginal'],
  		['Cari', 'Carian'],
  		['Cham', 'Cham'],
  		['Cher', 'Cherokee'],
  		['Copt', 'Coptic'],
  		['Qaac', 'Coptic'],
  		['Cprt', 'Cypriot'],
  		['Cyrl', 'Cyrillic'],
  		['Deva', 'Devanagari'],
  		['Dogr', 'Dogra'],
  		['Dsrt', 'Deseret'],
  		['Dupl', 'Duployan'],
  		['Egyp', 'Egyptian_Hieroglyphs'],
  		['Elba', 'Elbasan'],
  		['Elym', 'Elymaic'],
  		['Ethi', 'Ethiopic'],
  		['Geor', 'Georgian'],
  		['Glag', 'Glagolitic'],
  		['Gong', 'Gunjala_Gondi'],
  		['Gonm', 'Masaram_Gondi'],
  		['Goth', 'Gothic'],
  		['Gran', 'Grantha'],
  		['Grek', 'Greek'],
  		['Gujr', 'Gujarati'],
  		['Guru', 'Gurmukhi'],
  		['Hang', 'Hangul'],
  		['Hani', 'Han'],
  		['Hano', 'Hanunoo'],
  		['Hatr', 'Hatran'],
  		['Hebr', 'Hebrew'],
  		['Hira', 'Hiragana'],
  		['Hluw', 'Anatolian_Hieroglyphs'],
  		['Hmng', 'Pahawh_Hmong'],
  		['Hmnp', 'Nyiakeng_Puachue_Hmong'],
  		['Hrkt', 'Katakana_Or_Hiragana'],
  		['Hung', 'Old_Hungarian'],
  		['Ital', 'Old_Italic'],
  		['Java', 'Javanese'],
  		['Kali', 'Kayah_Li'],
  		['Kana', 'Katakana'],
  		['Khar', 'Kharoshthi'],
  		['Khmr', 'Khmer'],
  		['Khoj', 'Khojki'],
  		['Knda', 'Kannada'],
  		['Kthi', 'Kaithi'],
  		['Lana', 'Tai_Tham'],
  		['Laoo', 'Lao'],
  		['Latn', 'Latin'],
  		['Lepc', 'Lepcha'],
  		['Limb', 'Limbu'],
  		['Lina', 'Linear_A'],
  		['Linb', 'Linear_B'],
  		['Lisu', 'Lisu'],
  		['Lyci', 'Lycian'],
  		['Lydi', 'Lydian'],
  		['Mahj', 'Mahajani'],
  		['Maka', 'Makasar'],
  		['Mand', 'Mandaic'],
  		['Mani', 'Manichaean'],
  		['Marc', 'Marchen'],
  		['Medf', 'Medefaidrin'],
  		['Mend', 'Mende_Kikakui'],
  		['Merc', 'Meroitic_Cursive'],
  		['Mero', 'Meroitic_Hieroglyphs'],
  		['Mlym', 'Malayalam'],
  		['Modi', 'Modi'],
  		['Mong', 'Mongolian'],
  		['Mroo', 'Mro'],
  		['Mtei', 'Meetei_Mayek'],
  		['Mult', 'Multani'],
  		['Mymr', 'Myanmar'],
  		['Nand', 'Nandinagari'],
  		['Narb', 'Old_North_Arabian'],
  		['Nbat', 'Nabataean'],
  		['Newa', 'Newa'],
  		['Nkoo', 'Nko'],
  		['Nshu', 'Nushu'],
  		['Ogam', 'Ogham'],
  		['Olck', 'Ol_Chiki'],
  		['Orkh', 'Old_Turkic'],
  		['Orya', 'Oriya'],
  		['Osge', 'Osage'],
  		['Osma', 'Osmanya'],
  		['Palm', 'Palmyrene'],
  		['Pauc', 'Pau_Cin_Hau'],
  		['Perm', 'Old_Permic'],
  		['Phag', 'Phags_Pa'],
  		['Phli', 'Inscriptional_Pahlavi'],
  		['Phlp', 'Psalter_Pahlavi'],
  		['Phnx', 'Phoenician'],
  		['Plrd', 'Miao'],
  		['Prti', 'Inscriptional_Parthian'],
  		['Rjng', 'Rejang'],
  		['Rohg', 'Hanifi_Rohingya'],
  		['Runr', 'Runic'],
  		['Samr', 'Samaritan'],
  		['Sarb', 'Old_South_Arabian'],
  		['Saur', 'Saurashtra'],
  		['Sgnw', 'SignWriting'],
  		['Shaw', 'Shavian'],
  		['Shrd', 'Sharada'],
  		['Sidd', 'Siddham'],
  		['Sind', 'Khudawadi'],
  		['Sinh', 'Sinhala'],
  		['Sogd', 'Sogdian'],
  		['Sogo', 'Old_Sogdian'],
  		['Sora', 'Sora_Sompeng'],
  		['Soyo', 'Soyombo'],
  		['Sund', 'Sundanese'],
  		['Sylo', 'Syloti_Nagri'],
  		['Syrc', 'Syriac'],
  		['Tagb', 'Tagbanwa'],
  		['Takr', 'Takri'],
  		['Tale', 'Tai_Le'],
  		['Talu', 'New_Tai_Lue'],
  		['Taml', 'Tamil'],
  		['Tang', 'Tangut'],
  		['Tavt', 'Tai_Viet'],
  		['Telu', 'Telugu'],
  		['Tfng', 'Tifinagh'],
  		['Tglg', 'Tagalog'],
  		['Thaa', 'Thaana'],
  		['Thai', 'Thai'],
  		['Tibt', 'Tibetan'],
  		['Tirh', 'Tirhuta'],
  		['Ugar', 'Ugaritic'],
  		['Vaii', 'Vai'],
  		['Wara', 'Warang_Citi'],
  		['Wcho', 'Wancho'],
  		['Xpeo', 'Old_Persian'],
  		['Xsux', 'Cuneiform'],
  		['Yiii', 'Yi'],
  		['Zanb', 'Zanabazar_Square'],
  		['Zinh', 'Inherited'],
  		['Qaai', 'Inherited'],
  		['Zyyy', 'Common'],
  		['Zzzz', 'Unknown'],
  		['Adlam', 'Adlam'],
  		['Caucasian_Albanian', 'Caucasian_Albanian'],
  		['Arabic', 'Arabic'],
  		['Imperial_Aramaic', 'Imperial_Aramaic'],
  		['Armenian', 'Armenian'],
  		['Avestan', 'Avestan'],
  		['Balinese', 'Balinese'],
  		['Bamum', 'Bamum'],
  		['Bassa_Vah', 'Bassa_Vah'],
  		['Batak', 'Batak'],
  		['Bengali', 'Bengali'],
  		['Bhaiksuki', 'Bhaiksuki'],
  		['Bopomofo', 'Bopomofo'],
  		['Brahmi', 'Brahmi'],
  		['Braille', 'Braille'],
  		['Buginese', 'Buginese'],
  		['Buhid', 'Buhid'],
  		['Chakma', 'Chakma'],
  		['Canadian_Aboriginal', 'Canadian_Aboriginal'],
  		['Carian', 'Carian'],
  		['Cherokee', 'Cherokee'],
  		['Coptic', 'Coptic'],
  		['Cypriot', 'Cypriot'],
  		['Cyrillic', 'Cyrillic'],
  		['Devanagari', 'Devanagari'],
  		['Dogra', 'Dogra'],
  		['Deseret', 'Deseret'],
  		['Duployan', 'Duployan'],
  		['Egyptian_Hieroglyphs', 'Egyptian_Hieroglyphs'],
  		['Elbasan', 'Elbasan'],
  		['Elymaic', 'Elymaic'],
  		['Ethiopic', 'Ethiopic'],
  		['Georgian', 'Georgian'],
  		['Glagolitic', 'Glagolitic'],
  		['Gunjala_Gondi', 'Gunjala_Gondi'],
  		['Masaram_Gondi', 'Masaram_Gondi'],
  		['Gothic', 'Gothic'],
  		['Grantha', 'Grantha'],
  		['Greek', 'Greek'],
  		['Gujarati', 'Gujarati'],
  		['Gurmukhi', 'Gurmukhi'],
  		['Hangul', 'Hangul'],
  		['Han', 'Han'],
  		['Hanunoo', 'Hanunoo'],
  		['Hatran', 'Hatran'],
  		['Hebrew', 'Hebrew'],
  		['Hiragana', 'Hiragana'],
  		['Anatolian_Hieroglyphs', 'Anatolian_Hieroglyphs'],
  		['Pahawh_Hmong', 'Pahawh_Hmong'],
  		['Nyiakeng_Puachue_Hmong', 'Nyiakeng_Puachue_Hmong'],
  		['Katakana_Or_Hiragana', 'Katakana_Or_Hiragana'],
  		['Old_Hungarian', 'Old_Hungarian'],
  		['Old_Italic', 'Old_Italic'],
  		['Javanese', 'Javanese'],
  		['Kayah_Li', 'Kayah_Li'],
  		['Katakana', 'Katakana'],
  		['Kharoshthi', 'Kharoshthi'],
  		['Khmer', 'Khmer'],
  		['Khojki', 'Khojki'],
  		['Kannada', 'Kannada'],
  		['Kaithi', 'Kaithi'],
  		['Tai_Tham', 'Tai_Tham'],
  		['Lao', 'Lao'],
  		['Latin', 'Latin'],
  		['Lepcha', 'Lepcha'],
  		['Limbu', 'Limbu'],
  		['Linear_A', 'Linear_A'],
  		['Linear_B', 'Linear_B'],
  		['Lycian', 'Lycian'],
  		['Lydian', 'Lydian'],
  		['Mahajani', 'Mahajani'],
  		['Makasar', 'Makasar'],
  		['Mandaic', 'Mandaic'],
  		['Manichaean', 'Manichaean'],
  		['Marchen', 'Marchen'],
  		['Medefaidrin', 'Medefaidrin'],
  		['Mende_Kikakui', 'Mende_Kikakui'],
  		['Meroitic_Cursive', 'Meroitic_Cursive'],
  		['Meroitic_Hieroglyphs', 'Meroitic_Hieroglyphs'],
  		['Malayalam', 'Malayalam'],
  		['Mongolian', 'Mongolian'],
  		['Mro', 'Mro'],
  		['Meetei_Mayek', 'Meetei_Mayek'],
  		['Multani', 'Multani'],
  		['Myanmar', 'Myanmar'],
  		['Nandinagari', 'Nandinagari'],
  		['Old_North_Arabian', 'Old_North_Arabian'],
  		['Nabataean', 'Nabataean'],
  		['Nko', 'Nko'],
  		['Nushu', 'Nushu'],
  		['Ogham', 'Ogham'],
  		['Ol_Chiki', 'Ol_Chiki'],
  		['Old_Turkic', 'Old_Turkic'],
  		['Oriya', 'Oriya'],
  		['Osage', 'Osage'],
  		['Osmanya', 'Osmanya'],
  		['Palmyrene', 'Palmyrene'],
  		['Pau_Cin_Hau', 'Pau_Cin_Hau'],
  		['Old_Permic', 'Old_Permic'],
  		['Phags_Pa', 'Phags_Pa'],
  		['Inscriptional_Pahlavi', 'Inscriptional_Pahlavi'],
  		['Psalter_Pahlavi', 'Psalter_Pahlavi'],
  		['Phoenician', 'Phoenician'],
  		['Miao', 'Miao'],
  		['Inscriptional_Parthian', 'Inscriptional_Parthian'],
  		['Rejang', 'Rejang'],
  		['Hanifi_Rohingya', 'Hanifi_Rohingya'],
  		['Runic', 'Runic'],
  		['Samaritan', 'Samaritan'],
  		['Old_South_Arabian', 'Old_South_Arabian'],
  		['Saurashtra', 'Saurashtra'],
  		['SignWriting', 'SignWriting'],
  		['Shavian', 'Shavian'],
  		['Sharada', 'Sharada'],
  		['Siddham', 'Siddham'],
  		['Khudawadi', 'Khudawadi'],
  		['Sinhala', 'Sinhala'],
  		['Sogdian', 'Sogdian'],
  		['Old_Sogdian', 'Old_Sogdian'],
  		['Sora_Sompeng', 'Sora_Sompeng'],
  		['Soyombo', 'Soyombo'],
  		['Sundanese', 'Sundanese'],
  		['Syloti_Nagri', 'Syloti_Nagri'],
  		['Syriac', 'Syriac'],
  		['Tagbanwa', 'Tagbanwa'],
  		['Takri', 'Takri'],
  		['Tai_Le', 'Tai_Le'],
  		['New_Tai_Lue', 'New_Tai_Lue'],
  		['Tamil', 'Tamil'],
  		['Tangut', 'Tangut'],
  		['Tai_Viet', 'Tai_Viet'],
  		['Telugu', 'Telugu'],
  		['Tifinagh', 'Tifinagh'],
  		['Tagalog', 'Tagalog'],
  		['Thaana', 'Thaana'],
  		['Tibetan', 'Tibetan'],
  		['Tirhuta', 'Tirhuta'],
  		['Ugaritic', 'Ugaritic'],
  		['Vai', 'Vai'],
  		['Warang_Citi', 'Warang_Citi'],
  		['Wancho', 'Wancho'],
  		['Old_Persian', 'Old_Persian'],
  		['Cuneiform', 'Cuneiform'],
  		['Yi', 'Yi'],
  		['Zanabazar_Square', 'Zanabazar_Square'],
  		['Inherited', 'Inherited'],
  		['Common', 'Common'],
  		['Unknown', 'Unknown']
  	])],
  	['Script_Extensions', new Map([
  		['Adlm', 'Adlam'],
  		['Aghb', 'Caucasian_Albanian'],
  		['Ahom', 'Ahom'],
  		['Arab', 'Arabic'],
  		['Armi', 'Imperial_Aramaic'],
  		['Armn', 'Armenian'],
  		['Avst', 'Avestan'],
  		['Bali', 'Balinese'],
  		['Bamu', 'Bamum'],
  		['Bass', 'Bassa_Vah'],
  		['Batk', 'Batak'],
  		['Beng', 'Bengali'],
  		['Bhks', 'Bhaiksuki'],
  		['Bopo', 'Bopomofo'],
  		['Brah', 'Brahmi'],
  		['Brai', 'Braille'],
  		['Bugi', 'Buginese'],
  		['Buhd', 'Buhid'],
  		['Cakm', 'Chakma'],
  		['Cans', 'Canadian_Aboriginal'],
  		['Cari', 'Carian'],
  		['Cham', 'Cham'],
  		['Cher', 'Cherokee'],
  		['Copt', 'Coptic'],
  		['Qaac', 'Coptic'],
  		['Cprt', 'Cypriot'],
  		['Cyrl', 'Cyrillic'],
  		['Deva', 'Devanagari'],
  		['Dogr', 'Dogra'],
  		['Dsrt', 'Deseret'],
  		['Dupl', 'Duployan'],
  		['Egyp', 'Egyptian_Hieroglyphs'],
  		['Elba', 'Elbasan'],
  		['Elym', 'Elymaic'],
  		['Ethi', 'Ethiopic'],
  		['Geor', 'Georgian'],
  		['Glag', 'Glagolitic'],
  		['Gong', 'Gunjala_Gondi'],
  		['Gonm', 'Masaram_Gondi'],
  		['Goth', 'Gothic'],
  		['Gran', 'Grantha'],
  		['Grek', 'Greek'],
  		['Gujr', 'Gujarati'],
  		['Guru', 'Gurmukhi'],
  		['Hang', 'Hangul'],
  		['Hani', 'Han'],
  		['Hano', 'Hanunoo'],
  		['Hatr', 'Hatran'],
  		['Hebr', 'Hebrew'],
  		['Hira', 'Hiragana'],
  		['Hluw', 'Anatolian_Hieroglyphs'],
  		['Hmng', 'Pahawh_Hmong'],
  		['Hmnp', 'Nyiakeng_Puachue_Hmong'],
  		['Hrkt', 'Katakana_Or_Hiragana'],
  		['Hung', 'Old_Hungarian'],
  		['Ital', 'Old_Italic'],
  		['Java', 'Javanese'],
  		['Kali', 'Kayah_Li'],
  		['Kana', 'Katakana'],
  		['Khar', 'Kharoshthi'],
  		['Khmr', 'Khmer'],
  		['Khoj', 'Khojki'],
  		['Knda', 'Kannada'],
  		['Kthi', 'Kaithi'],
  		['Lana', 'Tai_Tham'],
  		['Laoo', 'Lao'],
  		['Latn', 'Latin'],
  		['Lepc', 'Lepcha'],
  		['Limb', 'Limbu'],
  		['Lina', 'Linear_A'],
  		['Linb', 'Linear_B'],
  		['Lisu', 'Lisu'],
  		['Lyci', 'Lycian'],
  		['Lydi', 'Lydian'],
  		['Mahj', 'Mahajani'],
  		['Maka', 'Makasar'],
  		['Mand', 'Mandaic'],
  		['Mani', 'Manichaean'],
  		['Marc', 'Marchen'],
  		['Medf', 'Medefaidrin'],
  		['Mend', 'Mende_Kikakui'],
  		['Merc', 'Meroitic_Cursive'],
  		['Mero', 'Meroitic_Hieroglyphs'],
  		['Mlym', 'Malayalam'],
  		['Modi', 'Modi'],
  		['Mong', 'Mongolian'],
  		['Mroo', 'Mro'],
  		['Mtei', 'Meetei_Mayek'],
  		['Mult', 'Multani'],
  		['Mymr', 'Myanmar'],
  		['Nand', 'Nandinagari'],
  		['Narb', 'Old_North_Arabian'],
  		['Nbat', 'Nabataean'],
  		['Newa', 'Newa'],
  		['Nkoo', 'Nko'],
  		['Nshu', 'Nushu'],
  		['Ogam', 'Ogham'],
  		['Olck', 'Ol_Chiki'],
  		['Orkh', 'Old_Turkic'],
  		['Orya', 'Oriya'],
  		['Osge', 'Osage'],
  		['Osma', 'Osmanya'],
  		['Palm', 'Palmyrene'],
  		['Pauc', 'Pau_Cin_Hau'],
  		['Perm', 'Old_Permic'],
  		['Phag', 'Phags_Pa'],
  		['Phli', 'Inscriptional_Pahlavi'],
  		['Phlp', 'Psalter_Pahlavi'],
  		['Phnx', 'Phoenician'],
  		['Plrd', 'Miao'],
  		['Prti', 'Inscriptional_Parthian'],
  		['Rjng', 'Rejang'],
  		['Rohg', 'Hanifi_Rohingya'],
  		['Runr', 'Runic'],
  		['Samr', 'Samaritan'],
  		['Sarb', 'Old_South_Arabian'],
  		['Saur', 'Saurashtra'],
  		['Sgnw', 'SignWriting'],
  		['Shaw', 'Shavian'],
  		['Shrd', 'Sharada'],
  		['Sidd', 'Siddham'],
  		['Sind', 'Khudawadi'],
  		['Sinh', 'Sinhala'],
  		['Sogd', 'Sogdian'],
  		['Sogo', 'Old_Sogdian'],
  		['Sora', 'Sora_Sompeng'],
  		['Soyo', 'Soyombo'],
  		['Sund', 'Sundanese'],
  		['Sylo', 'Syloti_Nagri'],
  		['Syrc', 'Syriac'],
  		['Tagb', 'Tagbanwa'],
  		['Takr', 'Takri'],
  		['Tale', 'Tai_Le'],
  		['Talu', 'New_Tai_Lue'],
  		['Taml', 'Tamil'],
  		['Tang', 'Tangut'],
  		['Tavt', 'Tai_Viet'],
  		['Telu', 'Telugu'],
  		['Tfng', 'Tifinagh'],
  		['Tglg', 'Tagalog'],
  		['Thaa', 'Thaana'],
  		['Thai', 'Thai'],
  		['Tibt', 'Tibetan'],
  		['Tirh', 'Tirhuta'],
  		['Ugar', 'Ugaritic'],
  		['Vaii', 'Vai'],
  		['Wara', 'Warang_Citi'],
  		['Wcho', 'Wancho'],
  		['Xpeo', 'Old_Persian'],
  		['Xsux', 'Cuneiform'],
  		['Yiii', 'Yi'],
  		['Zanb', 'Zanabazar_Square'],
  		['Zinh', 'Inherited'],
  		['Qaai', 'Inherited'],
  		['Zyyy', 'Common'],
  		['Zzzz', 'Unknown'],
  		['Adlam', 'Adlam'],
  		['Caucasian_Albanian', 'Caucasian_Albanian'],
  		['Arabic', 'Arabic'],
  		['Imperial_Aramaic', 'Imperial_Aramaic'],
  		['Armenian', 'Armenian'],
  		['Avestan', 'Avestan'],
  		['Balinese', 'Balinese'],
  		['Bamum', 'Bamum'],
  		['Bassa_Vah', 'Bassa_Vah'],
  		['Batak', 'Batak'],
  		['Bengali', 'Bengali'],
  		['Bhaiksuki', 'Bhaiksuki'],
  		['Bopomofo', 'Bopomofo'],
  		['Brahmi', 'Brahmi'],
  		['Braille', 'Braille'],
  		['Buginese', 'Buginese'],
  		['Buhid', 'Buhid'],
  		['Chakma', 'Chakma'],
  		['Canadian_Aboriginal', 'Canadian_Aboriginal'],
  		['Carian', 'Carian'],
  		['Cherokee', 'Cherokee'],
  		['Coptic', 'Coptic'],
  		['Cypriot', 'Cypriot'],
  		['Cyrillic', 'Cyrillic'],
  		['Devanagari', 'Devanagari'],
  		['Dogra', 'Dogra'],
  		['Deseret', 'Deseret'],
  		['Duployan', 'Duployan'],
  		['Egyptian_Hieroglyphs', 'Egyptian_Hieroglyphs'],
  		['Elbasan', 'Elbasan'],
  		['Elymaic', 'Elymaic'],
  		['Ethiopic', 'Ethiopic'],
  		['Georgian', 'Georgian'],
  		['Glagolitic', 'Glagolitic'],
  		['Gunjala_Gondi', 'Gunjala_Gondi'],
  		['Masaram_Gondi', 'Masaram_Gondi'],
  		['Gothic', 'Gothic'],
  		['Grantha', 'Grantha'],
  		['Greek', 'Greek'],
  		['Gujarati', 'Gujarati'],
  		['Gurmukhi', 'Gurmukhi'],
  		['Hangul', 'Hangul'],
  		['Han', 'Han'],
  		['Hanunoo', 'Hanunoo'],
  		['Hatran', 'Hatran'],
  		['Hebrew', 'Hebrew'],
  		['Hiragana', 'Hiragana'],
  		['Anatolian_Hieroglyphs', 'Anatolian_Hieroglyphs'],
  		['Pahawh_Hmong', 'Pahawh_Hmong'],
  		['Nyiakeng_Puachue_Hmong', 'Nyiakeng_Puachue_Hmong'],
  		['Katakana_Or_Hiragana', 'Katakana_Or_Hiragana'],
  		['Old_Hungarian', 'Old_Hungarian'],
  		['Old_Italic', 'Old_Italic'],
  		['Javanese', 'Javanese'],
  		['Kayah_Li', 'Kayah_Li'],
  		['Katakana', 'Katakana'],
  		['Kharoshthi', 'Kharoshthi'],
  		['Khmer', 'Khmer'],
  		['Khojki', 'Khojki'],
  		['Kannada', 'Kannada'],
  		['Kaithi', 'Kaithi'],
  		['Tai_Tham', 'Tai_Tham'],
  		['Lao', 'Lao'],
  		['Latin', 'Latin'],
  		['Lepcha', 'Lepcha'],
  		['Limbu', 'Limbu'],
  		['Linear_A', 'Linear_A'],
  		['Linear_B', 'Linear_B'],
  		['Lycian', 'Lycian'],
  		['Lydian', 'Lydian'],
  		['Mahajani', 'Mahajani'],
  		['Makasar', 'Makasar'],
  		['Mandaic', 'Mandaic'],
  		['Manichaean', 'Manichaean'],
  		['Marchen', 'Marchen'],
  		['Medefaidrin', 'Medefaidrin'],
  		['Mende_Kikakui', 'Mende_Kikakui'],
  		['Meroitic_Cursive', 'Meroitic_Cursive'],
  		['Meroitic_Hieroglyphs', 'Meroitic_Hieroglyphs'],
  		['Malayalam', 'Malayalam'],
  		['Mongolian', 'Mongolian'],
  		['Mro', 'Mro'],
  		['Meetei_Mayek', 'Meetei_Mayek'],
  		['Multani', 'Multani'],
  		['Myanmar', 'Myanmar'],
  		['Nandinagari', 'Nandinagari'],
  		['Old_North_Arabian', 'Old_North_Arabian'],
  		['Nabataean', 'Nabataean'],
  		['Nko', 'Nko'],
  		['Nushu', 'Nushu'],
  		['Ogham', 'Ogham'],
  		['Ol_Chiki', 'Ol_Chiki'],
  		['Old_Turkic', 'Old_Turkic'],
  		['Oriya', 'Oriya'],
  		['Osage', 'Osage'],
  		['Osmanya', 'Osmanya'],
  		['Palmyrene', 'Palmyrene'],
  		['Pau_Cin_Hau', 'Pau_Cin_Hau'],
  		['Old_Permic', 'Old_Permic'],
  		['Phags_Pa', 'Phags_Pa'],
  		['Inscriptional_Pahlavi', 'Inscriptional_Pahlavi'],
  		['Psalter_Pahlavi', 'Psalter_Pahlavi'],
  		['Phoenician', 'Phoenician'],
  		['Miao', 'Miao'],
  		['Inscriptional_Parthian', 'Inscriptional_Parthian'],
  		['Rejang', 'Rejang'],
  		['Hanifi_Rohingya', 'Hanifi_Rohingya'],
  		['Runic', 'Runic'],
  		['Samaritan', 'Samaritan'],
  		['Old_South_Arabian', 'Old_South_Arabian'],
  		['Saurashtra', 'Saurashtra'],
  		['SignWriting', 'SignWriting'],
  		['Shavian', 'Shavian'],
  		['Sharada', 'Sharada'],
  		['Siddham', 'Siddham'],
  		['Khudawadi', 'Khudawadi'],
  		['Sinhala', 'Sinhala'],
  		['Sogdian', 'Sogdian'],
  		['Old_Sogdian', 'Old_Sogdian'],
  		['Sora_Sompeng', 'Sora_Sompeng'],
  		['Soyombo', 'Soyombo'],
  		['Sundanese', 'Sundanese'],
  		['Syloti_Nagri', 'Syloti_Nagri'],
  		['Syriac', 'Syriac'],
  		['Tagbanwa', 'Tagbanwa'],
  		['Takri', 'Takri'],
  		['Tai_Le', 'Tai_Le'],
  		['New_Tai_Lue', 'New_Tai_Lue'],
  		['Tamil', 'Tamil'],
  		['Tangut', 'Tangut'],
  		['Tai_Viet', 'Tai_Viet'],
  		['Telugu', 'Telugu'],
  		['Tifinagh', 'Tifinagh'],
  		['Tagalog', 'Tagalog'],
  		['Thaana', 'Thaana'],
  		['Tibetan', 'Tibetan'],
  		['Tirhuta', 'Tirhuta'],
  		['Ugaritic', 'Ugaritic'],
  		['Vai', 'Vai'],
  		['Warang_Citi', 'Warang_Citi'],
  		['Wancho', 'Wancho'],
  		['Old_Persian', 'Old_Persian'],
  		['Cuneiform', 'Cuneiform'],
  		['Yi', 'Yi'],
  		['Zanabazar_Square', 'Zanabazar_Square'],
  		['Inherited', 'Inherited'],
  		['Common', 'Common'],
  		['Unknown', 'Unknown']
  	])]
  ]);

  var matchPropertyValue = function(property, value) {
  	var aliasToValue = mappings.get(property);
  	if (!aliasToValue) {
  		throw new Error(("Unknown property `" + property + "`."));
  	}
  	var canonicalValue = aliasToValue.get(value);
  	if (canonicalValue) {
  		return canonicalValue;
  	}
  	throw new Error(
  		("Unknown value `" + value + "` for property `" + property + "`.")
  	);
  };

  var unicodeMatchPropertyValueEcmascript = matchPropertyValue;

  var iuMappings = new Map([
  	[0x4B, 0x212A],
  	[0x53, 0x17F],
  	[0x6B, 0x212A],
  	[0x73, 0x17F],
  	[0xB5, 0x39C],
  	[0xC5, 0x212B],
  	[0xDF, 0x1E9E],
  	[0xE5, 0x212B],
  	[0x17F, 0x53],
  	[0x1C4, 0x1C5],
  	[0x1C5, 0x1C4],
  	[0x1C7, 0x1C8],
  	[0x1C8, 0x1C7],
  	[0x1CA, 0x1CB],
  	[0x1CB, 0x1CA],
  	[0x1F1, 0x1F2],
  	[0x1F2, 0x1F1],
  	[0x26A, 0xA7AE],
  	[0x282, 0xA7C5],
  	[0x29D, 0xA7B2],
  	[0x345, 0x1FBE],
  	[0x392, 0x3D0],
  	[0x395, 0x3F5],
  	[0x398, 0x3F4],
  	[0x399, 0x1FBE],
  	[0x39A, 0x3F0],
  	[0x39C, 0xB5],
  	[0x3A0, 0x3D6],
  	[0x3A1, 0x3F1],
  	[0x3A3, 0x3C2],
  	[0x3A6, 0x3D5],
  	[0x3A9, 0x2126],
  	[0x3B8, 0x3F4],
  	[0x3C2, 0x3A3],
  	[0x3C9, 0x2126],
  	[0x3D0, 0x392],
  	[0x3D1, 0x3F4],
  	[0x3D5, 0x3A6],
  	[0x3D6, 0x3A0],
  	[0x3F0, 0x39A],
  	[0x3F1, 0x3A1],
  	[0x3F4, [
  		0x398,
  		0x3D1,
  		0x3B8
  	]],
  	[0x3F5, 0x395],
  	[0x412, 0x1C80],
  	[0x414, 0x1C81],
  	[0x41E, 0x1C82],
  	[0x421, 0x1C83],
  	[0x422, 0x1C85],
  	[0x42A, 0x1C86],
  	[0x432, 0x1C80],
  	[0x434, 0x1C81],
  	[0x43E, 0x1C82],
  	[0x441, 0x1C83],
  	[0x442, [
  		0x1C84,
  		0x1C85
  	]],
  	[0x44A, 0x1C86],
  	[0x462, 0x1C87],
  	[0x463, 0x1C87],
  	[0x10D0, 0x1C90],
  	[0x10D1, 0x1C91],
  	[0x10D2, 0x1C92],
  	[0x10D3, 0x1C93],
  	[0x10D4, 0x1C94],
  	[0x10D5, 0x1C95],
  	[0x10D6, 0x1C96],
  	[0x10D7, 0x1C97],
  	[0x10D8, 0x1C98],
  	[0x10D9, 0x1C99],
  	[0x10DA, 0x1C9A],
  	[0x10DB, 0x1C9B],
  	[0x10DC, 0x1C9C],
  	[0x10DD, 0x1C9D],
  	[0x10DE, 0x1C9E],
  	[0x10DF, 0x1C9F],
  	[0x10E0, 0x1CA0],
  	[0x10E1, 0x1CA1],
  	[0x10E2, 0x1CA2],
  	[0x10E3, 0x1CA3],
  	[0x10E4, 0x1CA4],
  	[0x10E5, 0x1CA5],
  	[0x10E6, 0x1CA6],
  	[0x10E7, 0x1CA7],
  	[0x10E8, 0x1CA8],
  	[0x10E9, 0x1CA9],
  	[0x10EA, 0x1CAA],
  	[0x10EB, 0x1CAB],
  	[0x10EC, 0x1CAC],
  	[0x10ED, 0x1CAD],
  	[0x10EE, 0x1CAE],
  	[0x10EF, 0x1CAF],
  	[0x10F0, 0x1CB0],
  	[0x10F1, 0x1CB1],
  	[0x10F2, 0x1CB2],
  	[0x10F3, 0x1CB3],
  	[0x10F4, 0x1CB4],
  	[0x10F5, 0x1CB5],
  	[0x10F6, 0x1CB6],
  	[0x10F7, 0x1CB7],
  	[0x10F8, 0x1CB8],
  	[0x10F9, 0x1CB9],
  	[0x10FA, 0x1CBA],
  	[0x10FD, 0x1CBD],
  	[0x10FE, 0x1CBE],
  	[0x10FF, 0x1CBF],
  	[0x13A0, 0xAB70],
  	[0x13A1, 0xAB71],
  	[0x13A2, 0xAB72],
  	[0x13A3, 0xAB73],
  	[0x13A4, 0xAB74],
  	[0x13A5, 0xAB75],
  	[0x13A6, 0xAB76],
  	[0x13A7, 0xAB77],
  	[0x13A8, 0xAB78],
  	[0x13A9, 0xAB79],
  	[0x13AA, 0xAB7A],
  	[0x13AB, 0xAB7B],
  	[0x13AC, 0xAB7C],
  	[0x13AD, 0xAB7D],
  	[0x13AE, 0xAB7E],
  	[0x13AF, 0xAB7F],
  	[0x13B0, 0xAB80],
  	[0x13B1, 0xAB81],
  	[0x13B2, 0xAB82],
  	[0x13B3, 0xAB83],
  	[0x13B4, 0xAB84],
  	[0x13B5, 0xAB85],
  	[0x13B6, 0xAB86],
  	[0x13B7, 0xAB87],
  	[0x13B8, 0xAB88],
  	[0x13B9, 0xAB89],
  	[0x13BA, 0xAB8A],
  	[0x13BB, 0xAB8B],
  	[0x13BC, 0xAB8C],
  	[0x13BD, 0xAB8D],
  	[0x13BE, 0xAB8E],
  	[0x13BF, 0xAB8F],
  	[0x13C0, 0xAB90],
  	[0x13C1, 0xAB91],
  	[0x13C2, 0xAB92],
  	[0x13C3, 0xAB93],
  	[0x13C4, 0xAB94],
  	[0x13C5, 0xAB95],
  	[0x13C6, 0xAB96],
  	[0x13C7, 0xAB97],
  	[0x13C8, 0xAB98],
  	[0x13C9, 0xAB99],
  	[0x13CA, 0xAB9A],
  	[0x13CB, 0xAB9B],
  	[0x13CC, 0xAB9C],
  	[0x13CD, 0xAB9D],
  	[0x13CE, 0xAB9E],
  	[0x13CF, 0xAB9F],
  	[0x13D0, 0xABA0],
  	[0x13D1, 0xABA1],
  	[0x13D2, 0xABA2],
  	[0x13D3, 0xABA3],
  	[0x13D4, 0xABA4],
  	[0x13D5, 0xABA5],
  	[0x13D6, 0xABA6],
  	[0x13D7, 0xABA7],
  	[0x13D8, 0xABA8],
  	[0x13D9, 0xABA9],
  	[0x13DA, 0xABAA],
  	[0x13DB, 0xABAB],
  	[0x13DC, 0xABAC],
  	[0x13DD, 0xABAD],
  	[0x13DE, 0xABAE],
  	[0x13DF, 0xABAF],
  	[0x13E0, 0xABB0],
  	[0x13E1, 0xABB1],
  	[0x13E2, 0xABB2],
  	[0x13E3, 0xABB3],
  	[0x13E4, 0xABB4],
  	[0x13E5, 0xABB5],
  	[0x13E6, 0xABB6],
  	[0x13E7, 0xABB7],
  	[0x13E8, 0xABB8],
  	[0x13E9, 0xABB9],
  	[0x13EA, 0xABBA],
  	[0x13EB, 0xABBB],
  	[0x13EC, 0xABBC],
  	[0x13ED, 0xABBD],
  	[0x13EE, 0xABBE],
  	[0x13EF, 0xABBF],
  	[0x13F0, 0x13F8],
  	[0x13F1, 0x13F9],
  	[0x13F2, 0x13FA],
  	[0x13F3, 0x13FB],
  	[0x13F4, 0x13FC],
  	[0x13F5, 0x13FD],
  	[0x13F8, 0x13F0],
  	[0x13F9, 0x13F1],
  	[0x13FA, 0x13F2],
  	[0x13FB, 0x13F3],
  	[0x13FC, 0x13F4],
  	[0x13FD, 0x13F5],
  	[0x1C80, [
  		0x412,
  		0x432
  	]],
  	[0x1C81, [
  		0x414,
  		0x434
  	]],
  	[0x1C82, [
  		0x41E,
  		0x43E
  	]],
  	[0x1C83, [
  		0x421,
  		0x441
  	]],
  	[0x1C84, [
  		0x1C85,
  		0x442
  	]],
  	[0x1C85, [
  		0x422,
  		0x1C84,
  		0x442
  	]],
  	[0x1C86, [
  		0x42A,
  		0x44A
  	]],
  	[0x1C87, [
  		0x462,
  		0x463
  	]],
  	[0x1C88, [
  		0xA64A,
  		0xA64B
  	]],
  	[0x1C90, 0x10D0],
  	[0x1C91, 0x10D1],
  	[0x1C92, 0x10D2],
  	[0x1C93, 0x10D3],
  	[0x1C94, 0x10D4],
  	[0x1C95, 0x10D5],
  	[0x1C96, 0x10D6],
  	[0x1C97, 0x10D7],
  	[0x1C98, 0x10D8],
  	[0x1C99, 0x10D9],
  	[0x1C9A, 0x10DA],
  	[0x1C9B, 0x10DB],
  	[0x1C9C, 0x10DC],
  	[0x1C9D, 0x10DD],
  	[0x1C9E, 0x10DE],
  	[0x1C9F, 0x10DF],
  	[0x1CA0, 0x10E0],
  	[0x1CA1, 0x10E1],
  	[0x1CA2, 0x10E2],
  	[0x1CA3, 0x10E3],
  	[0x1CA4, 0x10E4],
  	[0x1CA5, 0x10E5],
  	[0x1CA6, 0x10E6],
  	[0x1CA7, 0x10E7],
  	[0x1CA8, 0x10E8],
  	[0x1CA9, 0x10E9],
  	[0x1CAA, 0x10EA],
  	[0x1CAB, 0x10EB],
  	[0x1CAC, 0x10EC],
  	[0x1CAD, 0x10ED],
  	[0x1CAE, 0x10EE],
  	[0x1CAF, 0x10EF],
  	[0x1CB0, 0x10F0],
  	[0x1CB1, 0x10F1],
  	[0x1CB2, 0x10F2],
  	[0x1CB3, 0x10F3],
  	[0x1CB4, 0x10F4],
  	[0x1CB5, 0x10F5],
  	[0x1CB6, 0x10F6],
  	[0x1CB7, 0x10F7],
  	[0x1CB8, 0x10F8],
  	[0x1CB9, 0x10F9],
  	[0x1CBA, 0x10FA],
  	[0x1CBD, 0x10FD],
  	[0x1CBE, 0x10FE],
  	[0x1CBF, 0x10FF],
  	[0x1D8E, 0xA7C6],
  	[0x1E60, 0x1E9B],
  	[0x1E9B, 0x1E60],
  	[0x1E9E, 0xDF],
  	[0x1F80, 0x1F88],
  	[0x1F81, 0x1F89],
  	[0x1F82, 0x1F8A],
  	[0x1F83, 0x1F8B],
  	[0x1F84, 0x1F8C],
  	[0x1F85, 0x1F8D],
  	[0x1F86, 0x1F8E],
  	[0x1F87, 0x1F8F],
  	[0x1F88, 0x1F80],
  	[0x1F89, 0x1F81],
  	[0x1F8A, 0x1F82],
  	[0x1F8B, 0x1F83],
  	[0x1F8C, 0x1F84],
  	[0x1F8D, 0x1F85],
  	[0x1F8E, 0x1F86],
  	[0x1F8F, 0x1F87],
  	[0x1F90, 0x1F98],
  	[0x1F91, 0x1F99],
  	[0x1F92, 0x1F9A],
  	[0x1F93, 0x1F9B],
  	[0x1F94, 0x1F9C],
  	[0x1F95, 0x1F9D],
  	[0x1F96, 0x1F9E],
  	[0x1F97, 0x1F9F],
  	[0x1F98, 0x1F90],
  	[0x1F99, 0x1F91],
  	[0x1F9A, 0x1F92],
  	[0x1F9B, 0x1F93],
  	[0x1F9C, 0x1F94],
  	[0x1F9D, 0x1F95],
  	[0x1F9E, 0x1F96],
  	[0x1F9F, 0x1F97],
  	[0x1FA0, 0x1FA8],
  	[0x1FA1, 0x1FA9],
  	[0x1FA2, 0x1FAA],
  	[0x1FA3, 0x1FAB],
  	[0x1FA4, 0x1FAC],
  	[0x1FA5, 0x1FAD],
  	[0x1FA6, 0x1FAE],
  	[0x1FA7, 0x1FAF],
  	[0x1FA8, 0x1FA0],
  	[0x1FA9, 0x1FA1],
  	[0x1FAA, 0x1FA2],
  	[0x1FAB, 0x1FA3],
  	[0x1FAC, 0x1FA4],
  	[0x1FAD, 0x1FA5],
  	[0x1FAE, 0x1FA6],
  	[0x1FAF, 0x1FA7],
  	[0x1FB3, 0x1FBC],
  	[0x1FBC, 0x1FB3],
  	[0x1FBE, [
  		0x345,
  		0x399
  	]],
  	[0x1FC3, 0x1FCC],
  	[0x1FCC, 0x1FC3],
  	[0x1FF3, 0x1FFC],
  	[0x1FFC, 0x1FF3],
  	[0x2126, [
  		0x3A9,
  		0x3C9
  	]],
  	[0x212A, 0x4B],
  	[0x212B, [
  		0xC5,
  		0xE5
  	]],
  	[0xA64A, 0x1C88],
  	[0xA64B, 0x1C88],
  	[0xA794, 0xA7C4],
  	[0xA7AE, 0x26A],
  	[0xA7B2, 0x29D],
  	[0xA7B3, 0xAB53],
  	[0xA7B4, 0xA7B5],
  	[0xA7B5, 0xA7B4],
  	[0xA7B6, 0xA7B7],
  	[0xA7B7, 0xA7B6],
  	[0xA7B8, 0xA7B9],
  	[0xA7B9, 0xA7B8],
  	[0xA7BA, 0xA7BB],
  	[0xA7BB, 0xA7BA],
  	[0xA7BC, 0xA7BD],
  	[0xA7BD, 0xA7BC],
  	[0xA7BE, 0xA7BF],
  	[0xA7BF, 0xA7BE],
  	[0xA7C2, 0xA7C3],
  	[0xA7C3, 0xA7C2],
  	[0xA7C4, 0xA794],
  	[0xA7C5, 0x282],
  	[0xA7C6, 0x1D8E],
  	[0xAB53, 0xA7B3],
  	[0xAB70, 0x13A0],
  	[0xAB71, 0x13A1],
  	[0xAB72, 0x13A2],
  	[0xAB73, 0x13A3],
  	[0xAB74, 0x13A4],
  	[0xAB75, 0x13A5],
  	[0xAB76, 0x13A6],
  	[0xAB77, 0x13A7],
  	[0xAB78, 0x13A8],
  	[0xAB79, 0x13A9],
  	[0xAB7A, 0x13AA],
  	[0xAB7B, 0x13AB],
  	[0xAB7C, 0x13AC],
  	[0xAB7D, 0x13AD],
  	[0xAB7E, 0x13AE],
  	[0xAB7F, 0x13AF],
  	[0xAB80, 0x13B0],
  	[0xAB81, 0x13B1],
  	[0xAB82, 0x13B2],
  	[0xAB83, 0x13B3],
  	[0xAB84, 0x13B4],
  	[0xAB85, 0x13B5],
  	[0xAB86, 0x13B6],
  	[0xAB87, 0x13B7],
  	[0xAB88, 0x13B8],
  	[0xAB89, 0x13B9],
  	[0xAB8A, 0x13BA],
  	[0xAB8B, 0x13BB],
  	[0xAB8C, 0x13BC],
  	[0xAB8D, 0x13BD],
  	[0xAB8E, 0x13BE],
  	[0xAB8F, 0x13BF],
  	[0xAB90, 0x13C0],
  	[0xAB91, 0x13C1],
  	[0xAB92, 0x13C2],
  	[0xAB93, 0x13C3],
  	[0xAB94, 0x13C4],
  	[0xAB95, 0x13C5],
  	[0xAB96, 0x13C6],
  	[0xAB97, 0x13C7],
  	[0xAB98, 0x13C8],
  	[0xAB99, 0x13C9],
  	[0xAB9A, 0x13CA],
  	[0xAB9B, 0x13CB],
  	[0xAB9C, 0x13CC],
  	[0xAB9D, 0x13CD],
  	[0xAB9E, 0x13CE],
  	[0xAB9F, 0x13CF],
  	[0xABA0, 0x13D0],
  	[0xABA1, 0x13D1],
  	[0xABA2, 0x13D2],
  	[0xABA3, 0x13D3],
  	[0xABA4, 0x13D4],
  	[0xABA5, 0x13D5],
  	[0xABA6, 0x13D6],
  	[0xABA7, 0x13D7],
  	[0xABA8, 0x13D8],
  	[0xABA9, 0x13D9],
  	[0xABAA, 0x13DA],
  	[0xABAB, 0x13DB],
  	[0xABAC, 0x13DC],
  	[0xABAD, 0x13DD],
  	[0xABAE, 0x13DE],
  	[0xABAF, 0x13DF],
  	[0xABB0, 0x13E0],
  	[0xABB1, 0x13E1],
  	[0xABB2, 0x13E2],
  	[0xABB3, 0x13E3],
  	[0xABB4, 0x13E4],
  	[0xABB5, 0x13E5],
  	[0xABB6, 0x13E6],
  	[0xABB7, 0x13E7],
  	[0xABB8, 0x13E8],
  	[0xABB9, 0x13E9],
  	[0xABBA, 0x13EA],
  	[0xABBB, 0x13EB],
  	[0xABBC, 0x13EC],
  	[0xABBD, 0x13ED],
  	[0xABBE, 0x13EE],
  	[0xABBF, 0x13EF],
  	[0x10400, 0x10428],
  	[0x10401, 0x10429],
  	[0x10402, 0x1042A],
  	[0x10403, 0x1042B],
  	[0x10404, 0x1042C],
  	[0x10405, 0x1042D],
  	[0x10406, 0x1042E],
  	[0x10407, 0x1042F],
  	[0x10408, 0x10430],
  	[0x10409, 0x10431],
  	[0x1040A, 0x10432],
  	[0x1040B, 0x10433],
  	[0x1040C, 0x10434],
  	[0x1040D, 0x10435],
  	[0x1040E, 0x10436],
  	[0x1040F, 0x10437],
  	[0x10410, 0x10438],
  	[0x10411, 0x10439],
  	[0x10412, 0x1043A],
  	[0x10413, 0x1043B],
  	[0x10414, 0x1043C],
  	[0x10415, 0x1043D],
  	[0x10416, 0x1043E],
  	[0x10417, 0x1043F],
  	[0x10418, 0x10440],
  	[0x10419, 0x10441],
  	[0x1041A, 0x10442],
  	[0x1041B, 0x10443],
  	[0x1041C, 0x10444],
  	[0x1041D, 0x10445],
  	[0x1041E, 0x10446],
  	[0x1041F, 0x10447],
  	[0x10420, 0x10448],
  	[0x10421, 0x10449],
  	[0x10422, 0x1044A],
  	[0x10423, 0x1044B],
  	[0x10424, 0x1044C],
  	[0x10425, 0x1044D],
  	[0x10426, 0x1044E],
  	[0x10427, 0x1044F],
  	[0x10428, 0x10400],
  	[0x10429, 0x10401],
  	[0x1042A, 0x10402],
  	[0x1042B, 0x10403],
  	[0x1042C, 0x10404],
  	[0x1042D, 0x10405],
  	[0x1042E, 0x10406],
  	[0x1042F, 0x10407],
  	[0x10430, 0x10408],
  	[0x10431, 0x10409],
  	[0x10432, 0x1040A],
  	[0x10433, 0x1040B],
  	[0x10434, 0x1040C],
  	[0x10435, 0x1040D],
  	[0x10436, 0x1040E],
  	[0x10437, 0x1040F],
  	[0x10438, 0x10410],
  	[0x10439, 0x10411],
  	[0x1043A, 0x10412],
  	[0x1043B, 0x10413],
  	[0x1043C, 0x10414],
  	[0x1043D, 0x10415],
  	[0x1043E, 0x10416],
  	[0x1043F, 0x10417],
  	[0x10440, 0x10418],
  	[0x10441, 0x10419],
  	[0x10442, 0x1041A],
  	[0x10443, 0x1041B],
  	[0x10444, 0x1041C],
  	[0x10445, 0x1041D],
  	[0x10446, 0x1041E],
  	[0x10447, 0x1041F],
  	[0x10448, 0x10420],
  	[0x10449, 0x10421],
  	[0x1044A, 0x10422],
  	[0x1044B, 0x10423],
  	[0x1044C, 0x10424],
  	[0x1044D, 0x10425],
  	[0x1044E, 0x10426],
  	[0x1044F, 0x10427],
  	[0x104B0, 0x104D8],
  	[0x104B1, 0x104D9],
  	[0x104B2, 0x104DA],
  	[0x104B3, 0x104DB],
  	[0x104B4, 0x104DC],
  	[0x104B5, 0x104DD],
  	[0x104B6, 0x104DE],
  	[0x104B7, 0x104DF],
  	[0x104B8, 0x104E0],
  	[0x104B9, 0x104E1],
  	[0x104BA, 0x104E2],
  	[0x104BB, 0x104E3],
  	[0x104BC, 0x104E4],
  	[0x104BD, 0x104E5],
  	[0x104BE, 0x104E6],
  	[0x104BF, 0x104E7],
  	[0x104C0, 0x104E8],
  	[0x104C1, 0x104E9],
  	[0x104C2, 0x104EA],
  	[0x104C3, 0x104EB],
  	[0x104C4, 0x104EC],
  	[0x104C5, 0x104ED],
  	[0x104C6, 0x104EE],
  	[0x104C7, 0x104EF],
  	[0x104C8, 0x104F0],
  	[0x104C9, 0x104F1],
  	[0x104CA, 0x104F2],
  	[0x104CB, 0x104F3],
  	[0x104CC, 0x104F4],
  	[0x104CD, 0x104F5],
  	[0x104CE, 0x104F6],
  	[0x104CF, 0x104F7],
  	[0x104D0, 0x104F8],
  	[0x104D1, 0x104F9],
  	[0x104D2, 0x104FA],
  	[0x104D3, 0x104FB],
  	[0x104D8, 0x104B0],
  	[0x104D9, 0x104B1],
  	[0x104DA, 0x104B2],
  	[0x104DB, 0x104B3],
  	[0x104DC, 0x104B4],
  	[0x104DD, 0x104B5],
  	[0x104DE, 0x104B6],
  	[0x104DF, 0x104B7],
  	[0x104E0, 0x104B8],
  	[0x104E1, 0x104B9],
  	[0x104E2, 0x104BA],
  	[0x104E3, 0x104BB],
  	[0x104E4, 0x104BC],
  	[0x104E5, 0x104BD],
  	[0x104E6, 0x104BE],
  	[0x104E7, 0x104BF],
  	[0x104E8, 0x104C0],
  	[0x104E9, 0x104C1],
  	[0x104EA, 0x104C2],
  	[0x104EB, 0x104C3],
  	[0x104EC, 0x104C4],
  	[0x104ED, 0x104C5],
  	[0x104EE, 0x104C6],
  	[0x104EF, 0x104C7],
  	[0x104F0, 0x104C8],
  	[0x104F1, 0x104C9],
  	[0x104F2, 0x104CA],
  	[0x104F3, 0x104CB],
  	[0x104F4, 0x104CC],
  	[0x104F5, 0x104CD],
  	[0x104F6, 0x104CE],
  	[0x104F7, 0x104CF],
  	[0x104F8, 0x104D0],
  	[0x104F9, 0x104D1],
  	[0x104FA, 0x104D2],
  	[0x104FB, 0x104D3],
  	[0x10C80, 0x10CC0],
  	[0x10C81, 0x10CC1],
  	[0x10C82, 0x10CC2],
  	[0x10C83, 0x10CC3],
  	[0x10C84, 0x10CC4],
  	[0x10C85, 0x10CC5],
  	[0x10C86, 0x10CC6],
  	[0x10C87, 0x10CC7],
  	[0x10C88, 0x10CC8],
  	[0x10C89, 0x10CC9],
  	[0x10C8A, 0x10CCA],
  	[0x10C8B, 0x10CCB],
  	[0x10C8C, 0x10CCC],
  	[0x10C8D, 0x10CCD],
  	[0x10C8E, 0x10CCE],
  	[0x10C8F, 0x10CCF],
  	[0x10C90, 0x10CD0],
  	[0x10C91, 0x10CD1],
  	[0x10C92, 0x10CD2],
  	[0x10C93, 0x10CD3],
  	[0x10C94, 0x10CD4],
  	[0x10C95, 0x10CD5],
  	[0x10C96, 0x10CD6],
  	[0x10C97, 0x10CD7],
  	[0x10C98, 0x10CD8],
  	[0x10C99, 0x10CD9],
  	[0x10C9A, 0x10CDA],
  	[0x10C9B, 0x10CDB],
  	[0x10C9C, 0x10CDC],
  	[0x10C9D, 0x10CDD],
  	[0x10C9E, 0x10CDE],
  	[0x10C9F, 0x10CDF],
  	[0x10CA0, 0x10CE0],
  	[0x10CA1, 0x10CE1],
  	[0x10CA2, 0x10CE2],
  	[0x10CA3, 0x10CE3],
  	[0x10CA4, 0x10CE4],
  	[0x10CA5, 0x10CE5],
  	[0x10CA6, 0x10CE6],
  	[0x10CA7, 0x10CE7],
  	[0x10CA8, 0x10CE8],
  	[0x10CA9, 0x10CE9],
  	[0x10CAA, 0x10CEA],
  	[0x10CAB, 0x10CEB],
  	[0x10CAC, 0x10CEC],
  	[0x10CAD, 0x10CED],
  	[0x10CAE, 0x10CEE],
  	[0x10CAF, 0x10CEF],
  	[0x10CB0, 0x10CF0],
  	[0x10CB1, 0x10CF1],
  	[0x10CB2, 0x10CF2],
  	[0x10CC0, 0x10C80],
  	[0x10CC1, 0x10C81],
  	[0x10CC2, 0x10C82],
  	[0x10CC3, 0x10C83],
  	[0x10CC4, 0x10C84],
  	[0x10CC5, 0x10C85],
  	[0x10CC6, 0x10C86],
  	[0x10CC7, 0x10C87],
  	[0x10CC8, 0x10C88],
  	[0x10CC9, 0x10C89],
  	[0x10CCA, 0x10C8A],
  	[0x10CCB, 0x10C8B],
  	[0x10CCC, 0x10C8C],
  	[0x10CCD, 0x10C8D],
  	[0x10CCE, 0x10C8E],
  	[0x10CCF, 0x10C8F],
  	[0x10CD0, 0x10C90],
  	[0x10CD1, 0x10C91],
  	[0x10CD2, 0x10C92],
  	[0x10CD3, 0x10C93],
  	[0x10CD4, 0x10C94],
  	[0x10CD5, 0x10C95],
  	[0x10CD6, 0x10C96],
  	[0x10CD7, 0x10C97],
  	[0x10CD8, 0x10C98],
  	[0x10CD9, 0x10C99],
  	[0x10CDA, 0x10C9A],
  	[0x10CDB, 0x10C9B],
  	[0x10CDC, 0x10C9C],
  	[0x10CDD, 0x10C9D],
  	[0x10CDE, 0x10C9E],
  	[0x10CDF, 0x10C9F],
  	[0x10CE0, 0x10CA0],
  	[0x10CE1, 0x10CA1],
  	[0x10CE2, 0x10CA2],
  	[0x10CE3, 0x10CA3],
  	[0x10CE4, 0x10CA4],
  	[0x10CE5, 0x10CA5],
  	[0x10CE6, 0x10CA6],
  	[0x10CE7, 0x10CA7],
  	[0x10CE8, 0x10CA8],
  	[0x10CE9, 0x10CA9],
  	[0x10CEA, 0x10CAA],
  	[0x10CEB, 0x10CAB],
  	[0x10CEC, 0x10CAC],
  	[0x10CED, 0x10CAD],
  	[0x10CEE, 0x10CAE],
  	[0x10CEF, 0x10CAF],
  	[0x10CF0, 0x10CB0],
  	[0x10CF1, 0x10CB1],
  	[0x10CF2, 0x10CB2],
  	[0x118A0, 0x118C0],
  	[0x118A1, 0x118C1],
  	[0x118A2, 0x118C2],
  	[0x118A3, 0x118C3],
  	[0x118A4, 0x118C4],
  	[0x118A5, 0x118C5],
  	[0x118A6, 0x118C6],
  	[0x118A7, 0x118C7],
  	[0x118A8, 0x118C8],
  	[0x118A9, 0x118C9],
  	[0x118AA, 0x118CA],
  	[0x118AB, 0x118CB],
  	[0x118AC, 0x118CC],
  	[0x118AD, 0x118CD],
  	[0x118AE, 0x118CE],
  	[0x118AF, 0x118CF],
  	[0x118B0, 0x118D0],
  	[0x118B1, 0x118D1],
  	[0x118B2, 0x118D2],
  	[0x118B3, 0x118D3],
  	[0x118B4, 0x118D4],
  	[0x118B5, 0x118D5],
  	[0x118B6, 0x118D6],
  	[0x118B7, 0x118D7],
  	[0x118B8, 0x118D8],
  	[0x118B9, 0x118D9],
  	[0x118BA, 0x118DA],
  	[0x118BB, 0x118DB],
  	[0x118BC, 0x118DC],
  	[0x118BD, 0x118DD],
  	[0x118BE, 0x118DE],
  	[0x118BF, 0x118DF],
  	[0x118C0, 0x118A0],
  	[0x118C1, 0x118A1],
  	[0x118C2, 0x118A2],
  	[0x118C3, 0x118A3],
  	[0x118C4, 0x118A4],
  	[0x118C5, 0x118A5],
  	[0x118C6, 0x118A6],
  	[0x118C7, 0x118A7],
  	[0x118C8, 0x118A8],
  	[0x118C9, 0x118A9],
  	[0x118CA, 0x118AA],
  	[0x118CB, 0x118AB],
  	[0x118CC, 0x118AC],
  	[0x118CD, 0x118AD],
  	[0x118CE, 0x118AE],
  	[0x118CF, 0x118AF],
  	[0x118D0, 0x118B0],
  	[0x118D1, 0x118B1],
  	[0x118D2, 0x118B2],
  	[0x118D3, 0x118B3],
  	[0x118D4, 0x118B4],
  	[0x118D5, 0x118B5],
  	[0x118D6, 0x118B6],
  	[0x118D7, 0x118B7],
  	[0x118D8, 0x118B8],
  	[0x118D9, 0x118B9],
  	[0x118DA, 0x118BA],
  	[0x118DB, 0x118BB],
  	[0x118DC, 0x118BC],
  	[0x118DD, 0x118BD],
  	[0x118DE, 0x118BE],
  	[0x118DF, 0x118BF],
  	[0x16E40, 0x16E60],
  	[0x16E41, 0x16E61],
  	[0x16E42, 0x16E62],
  	[0x16E43, 0x16E63],
  	[0x16E44, 0x16E64],
  	[0x16E45, 0x16E65],
  	[0x16E46, 0x16E66],
  	[0x16E47, 0x16E67],
  	[0x16E48, 0x16E68],
  	[0x16E49, 0x16E69],
  	[0x16E4A, 0x16E6A],
  	[0x16E4B, 0x16E6B],
  	[0x16E4C, 0x16E6C],
  	[0x16E4D, 0x16E6D],
  	[0x16E4E, 0x16E6E],
  	[0x16E4F, 0x16E6F],
  	[0x16E50, 0x16E70],
  	[0x16E51, 0x16E71],
  	[0x16E52, 0x16E72],
  	[0x16E53, 0x16E73],
  	[0x16E54, 0x16E74],
  	[0x16E55, 0x16E75],
  	[0x16E56, 0x16E76],
  	[0x16E57, 0x16E77],
  	[0x16E58, 0x16E78],
  	[0x16E59, 0x16E79],
  	[0x16E5A, 0x16E7A],
  	[0x16E5B, 0x16E7B],
  	[0x16E5C, 0x16E7C],
  	[0x16E5D, 0x16E7D],
  	[0x16E5E, 0x16E7E],
  	[0x16E5F, 0x16E7F],
  	[0x16E60, 0x16E40],
  	[0x16E61, 0x16E41],
  	[0x16E62, 0x16E42],
  	[0x16E63, 0x16E43],
  	[0x16E64, 0x16E44],
  	[0x16E65, 0x16E45],
  	[0x16E66, 0x16E46],
  	[0x16E67, 0x16E47],
  	[0x16E68, 0x16E48],
  	[0x16E69, 0x16E49],
  	[0x16E6A, 0x16E4A],
  	[0x16E6B, 0x16E4B],
  	[0x16E6C, 0x16E4C],
  	[0x16E6D, 0x16E4D],
  	[0x16E6E, 0x16E4E],
  	[0x16E6F, 0x16E4F],
  	[0x16E70, 0x16E50],
  	[0x16E71, 0x16E51],
  	[0x16E72, 0x16E52],
  	[0x16E73, 0x16E53],
  	[0x16E74, 0x16E54],
  	[0x16E75, 0x16E55],
  	[0x16E76, 0x16E56],
  	[0x16E77, 0x16E57],
  	[0x16E78, 0x16E58],
  	[0x16E79, 0x16E59],
  	[0x16E7A, 0x16E5A],
  	[0x16E7B, 0x16E5B],
  	[0x16E7C, 0x16E5C],
  	[0x16E7D, 0x16E5D],
  	[0x16E7E, 0x16E5E],
  	[0x16E7F, 0x16E5F],
  	[0x1E900, 0x1E922],
  	[0x1E901, 0x1E923],
  	[0x1E902, 0x1E924],
  	[0x1E903, 0x1E925],
  	[0x1E904, 0x1E926],
  	[0x1E905, 0x1E927],
  	[0x1E906, 0x1E928],
  	[0x1E907, 0x1E929],
  	[0x1E908, 0x1E92A],
  	[0x1E909, 0x1E92B],
  	[0x1E90A, 0x1E92C],
  	[0x1E90B, 0x1E92D],
  	[0x1E90C, 0x1E92E],
  	[0x1E90D, 0x1E92F],
  	[0x1E90E, 0x1E930],
  	[0x1E90F, 0x1E931],
  	[0x1E910, 0x1E932],
  	[0x1E911, 0x1E933],
  	[0x1E912, 0x1E934],
  	[0x1E913, 0x1E935],
  	[0x1E914, 0x1E936],
  	[0x1E915, 0x1E937],
  	[0x1E916, 0x1E938],
  	[0x1E917, 0x1E939],
  	[0x1E918, 0x1E93A],
  	[0x1E919, 0x1E93B],
  	[0x1E91A, 0x1E93C],
  	[0x1E91B, 0x1E93D],
  	[0x1E91C, 0x1E93E],
  	[0x1E91D, 0x1E93F],
  	[0x1E91E, 0x1E940],
  	[0x1E91F, 0x1E941],
  	[0x1E920, 0x1E942],
  	[0x1E921, 0x1E943],
  	[0x1E922, 0x1E900],
  	[0x1E923, 0x1E901],
  	[0x1E924, 0x1E902],
  	[0x1E925, 0x1E903],
  	[0x1E926, 0x1E904],
  	[0x1E927, 0x1E905],
  	[0x1E928, 0x1E906],
  	[0x1E929, 0x1E907],
  	[0x1E92A, 0x1E908],
  	[0x1E92B, 0x1E909],
  	[0x1E92C, 0x1E90A],
  	[0x1E92D, 0x1E90B],
  	[0x1E92E, 0x1E90C],
  	[0x1E92F, 0x1E90D],
  	[0x1E930, 0x1E90E],
  	[0x1E931, 0x1E90F],
  	[0x1E932, 0x1E910],
  	[0x1E933, 0x1E911],
  	[0x1E934, 0x1E912],
  	[0x1E935, 0x1E913],
  	[0x1E936, 0x1E914],
  	[0x1E937, 0x1E915],
  	[0x1E938, 0x1E916],
  	[0x1E939, 0x1E917],
  	[0x1E93A, 0x1E918],
  	[0x1E93B, 0x1E919],
  	[0x1E93C, 0x1E91A],
  	[0x1E93D, 0x1E91B],
  	[0x1E93E, 0x1E91C],
  	[0x1E93F, 0x1E91D],
  	[0x1E940, 0x1E91E],
  	[0x1E941, 0x1E91F],
  	[0x1E942, 0x1E920],
  	[0x1E943, 0x1E921]
  ]);

  var REGULAR = new Map([
  	['d', regenerate()
  		.addRange(0x30, 0x39)],
  	['D', regenerate()
  		.addRange(0x0, 0x2F)
  		.addRange(0x3A, 0xFFFF)],
  	['s', regenerate(0x20, 0xA0, 0x1680, 0x202F, 0x205F, 0x3000, 0xFEFF)
  		.addRange(0x9, 0xD)
  		.addRange(0x2000, 0x200A)
  		.addRange(0x2028, 0x2029)],
  	['S', regenerate()
  		.addRange(0x0, 0x8)
  		.addRange(0xE, 0x1F)
  		.addRange(0x21, 0x9F)
  		.addRange(0xA1, 0x167F)
  		.addRange(0x1681, 0x1FFF)
  		.addRange(0x200B, 0x2027)
  		.addRange(0x202A, 0x202E)
  		.addRange(0x2030, 0x205E)
  		.addRange(0x2060, 0x2FFF)
  		.addRange(0x3001, 0xFEFE)
  		.addRange(0xFF00, 0xFFFF)],
  	['w', regenerate(0x5F)
  		.addRange(0x30, 0x39)
  		.addRange(0x41, 0x5A)
  		.addRange(0x61, 0x7A)],
  	['W', regenerate(0x60)
  		.addRange(0x0, 0x2F)
  		.addRange(0x3A, 0x40)
  		.addRange(0x5B, 0x5E)
  		.addRange(0x7B, 0xFFFF)]
  ]);

  var UNICODE = new Map([
  	['d', regenerate()
  		.addRange(0x30, 0x39)],
  	['D', regenerate()
  		.addRange(0x0, 0x2F)
  		.addRange(0x3A, 0x10FFFF)],
  	['s', regenerate(0x20, 0xA0, 0x1680, 0x202F, 0x205F, 0x3000, 0xFEFF)
  		.addRange(0x9, 0xD)
  		.addRange(0x2000, 0x200A)
  		.addRange(0x2028, 0x2029)],
  	['S', regenerate()
  		.addRange(0x0, 0x8)
  		.addRange(0xE, 0x1F)
  		.addRange(0x21, 0x9F)
  		.addRange(0xA1, 0x167F)
  		.addRange(0x1681, 0x1FFF)
  		.addRange(0x200B, 0x2027)
  		.addRange(0x202A, 0x202E)
  		.addRange(0x2030, 0x205E)
  		.addRange(0x2060, 0x2FFF)
  		.addRange(0x3001, 0xFEFE)
  		.addRange(0xFF00, 0x10FFFF)],
  	['w', regenerate(0x5F)
  		.addRange(0x30, 0x39)
  		.addRange(0x41, 0x5A)
  		.addRange(0x61, 0x7A)],
  	['W', regenerate(0x60)
  		.addRange(0x0, 0x2F)
  		.addRange(0x3A, 0x40)
  		.addRange(0x5B, 0x5E)
  		.addRange(0x7B, 0x10FFFF)]
  ]);

  var UNICODE_IGNORE_CASE = new Map([
  	['d', regenerate()
  		.addRange(0x30, 0x39)],
  	['D', regenerate()
  		.addRange(0x0, 0x2F)
  		.addRange(0x3A, 0x10FFFF)],
  	['s', regenerate(0x20, 0xA0, 0x1680, 0x202F, 0x205F, 0x3000, 0xFEFF)
  		.addRange(0x9, 0xD)
  		.addRange(0x2000, 0x200A)
  		.addRange(0x2028, 0x2029)],
  	['S', regenerate()
  		.addRange(0x0, 0x8)
  		.addRange(0xE, 0x1F)
  		.addRange(0x21, 0x9F)
  		.addRange(0xA1, 0x167F)
  		.addRange(0x1681, 0x1FFF)
  		.addRange(0x200B, 0x2027)
  		.addRange(0x202A, 0x202E)
  		.addRange(0x2030, 0x205E)
  		.addRange(0x2060, 0x2FFF)
  		.addRange(0x3001, 0xFEFE)
  		.addRange(0xFF00, 0x10FFFF)],
  	['w', regenerate(0x5F, 0x17F, 0x212A)
  		.addRange(0x30, 0x39)
  		.addRange(0x41, 0x5A)
  		.addRange(0x61, 0x7A)],
  	['W', regenerate(0x60)
  		.addRange(0x0, 0x2F)
  		.addRange(0x3A, 0x40)
  		.addRange(0x5B, 0x5E)
  		.addRange(0x7B, 0x17E)
  		.addRange(0x180, 0x2129)
  		.addRange(0x212B, 0x10FFFF)]
  ]);

  var characterClassEscapeSets = {
  	REGULAR: REGULAR,
  	UNICODE: UNICODE,
  	UNICODE_IGNORE_CASE: UNICODE_IGNORE_CASE
  };

  var generate = regjsgen.generate;
  var parse = parser.parse;






  // Prepare a Regenerate set containing all code points, used for negative
  // character classes (if any).
  var UNICODE_SET = regenerate().addRange(0x0, 0x10FFFF);
  // Without the `u` flag, the range stops at 0xFFFF.
  // https://mths.be/es6#sec-pattern-semantics
  var BMP_SET = regenerate().addRange(0x0, 0xFFFF);

  // Prepare a Regenerate set containing all code points that are supposed to be
  // matched by `/./u`. https://mths.be/es6#sec-atom
  var DOT_SET_UNICODE = UNICODE_SET.clone() // all Unicode code points
  	.remove(
  		// minus `LineTerminator`s (https://mths.be/es6#sec-line-terminators):
  		0x000A, // Line Feed <LF>
  		0x000D, // Carriage Return <CR>
  		0x2028, // Line Separator <LS>
  		0x2029  // Paragraph Separator <PS>
  	);

  var getCharacterClassEscapeSet = function (character, unicode, ignoreCase) {
  	if (unicode) {
  		if (ignoreCase) {
  			return characterClassEscapeSets.UNICODE_IGNORE_CASE.get(character);
  		}
  		return characterClassEscapeSets.UNICODE.get(character);
  	}
  	return characterClassEscapeSets.REGULAR.get(character);
  };

  var getUnicodeDotSet = function (dotAll) {
  	return dotAll ? UNICODE_SET : DOT_SET_UNICODE;
  };

  var getUnicodePropertyValueSet = function (property, value) {
  	var path = value ?
  		(property + "/" + value) :
  		("Binary_Property/" + property);
  	try {
  		return commonjsRequire(("regenerate-unicode-properties/" + path + ".js"));
  	} catch (exception) {
  		throw new Error(
  			"Failed to recognize value `" + value + "` for property " +
  			"`" + property + "`."
  		);
  	}
  };

  var handleLoneUnicodePropertyNameOrValue = function (value) {
  	// It could be a `General_Category` value or a binary property.
  	// Note: `unicodeMatchPropertyValue` throws on invalid values.
  	try {
  		var property$1 = 'General_Category';
  		var category = unicodeMatchPropertyValueEcmascript(property$1, value);
  		return getUnicodePropertyValueSet(property$1, category);
  	} catch (exception) {}
  	// It’s not a `General_Category` value, so check if it’s a binary
  	// property. Note: `unicodeMatchProperty` throws on invalid properties.
  	var property = unicodeMatchPropertyEcmascript(value);
  	return getUnicodePropertyValueSet(property);
  };

  var getUnicodePropertyEscapeSet = function (value, isNegative) {
  	var parts = value.split('=');
  	var firstPart = parts[0];
  	var set;
  	if (parts.length == 1) {
  		set = handleLoneUnicodePropertyNameOrValue(firstPart);
  	} else {
  		// The pattern consists of two parts, i.e. `Property=Value`.
  		var property = unicodeMatchPropertyEcmascript(firstPart);
  		var value$1 = unicodeMatchPropertyValueEcmascript(property, parts[1]);
  		set = getUnicodePropertyValueSet(property, value$1);
  	}
  	if (isNegative) {
  		return UNICODE_SET.clone().remove(set);
  	}
  	return set.clone();
  };

  // Given a range of code points, add any case-folded code points in that range
  // to a set.
  regenerate.prototype.iuAddRange = function(min, max) {
  	var $this = this;
  	do {
  		var folded = caseFold(min);
  		if (folded) {
  			$this.add(folded);
  		}
  	} while (++min <= max);
  	return $this;
  };

  var update = function (item, pattern) {
  	var tree = parse(pattern, config.useUnicodeFlag ? 'u' : '');
  	switch (tree.type) {
  		case 'characterClass':
  		case 'group':
  		case 'value':
  			// No wrapping needed.
  			break;
  		default:
  			// Wrap the pattern in a non-capturing group.
  			tree = wrap(tree, pattern);
  	}
  	Object.assign(item, tree);
  };

  var wrap = function (tree, pattern) {
  	// Wrap the pattern in a non-capturing group.
  	return {
  		'type': 'group',
  		'behavior': 'ignore',
  		'body': [tree],
  		'raw': ("(?:" + pattern + ")")
  	};
  };

  var caseFold = function (codePoint) {
  	return iuMappings.get(codePoint) || false;
  };

  var processCharacterClass = function (characterClassItem, regenerateOptions) {
  	var set = regenerate();
  	for (var i = 0, list = characterClassItem.body; i < list.length; i += 1) {
  		var item = list[i];

  		switch (item.type) {
  			case 'value':
  				set.add(item.codePoint);
  				if (config.ignoreCase && config.unicode && !config.useUnicodeFlag) {
  					var folded = caseFold(item.codePoint);
  					if (folded) {
  						set.add(folded);
  					}
  				}
  				break;
  			case 'characterClassRange':
  				var min = item.min.codePoint;
  				var max = item.max.codePoint;
  				set.addRange(min, max);
  				if (config.ignoreCase && config.unicode && !config.useUnicodeFlag) {
  					set.iuAddRange(min, max);
  				}
  				break;
  			case 'characterClassEscape':
  				set.add(getCharacterClassEscapeSet(
  					item.value,
  					config.unicode,
  					config.ignoreCase
  				));
  				break;
  			case 'unicodePropertyEscape':
  				set.add(getUnicodePropertyEscapeSet(item.value, item.negative));
  				break;
  			// The `default` clause is only here as a safeguard; it should never be
  			// reached. Code coverage tools should ignore it.
  			/* istanbul ignore next */
  			default:
  				throw new Error(("Unknown term type: " + (item.type)));
  		}
  	}
  	if (characterClassItem.negative) {
  		set = (config.unicode ? UNICODE_SET : BMP_SET).clone().remove(set);
  	}
  	update(characterClassItem, set.toString(regenerateOptions));
  	return characterClassItem;
  };

  var updateNamedReference = function (item, index) {
  	delete item.name;
  	item.matchIndex = index;
  };

  var assertNoUnmatchedReferences = function (groups) {
  	var unmatchedReferencesNames = Object.keys(groups.unmatchedReferences);
  	if (unmatchedReferencesNames.length > 0) {
  		throw new Error(("Unknown group names: " + unmatchedReferencesNames));
  	}
  };

  var processTerm = function (item, regenerateOptions, groups) {
  	switch (item.type) {
  		case 'dot':
  			if (config.unicode) {
  				update(
  					item,
  					getUnicodeDotSet(config.dotAll).toString(regenerateOptions)
  				);
  			} else if (config.dotAll) {
  				// TODO: consider changing this at the regenerate level.
  				update(item, '[\\s\\S]');
  			}
  			break;
  		case 'characterClass':
  			item = processCharacterClass(item, regenerateOptions);
  			break;
  		case 'unicodePropertyEscape':
  			update(
  				item,
  				getUnicodePropertyEscapeSet(item.value, item.negative)
  					.toString(regenerateOptions)
  			);
  			break;
  		case 'characterClassEscape':
  			update(
  				item,
  				getCharacterClassEscapeSet(
  					item.value,
  					config.unicode,
  					config.ignoreCase
  				).toString(regenerateOptions)
  			);
  			break;
  		case 'group':
  			if (item.behavior == 'normal') {
  				groups.lastIndex++;
  			}
  			if (item.name) {
  				var name = item.name.value;

  				if (groups.names[name]) {
  					throw new Error(
  						("Multiple groups with the same name (" + name + ") are not allowed.")
  					);
  				}

  				var index = groups.lastIndex;
  				delete item.name;

  				groups.names[name] = index;
  				if (groups.onNamedGroup) {
  					groups.onNamedGroup.call(null, name, index);
  				}

  				if (groups.unmatchedReferences[name]) {
  					groups.unmatchedReferences[name].forEach(function (reference) {
  						updateNamedReference(reference, index);
  					});
  					delete groups.unmatchedReferences[name];
  				}
  			}
  			/* falls through */
  		case 'alternative':
  		case 'disjunction':
  		case 'quantifier':
  			item.body = item.body.map(function (term) {
  				return processTerm(term, regenerateOptions, groups);
  			});
  			break;
  		case 'value':
  			var codePoint = item.codePoint;
  			var set = regenerate(codePoint);
  			if (config.ignoreCase && config.unicode && !config.useUnicodeFlag) {
  				var folded = caseFold(codePoint);
  				if (folded) {
  					set.add(folded);
  				}
  			}
  			update(item, set.toString(regenerateOptions));
  			break;
  		case 'reference':
  			if (item.name) {
  				var name$1 = item.name.value;
  				var index$1 = groups.names[name$1];
  				if (index$1) {
  					updateNamedReference(item, index$1);
  					break;
  				}

  				if (!groups.unmatchedReferences[name$1]) {
  					groups.unmatchedReferences[name$1] = [];
  				}
  				// Keep track of references used before the corresponding group.
  				groups.unmatchedReferences[name$1].push(item);
  			}
  			break;
  		case 'anchor':
  		case 'empty':
  		case 'group':
  			// Nothing to do here.
  			break;
  		// The `default` clause is only here as a safeguard; it should never be
  		// reached. Code coverage tools should ignore it.
  		/* istanbul ignore next */
  		default:
  			throw new Error(("Unknown term type: " + (item.type)));
  	}
  	return item;
  };

  var config = {
  	'ignoreCase': false,
  	'unicode': false,
  	'dotAll': false,
  	'useUnicodeFlag': false
  };
  var rewritePattern = function (pattern, flags, options) {
  	var regjsparserFeatures = {
  		'unicodePropertyEscape': options && options.unicodePropertyEscape,
  		'namedGroups': options && options.namedGroup,
  		'lookbehind': options && options.lookbehind
  	};
  	config.ignoreCase = flags && flags.includes('i');
  	config.unicode = flags && flags.includes('u');
  	var supportDotAllFlag = options && options.dotAllFlag;
  	config.dotAll = supportDotAllFlag && flags && flags.includes('s');
  	config.useUnicodeFlag = options && options.useUnicodeFlag;
  	var regenerateOptions = {
  		'hasUnicodeFlag': config.useUnicodeFlag,
  		'bmpOnly': !config.unicode
  	};
  	var groups = {
  		'onNamedGroup': options && options.onNamedGroup,
  		'lastIndex': 0,
  		'names': Object.create(null), // { [name]: index }
  		'unmatchedReferences': Object.create(null) // { [name]: Array<reference> }
  	};
  	var tree = parse(pattern, flags, regjsparserFeatures);
  	// Note: `processTerm` mutates `tree` and `groups`.
  	processTerm(tree, regenerateOptions, groups);
  	assertNoUnmatchedReferences(groups);
  	return generate(tree);
  };

  var rewritePattern_1 = rewritePattern;

  var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/=';
  function encode(decoded) {
      var sourceFileIndex = 0; // second field
      var sourceCodeLine = 0; // third field
      var sourceCodeColumn = 0; // fourth field
      var nameIndex = 0; // fifth field
      var mappings = '';
      for (var i = 0; i < decoded.length; i++) {
          var line = decoded[i];
          if (i > 0)
              { mappings += ';'; }
          if (line.length === 0)
              { continue; }
          var generatedCodeColumn = 0; // first field
          var lineMappings = [];
          for (var _i = 0, line_1 = line; _i < line_1.length; _i++) {
              var segment = line_1[_i];
              var segmentMappings = encodeInteger(segment[0] - generatedCodeColumn);
              generatedCodeColumn = segment[0];
              if (segment.length > 1) {
                  segmentMappings +=
                      encodeInteger(segment[1] - sourceFileIndex) +
                          encodeInteger(segment[2] - sourceCodeLine) +
                          encodeInteger(segment[3] - sourceCodeColumn);
                  sourceFileIndex = segment[1];
                  sourceCodeLine = segment[2];
                  sourceCodeColumn = segment[3];
              }
              if (segment.length === 5) {
                  segmentMappings += encodeInteger(segment[4] - nameIndex);
                  nameIndex = segment[4];
              }
              lineMappings.push(segmentMappings);
          }
          mappings += lineMappings.join(',');
      }
      return mappings;
  }
  function encodeInteger(num) {
      var result = '';
      num = num < 0 ? (-num << 1) | 1 : num << 1;
      do {
          var clamped = num & 31;
          num >>>= 5;
          if (num > 0) {
              clamped |= 32;
          }
          result += chars[clamped];
      } while (num > 0);
      return result;
  }

  var BitSet = function BitSet(arg) {
  	this.bits = arg instanceof BitSet ? arg.bits.slice() : [];
  };

  BitSet.prototype.add = function add (n) {
  	this.bits[n >> 5] |= 1 << (n & 31);
  };

  BitSet.prototype.has = function has (n) {
  	return !!(this.bits[n >> 5] & (1 << (n & 31)));
  };

  var Chunk = function Chunk(start, end, content) {
  	this.start = start;
  	this.end = end;
  	this.original = content;

  	this.intro = '';
  	this.outro = '';

  	this.content = content;
  	this.storeName = false;
  	this.edited = false;

  	// we make these non-enumerable, for sanity while debugging
  	Object.defineProperties(this, {
  		previous: { writable: true, value: null },
  		next:     { writable: true, value: null }
  	});
  };

  Chunk.prototype.appendLeft = function appendLeft (content) {
  	this.outro += content;
  };

  Chunk.prototype.appendRight = function appendRight (content) {
  	this.intro = this.intro + content;
  };

  Chunk.prototype.clone = function clone () {
  	var chunk = new Chunk(this.start, this.end, this.original);

  	chunk.intro = this.intro;
  	chunk.outro = this.outro;
  	chunk.content = this.content;
  	chunk.storeName = this.storeName;
  	chunk.edited = this.edited;

  	return chunk;
  };

  Chunk.prototype.contains = function contains (index) {
  	return this.start < index && index < this.end;
  };

  Chunk.prototype.eachNext = function eachNext (fn) {
  	var chunk = this;
  	while (chunk) {
  		fn(chunk);
  		chunk = chunk.next;
  	}
  };

  Chunk.prototype.eachPrevious = function eachPrevious (fn) {
  	var chunk = this;
  	while (chunk) {
  		fn(chunk);
  		chunk = chunk.previous;
  	}
  };

  Chunk.prototype.edit = function edit (content, storeName, contentOnly) {
  	this.content = content;
  	if (!contentOnly) {
  		this.intro = '';
  		this.outro = '';
  	}
  	this.storeName = storeName;

  	this.edited = true;

  	return this;
  };

  Chunk.prototype.prependLeft = function prependLeft (content) {
  	this.outro = content + this.outro;
  };

  Chunk.prototype.prependRight = function prependRight (content) {
  	this.intro = content + this.intro;
  };

  Chunk.prototype.split = function split (index) {
  	var sliceIndex = index - this.start;

  	var originalBefore = this.original.slice(0, sliceIndex);
  	var originalAfter = this.original.slice(sliceIndex);

  	this.original = originalBefore;

  	var newChunk = new Chunk(index, this.end, originalAfter);
  	newChunk.outro = this.outro;
  	this.outro = '';

  	this.end = index;

  	if (this.edited) {
  		// TODO is this block necessary?...
  		newChunk.edit('', false);
  		this.content = '';
  	} else {
  		this.content = originalBefore;
  	}

  	newChunk.next = this.next;
  	if (newChunk.next) { newChunk.next.previous = newChunk; }
  	newChunk.previous = this;
  	this.next = newChunk;

  	return newChunk;
  };

  Chunk.prototype.toString = function toString () {
  	return this.intro + this.content + this.outro;
  };

  Chunk.prototype.trimEnd = function trimEnd (rx) {
  	this.outro = this.outro.replace(rx, '');
  	if (this.outro.length) { return true; }

  	var trimmed = this.content.replace(rx, '');

  	if (trimmed.length) {
  		if (trimmed !== this.content) {
  			this.split(this.start + trimmed.length).edit('', undefined, true);
  		}
  		return true;

  	} else {
  		this.edit('', undefined, true);

  		this.intro = this.intro.replace(rx, '');
  		if (this.intro.length) { return true; }
  	}
  };

  Chunk.prototype.trimStart = function trimStart (rx) {
  	this.intro = this.intro.replace(rx, '');
  	if (this.intro.length) { return true; }

  	var trimmed = this.content.replace(rx, '');

  	if (trimmed.length) {
  		if (trimmed !== this.content) {
  			this.split(this.end - trimmed.length);
  			this.edit('', undefined, true);
  		}
  		return true;

  	} else {
  		this.edit('', undefined, true);

  		this.outro = this.outro.replace(rx, '');
  		if (this.outro.length) { return true; }
  	}
  };

  var btoa = function () {
  	throw new Error('Unsupported environment: `window.btoa` or `Buffer` should be supported.');
  };
  if (typeof window !== 'undefined' && typeof window.btoa === 'function') {
  	btoa = function (str) { return window.btoa(unescape(encodeURIComponent(str))); };
  } else if (typeof Buffer === 'function') {
  	btoa = function (str) { return Buffer.from(str, 'utf-8').toString('base64'); };
  }

  var SourceMap = function SourceMap(properties) {
  	this.version = 3;
  	this.file = properties.file;
  	this.sources = properties.sources;
  	this.sourcesContent = properties.sourcesContent;
  	this.names = properties.names;
  	this.mappings = encode(properties.mappings);
  };

  SourceMap.prototype.toString = function toString () {
  	return JSON.stringify(this);
  };

  SourceMap.prototype.toUrl = function toUrl () {
  	return 'data:application/json;charset=utf-8;base64,' + btoa(this.toString());
  };

  function guessIndent(code) {
  	var lines = code.split('\n');

  	var tabbed = lines.filter(function (line) { return /^\t+/.test(line); });
  	var spaced = lines.filter(function (line) { return /^ {2,}/.test(line); });

  	if (tabbed.length === 0 && spaced.length === 0) {
  		return null;
  	}

  	// More lines tabbed than spaced? Assume tabs, and
  	// default to tabs in the case of a tie (or nothing
  	// to go on)
  	if (tabbed.length >= spaced.length) {
  		return '\t';
  	}

  	// Otherwise, we need to guess the multiple
  	var min = spaced.reduce(function (previous, current) {
  		var numSpaces = /^ +/.exec(current)[0].length;
  		return Math.min(numSpaces, previous);
  	}, Infinity);

  	return new Array(min + 1).join(' ');
  }

  function getRelativePath(from, to) {
  	var fromParts = from.split(/[/\\]/);
  	var toParts = to.split(/[/\\]/);

  	fromParts.pop(); // get dirname

  	while (fromParts[0] === toParts[0]) {
  		fromParts.shift();
  		toParts.shift();
  	}

  	if (fromParts.length) {
  		var i = fromParts.length;
  		while (i--) { fromParts[i] = '..'; }
  	}

  	return fromParts.concat(toParts).join('/');
  }

  var toString = Object.prototype.toString;

  function isObject(thing) {
  	return toString.call(thing) === '[object Object]';
  }

  function getLocator(source) {
  	var originalLines = source.split('\n');
  	var lineOffsets = [];

  	for (var i = 0, pos = 0; i < originalLines.length; i++) {
  		lineOffsets.push(pos);
  		pos += originalLines[i].length + 1;
  	}

  	return function locate(index) {
  		var i = 0;
  		var j = lineOffsets.length;
  		while (i < j) {
  			var m = (i + j) >> 1;
  			if (index < lineOffsets[m]) {
  				j = m;
  			} else {
  				i = m + 1;
  			}
  		}
  		var line = i - 1;
  		var column = index - lineOffsets[line];
  		return { line: line, column: column };
  	};
  }

  var Mappings = function Mappings(hires) {
  	this.hires = hires;
  	this.generatedCodeLine = 0;
  	this.generatedCodeColumn = 0;
  	this.raw = [];
  	this.rawSegments = this.raw[this.generatedCodeLine] = [];
  	this.pending = null;
  };

  Mappings.prototype.addEdit = function addEdit (sourceIndex, content, loc, nameIndex) {
  	if (content.length) {
  		var segment = [this.generatedCodeColumn, sourceIndex, loc.line, loc.column];
  		if (nameIndex >= 0) {
  			segment.push(nameIndex);
  		}
  		this.rawSegments.push(segment);
  	} else if (this.pending) {
  		this.rawSegments.push(this.pending);
  	}

  	this.advance(content);
  	this.pending = null;
  };

  Mappings.prototype.addUneditedChunk = function addUneditedChunk (sourceIndex, chunk, original, loc, sourcemapLocations) {
  	var originalCharIndex = chunk.start;
  	var first = true;

  	while (originalCharIndex < chunk.end) {
  		if (this.hires || first || sourcemapLocations.has(originalCharIndex)) {
  			this.rawSegments.push([this.generatedCodeColumn, sourceIndex, loc.line, loc.column]);
  		}

  		if (original[originalCharIndex] === '\n') {
  			loc.line += 1;
  			loc.column = 0;
  			this.generatedCodeLine += 1;
  			this.raw[this.generatedCodeLine] = this.rawSegments = [];
  			this.generatedCodeColumn = 0;
  			first = true;
  		} else {
  			loc.column += 1;
  			this.generatedCodeColumn += 1;
  			first = false;
  		}

  		originalCharIndex += 1;
  	}

  	this.pending = null;
  };

  Mappings.prototype.advance = function advance (str) {
  	if (!str) { return; }

  	var lines = str.split('\n');

  	if (lines.length > 1) {
  		for (var i = 0; i < lines.length - 1; i++) {
  			this.generatedCodeLine++;
  			this.raw[this.generatedCodeLine] = this.rawSegments = [];
  		}
  		this.generatedCodeColumn = 0;
  	}

  	this.generatedCodeColumn += lines[lines.length - 1].length;
  };

  var n = '\n';

  var warned = {
  	insertLeft: false,
  	insertRight: false,
  	storeName: false
  };

  var MagicString = function MagicString(string, options) {
  	if ( options === void 0 ) { options = {}; }

  	var chunk = new Chunk(0, string.length, string);

  	Object.defineProperties(this, {
  		original:              { writable: true, value: string },
  		outro:                 { writable: true, value: '' },
  		intro:                 { writable: true, value: '' },
  		firstChunk:            { writable: true, value: chunk },
  		lastChunk:             { writable: true, value: chunk },
  		lastSearchedChunk:     { writable: true, value: chunk },
  		byStart:               { writable: true, value: {} },
  		byEnd:                 { writable: true, value: {} },
  		filename:              { writable: true, value: options.filename },
  		indentExclusionRanges: { writable: true, value: options.indentExclusionRanges },
  		sourcemapLocations:    { writable: true, value: new BitSet() },
  		storedNames:           { writable: true, value: {} },
  		indentStr:             { writable: true, value: guessIndent(string) }
  	});

  	this.byStart[0] = chunk;
  	this.byEnd[string.length] = chunk;
  };

  MagicString.prototype.addSourcemapLocation = function addSourcemapLocation (char) {
  	this.sourcemapLocations.add(char);
  };

  MagicString.prototype.append = function append (content) {
  	if (typeof content !== 'string') { throw new TypeError('outro content must be a string'); }

  	this.outro += content;
  	return this;
  };

  MagicString.prototype.appendLeft = function appendLeft (index, content) {
  	if (typeof content !== 'string') { throw new TypeError('inserted content must be a string'); }

  	this._split(index);

  	var chunk = this.byEnd[index];

  	if (chunk) {
  		chunk.appendLeft(content);
  	} else {
  		this.intro += content;
  	}
  	return this;
  };

  MagicString.prototype.appendRight = function appendRight (index, content) {
  	if (typeof content !== 'string') { throw new TypeError('inserted content must be a string'); }

  	this._split(index);

  	var chunk = this.byStart[index];

  	if (chunk) {
  		chunk.appendRight(content);
  	} else {
  		this.outro += content;
  	}
  	return this;
  };

  MagicString.prototype.clone = function clone () {
  	var cloned = new MagicString(this.original, { filename: this.filename });

  	var originalChunk = this.firstChunk;
  	var clonedChunk = (cloned.firstChunk = cloned.lastSearchedChunk = originalChunk.clone());

  	while (originalChunk) {
  		cloned.byStart[clonedChunk.start] = clonedChunk;
  		cloned.byEnd[clonedChunk.end] = clonedChunk;

  		var nextOriginalChunk = originalChunk.next;
  		var nextClonedChunk = nextOriginalChunk && nextOriginalChunk.clone();

  		if (nextClonedChunk) {
  			clonedChunk.next = nextClonedChunk;
  			nextClonedChunk.previous = clonedChunk;

  			clonedChunk = nextClonedChunk;
  		}

  		originalChunk = nextOriginalChunk;
  	}

  	cloned.lastChunk = clonedChunk;

  	if (this.indentExclusionRanges) {
  		cloned.indentExclusionRanges = this.indentExclusionRanges.slice();
  	}

  	cloned.sourcemapLocations = new BitSet(this.sourcemapLocations);

  	cloned.intro = this.intro;
  	cloned.outro = this.outro;

  	return cloned;
  };

  MagicString.prototype.generateDecodedMap = function generateDecodedMap (options) {
  		var this$1 = this;

  	options = options || {};

  	var sourceIndex = 0;
  	var names = Object.keys(this.storedNames);
  	var mappings = new Mappings(options.hires);

  	var locate = getLocator(this.original);

  	if (this.intro) {
  		mappings.advance(this.intro);
  	}

  	this.firstChunk.eachNext(function (chunk) {
  		var loc = locate(chunk.start);

  		if (chunk.intro.length) { mappings.advance(chunk.intro); }

  		if (chunk.edited) {
  			mappings.addEdit(
  				sourceIndex,
  				chunk.content,
  				loc,
  				chunk.storeName ? names.indexOf(chunk.original) : -1
  			);
  		} else {
  			mappings.addUneditedChunk(sourceIndex, chunk, this$1.original, loc, this$1.sourcemapLocations);
  		}

  		if (chunk.outro.length) { mappings.advance(chunk.outro); }
  	});

  	return {
  		file: options.file ? options.file.split(/[/\\]/).pop() : null,
  		sources: [options.source ? getRelativePath(options.file || '', options.source) : null],
  		sourcesContent: options.includeContent ? [this.original] : [null],
  		names: names,
  		mappings: mappings.raw
  	};
  };

  MagicString.prototype.generateMap = function generateMap (options) {
  	return new SourceMap(this.generateDecodedMap(options));
  };

  MagicString.prototype.getIndentString = function getIndentString () {
  	return this.indentStr === null ? '\t' : this.indentStr;
  };

  MagicString.prototype.indent = function indent (indentStr, options) {
  	var pattern = /^[^\r\n]/gm;

  	if (isObject(indentStr)) {
  		options = indentStr;
  		indentStr = undefined;
  	}

  	indentStr = indentStr !== undefined ? indentStr : this.indentStr || '\t';

  	if (indentStr === '') { return this; } // noop

  	options = options || {};

  	// Process exclusion ranges
  	var isExcluded = {};

  	if (options.exclude) {
  		var exclusions =
  			typeof options.exclude[0] === 'number' ? [options.exclude] : options.exclude;
  		exclusions.forEach(function (exclusion) {
  			for (var i = exclusion[0]; i < exclusion[1]; i += 1) {
  				isExcluded[i] = true;
  			}
  		});
  	}

  	var shouldIndentNextCharacter = options.indentStart !== false;
  	var replacer = function (match) {
  		if (shouldIndentNextCharacter) { return ("" + indentStr + match); }
  		shouldIndentNextCharacter = true;
  		return match;
  	};

  	this.intro = this.intro.replace(pattern, replacer);

  	var charIndex = 0;
  	var chunk = this.firstChunk;

  	while (chunk) {
  		var end = chunk.end;

  		if (chunk.edited) {
  			if (!isExcluded[charIndex]) {
  				chunk.content = chunk.content.replace(pattern, replacer);

  				if (chunk.content.length) {
  					shouldIndentNextCharacter = chunk.content[chunk.content.length - 1] === '\n';
  				}
  			}
  		} else {
  			charIndex = chunk.start;

  			while (charIndex < end) {
  				if (!isExcluded[charIndex]) {
  					var char = this.original[charIndex];

  					if (char === '\n') {
  						shouldIndentNextCharacter = true;
  					} else if (char !== '\r' && shouldIndentNextCharacter) {
  						shouldIndentNextCharacter = false;

  						if (charIndex === chunk.start) {
  							chunk.prependRight(indentStr);
  						} else {
  							this._splitChunk(chunk, charIndex);
  							chunk = chunk.next;
  							chunk.prependRight(indentStr);
  						}
  					}
  				}

  				charIndex += 1;
  			}
  		}

  		charIndex = chunk.end;
  		chunk = chunk.next;
  	}

  	this.outro = this.outro.replace(pattern, replacer);

  	return this;
  };

  MagicString.prototype.insert = function insert () {
  	throw new Error('magicString.insert(...) is deprecated. Use prependRight(...) or appendLeft(...)');
  };

  MagicString.prototype.insertLeft = function insertLeft (index, content) {
  	if (!warned.insertLeft) {
  		console.warn('magicString.insertLeft(...) is deprecated. Use magicString.appendLeft(...) instead'); // eslint-disable-line no-console
  		warned.insertLeft = true;
  	}

  	return this.appendLeft(index, content);
  };

  MagicString.prototype.insertRight = function insertRight (index, content) {
  	if (!warned.insertRight) {
  		console.warn('magicString.insertRight(...) is deprecated. Use magicString.prependRight(...) instead'); // eslint-disable-line no-console
  		warned.insertRight = true;
  	}

  	return this.prependRight(index, content);
  };

  MagicString.prototype.move = function move (start, end, index) {
  	if (index >= start && index <= end) { throw new Error('Cannot move a selection inside itself'); }

  	this._split(start);
  	this._split(end);
  	this._split(index);

  	var first = this.byStart[start];
  	var last = this.byEnd[end];

  	var oldLeft = first.previous;
  	var oldRight = last.next;

  	var newRight = this.byStart[index];
  	if (!newRight && last === this.lastChunk) { return this; }
  	var newLeft = newRight ? newRight.previous : this.lastChunk;

  	if (oldLeft) { oldLeft.next = oldRight; }
  	if (oldRight) { oldRight.previous = oldLeft; }

  	if (newLeft) { newLeft.next = first; }
  	if (newRight) { newRight.previous = last; }

  	if (!first.previous) { this.firstChunk = last.next; }
  	if (!last.next) {
  		this.lastChunk = first.previous;
  		this.lastChunk.next = null;
  	}

  	first.previous = newLeft;
  	last.next = newRight || null;

  	if (!newLeft) { this.firstChunk = first; }
  	if (!newRight) { this.lastChunk = last; }
  	return this;
  };

  MagicString.prototype.overwrite = function overwrite (start, end, content, options) {
  	if (typeof content !== 'string') { throw new TypeError('replacement content must be a string'); }

  	while (start < 0) { start += this.original.length; }
  	while (end < 0) { end += this.original.length; }

  	if (end > this.original.length) { throw new Error('end is out of bounds'); }
  	if (start === end)
  		{ throw new Error('Cannot overwrite a zero-length range – use appendLeft or prependRight instead'); }

  	this._split(start);
  	this._split(end);

  	if (options === true) {
  		if (!warned.storeName) {
  			console.warn('The final argument to magicString.overwrite(...) should be an options object. See https://github.com/rich-harris/magic-string'); // eslint-disable-line no-console
  			warned.storeName = true;
  		}

  		options = { storeName: true };
  	}
  	var storeName = options !== undefined ? options.storeName : false;
  	var contentOnly = options !== undefined ? options.contentOnly : false;

  	if (storeName) {
  		var original = this.original.slice(start, end);
  		this.storedNames[original] = true;
  	}

  	var first = this.byStart[start];
  	var last = this.byEnd[end];

  	if (first) {
  		if (end > first.end && first.next !== this.byStart[first.end]) {
  			throw new Error('Cannot overwrite across a split point');
  		}

  		first.edit(content, storeName, contentOnly);

  		if (first !== last) {
  			var chunk = first.next;
  			while (chunk !== last) {
  				chunk.edit('', false);
  				chunk = chunk.next;
  			}

  			chunk.edit('', false);
  		}
  	} else {
  		// must be inserting at the end
  		var newChunk = new Chunk(start, end, '').edit(content, storeName);

  		// TODO last chunk in the array may not be the last chunk, if it's moved...
  		last.next = newChunk;
  		newChunk.previous = last;
  	}
  	return this;
  };

  MagicString.prototype.prepend = function prepend (content) {
  	if (typeof content !== 'string') { throw new TypeError('outro content must be a string'); }

  	this.intro = content + this.intro;
  	return this;
  };

  MagicString.prototype.prependLeft = function prependLeft (index, content) {
  	if (typeof content !== 'string') { throw new TypeError('inserted content must be a string'); }

  	this._split(index);

  	var chunk = this.byEnd[index];

  	if (chunk) {
  		chunk.prependLeft(content);
  	} else {
  		this.intro = content + this.intro;
  	}
  	return this;
  };

  MagicString.prototype.prependRight = function prependRight (index, content) {
  	if (typeof content !== 'string') { throw new TypeError('inserted content must be a string'); }

  	this._split(index);

  	var chunk = this.byStart[index];

  	if (chunk) {
  		chunk.prependRight(content);
  	} else {
  		this.outro = content + this.outro;
  	}
  	return this;
  };

  MagicString.prototype.remove = function remove (start, end) {
  	while (start < 0) { start += this.original.length; }
  	while (end < 0) { end += this.original.length; }

  	if (start === end) { return this; }

  	if (start < 0 || end > this.original.length) { throw new Error('Character is out of bounds'); }
  	if (start > end) { throw new Error('end must be greater than start'); }

  	this._split(start);
  	this._split(end);

  	var chunk = this.byStart[start];

  	while (chunk) {
  		chunk.intro = '';
  		chunk.outro = '';
  		chunk.edit('');

  		chunk = end > chunk.end ? this.byStart[chunk.end] : null;
  	}
  	return this;
  };

  MagicString.prototype.lastChar = function lastChar () {
  	if (this.outro.length)
  		{ return this.outro[this.outro.length - 1]; }
  	var chunk = this.lastChunk;
  	do {
  		if (chunk.outro.length)
  			{ return chunk.outro[chunk.outro.length - 1]; }
  		if (chunk.content.length)
  			{ return chunk.content[chunk.content.length - 1]; }
  		if (chunk.intro.length)
  			{ return chunk.intro[chunk.intro.length - 1]; }
  	} while (chunk = chunk.previous);
  	if (this.intro.length)
  		{ return this.intro[this.intro.length - 1]; }
  	return '';
  };

  MagicString.prototype.lastLine = function lastLine () {
  	var lineIndex = this.outro.lastIndexOf(n);
  	if (lineIndex !== -1)
  		{ return this.outro.substr(lineIndex + 1); }
  	var lineStr = this.outro;
  	var chunk = this.lastChunk;
  	do {
  		if (chunk.outro.length > 0) {
  			lineIndex = chunk.outro.lastIndexOf(n);
  			if (lineIndex !== -1)
  				{ return chunk.outro.substr(lineIndex + 1) + lineStr; }
  			lineStr = chunk.outro + lineStr;
  		}

  		if (chunk.content.length > 0) {
  			lineIndex = chunk.content.lastIndexOf(n);
  			if (lineIndex !== -1)
  				{ return chunk.content.substr(lineIndex + 1) + lineStr; }
  			lineStr = chunk.content + lineStr;
  		}

  		if (chunk.intro.length > 0) {
  			lineIndex = chunk.intro.lastIndexOf(n);
  			if (lineIndex !== -1)
  				{ return chunk.intro.substr(lineIndex + 1) + lineStr; }
  			lineStr = chunk.intro + lineStr;
  		}
  	} while (chunk = chunk.previous);
  	lineIndex = this.intro.lastIndexOf(n);
  	if (lineIndex !== -1)
  		{ return this.intro.substr(lineIndex + 1) + lineStr; }
  	return this.intro + lineStr;
  };

  MagicString.prototype.slice = function slice (start, end) {
  		if ( start === void 0 ) { start = 0; }
  		if ( end === void 0 ) { end = this.original.length; }

  	while (start < 0) { start += this.original.length; }
  	while (end < 0) { end += this.original.length; }

  	var result = '';

  	// find start chunk
  	var chunk = this.firstChunk;
  	while (chunk && (chunk.start > start || chunk.end <= start)) {
  		// found end chunk before start
  		if (chunk.start < end && chunk.end >= end) {
  			return result;
  		}

  		chunk = chunk.next;
  	}

  	if (chunk && chunk.edited && chunk.start !== start)
  		{ throw new Error(("Cannot use replaced character " + start + " as slice start anchor.")); }

  	var startChunk = chunk;
  	while (chunk) {
  		if (chunk.intro && (startChunk !== chunk || chunk.start === start)) {
  			result += chunk.intro;
  		}

  		var containsEnd = chunk.start < end && chunk.end >= end;
  		if (containsEnd && chunk.edited && chunk.end !== end)
  			{ throw new Error(("Cannot use replaced character " + end + " as slice end anchor.")); }

  		var sliceStart = startChunk === chunk ? start - chunk.start : 0;
  		var sliceEnd = containsEnd ? chunk.content.length + end - chunk.end : chunk.content.length;

  		result += chunk.content.slice(sliceStart, sliceEnd);

  		if (chunk.outro && (!containsEnd || chunk.end === end)) {
  			result += chunk.outro;
  		}

  		if (containsEnd) {
  			break;
  		}

  		chunk = chunk.next;
  	}

  	return result;
  };

  // TODO deprecate this? not really very useful
  MagicString.prototype.snip = function snip (start, end) {
  	var clone = this.clone();
  	clone.remove(0, start);
  	clone.remove(end, clone.original.length);

  	return clone;
  };

  MagicString.prototype._split = function _split (index) {
  	if (this.byStart[index] || this.byEnd[index]) { return; }

  	var chunk = this.lastSearchedChunk;
  	var searchForward = index > chunk.end;

  	while (chunk) {
  		if (chunk.contains(index)) { return this._splitChunk(chunk, index); }

  		chunk = searchForward ? this.byStart[chunk.end] : this.byEnd[chunk.start];
  	}
  };

  MagicString.prototype._splitChunk = function _splitChunk (chunk, index) {
  	if (chunk.edited && chunk.content.length) {
  		// zero-length edited chunks are a special case (overlapping replacements)
  		var loc = getLocator(this.original)(index);
  		throw new Error(
  			("Cannot split a chunk that has already been edited (" + (loc.line) + ":" + (loc.column) + " – \"" + (chunk.original) + "\")")
  		);
  	}

  	var newChunk = chunk.split(index);

  	this.byEnd[index] = chunk;
  	this.byStart[index] = newChunk;
  	this.byEnd[newChunk.end] = newChunk;

  	if (chunk === this.lastChunk) { this.lastChunk = newChunk; }

  	this.lastSearchedChunk = chunk;
  	return true;
  };

  MagicString.prototype.toString = function toString () {
  	var str = this.intro;

  	var chunk = this.firstChunk;
  	while (chunk) {
  		str += chunk.toString();
  		chunk = chunk.next;
  	}

  	return str + this.outro;
  };

  MagicString.prototype.isEmpty = function isEmpty () {
  	var chunk = this.firstChunk;
  	do {
  		if (chunk.intro.length && chunk.intro.trim() ||
  				chunk.content.length && chunk.content.trim() ||
  				chunk.outro.length && chunk.outro.trim())
  			{ return false; }
  	} while (chunk = chunk.next);
  	return true;
  };

  MagicString.prototype.length = function length () {
  	var chunk = this.firstChunk;
  	var length = 0;
  	do {
  		length += chunk.intro.length + chunk.content.length + chunk.outro.length;
  	} while (chunk = chunk.next);
  	return length;
  };

  MagicString.prototype.trimLines = function trimLines () {
  	return this.trim('[\\r\\n]');
  };

  MagicString.prototype.trim = function trim (charType) {
  	return this.trimStart(charType).trimEnd(charType);
  };

  MagicString.prototype.trimEndAborted = function trimEndAborted (charType) {
  	var rx = new RegExp((charType || '\\s') + '+$');

  	this.outro = this.outro.replace(rx, '');
  	if (this.outro.length) { return true; }

  	var chunk = this.lastChunk;

  	do {
  		var end = chunk.end;
  		var aborted = chunk.trimEnd(rx);

  		// if chunk was trimmed, we have a new lastChunk
  		if (chunk.end !== end) {
  			if (this.lastChunk === chunk) {
  				this.lastChunk = chunk.next;
  			}

  			this.byEnd[chunk.end] = chunk;
  			this.byStart[chunk.next.start] = chunk.next;
  			this.byEnd[chunk.next.end] = chunk.next;
  		}

  		if (aborted) { return true; }
  		chunk = chunk.previous;
  	} while (chunk);

  	return false;
  };

  MagicString.prototype.trimEnd = function trimEnd (charType) {
  	this.trimEndAborted(charType);
  	return this;
  };
  MagicString.prototype.trimStartAborted = function trimStartAborted (charType) {
  	var rx = new RegExp('^' + (charType || '\\s') + '+');

  	this.intro = this.intro.replace(rx, '');
  	if (this.intro.length) { return true; }

  	var chunk = this.firstChunk;

  	do {
  		var end = chunk.end;
  		var aborted = chunk.trimStart(rx);

  		if (chunk.end !== end) {
  			// special case...
  			if (chunk === this.lastChunk) { this.lastChunk = chunk.next; }

  			this.byEnd[chunk.end] = chunk;
  			this.byStart[chunk.next.start] = chunk.next;
  			this.byEnd[chunk.next.end] = chunk.next;
  		}

  		if (aborted) { return true; }
  		chunk = chunk.next;
  	} while (chunk);

  	return false;
  };

  MagicString.prototype.trimStart = function trimStart (charType) {
  	this.trimStartAborted(charType);
  	return this;
  };

  // Reserved word lists for various dialects of the language

  var reservedWords = {
    3: "abstract boolean byte char class double enum export extends final float goto implements import int interface long native package private protected public short static super synchronized throws transient volatile",
    5: "class enum extends super const export import",
    6: "enum",
    strict: "implements interface let package private protected public static yield",
    strictBind: "eval arguments"
  };

  // And the keywords

  var ecma5AndLessKeywords = "break case catch continue debugger default do else finally for function if return switch throw try var while with null true false instanceof typeof void delete new in this";

  var keywords = {
    5: ecma5AndLessKeywords,
    "5module": ecma5AndLessKeywords + " export import",
    6: ecma5AndLessKeywords + " const class extends export import super"
  };

  var keywordRelationalOperator = /^in(stanceof)?$/;

  // ## Character categories

  // Big ugly regular expressions that match characters in the
  // whitespace, identifier, and identifier-start categories. These
  // are only applied when a character is found to actually have a
  // code point above 128.
  // Generated by `bin/generate-identifier-regex.js`.
  var nonASCIIidentifierStartChars = "\xaa\xb5\xba\xc0-\xd6\xd8-\xf6\xf8-\u02c1\u02c6-\u02d1\u02e0-\u02e4\u02ec\u02ee\u0370-\u0374\u0376\u0377\u037a-\u037d\u037f\u0386\u0388-\u038a\u038c\u038e-\u03a1\u03a3-\u03f5\u03f7-\u0481\u048a-\u052f\u0531-\u0556\u0559\u0560-\u0588\u05d0-\u05ea\u05ef-\u05f2\u0620-\u064a\u066e\u066f\u0671-\u06d3\u06d5\u06e5\u06e6\u06ee\u06ef\u06fa-\u06fc\u06ff\u0710\u0712-\u072f\u074d-\u07a5\u07b1\u07ca-\u07ea\u07f4\u07f5\u07fa\u0800-\u0815\u081a\u0824\u0828\u0840-\u0858\u0860-\u086a\u08a0-\u08b4\u08b6-\u08bd\u0904-\u0939\u093d\u0950\u0958-\u0961\u0971-\u0980\u0985-\u098c\u098f\u0990\u0993-\u09a8\u09aa-\u09b0\u09b2\u09b6-\u09b9\u09bd\u09ce\u09dc\u09dd\u09df-\u09e1\u09f0\u09f1\u09fc\u0a05-\u0a0a\u0a0f\u0a10\u0a13-\u0a28\u0a2a-\u0a30\u0a32\u0a33\u0a35\u0a36\u0a38\u0a39\u0a59-\u0a5c\u0a5e\u0a72-\u0a74\u0a85-\u0a8d\u0a8f-\u0a91\u0a93-\u0aa8\u0aaa-\u0ab0\u0ab2\u0ab3\u0ab5-\u0ab9\u0abd\u0ad0\u0ae0\u0ae1\u0af9\u0b05-\u0b0c\u0b0f\u0b10\u0b13-\u0b28\u0b2a-\u0b30\u0b32\u0b33\u0b35-\u0b39\u0b3d\u0b5c\u0b5d\u0b5f-\u0b61\u0b71\u0b83\u0b85-\u0b8a\u0b8e-\u0b90\u0b92-\u0b95\u0b99\u0b9a\u0b9c\u0b9e\u0b9f\u0ba3\u0ba4\u0ba8-\u0baa\u0bae-\u0bb9\u0bd0\u0c05-\u0c0c\u0c0e-\u0c10\u0c12-\u0c28\u0c2a-\u0c39\u0c3d\u0c58-\u0c5a\u0c60\u0c61\u0c80\u0c85-\u0c8c\u0c8e-\u0c90\u0c92-\u0ca8\u0caa-\u0cb3\u0cb5-\u0cb9\u0cbd\u0cde\u0ce0\u0ce1\u0cf1\u0cf2\u0d05-\u0d0c\u0d0e-\u0d10\u0d12-\u0d3a\u0d3d\u0d4e\u0d54-\u0d56\u0d5f-\u0d61\u0d7a-\u0d7f\u0d85-\u0d96\u0d9a-\u0db1\u0db3-\u0dbb\u0dbd\u0dc0-\u0dc6\u0e01-\u0e30\u0e32\u0e33\u0e40-\u0e46\u0e81\u0e82\u0e84\u0e86-\u0e8a\u0e8c-\u0ea3\u0ea5\u0ea7-\u0eb0\u0eb2\u0eb3\u0ebd\u0ec0-\u0ec4\u0ec6\u0edc-\u0edf\u0f00\u0f40-\u0f47\u0f49-\u0f6c\u0f88-\u0f8c\u1000-\u102a\u103f\u1050-\u1055\u105a-\u105d\u1061\u1065\u1066\u106e-\u1070\u1075-\u1081\u108e\u10a0-\u10c5\u10c7\u10cd\u10d0-\u10fa\u10fc-\u1248\u124a-\u124d\u1250-\u1256\u1258\u125a-\u125d\u1260-\u1288\u128a-\u128d\u1290-\u12b0\u12b2-\u12b5\u12b8-\u12be\u12c0\u12c2-\u12c5\u12c8-\u12d6\u12d8-\u1310\u1312-\u1315\u1318-\u135a\u1380-\u138f\u13a0-\u13f5\u13f8-\u13fd\u1401-\u166c\u166f-\u167f\u1681-\u169a\u16a0-\u16ea\u16ee-\u16f8\u1700-\u170c\u170e-\u1711\u1720-\u1731\u1740-\u1751\u1760-\u176c\u176e-\u1770\u1780-\u17b3\u17d7\u17dc\u1820-\u1878\u1880-\u18a8\u18aa\u18b0-\u18f5\u1900-\u191e\u1950-\u196d\u1970-\u1974\u1980-\u19ab\u19b0-\u19c9\u1a00-\u1a16\u1a20-\u1a54\u1aa7\u1b05-\u1b33\u1b45-\u1b4b\u1b83-\u1ba0\u1bae\u1baf\u1bba-\u1be5\u1c00-\u1c23\u1c4d-\u1c4f\u1c5a-\u1c7d\u1c80-\u1c88\u1c90-\u1cba\u1cbd-\u1cbf\u1ce9-\u1cec\u1cee-\u1cf3\u1cf5\u1cf6\u1cfa\u1d00-\u1dbf\u1e00-\u1f15\u1f18-\u1f1d\u1f20-\u1f45\u1f48-\u1f4d\u1f50-\u1f57\u1f59\u1f5b\u1f5d\u1f5f-\u1f7d\u1f80-\u1fb4\u1fb6-\u1fbc\u1fbe\u1fc2-\u1fc4\u1fc6-\u1fcc\u1fd0-\u1fd3\u1fd6-\u1fdb\u1fe0-\u1fec\u1ff2-\u1ff4\u1ff6-\u1ffc\u2071\u207f\u2090-\u209c\u2102\u2107\u210a-\u2113\u2115\u2118-\u211d\u2124\u2126\u2128\u212a-\u2139\u213c-\u213f\u2145-\u2149\u214e\u2160-\u2188\u2c00-\u2c2e\u2c30-\u2c5e\u2c60-\u2ce4\u2ceb-\u2cee\u2cf2\u2cf3\u2d00-\u2d25\u2d27\u2d2d\u2d30-\u2d67\u2d6f\u2d80-\u2d96\u2da0-\u2da6\u2da8-\u2dae\u2db0-\u2db6\u2db8-\u2dbe\u2dc0-\u2dc6\u2dc8-\u2dce\u2dd0-\u2dd6\u2dd8-\u2dde\u3005-\u3007\u3021-\u3029\u3031-\u3035\u3038-\u303c\u3041-\u3096\u309b-\u309f\u30a1-\u30fa\u30fc-\u30ff\u3105-\u312f\u3131-\u318e\u31a0-\u31ba\u31f0-\u31ff\u3400-\u4db5\u4e00-\u9fef\ua000-\ua48c\ua4d0-\ua4fd\ua500-\ua60c\ua610-\ua61f\ua62a\ua62b\ua640-\ua66e\ua67f-\ua69d\ua6a0-\ua6ef\ua717-\ua71f\ua722-\ua788\ua78b-\ua7bf\ua7c2-\ua7c6\ua7f7-\ua801\ua803-\ua805\ua807-\ua80a\ua80c-\ua822\ua840-\ua873\ua882-\ua8b3\ua8f2-\ua8f7\ua8fb\ua8fd\ua8fe\ua90a-\ua925\ua930-\ua946\ua960-\ua97c\ua984-\ua9b2\ua9cf\ua9e0-\ua9e4\ua9e6-\ua9ef\ua9fa-\ua9fe\uaa00-\uaa28\uaa40-\uaa42\uaa44-\uaa4b\uaa60-\uaa76\uaa7a\uaa7e-\uaaaf\uaab1\uaab5\uaab6\uaab9-\uaabd\uaac0\uaac2\uaadb-\uaadd\uaae0-\uaaea\uaaf2-\uaaf4\uab01-\uab06\uab09-\uab0e\uab11-\uab16\uab20-\uab26\uab28-\uab2e\uab30-\uab5a\uab5c-\uab67\uab70-\uabe2\uac00-\ud7a3\ud7b0-\ud7c6\ud7cb-\ud7fb\uf900-\ufa6d\ufa70-\ufad9\ufb00-\ufb06\ufb13-\ufb17\ufb1d\ufb1f-\ufb28\ufb2a-\ufb36\ufb38-\ufb3c\ufb3e\ufb40\ufb41\ufb43\ufb44\ufb46-\ufbb1\ufbd3-\ufd3d\ufd50-\ufd8f\ufd92-\ufdc7\ufdf0-\ufdfb\ufe70-\ufe74\ufe76-\ufefc\uff21-\uff3a\uff41-\uff5a\uff66-\uffbe\uffc2-\uffc7\uffca-\uffcf\uffd2-\uffd7\uffda-\uffdc";
  var nonASCIIidentifierChars = "\u200c\u200d\xb7\u0300-\u036f\u0387\u0483-\u0487\u0591-\u05bd\u05bf\u05c1\u05c2\u05c4\u05c5\u05c7\u0610-\u061a\u064b-\u0669\u0670\u06d6-\u06dc\u06df-\u06e4\u06e7\u06e8\u06ea-\u06ed\u06f0-\u06f9\u0711\u0730-\u074a\u07a6-\u07b0\u07c0-\u07c9\u07eb-\u07f3\u07fd\u0816-\u0819\u081b-\u0823\u0825-\u0827\u0829-\u082d\u0859-\u085b\u08d3-\u08e1\u08e3-\u0903\u093a-\u093c\u093e-\u094f\u0951-\u0957\u0962\u0963\u0966-\u096f\u0981-\u0983\u09bc\u09be-\u09c4\u09c7\u09c8\u09cb-\u09cd\u09d7\u09e2\u09e3\u09e6-\u09ef\u09fe\u0a01-\u0a03\u0a3c\u0a3e-\u0a42\u0a47\u0a48\u0a4b-\u0a4d\u0a51\u0a66-\u0a71\u0a75\u0a81-\u0a83\u0abc\u0abe-\u0ac5\u0ac7-\u0ac9\u0acb-\u0acd\u0ae2\u0ae3\u0ae6-\u0aef\u0afa-\u0aff\u0b01-\u0b03\u0b3c\u0b3e-\u0b44\u0b47\u0b48\u0b4b-\u0b4d\u0b56\u0b57\u0b62\u0b63\u0b66-\u0b6f\u0b82\u0bbe-\u0bc2\u0bc6-\u0bc8\u0bca-\u0bcd\u0bd7\u0be6-\u0bef\u0c00-\u0c04\u0c3e-\u0c44\u0c46-\u0c48\u0c4a-\u0c4d\u0c55\u0c56\u0c62\u0c63\u0c66-\u0c6f\u0c81-\u0c83\u0cbc\u0cbe-\u0cc4\u0cc6-\u0cc8\u0cca-\u0ccd\u0cd5\u0cd6\u0ce2\u0ce3\u0ce6-\u0cef\u0d00-\u0d03\u0d3b\u0d3c\u0d3e-\u0d44\u0d46-\u0d48\u0d4a-\u0d4d\u0d57\u0d62\u0d63\u0d66-\u0d6f\u0d82\u0d83\u0dca\u0dcf-\u0dd4\u0dd6\u0dd8-\u0ddf\u0de6-\u0def\u0df2\u0df3\u0e31\u0e34-\u0e3a\u0e47-\u0e4e\u0e50-\u0e59\u0eb1\u0eb4-\u0ebc\u0ec8-\u0ecd\u0ed0-\u0ed9\u0f18\u0f19\u0f20-\u0f29\u0f35\u0f37\u0f39\u0f3e\u0f3f\u0f71-\u0f84\u0f86\u0f87\u0f8d-\u0f97\u0f99-\u0fbc\u0fc6\u102b-\u103e\u1040-\u1049\u1056-\u1059\u105e-\u1060\u1062-\u1064\u1067-\u106d\u1071-\u1074\u1082-\u108d\u108f-\u109d\u135d-\u135f\u1369-\u1371\u1712-\u1714\u1732-\u1734\u1752\u1753\u1772\u1773\u17b4-\u17d3\u17dd\u17e0-\u17e9\u180b-\u180d\u1810-\u1819\u18a9\u1920-\u192b\u1930-\u193b\u1946-\u194f\u19d0-\u19da\u1a17-\u1a1b\u1a55-\u1a5e\u1a60-\u1a7c\u1a7f-\u1a89\u1a90-\u1a99\u1ab0-\u1abd\u1b00-\u1b04\u1b34-\u1b44\u1b50-\u1b59\u1b6b-\u1b73\u1b80-\u1b82\u1ba1-\u1bad\u1bb0-\u1bb9\u1be6-\u1bf3\u1c24-\u1c37\u1c40-\u1c49\u1c50-\u1c59\u1cd0-\u1cd2\u1cd4-\u1ce8\u1ced\u1cf4\u1cf7-\u1cf9\u1dc0-\u1df9\u1dfb-\u1dff\u203f\u2040\u2054\u20d0-\u20dc\u20e1\u20e5-\u20f0\u2cef-\u2cf1\u2d7f\u2de0-\u2dff\u302a-\u302f\u3099\u309a\ua620-\ua629\ua66f\ua674-\ua67d\ua69e\ua69f\ua6f0\ua6f1\ua802\ua806\ua80b\ua823-\ua827\ua880\ua881\ua8b4-\ua8c5\ua8d0-\ua8d9\ua8e0-\ua8f1\ua8ff-\ua909\ua926-\ua92d\ua947-\ua953\ua980-\ua983\ua9b3-\ua9c0\ua9d0-\ua9d9\ua9e5\ua9f0-\ua9f9\uaa29-\uaa36\uaa43\uaa4c\uaa4d\uaa50-\uaa59\uaa7b-\uaa7d\uaab0\uaab2-\uaab4\uaab7\uaab8\uaabe\uaabf\uaac1\uaaeb-\uaaef\uaaf5\uaaf6\uabe3-\uabea\uabec\uabed\uabf0-\uabf9\ufb1e\ufe00-\ufe0f\ufe20-\ufe2f\ufe33\ufe34\ufe4d-\ufe4f\uff10-\uff19\uff3f";

  var nonASCIIidentifierStart = new RegExp("[" + nonASCIIidentifierStartChars + "]");
  var nonASCIIidentifier = new RegExp("[" + nonASCIIidentifierStartChars + nonASCIIidentifierChars + "]");

  nonASCIIidentifierStartChars = nonASCIIidentifierChars = null;

  // These are a run-length and offset encoded representation of the
  // >0xffff code points that are a valid part of identifiers. The
  // offset starts at 0x10000, and each pair of numbers represents an
  // offset to the next range, and then a size of the range. They were
  // generated by bin/generate-identifier-regex.js

  // eslint-disable-next-line comma-spacing
  var astralIdentifierStartCodes = [0,11,2,25,2,18,2,1,2,14,3,13,35,122,70,52,268,28,4,48,48,31,14,29,6,37,11,29,3,35,5,7,2,4,43,157,19,35,5,35,5,39,9,51,157,310,10,21,11,7,153,5,3,0,2,43,2,1,4,0,3,22,11,22,10,30,66,18,2,1,11,21,11,25,71,55,7,1,65,0,16,3,2,2,2,28,43,28,4,28,36,7,2,27,28,53,11,21,11,18,14,17,111,72,56,50,14,50,14,35,477,28,11,0,9,21,155,22,13,52,76,44,33,24,27,35,30,0,12,34,4,0,13,47,15,3,22,0,2,0,36,17,2,24,85,6,2,0,2,3,2,14,2,9,8,46,39,7,3,1,3,21,2,6,2,1,2,4,4,0,19,0,13,4,159,52,19,3,21,0,33,47,21,1,2,0,185,46,42,3,37,47,21,0,60,42,14,0,72,26,230,43,117,63,32,0,161,7,3,38,17,0,2,0,29,0,11,39,8,0,22,0,12,45,20,0,35,56,264,8,2,36,18,0,50,29,113,6,2,1,2,37,22,0,26,5,2,1,2,31,15,0,328,18,270,921,103,110,18,195,2749,1070,4050,582,8634,568,8,30,114,29,19,47,17,3,32,20,6,18,689,63,129,74,6,0,67,12,65,1,2,0,29,6135,9,754,9486,286,50,2,18,3,9,395,2309,106,6,12,4,8,8,9,5991,84,2,70,2,1,3,0,3,1,3,3,2,11,2,0,2,6,2,64,2,3,3,7,2,6,2,27,2,3,2,4,2,0,4,6,2,339,3,24,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,30,2,24,2,7,2357,44,11,6,17,0,370,43,1301,196,60,67,8,0,1205,3,2,26,2,1,2,0,3,0,2,9,2,3,2,0,2,0,7,0,5,0,2,0,2,0,2,2,2,1,2,0,3,0,2,0,2,0,2,0,2,0,2,1,2,0,3,3,2,6,2,3,2,3,2,0,2,9,2,16,6,2,2,4,2,16,4421,42710,42,4148,12,221,3,5761,15,7472,3104,541];

  // eslint-disable-next-line comma-spacing
  var astralIdentifierCodes = [509,0,227,0,150,4,294,9,1368,2,2,1,6,3,41,2,5,0,166,1,574,3,9,9,525,10,176,2,54,14,32,9,16,3,46,10,54,9,7,2,37,13,2,9,6,1,45,0,13,2,49,13,9,3,4,9,83,11,7,0,161,11,6,9,7,3,56,1,2,6,3,1,3,2,10,0,11,1,3,6,4,4,193,17,10,9,5,0,82,19,13,9,214,6,3,8,28,1,83,16,16,9,82,12,9,9,84,14,5,9,243,14,166,9,232,6,3,6,4,0,29,9,41,6,2,3,9,0,10,10,47,15,406,7,2,7,17,9,57,21,2,13,123,5,4,0,2,1,2,6,2,0,9,9,49,4,2,1,2,4,9,9,330,3,19306,9,135,4,60,6,26,9,1014,0,2,54,8,3,19723,1,5319,4,4,5,9,7,3,6,31,3,149,2,1418,49,513,54,5,49,9,0,15,0,23,4,2,14,1361,6,2,16,3,6,2,1,2,4,262,6,10,9,419,13,1495,6,110,6,6,9,792487,239];

  // This has a complexity linear to the value of the code. The
  // assumption is that looking up astral identifier characters is
  // rare.
  function isInAstralSet(code, set) {
    var pos = 0x10000;
    for (var i = 0; i < set.length; i += 2) {
      pos += set[i];
      if (pos > code) { return false }
      pos += set[i + 1];
      if (pos >= code) { return true }
    }
  }

  // Test whether a given character code starts an identifier.

  function isIdentifierStart(code, astral) {
    if (code < 65) { return code === 36 }
    if (code < 91) { return true }
    if (code < 97) { return code === 95 }
    if (code < 123) { return true }
    if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifierStart.test(String.fromCharCode(code)) }
    if (astral === false) { return false }
    return isInAstralSet(code, astralIdentifierStartCodes)
  }

  // Test whether a given character is part of an identifier.

  function isIdentifierChar(code, astral) {
    if (code < 48) { return code === 36 }
    if (code < 58) { return true }
    if (code < 65) { return false }
    if (code < 91) { return true }
    if (code < 97) { return code === 95 }
    if (code < 123) { return true }
    if (code <= 0xffff) { return code >= 0xaa && nonASCIIidentifier.test(String.fromCharCode(code)) }
    if (astral === false) { return false }
    return isInAstralSet(code, astralIdentifierStartCodes) || isInAstralSet(code, astralIdentifierCodes)
  }

  // ## Token types

  // The assignment of fine-grained, information-carrying type objects
  // allows the tokenizer to store the information it has about a
  // token in a way that is very cheap for the parser to look up.

  // All token type variables start with an underscore, to make them
  // easy to recognize.

  // The `beforeExpr` property is used to disambiguate between regular
  // expressions and divisions. It is set on all token types that can
  // be followed by an expression (thus, a slash after them would be a
  // regular expression).
  //
  // The `startsExpr` property is used to check if the token ends a
  // `yield` expression. It is set on all token types that either can
  // directly start an expression (like a quotation mark) or can
  // continue an expression (like the body of a string).
  //
  // `isLoop` marks a keyword as starting a loop, which is important
  // to know when parsing a label, in order to allow or disallow
  // continue jumps to that label.

  var TokenType = function TokenType(label, conf) {
    if ( conf === void 0 ) { conf = {}; }

    this.label = label;
    this.keyword = conf.keyword;
    this.beforeExpr = !!conf.beforeExpr;
    this.startsExpr = !!conf.startsExpr;
    this.isLoop = !!conf.isLoop;
    this.isAssign = !!conf.isAssign;
    this.prefix = !!conf.prefix;
    this.postfix = !!conf.postfix;
    this.binop = conf.binop || null;
    this.updateContext = null;
  };

  function binop(name, prec) {
    return new TokenType(name, {beforeExpr: true, binop: prec})
  }
  var beforeExpr = {beforeExpr: true}, startsExpr = {startsExpr: true};

  // Map keyword names to token types.

  var keywords$1 = {};

  // Succinct definitions of keyword token types
  function kw(name, options) {
    if ( options === void 0 ) { options = {}; }

    options.keyword = name;
    return keywords$1[name] = new TokenType(name, options)
  }

  var types = {
    num: new TokenType("num", startsExpr),
    regexp: new TokenType("regexp", startsExpr),
    string: new TokenType("string", startsExpr),
    name: new TokenType("name", startsExpr),
    eof: new TokenType("eof"),

    // Punctuation token types.
    bracketL: new TokenType("[", {beforeExpr: true, startsExpr: true}),
    bracketR: new TokenType("]"),
    braceL: new TokenType("{", {beforeExpr: true, startsExpr: true}),
    braceR: new TokenType("}"),
    parenL: new TokenType("(", {beforeExpr: true, startsExpr: true}),
    parenR: new TokenType(")"),
    comma: new TokenType(",", beforeExpr),
    semi: new TokenType(";", beforeExpr),
    colon: new TokenType(":", beforeExpr),
    dot: new TokenType("."),
    question: new TokenType("?", beforeExpr),
    arrow: new TokenType("=>", beforeExpr),
    template: new TokenType("template"),
    invalidTemplate: new TokenType("invalidTemplate"),
    ellipsis: new TokenType("...", beforeExpr),
    backQuote: new TokenType("`", startsExpr),
    dollarBraceL: new TokenType("${", {beforeExpr: true, startsExpr: true}),

    // Operators. These carry several kinds of properties to help the
    // parser use them properly (the presence of these properties is
    // what categorizes them as operators).
    //
    // `binop`, when present, specifies that this operator is a binary
    // operator, and will refer to its precedence.
    //
    // `prefix` and `postfix` mark the operator as a prefix or postfix
    // unary operator.
    //
    // `isAssign` marks all of `=`, `+=`, `-=` etcetera, which act as
    // binary operators with a very low precedence, that should result
    // in AssignmentExpression nodes.

    eq: new TokenType("=", {beforeExpr: true, isAssign: true}),
    assign: new TokenType("_=", {beforeExpr: true, isAssign: true}),
    incDec: new TokenType("++/--", {prefix: true, postfix: true, startsExpr: true}),
    prefix: new TokenType("!/~", {beforeExpr: true, prefix: true, startsExpr: true}),
    logicalOR: binop("||", 1),
    logicalAND: binop("&&", 2),
    bitwiseOR: binop("|", 3),
    bitwiseXOR: binop("^", 4),
    bitwiseAND: binop("&", 5),
    equality: binop("==/!=/===/!==", 6),
    relational: binop("</>/<=/>=", 7),
    bitShift: binop("<</>>/>>>", 8),
    plusMin: new TokenType("+/-", {beforeExpr: true, binop: 9, prefix: true, startsExpr: true}),
    modulo: binop("%", 10),
    star: binop("*", 10),
    slash: binop("/", 10),
    starstar: new TokenType("**", {beforeExpr: true}),

    // Keyword token types.
    _break: kw("break"),
    _case: kw("case", beforeExpr),
    _catch: kw("catch"),
    _continue: kw("continue"),
    _debugger: kw("debugger"),
    _default: kw("default", beforeExpr),
    _do: kw("do", {isLoop: true, beforeExpr: true}),
    _else: kw("else", beforeExpr),
    _finally: kw("finally"),
    _for: kw("for", {isLoop: true}),
    _function: kw("function", startsExpr),
    _if: kw("if"),
    _return: kw("return", beforeExpr),
    _switch: kw("switch"),
    _throw: kw("throw", beforeExpr),
    _try: kw("try"),
    _var: kw("var"),
    _const: kw("const"),
    _while: kw("while", {isLoop: true}),
    _with: kw("with"),
    _new: kw("new", {beforeExpr: true, startsExpr: true}),
    _this: kw("this", startsExpr),
    _super: kw("super", startsExpr),
    _class: kw("class", startsExpr),
    _extends: kw("extends", beforeExpr),
    _export: kw("export"),
    _import: kw("import", startsExpr),
    _null: kw("null", startsExpr),
    _true: kw("true", startsExpr),
    _false: kw("false", startsExpr),
    _in: kw("in", {beforeExpr: true, binop: 7}),
    _instanceof: kw("instanceof", {beforeExpr: true, binop: 7}),
    _typeof: kw("typeof", {beforeExpr: true, prefix: true, startsExpr: true}),
    _void: kw("void", {beforeExpr: true, prefix: true, startsExpr: true}),
    _delete: kw("delete", {beforeExpr: true, prefix: true, startsExpr: true})
  };

  // Matches a whole line break (where CRLF is considered a single
  // line break). Used to count lines.

  var lineBreak = /\r\n?|\n|\u2028|\u2029/;
  var lineBreakG = new RegExp(lineBreak.source, "g");

  function isNewLine(code, ecma2019String) {
    return code === 10 || code === 13 || (!ecma2019String && (code === 0x2028 || code === 0x2029))
  }

  var nonASCIIwhitespace = /[\u1680\u2000-\u200a\u202f\u205f\u3000\ufeff]/;

  var skipWhiteSpace = /(?:\s|\/\/.*|\/\*[^]*?\*\/)*/g;

  var ref = Object.prototype;
  var hasOwnProperty = ref.hasOwnProperty;
  var toString$1 = ref.toString;

  // Checks if an object has a property.

  function has(obj, propName) {
    return hasOwnProperty.call(obj, propName)
  }

  var isArray = Array.isArray || (function (obj) { return (
    toString$1.call(obj) === "[object Array]"
  ); });

  function wordsRegexp(words) {
    return new RegExp("^(?:" + words.replace(/ /g, "|") + ")$")
  }

  // These are used when `options.locations` is on, for the
  // `startLoc` and `endLoc` properties.

  var Position = function Position(line, col) {
    this.line = line;
    this.column = col;
  };

  Position.prototype.offset = function offset (n) {
    return new Position(this.line, this.column + n)
  };

  var SourceLocation = function SourceLocation(p, start, end) {
    this.start = start;
    this.end = end;
    if (p.sourceFile !== null) { this.source = p.sourceFile; }
  };

  // The `getLineInfo` function is mostly useful when the
  // `locations` option is off (for performance reasons) and you
  // want to find the line/column position for a given character
  // offset. `input` should be the code string that the offset refers
  // into.

  function getLineInfo(input, offset) {
    for (var line = 1, cur = 0;;) {
      lineBreakG.lastIndex = cur;
      var match = lineBreakG.exec(input);
      if (match && match.index < offset) {
        ++line;
        cur = match.index + match[0].length;
      } else {
        return new Position(line, offset - cur)
      }
    }
  }

  // A second optional argument can be given to further configure
  // the parser process. These options are recognized:

  var defaultOptions = {
    // `ecmaVersion` indicates the ECMAScript version to parse. Must be
    // either 3, 5, 6 (2015), 7 (2016), 8 (2017), 9 (2018), or 10
    // (2019). This influences support for strict mode, the set of
    // reserved words, and support for new syntax features. The default
    // is 9.
    ecmaVersion: 9,
    // `sourceType` indicates the mode the code should be parsed in.
    // Can be either `"script"` or `"module"`. This influences global
    // strict mode and parsing of `import` and `export` declarations.
    sourceType: "script",
    // `onInsertedSemicolon` can be a callback that will be called
    // when a semicolon is automatically inserted. It will be passed
    // the position of the comma as an offset, and if `locations` is
    // enabled, it is given the location as a `{line, column}` object
    // as second argument.
    onInsertedSemicolon: null,
    // `onTrailingComma` is similar to `onInsertedSemicolon`, but for
    // trailing commas.
    onTrailingComma: null,
    // By default, reserved words are only enforced if ecmaVersion >= 5.
    // Set `allowReserved` to a boolean value to explicitly turn this on
    // an off. When this option has the value "never", reserved words
    // and keywords can also not be used as property names.
    allowReserved: null,
    // When enabled, a return at the top level is not considered an
    // error.
    allowReturnOutsideFunction: false,
    // When enabled, import/export statements are not constrained to
    // appearing at the top of the program.
    allowImportExportEverywhere: false,
    // When enabled, await identifiers are allowed to appear at the top-level scope,
    // but they are still not allowed in non-async functions.
    allowAwaitOutsideFunction: false,
    // When enabled, hashbang directive in the beginning of file
    // is allowed and treated as a line comment.
    allowHashBang: false,
    // When `locations` is on, `loc` properties holding objects with
    // `start` and `end` properties in `{line, column}` form (with
    // line being 1-based and column 0-based) will be attached to the
    // nodes.
    locations: false,
    // A function can be passed as `onToken` option, which will
    // cause Acorn to call that function with object in the same
    // format as tokens returned from `tokenizer().getToken()`. Note
    // that you are not allowed to call the parser from the
    // callback—that will corrupt its internal state.
    onToken: null,
    // A function can be passed as `onComment` option, which will
    // cause Acorn to call that function with `(block, text, start,
    // end)` parameters whenever a comment is skipped. `block` is a
    // boolean indicating whether this is a block (`/* */`) comment,
    // `text` is the content of the comment, and `start` and `end` are
    // character offsets that denote the start and end of the comment.
    // When the `locations` option is on, two more parameters are
    // passed, the full `{line, column}` locations of the start and
    // end of the comments. Note that you are not allowed to call the
    // parser from the callback—that will corrupt its internal state.
    onComment: null,
    // Nodes have their start and end characters offsets recorded in
    // `start` and `end` properties (directly on the node, rather than
    // the `loc` object, which holds line/column data. To also add a
    // [semi-standardized][range] `range` property holding a `[start,
    // end]` array with the same numbers, set the `ranges` option to
    // `true`.
    //
    // [range]: https://bugzilla.mozilla.org/show_bug.cgi?id=745678
    ranges: false,
    // It is possible to parse multiple files into a single AST by
    // passing the tree produced by parsing the first file as
    // `program` option in subsequent parses. This will add the
    // toplevel forms of the parsed file to the `Program` (top) node
    // of an existing parse tree.
    program: null,
    // When `locations` is on, you can pass this to record the source
    // file in every node's `loc` object.
    sourceFile: null,
    // This value, if given, is stored in every node, whether
    // `locations` is on or off.
    directSourceFile: null,
    // When enabled, parenthesized expressions are represented by
    // (non-standard) ParenthesizedExpression nodes
    preserveParens: false
  };

  // Interpret and default an options object

  function getOptions(opts) {
    var options = {};

    for (var opt in defaultOptions)
      { options[opt] = opts && has(opts, opt) ? opts[opt] : defaultOptions[opt]; }

    if (options.ecmaVersion >= 2015)
      { options.ecmaVersion -= 2009; }

    if (options.allowReserved == null)
      { options.allowReserved = options.ecmaVersion < 5; }

    if (isArray(options.onToken)) {
      var tokens = options.onToken;
      options.onToken = function (token) { return tokens.push(token); };
    }
    if (isArray(options.onComment))
      { options.onComment = pushComment(options, options.onComment); }

    return options
  }

  function pushComment(options, array) {
    return function(block, text, start, end, startLoc, endLoc) {
      var comment = {
        type: block ? "Block" : "Line",
        value: text,
        start: start,
        end: end
      };
      if (options.locations)
        { comment.loc = new SourceLocation(this, startLoc, endLoc); }
      if (options.ranges)
        { comment.range = [start, end]; }
      array.push(comment);
    }
  }

  // Each scope gets a bitset that may contain these flags
  var
      SCOPE_TOP = 1,
      SCOPE_FUNCTION = 2,
      SCOPE_VAR = SCOPE_TOP | SCOPE_FUNCTION,
      SCOPE_ASYNC = 4,
      SCOPE_GENERATOR = 8,
      SCOPE_ARROW = 16,
      SCOPE_SIMPLE_CATCH = 32,
      SCOPE_SUPER = 64,
      SCOPE_DIRECT_SUPER = 128;

  function functionFlags(async, generator) {
    return SCOPE_FUNCTION | (async ? SCOPE_ASYNC : 0) | (generator ? SCOPE_GENERATOR : 0)
  }

  // Used in checkLVal and declareName to determine the type of a binding
  var
      BIND_NONE = 0, // Not a binding
      BIND_VAR = 1, // Var-style binding
      BIND_LEXICAL = 2, // Let- or const-style binding
      BIND_FUNCTION = 3, // Function declaration
      BIND_SIMPLE_CATCH = 4, // Simple (identifier pattern) catch binding
      BIND_OUTSIDE = 5; // Special case for function names as bound inside the function

  var Parser = function Parser(options, input, startPos) {
    this.options = options = getOptions(options);
    this.sourceFile = options.sourceFile;
    this.keywords = wordsRegexp(keywords[options.ecmaVersion >= 6 ? 6 : options.sourceType === "module" ? "5module" : 5]);
    var reserved = "";
    if (options.allowReserved !== true) {
      for (var v = options.ecmaVersion;; v--)
        { if (reserved = reservedWords[v]) { break } }
      if (options.sourceType === "module") { reserved += " await"; }
    }
    this.reservedWords = wordsRegexp(reserved);
    var reservedStrict = (reserved ? reserved + " " : "") + reservedWords.strict;
    this.reservedWordsStrict = wordsRegexp(reservedStrict);
    this.reservedWordsStrictBind = wordsRegexp(reservedStrict + " " + reservedWords.strictBind);
    this.input = String(input);

    // Used to signal to callers of `readWord1` whether the word
    // contained any escape sequences. This is needed because words with
    // escape sequences must not be interpreted as keywords.
    this.containsEsc = false;

    // Set up token state

    // The current position of the tokenizer in the input.
    if (startPos) {
      this.pos = startPos;
      this.lineStart = this.input.lastIndexOf("\n", startPos - 1) + 1;
      this.curLine = this.input.slice(0, this.lineStart).split(lineBreak).length;
    } else {
      this.pos = this.lineStart = 0;
      this.curLine = 1;
    }

    // Properties of the current token:
    // Its type
    this.type = types.eof;
    // For tokens that include more information than their type, the value
    this.value = null;
    // Its start and end offset
    this.start = this.end = this.pos;
    // And, if locations are used, the {line, column} object
    // corresponding to those offsets
    this.startLoc = this.endLoc = this.curPosition();

    // Position information for the previous token
    this.lastTokEndLoc = this.lastTokStartLoc = null;
    this.lastTokStart = this.lastTokEnd = this.pos;

    // The context stack is used to superficially track syntactic
    // context to predict whether a regular expression is allowed in a
    // given position.
    this.context = this.initialContext();
    this.exprAllowed = true;

    // Figure out if it's a module code.
    this.inModule = options.sourceType === "module";
    this.strict = this.inModule || this.strictDirective(this.pos);

    // Used to signify the start of a potential arrow function
    this.potentialArrowAt = -1;

    // Positions to delayed-check that yield/await does not exist in default parameters.
    this.yieldPos = this.awaitPos = this.awaitIdentPos = 0;
    // Labels in scope.
    this.labels = [];
    // Thus-far undefined exports.
    this.undefinedExports = {};

    // If enabled, skip leading hashbang line.
    if (this.pos === 0 && options.allowHashBang && this.input.slice(0, 2) === "#!")
      { this.skipLineComment(2); }

    // Scope tracking for duplicate variable names (see scope.js)
    this.scopeStack = [];
    this.enterScope(SCOPE_TOP);

    // For RegExp validation
    this.regexpState = null;
  };

  var prototypeAccessors = { inFunction: { configurable: true },inGenerator: { configurable: true },inAsync: { configurable: true },allowSuper: { configurable: true },allowDirectSuper: { configurable: true },treatFunctionsAsVar: { configurable: true } };

  Parser.prototype.parse = function parse () {
    var node = this.options.program || this.startNode();
    this.nextToken();
    return this.parseTopLevel(node)
  };

  prototypeAccessors.inFunction.get = function () { return (this.currentVarScope().flags & SCOPE_FUNCTION) > 0 };
  prototypeAccessors.inGenerator.get = function () { return (this.currentVarScope().flags & SCOPE_GENERATOR) > 0 };
  prototypeAccessors.inAsync.get = function () { return (this.currentVarScope().flags & SCOPE_ASYNC) > 0 };
  prototypeAccessors.allowSuper.get = function () { return (this.currentThisScope().flags & SCOPE_SUPER) > 0 };
  prototypeAccessors.allowDirectSuper.get = function () { return (this.currentThisScope().flags & SCOPE_DIRECT_SUPER) > 0 };
  prototypeAccessors.treatFunctionsAsVar.get = function () { return this.treatFunctionsAsVarInScope(this.currentScope()) };

  // Switch to a getter for 7.0.0.
  Parser.prototype.inNonArrowFunction = function inNonArrowFunction () { return (this.currentThisScope().flags & SCOPE_FUNCTION) > 0 };

  Parser.extend = function extend () {
      var arguments$1 = arguments;

      var plugins = [], len = arguments.length;
      while ( len-- ) { plugins[ len ] = arguments$1[ len ]; }

    var cls = this;
    for (var i = 0; i < plugins.length; i++) { cls = plugins[i](cls); }
    return cls
  };

  Parser.parse = function parse (input, options) {
    return new this(options, input).parse()
  };

  Parser.parseExpressionAt = function parseExpressionAt (input, pos, options) {
    var parser = new this(options, input, pos);
    parser.nextToken();
    return parser.parseExpression()
  };

  Parser.tokenizer = function tokenizer (input, options) {
    return new this(options, input)
  };

  Object.defineProperties( Parser.prototype, prototypeAccessors );

  var pp = Parser.prototype;

  // ## Parser utilities

  var literal = /^(?:'((?:\\.|[^'])*?)'|"((?:\\.|[^"])*?)")/;
  pp.strictDirective = function(start) {
    for (;;) {
      // Try to find string literal.
      skipWhiteSpace.lastIndex = start;
      start += skipWhiteSpace.exec(this.input)[0].length;
      var match = literal.exec(this.input.slice(start));
      if (!match) { return false }
      if ((match[1] || match[2]) === "use strict") { return true }
      start += match[0].length;

      // Skip semicolon, if any.
      skipWhiteSpace.lastIndex = start;
      start += skipWhiteSpace.exec(this.input)[0].length;
      if (this.input[start] === ";")
        { start++; }
    }
  };

  // Predicate that tests whether the next token is of the given
  // type, and if yes, consumes it as a side effect.

  pp.eat = function(type) {
    if (this.type === type) {
      this.next();
      return true
    } else {
      return false
    }
  };

  // Tests whether parsed token is a contextual keyword.

  pp.isContextual = function(name) {
    return this.type === types.name && this.value === name && !this.containsEsc
  };

  // Consumes contextual keyword if possible.

  pp.eatContextual = function(name) {
    if (!this.isContextual(name)) { return false }
    this.next();
    return true
  };

  // Asserts that following token is given contextual keyword.

  pp.expectContextual = function(name) {
    if (!this.eatContextual(name)) { this.unexpected(); }
  };

  // Test whether a semicolon can be inserted at the current position.

  pp.canInsertSemicolon = function() {
    return this.type === types.eof ||
      this.type === types.braceR ||
      lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
  };

  pp.insertSemicolon = function() {
    if (this.canInsertSemicolon()) {
      if (this.options.onInsertedSemicolon)
        { this.options.onInsertedSemicolon(this.lastTokEnd, this.lastTokEndLoc); }
      return true
    }
  };

  // Consume a semicolon, or, failing that, see if we are allowed to
  // pretend that there is a semicolon at this position.

  pp.semicolon = function() {
    if (!this.eat(types.semi) && !this.insertSemicolon()) { this.unexpected(); }
  };

  pp.afterTrailingComma = function(tokType, notNext) {
    if (this.type === tokType) {
      if (this.options.onTrailingComma)
        { this.options.onTrailingComma(this.lastTokStart, this.lastTokStartLoc); }
      if (!notNext)
        { this.next(); }
      return true
    }
  };

  // Expect a token of a given type. If found, consume it, otherwise,
  // raise an unexpected token error.

  pp.expect = function(type) {
    this.eat(type) || this.unexpected();
  };

  // Raise an unexpected token error.

  pp.unexpected = function(pos) {
    this.raise(pos != null ? pos : this.start, "Unexpected token");
  };

  function DestructuringErrors() {
    this.shorthandAssign =
    this.trailingComma =
    this.parenthesizedAssign =
    this.parenthesizedBind =
    this.doubleProto =
      -1;
  }

  pp.checkPatternErrors = function(refDestructuringErrors, isAssign) {
    if (!refDestructuringErrors) { return }
    if (refDestructuringErrors.trailingComma > -1)
      { this.raiseRecoverable(refDestructuringErrors.trailingComma, "Comma is not permitted after the rest element"); }
    var parens = isAssign ? refDestructuringErrors.parenthesizedAssign : refDestructuringErrors.parenthesizedBind;
    if (parens > -1) { this.raiseRecoverable(parens, "Parenthesized pattern"); }
  };

  pp.checkExpressionErrors = function(refDestructuringErrors, andThrow) {
    if (!refDestructuringErrors) { return false }
    var shorthandAssign = refDestructuringErrors.shorthandAssign;
    var doubleProto = refDestructuringErrors.doubleProto;
    if (!andThrow) { return shorthandAssign >= 0 || doubleProto >= 0 }
    if (shorthandAssign >= 0)
      { this.raise(shorthandAssign, "Shorthand property assignments are valid only in destructuring patterns"); }
    if (doubleProto >= 0)
      { this.raiseRecoverable(doubleProto, "Redefinition of __proto__ property"); }
  };

  pp.checkYieldAwaitInDefaultParams = function() {
    if (this.yieldPos && (!this.awaitPos || this.yieldPos < this.awaitPos))
      { this.raise(this.yieldPos, "Yield expression cannot be a default value"); }
    if (this.awaitPos)
      { this.raise(this.awaitPos, "Await expression cannot be a default value"); }
  };

  pp.isSimpleAssignTarget = function(expr) {
    if (expr.type === "ParenthesizedExpression")
      { return this.isSimpleAssignTarget(expr.expression) }
    return expr.type === "Identifier" || expr.type === "MemberExpression"
  };

  var pp$1 = Parser.prototype;

  // ### Statement parsing

  // Parse a program. Initializes the parser, reads any number of
  // statements, and wraps them in a Program node.  Optionally takes a
  // `program` argument.  If present, the statements will be appended
  // to its body instead of creating a new node.

  pp$1.parseTopLevel = function(node) {
    var exports = {};
    if (!node.body) { node.body = []; }
    while (this.type !== types.eof) {
      var stmt = this.parseStatement(null, true, exports);
      node.body.push(stmt);
    }
    if (this.inModule)
      { for (var i = 0, list = Object.keys(this.undefinedExports); i < list.length; i += 1)
        {
          var name = list[i];

          this.raiseRecoverable(this.undefinedExports[name].start, ("Export '" + name + "' is not defined"));
        } }
    this.adaptDirectivePrologue(node.body);
    this.next();
    node.sourceType = this.options.sourceType;
    return this.finishNode(node, "Program")
  };

  var loopLabel = {kind: "loop"}, switchLabel = {kind: "switch"};

  pp$1.isLet = function(context) {
    if (this.options.ecmaVersion < 6 || !this.isContextual("let")) { return false }
    skipWhiteSpace.lastIndex = this.pos;
    var skip = skipWhiteSpace.exec(this.input);
    var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
    // For ambiguous cases, determine if a LexicalDeclaration (or only a
    // Statement) is allowed here. If context is not empty then only a Statement
    // is allowed. However, `let [` is an explicit negative lookahead for
    // ExpressionStatement, so special-case it first.
    if (nextCh === 91) { return true } // '['
    if (context) { return false }

    if (nextCh === 123) { return true } // '{'
    if (isIdentifierStart(nextCh, true)) {
      var pos = next + 1;
      while (isIdentifierChar(this.input.charCodeAt(pos), true)) { ++pos; }
      var ident = this.input.slice(next, pos);
      if (!keywordRelationalOperator.test(ident)) { return true }
    }
    return false
  };

  // check 'async [no LineTerminator here] function'
  // - 'async /*foo*/ function' is OK.
  // - 'async /*\n*/ function' is invalid.
  pp$1.isAsyncFunction = function() {
    if (this.options.ecmaVersion < 8 || !this.isContextual("async"))
      { return false }

    skipWhiteSpace.lastIndex = this.pos;
    var skip = skipWhiteSpace.exec(this.input);
    var next = this.pos + skip[0].length;
    return !lineBreak.test(this.input.slice(this.pos, next)) &&
      this.input.slice(next, next + 8) === "function" &&
      (next + 8 === this.input.length || !isIdentifierChar(this.input.charAt(next + 8)))
  };

  // Parse a single statement.
  //
  // If expecting a statement and finding a slash operator, parse a
  // regular expression literal. This is to handle cases like
  // `if (foo) /blah/.exec(foo)`, where looking at the previous token
  // does not help.

  pp$1.parseStatement = function(context, topLevel, exports) {
    var starttype = this.type, node = this.startNode(), kind;

    if (this.isLet(context)) {
      starttype = types._var;
      kind = "let";
    }

    // Most types of statements are recognized by the keyword they
    // start with. Many are trivial to parse, some require a bit of
    // complexity.

    switch (starttype) {
    case types._break: case types._continue: return this.parseBreakContinueStatement(node, starttype.keyword)
    case types._debugger: return this.parseDebuggerStatement(node)
    case types._do: return this.parseDoStatement(node)
    case types._for: return this.parseForStatement(node)
    case types._function:
      // Function as sole body of either an if statement or a labeled statement
      // works, but not when it is part of a labeled statement that is the sole
      // body of an if statement.
      if ((context && (this.strict || context !== "if" && context !== "label")) && this.options.ecmaVersion >= 6) { this.unexpected(); }
      return this.parseFunctionStatement(node, false, !context)
    case types._class:
      if (context) { this.unexpected(); }
      return this.parseClass(node, true)
    case types._if: return this.parseIfStatement(node)
    case types._return: return this.parseReturnStatement(node)
    case types._switch: return this.parseSwitchStatement(node)
    case types._throw: return this.parseThrowStatement(node)
    case types._try: return this.parseTryStatement(node)
    case types._const: case types._var:
      kind = kind || this.value;
      if (context && kind !== "var") { this.unexpected(); }
      return this.parseVarStatement(node, kind)
    case types._while: return this.parseWhileStatement(node)
    case types._with: return this.parseWithStatement(node)
    case types.braceL: return this.parseBlock(true, node)
    case types.semi: return this.parseEmptyStatement(node)
    case types._export:
    case types._import:
      if (this.options.ecmaVersion > 10 && starttype === types._import) {
        skipWhiteSpace.lastIndex = this.pos;
        var skip = skipWhiteSpace.exec(this.input);
        var next = this.pos + skip[0].length, nextCh = this.input.charCodeAt(next);
        if (nextCh === 40) // '('
          { return this.parseExpressionStatement(node, this.parseExpression()) }
      }

      if (!this.options.allowImportExportEverywhere) {
        if (!topLevel)
          { this.raise(this.start, "'import' and 'export' may only appear at the top level"); }
        if (!this.inModule)
          { this.raise(this.start, "'import' and 'export' may appear only with 'sourceType: module'"); }
      }
      return starttype === types._import ? this.parseImport(node) : this.parseExport(node, exports)

      // If the statement does not start with a statement keyword or a
      // brace, it's an ExpressionStatement or LabeledStatement. We
      // simply start parsing an expression, and afterwards, if the
      // next token is a colon and the expression was a simple
      // Identifier node, we switch to interpreting it as a label.
    default:
      if (this.isAsyncFunction()) {
        if (context) { this.unexpected(); }
        this.next();
        return this.parseFunctionStatement(node, true, !context)
      }

      var maybeName = this.value, expr = this.parseExpression();
      if (starttype === types.name && expr.type === "Identifier" && this.eat(types.colon))
        { return this.parseLabeledStatement(node, maybeName, expr, context) }
      else { return this.parseExpressionStatement(node, expr) }
    }
  };

  pp$1.parseBreakContinueStatement = function(node, keyword) {
    var isBreak = keyword === "break";
    this.next();
    if (this.eat(types.semi) || this.insertSemicolon()) { node.label = null; }
    else if (this.type !== types.name) { this.unexpected(); }
    else {
      node.label = this.parseIdent();
      this.semicolon();
    }

    // Verify that there is an actual destination to break or
    // continue to.
    var i = 0;
    for (; i < this.labels.length; ++i) {
      var lab = this.labels[i];
      if (node.label == null || lab.name === node.label.name) {
        if (lab.kind != null && (isBreak || lab.kind === "loop")) { break }
        if (node.label && isBreak) { break }
      }
    }
    if (i === this.labels.length) { this.raise(node.start, "Unsyntactic " + keyword); }
    return this.finishNode(node, isBreak ? "BreakStatement" : "ContinueStatement")
  };

  pp$1.parseDebuggerStatement = function(node) {
    this.next();
    this.semicolon();
    return this.finishNode(node, "DebuggerStatement")
  };

  pp$1.parseDoStatement = function(node) {
    this.next();
    this.labels.push(loopLabel);
    node.body = this.parseStatement("do");
    this.labels.pop();
    this.expect(types._while);
    node.test = this.parseParenExpression();
    if (this.options.ecmaVersion >= 6)
      { this.eat(types.semi); }
    else
      { this.semicolon(); }
    return this.finishNode(node, "DoWhileStatement")
  };

  // Disambiguating between a `for` and a `for`/`in` or `for`/`of`
  // loop is non-trivial. Basically, we have to parse the init `var`
  // statement or expression, disallowing the `in` operator (see
  // the second parameter to `parseExpression`), and then check
  // whether the next token is `in` or `of`. When there is no init
  // part (semicolon immediately after the opening parenthesis), it
  // is a regular `for` loop.

  pp$1.parseForStatement = function(node) {
    this.next();
    var awaitAt = (this.options.ecmaVersion >= 9 && (this.inAsync || (!this.inFunction && this.options.allowAwaitOutsideFunction)) && this.eatContextual("await")) ? this.lastTokStart : -1;
    this.labels.push(loopLabel);
    this.enterScope(0);
    this.expect(types.parenL);
    if (this.type === types.semi) {
      if (awaitAt > -1) { this.unexpected(awaitAt); }
      return this.parseFor(node, null)
    }
    var isLet = this.isLet();
    if (this.type === types._var || this.type === types._const || isLet) {
      var init$1 = this.startNode(), kind = isLet ? "let" : this.value;
      this.next();
      this.parseVar(init$1, true, kind);
      this.finishNode(init$1, "VariableDeclaration");
      if ((this.type === types._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) && init$1.declarations.length === 1) {
        if (this.options.ecmaVersion >= 9) {
          if (this.type === types._in) {
            if (awaitAt > -1) { this.unexpected(awaitAt); }
          } else { node.await = awaitAt > -1; }
        }
        return this.parseForIn(node, init$1)
      }
      if (awaitAt > -1) { this.unexpected(awaitAt); }
      return this.parseFor(node, init$1)
    }
    var refDestructuringErrors = new DestructuringErrors;
    var init = this.parseExpression(true, refDestructuringErrors);
    if (this.type === types._in || (this.options.ecmaVersion >= 6 && this.isContextual("of"))) {
      if (this.options.ecmaVersion >= 9) {
        if (this.type === types._in) {
          if (awaitAt > -1) { this.unexpected(awaitAt); }
        } else { node.await = awaitAt > -1; }
      }
      this.toAssignable(init, false, refDestructuringErrors);
      this.checkLVal(init);
      return this.parseForIn(node, init)
    } else {
      this.checkExpressionErrors(refDestructuringErrors, true);
    }
    if (awaitAt > -1) { this.unexpected(awaitAt); }
    return this.parseFor(node, init)
  };

  pp$1.parseFunctionStatement = function(node, isAsync, declarationPosition) {
    this.next();
    return this.parseFunction(node, FUNC_STATEMENT | (declarationPosition ? 0 : FUNC_HANGING_STATEMENT), false, isAsync)
  };

  pp$1.parseIfStatement = function(node) {
    this.next();
    node.test = this.parseParenExpression();
    // allow function declarations in branches, but only in non-strict mode
    node.consequent = this.parseStatement("if");
    node.alternate = this.eat(types._else) ? this.parseStatement("if") : null;
    return this.finishNode(node, "IfStatement")
  };

  pp$1.parseReturnStatement = function(node) {
    if (!this.inFunction && !this.options.allowReturnOutsideFunction)
      { this.raise(this.start, "'return' outside of function"); }
    this.next();

    // In `return` (and `break`/`continue`), the keywords with
    // optional arguments, we eagerly look for a semicolon or the
    // possibility to insert one.

    if (this.eat(types.semi) || this.insertSemicolon()) { node.argument = null; }
    else { node.argument = this.parseExpression(); this.semicolon(); }
    return this.finishNode(node, "ReturnStatement")
  };

  pp$1.parseSwitchStatement = function(node) {
    this.next();
    node.discriminant = this.parseParenExpression();
    node.cases = [];
    this.expect(types.braceL);
    this.labels.push(switchLabel);
    this.enterScope(0);

    // Statements under must be grouped (by label) in SwitchCase
    // nodes. `cur` is used to keep the node that we are currently
    // adding statements to.

    var cur;
    for (var sawDefault = false; this.type !== types.braceR;) {
      if (this.type === types._case || this.type === types._default) {
        var isCase = this.type === types._case;
        if (cur) { this.finishNode(cur, "SwitchCase"); }
        node.cases.push(cur = this.startNode());
        cur.consequent = [];
        this.next();
        if (isCase) {
          cur.test = this.parseExpression();
        } else {
          if (sawDefault) { this.raiseRecoverable(this.lastTokStart, "Multiple default clauses"); }
          sawDefault = true;
          cur.test = null;
        }
        this.expect(types.colon);
      } else {
        if (!cur) { this.unexpected(); }
        cur.consequent.push(this.parseStatement(null));
      }
    }
    this.exitScope();
    if (cur) { this.finishNode(cur, "SwitchCase"); }
    this.next(); // Closing brace
    this.labels.pop();
    return this.finishNode(node, "SwitchStatement")
  };

  pp$1.parseThrowStatement = function(node) {
    this.next();
    if (lineBreak.test(this.input.slice(this.lastTokEnd, this.start)))
      { this.raise(this.lastTokEnd, "Illegal newline after throw"); }
    node.argument = this.parseExpression();
    this.semicolon();
    return this.finishNode(node, "ThrowStatement")
  };

  // Reused empty array added for node fields that are always empty.

  var empty = [];

  pp$1.parseTryStatement = function(node) {
    this.next();
    node.block = this.parseBlock();
    node.handler = null;
    if (this.type === types._catch) {
      var clause = this.startNode();
      this.next();
      if (this.eat(types.parenL)) {
        clause.param = this.parseBindingAtom();
        var simple = clause.param.type === "Identifier";
        this.enterScope(simple ? SCOPE_SIMPLE_CATCH : 0);
        this.checkLVal(clause.param, simple ? BIND_SIMPLE_CATCH : BIND_LEXICAL);
        this.expect(types.parenR);
      } else {
        if (this.options.ecmaVersion < 10) { this.unexpected(); }
        clause.param = null;
        this.enterScope(0);
      }
      clause.body = this.parseBlock(false);
      this.exitScope();
      node.handler = this.finishNode(clause, "CatchClause");
    }
    node.finalizer = this.eat(types._finally) ? this.parseBlock() : null;
    if (!node.handler && !node.finalizer)
      { this.raise(node.start, "Missing catch or finally clause"); }
    return this.finishNode(node, "TryStatement")
  };

  pp$1.parseVarStatement = function(node, kind) {
    this.next();
    this.parseVar(node, false, kind);
    this.semicolon();
    return this.finishNode(node, "VariableDeclaration")
  };

  pp$1.parseWhileStatement = function(node) {
    this.next();
    node.test = this.parseParenExpression();
    this.labels.push(loopLabel);
    node.body = this.parseStatement("while");
    this.labels.pop();
    return this.finishNode(node, "WhileStatement")
  };

  pp$1.parseWithStatement = function(node) {
    if (this.strict) { this.raise(this.start, "'with' in strict mode"); }
    this.next();
    node.object = this.parseParenExpression();
    node.body = this.parseStatement("with");
    return this.finishNode(node, "WithStatement")
  };

  pp$1.parseEmptyStatement = function(node) {
    this.next();
    return this.finishNode(node, "EmptyStatement")
  };

  pp$1.parseLabeledStatement = function(node, maybeName, expr, context) {
    for (var i$1 = 0, list = this.labels; i$1 < list.length; i$1 += 1)
      {
      var label = list[i$1];

      if (label.name === maybeName)
        { this.raise(expr.start, "Label '" + maybeName + "' is already declared");
    } }
    var kind = this.type.isLoop ? "loop" : this.type === types._switch ? "switch" : null;
    for (var i = this.labels.length - 1; i >= 0; i--) {
      var label$1 = this.labels[i];
      if (label$1.statementStart === node.start) {
        // Update information about previous labels on this node
        label$1.statementStart = this.start;
        label$1.kind = kind;
      } else { break }
    }
    this.labels.push({name: maybeName, kind: kind, statementStart: this.start});
    node.body = this.parseStatement(context ? context.indexOf("label") === -1 ? context + "label" : context : "label");
    this.labels.pop();
    node.label = expr;
    return this.finishNode(node, "LabeledStatement")
  };

  pp$1.parseExpressionStatement = function(node, expr) {
    node.expression = expr;
    this.semicolon();
    return this.finishNode(node, "ExpressionStatement")
  };

  // Parse a semicolon-enclosed block of statements, handling `"use
  // strict"` declarations when `allowStrict` is true (used for
  // function bodies).

  pp$1.parseBlock = function(createNewLexicalScope, node) {
    if ( createNewLexicalScope === void 0 ) { createNewLexicalScope = true; }
    if ( node === void 0 ) { node = this.startNode(); }

    node.body = [];
    this.expect(types.braceL);
    if (createNewLexicalScope) { this.enterScope(0); }
    while (!this.eat(types.braceR)) {
      var stmt = this.parseStatement(null);
      node.body.push(stmt);
    }
    if (createNewLexicalScope) { this.exitScope(); }
    return this.finishNode(node, "BlockStatement")
  };

  // Parse a regular `for` loop. The disambiguation code in
  // `parseStatement` will already have parsed the init statement or
  // expression.

  pp$1.parseFor = function(node, init) {
    node.init = init;
    this.expect(types.semi);
    node.test = this.type === types.semi ? null : this.parseExpression();
    this.expect(types.semi);
    node.update = this.type === types.parenR ? null : this.parseExpression();
    this.expect(types.parenR);
    node.body = this.parseStatement("for");
    this.exitScope();
    this.labels.pop();
    return this.finishNode(node, "ForStatement")
  };

  // Parse a `for`/`in` and `for`/`of` loop, which are almost
  // same from parser's perspective.

  pp$1.parseForIn = function(node, init) {
    var isForIn = this.type === types._in;
    this.next();

    if (
      init.type === "VariableDeclaration" &&
      init.declarations[0].init != null &&
      (
        !isForIn ||
        this.options.ecmaVersion < 8 ||
        this.strict ||
        init.kind !== "var" ||
        init.declarations[0].id.type !== "Identifier"
      )
    ) {
      this.raise(
        init.start,
        ((isForIn ? "for-in" : "for-of") + " loop variable declaration may not have an initializer")
      );
    } else if (init.type === "AssignmentPattern") {
      this.raise(init.start, "Invalid left-hand side in for-loop");
    }
    node.left = init;
    node.right = isForIn ? this.parseExpression() : this.parseMaybeAssign();
    this.expect(types.parenR);
    node.body = this.parseStatement("for");
    this.exitScope();
    this.labels.pop();
    return this.finishNode(node, isForIn ? "ForInStatement" : "ForOfStatement")
  };

  // Parse a list of variable declarations.

  pp$1.parseVar = function(node, isFor, kind) {
    node.declarations = [];
    node.kind = kind;
    for (;;) {
      var decl = this.startNode();
      this.parseVarId(decl, kind);
      if (this.eat(types.eq)) {
        decl.init = this.parseMaybeAssign(isFor);
      } else if (kind === "const" && !(this.type === types._in || (this.options.ecmaVersion >= 6 && this.isContextual("of")))) {
        this.unexpected();
      } else if (decl.id.type !== "Identifier" && !(isFor && (this.type === types._in || this.isContextual("of")))) {
        this.raise(this.lastTokEnd, "Complex binding patterns require an initialization value");
      } else {
        decl.init = null;
      }
      node.declarations.push(this.finishNode(decl, "VariableDeclarator"));
      if (!this.eat(types.comma)) { break }
    }
    return node
  };

  pp$1.parseVarId = function(decl, kind) {
    decl.id = this.parseBindingAtom();
    this.checkLVal(decl.id, kind === "var" ? BIND_VAR : BIND_LEXICAL, false);
  };

  var FUNC_STATEMENT = 1, FUNC_HANGING_STATEMENT = 2, FUNC_NULLABLE_ID = 4;

  // Parse a function declaration or literal (depending on the
  // `statement & FUNC_STATEMENT`).

  // Remove `allowExpressionBody` for 7.0.0, as it is only called with false
  pp$1.parseFunction = function(node, statement, allowExpressionBody, isAsync) {
    this.initFunction(node);
    if (this.options.ecmaVersion >= 9 || this.options.ecmaVersion >= 6 && !isAsync) {
      if (this.type === types.star && (statement & FUNC_HANGING_STATEMENT))
        { this.unexpected(); }
      node.generator = this.eat(types.star);
    }
    if (this.options.ecmaVersion >= 8)
      { node.async = !!isAsync; }

    if (statement & FUNC_STATEMENT) {
      node.id = (statement & FUNC_NULLABLE_ID) && this.type !== types.name ? null : this.parseIdent();
      if (node.id && !(statement & FUNC_HANGING_STATEMENT))
        // If it is a regular function declaration in sloppy mode, then it is
        // subject to Annex B semantics (BIND_FUNCTION). Otherwise, the binding
        // mode depends on properties of the current scope (see
        // treatFunctionsAsVar).
        { this.checkLVal(node.id, (this.strict || node.generator || node.async) ? this.treatFunctionsAsVar ? BIND_VAR : BIND_LEXICAL : BIND_FUNCTION); }
    }

    var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;
    this.enterScope(functionFlags(node.async, node.generator));

    if (!(statement & FUNC_STATEMENT))
      { node.id = this.type === types.name ? this.parseIdent() : null; }

    this.parseFunctionParams(node);
    this.parseFunctionBody(node, allowExpressionBody, false);

    this.yieldPos = oldYieldPos;
    this.awaitPos = oldAwaitPos;
    this.awaitIdentPos = oldAwaitIdentPos;
    return this.finishNode(node, (statement & FUNC_STATEMENT) ? "FunctionDeclaration" : "FunctionExpression")
  };

  pp$1.parseFunctionParams = function(node) {
    this.expect(types.parenL);
    node.params = this.parseBindingList(types.parenR, false, this.options.ecmaVersion >= 8);
    this.checkYieldAwaitInDefaultParams();
  };

  // Parse a class declaration or literal (depending on the
  // `isStatement` parameter).

  pp$1.parseClass = function(node, isStatement) {
    this.next();

    // ecma-262 14.6 Class Definitions
    // A class definition is always strict mode code.
    var oldStrict = this.strict;
    this.strict = true;

    this.parseClassId(node, isStatement);
    this.parseClassSuper(node);
    var classBody = this.startNode();
    var hadConstructor = false;
    classBody.body = [];
    this.expect(types.braceL);
    while (!this.eat(types.braceR)) {
      var element = this.parseClassElement(node.superClass !== null);
      if (element) {
        classBody.body.push(element);
        if (element.type === "MethodDefinition" && element.kind === "constructor") {
          if (hadConstructor) { this.raise(element.start, "Duplicate constructor in the same class"); }
          hadConstructor = true;
        }
      }
    }
    node.body = this.finishNode(classBody, "ClassBody");
    this.strict = oldStrict;
    return this.finishNode(node, isStatement ? "ClassDeclaration" : "ClassExpression")
  };

  pp$1.parseClassElement = function(constructorAllowsSuper) {
    var this$1 = this;

    if (this.eat(types.semi)) { return null }

    var method = this.startNode();
    var tryContextual = function (k, noLineBreak) {
      if ( noLineBreak === void 0 ) { noLineBreak = false; }

      var start = this$1.start, startLoc = this$1.startLoc;
      if (!this$1.eatContextual(k)) { return false }
      if (this$1.type !== types.parenL && (!noLineBreak || !this$1.canInsertSemicolon())) { return true }
      if (method.key) { this$1.unexpected(); }
      method.computed = false;
      method.key = this$1.startNodeAt(start, startLoc);
      method.key.name = k;
      this$1.finishNode(method.key, "Identifier");
      return false
    };

    method.kind = "method";
    method.static = tryContextual("static");
    var isGenerator = this.eat(types.star);
    var isAsync = false;
    if (!isGenerator) {
      if (this.options.ecmaVersion >= 8 && tryContextual("async", true)) {
        isAsync = true;
        isGenerator = this.options.ecmaVersion >= 9 && this.eat(types.star);
      } else if (tryContextual("get")) {
        method.kind = "get";
      } else if (tryContextual("set")) {
        method.kind = "set";
      }
    }
    if (!method.key) { this.parsePropertyName(method); }
    var key = method.key;
    var allowsDirectSuper = false;
    if (!method.computed && !method.static && (key.type === "Identifier" && key.name === "constructor" ||
        key.type === "Literal" && key.value === "constructor")) {
      if (method.kind !== "method") { this.raise(key.start, "Constructor can't have get/set modifier"); }
      if (isGenerator) { this.raise(key.start, "Constructor can't be a generator"); }
      if (isAsync) { this.raise(key.start, "Constructor can't be an async method"); }
      method.kind = "constructor";
      allowsDirectSuper = constructorAllowsSuper;
    } else if (method.static && key.type === "Identifier" && key.name === "prototype") {
      this.raise(key.start, "Classes may not have a static property named prototype");
    }
    this.parseClassMethod(method, isGenerator, isAsync, allowsDirectSuper);
    if (method.kind === "get" && method.value.params.length !== 0)
      { this.raiseRecoverable(method.value.start, "getter should have no params"); }
    if (method.kind === "set" && method.value.params.length !== 1)
      { this.raiseRecoverable(method.value.start, "setter should have exactly one param"); }
    if (method.kind === "set" && method.value.params[0].type === "RestElement")
      { this.raiseRecoverable(method.value.params[0].start, "Setter cannot use rest params"); }
    return method
  };

  pp$1.parseClassMethod = function(method, isGenerator, isAsync, allowsDirectSuper) {
    method.value = this.parseMethod(isGenerator, isAsync, allowsDirectSuper);
    return this.finishNode(method, "MethodDefinition")
  };

  pp$1.parseClassId = function(node, isStatement) {
    if (this.type === types.name) {
      node.id = this.parseIdent();
      if (isStatement)
        { this.checkLVal(node.id, BIND_LEXICAL, false); }
    } else {
      if (isStatement === true)
        { this.unexpected(); }
      node.id = null;
    }
  };

  pp$1.parseClassSuper = function(node) {
    node.superClass = this.eat(types._extends) ? this.parseExprSubscripts() : null;
  };

  // Parses module export declaration.

  pp$1.parseExport = function(node, exports) {
    this.next();
    // export * from '...'
    if (this.eat(types.star)) {
      this.expectContextual("from");
      if (this.type !== types.string) { this.unexpected(); }
      node.source = this.parseExprAtom();
      this.semicolon();
      return this.finishNode(node, "ExportAllDeclaration")
    }
    if (this.eat(types._default)) { // export default ...
      this.checkExport(exports, "default", this.lastTokStart);
      var isAsync;
      if (this.type === types._function || (isAsync = this.isAsyncFunction())) {
        var fNode = this.startNode();
        this.next();
        if (isAsync) { this.next(); }
        node.declaration = this.parseFunction(fNode, FUNC_STATEMENT | FUNC_NULLABLE_ID, false, isAsync);
      } else if (this.type === types._class) {
        var cNode = this.startNode();
        node.declaration = this.parseClass(cNode, "nullableID");
      } else {
        node.declaration = this.parseMaybeAssign();
        this.semicolon();
      }
      return this.finishNode(node, "ExportDefaultDeclaration")
    }
    // export var|const|let|function|class ...
    if (this.shouldParseExportStatement()) {
      node.declaration = this.parseStatement(null);
      if (node.declaration.type === "VariableDeclaration")
        { this.checkVariableExport(exports, node.declaration.declarations); }
      else
        { this.checkExport(exports, node.declaration.id.name, node.declaration.id.start); }
      node.specifiers = [];
      node.source = null;
    } else { // export { x, y as z } [from '...']
      node.declaration = null;
      node.specifiers = this.parseExportSpecifiers(exports);
      if (this.eatContextual("from")) {
        if (this.type !== types.string) { this.unexpected(); }
        node.source = this.parseExprAtom();
      } else {
        for (var i = 0, list = node.specifiers; i < list.length; i += 1) {
          // check for keywords used as local names
          var spec = list[i];

          this.checkUnreserved(spec.local);
          // check if export is defined
          this.checkLocalExport(spec.local);
        }

        node.source = null;
      }
      this.semicolon();
    }
    return this.finishNode(node, "ExportNamedDeclaration")
  };

  pp$1.checkExport = function(exports, name, pos) {
    if (!exports) { return }
    if (has(exports, name))
      { this.raiseRecoverable(pos, "Duplicate export '" + name + "'"); }
    exports[name] = true;
  };

  pp$1.checkPatternExport = function(exports, pat) {
    var type = pat.type;
    if (type === "Identifier")
      { this.checkExport(exports, pat.name, pat.start); }
    else if (type === "ObjectPattern")
      { for (var i = 0, list = pat.properties; i < list.length; i += 1)
        {
          var prop = list[i];

          this.checkPatternExport(exports, prop);
        } }
    else if (type === "ArrayPattern")
      { for (var i$1 = 0, list$1 = pat.elements; i$1 < list$1.length; i$1 += 1) {
        var elt = list$1[i$1];

          if (elt) { this.checkPatternExport(exports, elt); }
      } }
    else if (type === "Property")
      { this.checkPatternExport(exports, pat.value); }
    else if (type === "AssignmentPattern")
      { this.checkPatternExport(exports, pat.left); }
    else if (type === "RestElement")
      { this.checkPatternExport(exports, pat.argument); }
    else if (type === "ParenthesizedExpression")
      { this.checkPatternExport(exports, pat.expression); }
  };

  pp$1.checkVariableExport = function(exports, decls) {
    if (!exports) { return }
    for (var i = 0, list = decls; i < list.length; i += 1)
      {
      var decl = list[i];

      this.checkPatternExport(exports, decl.id);
    }
  };

  pp$1.shouldParseExportStatement = function() {
    return this.type.keyword === "var" ||
      this.type.keyword === "const" ||
      this.type.keyword === "class" ||
      this.type.keyword === "function" ||
      this.isLet() ||
      this.isAsyncFunction()
  };

  // Parses a comma-separated list of module exports.

  pp$1.parseExportSpecifiers = function(exports) {
    var nodes = [], first = true;
    // export { x, y as z } [from '...']
    this.expect(types.braceL);
    while (!this.eat(types.braceR)) {
      if (!first) {
        this.expect(types.comma);
        if (this.afterTrailingComma(types.braceR)) { break }
      } else { first = false; }

      var node = this.startNode();
      node.local = this.parseIdent(true);
      node.exported = this.eatContextual("as") ? this.parseIdent(true) : node.local;
      this.checkExport(exports, node.exported.name, node.exported.start);
      nodes.push(this.finishNode(node, "ExportSpecifier"));
    }
    return nodes
  };

  // Parses import declaration.

  pp$1.parseImport = function(node) {
    this.next();
    // import '...'
    if (this.type === types.string) {
      node.specifiers = empty;
      node.source = this.parseExprAtom();
    } else {
      node.specifiers = this.parseImportSpecifiers();
      this.expectContextual("from");
      node.source = this.type === types.string ? this.parseExprAtom() : this.unexpected();
    }
    this.semicolon();
    return this.finishNode(node, "ImportDeclaration")
  };

  // Parses a comma-separated list of module imports.

  pp$1.parseImportSpecifiers = function() {
    var nodes = [], first = true;
    if (this.type === types.name) {
      // import defaultObj, { x, y as z } from '...'
      var node = this.startNode();
      node.local = this.parseIdent();
      this.checkLVal(node.local, BIND_LEXICAL);
      nodes.push(this.finishNode(node, "ImportDefaultSpecifier"));
      if (!this.eat(types.comma)) { return nodes }
    }
    if (this.type === types.star) {
      var node$1 = this.startNode();
      this.next();
      this.expectContextual("as");
      node$1.local = this.parseIdent();
      this.checkLVal(node$1.local, BIND_LEXICAL);
      nodes.push(this.finishNode(node$1, "ImportNamespaceSpecifier"));
      return nodes
    }
    this.expect(types.braceL);
    while (!this.eat(types.braceR)) {
      if (!first) {
        this.expect(types.comma);
        if (this.afterTrailingComma(types.braceR)) { break }
      } else { first = false; }

      var node$2 = this.startNode();
      node$2.imported = this.parseIdent(true);
      if (this.eatContextual("as")) {
        node$2.local = this.parseIdent();
      } else {
        this.checkUnreserved(node$2.imported);
        node$2.local = node$2.imported;
      }
      this.checkLVal(node$2.local, BIND_LEXICAL);
      nodes.push(this.finishNode(node$2, "ImportSpecifier"));
    }
    return nodes
  };

  // Set `ExpressionStatement#directive` property for directive prologues.
  pp$1.adaptDirectivePrologue = function(statements) {
    for (var i = 0; i < statements.length && this.isDirectiveCandidate(statements[i]); ++i) {
      statements[i].directive = statements[i].expression.raw.slice(1, -1);
    }
  };
  pp$1.isDirectiveCandidate = function(statement) {
    return (
      statement.type === "ExpressionStatement" &&
      statement.expression.type === "Literal" &&
      typeof statement.expression.value === "string" &&
      // Reject parenthesized strings.
      (this.input[statement.start] === "\"" || this.input[statement.start] === "'")
    )
  };

  var pp$2 = Parser.prototype;

  // Convert existing expression atom to assignable pattern
  // if possible.

  pp$2.toAssignable = function(node, isBinding, refDestructuringErrors) {
    if (this.options.ecmaVersion >= 6 && node) {
      switch (node.type) {
      case "Identifier":
        if (this.inAsync && node.name === "await")
          { this.raise(node.start, "Cannot use 'await' as identifier inside an async function"); }
        break

      case "ObjectPattern":
      case "ArrayPattern":
      case "RestElement":
        break

      case "ObjectExpression":
        node.type = "ObjectPattern";
        if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
        for (var i = 0, list = node.properties; i < list.length; i += 1) {
          var prop = list[i];

        this.toAssignable(prop, isBinding);
          // Early error:
          //   AssignmentRestProperty[Yield, Await] :
          //     `...` DestructuringAssignmentTarget[Yield, Await]
          //
          //   It is a Syntax Error if |DestructuringAssignmentTarget| is an |ArrayLiteral| or an |ObjectLiteral|.
          if (
            prop.type === "RestElement" &&
            (prop.argument.type === "ArrayPattern" || prop.argument.type === "ObjectPattern")
          ) {
            this.raise(prop.argument.start, "Unexpected token");
          }
        }
        break

      case "Property":
        // AssignmentProperty has type === "Property"
        if (node.kind !== "init") { this.raise(node.key.start, "Object pattern can't contain getter or setter"); }
        this.toAssignable(node.value, isBinding);
        break

      case "ArrayExpression":
        node.type = "ArrayPattern";
        if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
        this.toAssignableList(node.elements, isBinding);
        break

      case "SpreadElement":
        node.type = "RestElement";
        this.toAssignable(node.argument, isBinding);
        if (node.argument.type === "AssignmentPattern")
          { this.raise(node.argument.start, "Rest elements cannot have a default value"); }
        break

      case "AssignmentExpression":
        if (node.operator !== "=") { this.raise(node.left.end, "Only '=' operator can be used for specifying default value."); }
        node.type = "AssignmentPattern";
        delete node.operator;
        this.toAssignable(node.left, isBinding);
        // falls through to AssignmentPattern

      case "AssignmentPattern":
        break

      case "ParenthesizedExpression":
        this.toAssignable(node.expression, isBinding, refDestructuringErrors);
        break

      case "MemberExpression":
        if (!isBinding) { break }

      default:
        this.raise(node.start, "Assigning to rvalue");
      }
    } else if (refDestructuringErrors) { this.checkPatternErrors(refDestructuringErrors, true); }
    return node
  };

  // Convert list of expression atoms to binding list.

  pp$2.toAssignableList = function(exprList, isBinding) {
    var end = exprList.length;
    for (var i = 0; i < end; i++) {
      var elt = exprList[i];
      if (elt) { this.toAssignable(elt, isBinding); }
    }
    if (end) {
      var last = exprList[end - 1];
      if (this.options.ecmaVersion === 6 && isBinding && last && last.type === "RestElement" && last.argument.type !== "Identifier")
        { this.unexpected(last.argument.start); }
    }
    return exprList
  };

  // Parses spread element.

  pp$2.parseSpread = function(refDestructuringErrors) {
    var node = this.startNode();
    this.next();
    node.argument = this.parseMaybeAssign(false, refDestructuringErrors);
    return this.finishNode(node, "SpreadElement")
  };

  pp$2.parseRestBinding = function() {
    var node = this.startNode();
    this.next();

    // RestElement inside of a function parameter must be an identifier
    if (this.options.ecmaVersion === 6 && this.type !== types.name)
      { this.unexpected(); }

    node.argument = this.parseBindingAtom();

    return this.finishNode(node, "RestElement")
  };

  // Parses lvalue (assignable) atom.

  pp$2.parseBindingAtom = function() {
    if (this.options.ecmaVersion >= 6) {
      switch (this.type) {
      case types.bracketL:
        var node = this.startNode();
        this.next();
        node.elements = this.parseBindingList(types.bracketR, true, true);
        return this.finishNode(node, "ArrayPattern")

      case types.braceL:
        return this.parseObj(true)
      }
    }
    return this.parseIdent()
  };

  pp$2.parseBindingList = function(close, allowEmpty, allowTrailingComma) {
    var elts = [], first = true;
    while (!this.eat(close)) {
      if (first) { first = false; }
      else { this.expect(types.comma); }
      if (allowEmpty && this.type === types.comma) {
        elts.push(null);
      } else if (allowTrailingComma && this.afterTrailingComma(close)) {
        break
      } else if (this.type === types.ellipsis) {
        var rest = this.parseRestBinding();
        this.parseBindingListItem(rest);
        elts.push(rest);
        if (this.type === types.comma) { this.raise(this.start, "Comma is not permitted after the rest element"); }
        this.expect(close);
        break
      } else {
        var elem = this.parseMaybeDefault(this.start, this.startLoc);
        this.parseBindingListItem(elem);
        elts.push(elem);
      }
    }
    return elts
  };

  pp$2.parseBindingListItem = function(param) {
    return param
  };

  // Parses assignment pattern around given atom if possible.

  pp$2.parseMaybeDefault = function(startPos, startLoc, left) {
    left = left || this.parseBindingAtom();
    if (this.options.ecmaVersion < 6 || !this.eat(types.eq)) { return left }
    var node = this.startNodeAt(startPos, startLoc);
    node.left = left;
    node.right = this.parseMaybeAssign();
    return this.finishNode(node, "AssignmentPattern")
  };

  // Verify that a node is an lval — something that can be assigned
  // to.
  // bindingType can be either:
  // 'var' indicating that the lval creates a 'var' binding
  // 'let' indicating that the lval creates a lexical ('let' or 'const') binding
  // 'none' indicating that the binding should be checked for illegal identifiers, but not for duplicate references

  pp$2.checkLVal = function(expr, bindingType, checkClashes) {
    if ( bindingType === void 0 ) { bindingType = BIND_NONE; }

    switch (expr.type) {
    case "Identifier":
      if (bindingType === BIND_LEXICAL && expr.name === "let")
        { this.raiseRecoverable(expr.start, "let is disallowed as a lexically bound name"); }
      if (this.strict && this.reservedWordsStrictBind.test(expr.name))
        { this.raiseRecoverable(expr.start, (bindingType ? "Binding " : "Assigning to ") + expr.name + " in strict mode"); }
      if (checkClashes) {
        if (has(checkClashes, expr.name))
          { this.raiseRecoverable(expr.start, "Argument name clash"); }
        checkClashes[expr.name] = true;
      }
      if (bindingType !== BIND_NONE && bindingType !== BIND_OUTSIDE) { this.declareName(expr.name, bindingType, expr.start); }
      break

    case "MemberExpression":
      if (bindingType) { this.raiseRecoverable(expr.start, "Binding member expression"); }
      break

    case "ObjectPattern":
      for (var i = 0, list = expr.properties; i < list.length; i += 1)
        {
      var prop = list[i];

      this.checkLVal(prop, bindingType, checkClashes);
    }
      break

    case "Property":
      // AssignmentProperty has type === "Property"
      this.checkLVal(expr.value, bindingType, checkClashes);
      break

    case "ArrayPattern":
      for (var i$1 = 0, list$1 = expr.elements; i$1 < list$1.length; i$1 += 1) {
        var elem = list$1[i$1];

      if (elem) { this.checkLVal(elem, bindingType, checkClashes); }
      }
      break

    case "AssignmentPattern":
      this.checkLVal(expr.left, bindingType, checkClashes);
      break

    case "RestElement":
      this.checkLVal(expr.argument, bindingType, checkClashes);
      break

    case "ParenthesizedExpression":
      this.checkLVal(expr.expression, bindingType, checkClashes);
      break

    default:
      this.raise(expr.start, (bindingType ? "Binding" : "Assigning to") + " rvalue");
    }
  };

  // A recursive descent parser operates by defining functions for all

  var pp$3 = Parser.prototype;

  // Check if property name clashes with already added.
  // Object/class getters and setters are not allowed to clash —
  // either with each other or with an init property — and in
  // strict mode, init properties are also not allowed to be repeated.

  pp$3.checkPropClash = function(prop, propHash, refDestructuringErrors) {
    if (this.options.ecmaVersion >= 9 && prop.type === "SpreadElement")
      { return }
    if (this.options.ecmaVersion >= 6 && (prop.computed || prop.method || prop.shorthand))
      { return }
    var key = prop.key;
    var name;
    switch (key.type) {
    case "Identifier": name = key.name; break
    case "Literal": name = String(key.value); break
    default: return
    }
    var kind = prop.kind;
    if (this.options.ecmaVersion >= 6) {
      if (name === "__proto__" && kind === "init") {
        if (propHash.proto) {
          if (refDestructuringErrors && refDestructuringErrors.doubleProto < 0) { refDestructuringErrors.doubleProto = key.start; }
          // Backwards-compat kludge. Can be removed in version 6.0
          else { this.raiseRecoverable(key.start, "Redefinition of __proto__ property"); }
        }
        propHash.proto = true;
      }
      return
    }
    name = "$" + name;
    var other = propHash[name];
    if (other) {
      var redefinition;
      if (kind === "init") {
        redefinition = this.strict && other.init || other.get || other.set;
      } else {
        redefinition = other.init || other[kind];
      }
      if (redefinition)
        { this.raiseRecoverable(key.start, "Redefinition of property"); }
    } else {
      other = propHash[name] = {
        init: false,
        get: false,
        set: false
      };
    }
    other[kind] = true;
  };

  // ### Expression parsing

  // These nest, from the most general expression type at the top to
  // 'atomic', nondivisible expression types at the bottom. Most of
  // the functions will simply let the function(s) below them parse,
  // and, *if* the syntactic construct they handle is present, wrap
  // the AST node that the inner parser gave them in another node.

  // Parse a full expression. The optional arguments are used to
  // forbid the `in` operator (in for loops initalization expressions)
  // and provide reference for storing '=' operator inside shorthand
  // property assignment in contexts where both object expression
  // and object pattern might appear (so it's possible to raise
  // delayed syntax error at correct position).

  pp$3.parseExpression = function(noIn, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc;
    var expr = this.parseMaybeAssign(noIn, refDestructuringErrors);
    if (this.type === types.comma) {
      var node = this.startNodeAt(startPos, startLoc);
      node.expressions = [expr];
      while (this.eat(types.comma)) { node.expressions.push(this.parseMaybeAssign(noIn, refDestructuringErrors)); }
      return this.finishNode(node, "SequenceExpression")
    }
    return expr
  };

  // Parse an assignment expression. This includes applications of
  // operators like `+=`.

  pp$3.parseMaybeAssign = function(noIn, refDestructuringErrors, afterLeftParse) {
    if (this.isContextual("yield")) {
      if (this.inGenerator) { return this.parseYield(noIn) }
      // The tokenizer will assume an expression is allowed after
      // `yield`, but this isn't that kind of yield
      else { this.exprAllowed = false; }
    }

    var ownDestructuringErrors = false, oldParenAssign = -1, oldTrailingComma = -1, oldShorthandAssign = -1;
    if (refDestructuringErrors) {
      oldParenAssign = refDestructuringErrors.parenthesizedAssign;
      oldTrailingComma = refDestructuringErrors.trailingComma;
      oldShorthandAssign = refDestructuringErrors.shorthandAssign;
      refDestructuringErrors.parenthesizedAssign = refDestructuringErrors.trailingComma = refDestructuringErrors.shorthandAssign = -1;
    } else {
      refDestructuringErrors = new DestructuringErrors;
      ownDestructuringErrors = true;
    }

    var startPos = this.start, startLoc = this.startLoc;
    if (this.type === types.parenL || this.type === types.name)
      { this.potentialArrowAt = this.start; }
    var left = this.parseMaybeConditional(noIn, refDestructuringErrors);
    if (afterLeftParse) { left = afterLeftParse.call(this, left, startPos, startLoc); }
    if (this.type.isAssign) {
      var node = this.startNodeAt(startPos, startLoc);
      node.operator = this.value;
      node.left = this.type === types.eq ? this.toAssignable(left, false, refDestructuringErrors) : left;
      if (!ownDestructuringErrors) { DestructuringErrors.call(refDestructuringErrors); }
      refDestructuringErrors.shorthandAssign = -1; // reset because shorthand default was used correctly
      this.checkLVal(left);
      this.next();
      node.right = this.parseMaybeAssign(noIn);
      return this.finishNode(node, "AssignmentExpression")
    } else {
      if (ownDestructuringErrors) { this.checkExpressionErrors(refDestructuringErrors, true); }
    }
    if (oldParenAssign > -1) { refDestructuringErrors.parenthesizedAssign = oldParenAssign; }
    if (oldTrailingComma > -1) { refDestructuringErrors.trailingComma = oldTrailingComma; }
    if (oldShorthandAssign > -1) { refDestructuringErrors.shorthandAssign = oldShorthandAssign; }
    return left
  };

  // Parse a ternary conditional (`?:`) operator.

  pp$3.parseMaybeConditional = function(noIn, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc;
    var expr = this.parseExprOps(noIn, refDestructuringErrors);
    if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
    if (this.eat(types.question)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.test = expr;
      node.consequent = this.parseMaybeAssign();
      this.expect(types.colon);
      node.alternate = this.parseMaybeAssign(noIn);
      return this.finishNode(node, "ConditionalExpression")
    }
    return expr
  };

  // Start the precedence parser.

  pp$3.parseExprOps = function(noIn, refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc;
    var expr = this.parseMaybeUnary(refDestructuringErrors, false);
    if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
    return expr.start === startPos && expr.type === "ArrowFunctionExpression" ? expr : this.parseExprOp(expr, startPos, startLoc, -1, noIn)
  };

  // Parse binary operators with the operator precedence parsing
  // algorithm. `left` is the left-hand side of the operator.
  // `minPrec` provides context that allows the function to stop and
  // defer further parser to one of its callers when it encounters an
  // operator that has a lower precedence than the set it is parsing.

  pp$3.parseExprOp = function(left, leftStartPos, leftStartLoc, minPrec, noIn) {
    var prec = this.type.binop;
    if (prec != null && (!noIn || this.type !== types._in)) {
      if (prec > minPrec) {
        var logical = this.type === types.logicalOR || this.type === types.logicalAND;
        var op = this.value;
        this.next();
        var startPos = this.start, startLoc = this.startLoc;
        var right = this.parseExprOp(this.parseMaybeUnary(null, false), startPos, startLoc, prec, noIn);
        var node = this.buildBinary(leftStartPos, leftStartLoc, left, right, op, logical);
        return this.parseExprOp(node, leftStartPos, leftStartLoc, minPrec, noIn)
      }
    }
    return left
  };

  pp$3.buildBinary = function(startPos, startLoc, left, right, op, logical) {
    var node = this.startNodeAt(startPos, startLoc);
    node.left = left;
    node.operator = op;
    node.right = right;
    return this.finishNode(node, logical ? "LogicalExpression" : "BinaryExpression")
  };

  // Parse unary operators, both prefix and postfix.

  pp$3.parseMaybeUnary = function(refDestructuringErrors, sawUnary) {
    var startPos = this.start, startLoc = this.startLoc, expr;
    if (this.isContextual("await") && (this.inAsync || (!this.inFunction && this.options.allowAwaitOutsideFunction))) {
      expr = this.parseAwait();
      sawUnary = true;
    } else if (this.type.prefix) {
      var node = this.startNode(), update = this.type === types.incDec;
      node.operator = this.value;
      node.prefix = true;
      this.next();
      node.argument = this.parseMaybeUnary(null, true);
      this.checkExpressionErrors(refDestructuringErrors, true);
      if (update) { this.checkLVal(node.argument); }
      else if (this.strict && node.operator === "delete" &&
               node.argument.type === "Identifier")
        { this.raiseRecoverable(node.start, "Deleting local variable in strict mode"); }
      else { sawUnary = true; }
      expr = this.finishNode(node, update ? "UpdateExpression" : "UnaryExpression");
    } else {
      expr = this.parseExprSubscripts(refDestructuringErrors);
      if (this.checkExpressionErrors(refDestructuringErrors)) { return expr }
      while (this.type.postfix && !this.canInsertSemicolon()) {
        var node$1 = this.startNodeAt(startPos, startLoc);
        node$1.operator = this.value;
        node$1.prefix = false;
        node$1.argument = expr;
        this.checkLVal(expr);
        this.next();
        expr = this.finishNode(node$1, "UpdateExpression");
      }
    }

    if (!sawUnary && this.eat(types.starstar))
      { return this.buildBinary(startPos, startLoc, expr, this.parseMaybeUnary(null, false), "**", false) }
    else
      { return expr }
  };

  // Parse call, dot, and `[]`-subscript expressions.

  pp$3.parseExprSubscripts = function(refDestructuringErrors) {
    var startPos = this.start, startLoc = this.startLoc;
    var expr = this.parseExprAtom(refDestructuringErrors);
    var skipArrowSubscripts = expr.type === "ArrowFunctionExpression" && this.input.slice(this.lastTokStart, this.lastTokEnd) !== ")";
    if (this.checkExpressionErrors(refDestructuringErrors) || skipArrowSubscripts) { return expr }
    var result = this.parseSubscripts(expr, startPos, startLoc);
    if (refDestructuringErrors && result.type === "MemberExpression") {
      if (refDestructuringErrors.parenthesizedAssign >= result.start) { refDestructuringErrors.parenthesizedAssign = -1; }
      if (refDestructuringErrors.parenthesizedBind >= result.start) { refDestructuringErrors.parenthesizedBind = -1; }
    }
    return result
  };

  pp$3.parseSubscripts = function(base, startPos, startLoc, noCalls) {
    var maybeAsyncArrow = this.options.ecmaVersion >= 8 && base.type === "Identifier" && base.name === "async" &&
        this.lastTokEnd === base.end && !this.canInsertSemicolon() && this.input.slice(base.start, base.end) === "async";
    while (true) {
      var element = this.parseSubscript(base, startPos, startLoc, noCalls, maybeAsyncArrow);
      if (element === base || element.type === "ArrowFunctionExpression") { return element }
      base = element;
    }
  };

  pp$3.parseSubscript = function(base, startPos, startLoc, noCalls, maybeAsyncArrow) {
    var computed = this.eat(types.bracketL);
    if (computed || this.eat(types.dot)) {
      var node = this.startNodeAt(startPos, startLoc);
      node.object = base;
      node.property = computed ? this.parseExpression() : this.parseIdent(this.options.allowReserved !== "never");
      node.computed = !!computed;
      if (computed) { this.expect(types.bracketR); }
      base = this.finishNode(node, "MemberExpression");
    } else if (!noCalls && this.eat(types.parenL)) {
      var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;
      this.yieldPos = 0;
      this.awaitPos = 0;
      this.awaitIdentPos = 0;
      var exprList = this.parseExprList(types.parenR, this.options.ecmaVersion >= 8 && base.type !== "Import", false, refDestructuringErrors);
      if (maybeAsyncArrow && !this.canInsertSemicolon() && this.eat(types.arrow)) {
        this.checkPatternErrors(refDestructuringErrors, false);
        this.checkYieldAwaitInDefaultParams();
        if (this.awaitIdentPos > 0)
          { this.raise(this.awaitIdentPos, "Cannot use 'await' as identifier inside an async function"); }
        this.yieldPos = oldYieldPos;
        this.awaitPos = oldAwaitPos;
        this.awaitIdentPos = oldAwaitIdentPos;
        return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList, true)
      }
      this.checkExpressionErrors(refDestructuringErrors, true);
      this.yieldPos = oldYieldPos || this.yieldPos;
      this.awaitPos = oldAwaitPos || this.awaitPos;
      this.awaitIdentPos = oldAwaitIdentPos || this.awaitIdentPos;
      var node$1 = this.startNodeAt(startPos, startLoc);
      node$1.callee = base;
      node$1.arguments = exprList;
      if (node$1.callee.type === "Import") {
        if (node$1.arguments.length !== 1) {
          this.raise(node$1.start, "import() requires exactly one argument");
        }

        var importArg = node$1.arguments[0];
        if (importArg && importArg.type === "SpreadElement") {
          this.raise(importArg.start, "... is not allowed in import()");
        }
      }
      base = this.finishNode(node$1, "CallExpression");
    } else if (this.type === types.backQuote) {
      var node$2 = this.startNodeAt(startPos, startLoc);
      node$2.tag = base;
      node$2.quasi = this.parseTemplate({isTagged: true});
      base = this.finishNode(node$2, "TaggedTemplateExpression");
    }
    return base
  };

  // Parse an atomic expression — either a single token that is an
  // expression, an expression started by a keyword like `function` or
  // `new`, or an expression wrapped in punctuation like `()`, `[]`,
  // or `{}`.

  pp$3.parseExprAtom = function(refDestructuringErrors) {
    // If a division operator appears in an expression position, the
    // tokenizer got confused, and we force it to read a regexp instead.
    if (this.type === types.slash) { this.readRegexp(); }

    var node, canBeArrow = this.potentialArrowAt === this.start;
    switch (this.type) {
    case types._super:
      if (!this.allowSuper)
        { this.raise(this.start, "'super' keyword outside a method"); }
      node = this.startNode();
      this.next();
      if (this.type === types.parenL && !this.allowDirectSuper)
        { this.raise(node.start, "super() call outside constructor of a subclass"); }
      // The `super` keyword can appear at below:
      // SuperProperty:
      //     super [ Expression ]
      //     super . IdentifierName
      // SuperCall:
      //     super Arguments
      if (this.type !== types.dot && this.type !== types.bracketL && this.type !== types.parenL)
        { this.unexpected(); }
      return this.finishNode(node, "Super")

    case types._this:
      node = this.startNode();
      this.next();
      return this.finishNode(node, "ThisExpression")

    case types.name:
      var startPos = this.start, startLoc = this.startLoc, containsEsc = this.containsEsc;
      var id = this.parseIdent(false);
      if (this.options.ecmaVersion >= 8 && !containsEsc && id.name === "async" && !this.canInsertSemicolon() && this.eat(types._function))
        { return this.parseFunction(this.startNodeAt(startPos, startLoc), 0, false, true) }
      if (canBeArrow && !this.canInsertSemicolon()) {
        if (this.eat(types.arrow))
          { return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], false) }
        if (this.options.ecmaVersion >= 8 && id.name === "async" && this.type === types.name && !containsEsc) {
          id = this.parseIdent(false);
          if (this.canInsertSemicolon() || !this.eat(types.arrow))
            { this.unexpected(); }
          return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), [id], true)
        }
      }
      return id

    case types.regexp:
      var value = this.value;
      node = this.parseLiteral(value.value);
      node.regex = {pattern: value.pattern, flags: value.flags};
      return node

    case types.num: case types.string:
      return this.parseLiteral(this.value)

    case types._null: case types._true: case types._false:
      node = this.startNode();
      node.value = this.type === types._null ? null : this.type === types._true;
      node.raw = this.type.keyword;
      this.next();
      return this.finishNode(node, "Literal")

    case types.parenL:
      var start = this.start, expr = this.parseParenAndDistinguishExpression(canBeArrow);
      if (refDestructuringErrors) {
        if (refDestructuringErrors.parenthesizedAssign < 0 && !this.isSimpleAssignTarget(expr))
          { refDestructuringErrors.parenthesizedAssign = start; }
        if (refDestructuringErrors.parenthesizedBind < 0)
          { refDestructuringErrors.parenthesizedBind = start; }
      }
      return expr

    case types.bracketL:
      node = this.startNode();
      this.next();
      node.elements = this.parseExprList(types.bracketR, true, true, refDestructuringErrors);
      return this.finishNode(node, "ArrayExpression")

    case types.braceL:
      return this.parseObj(false, refDestructuringErrors)

    case types._function:
      node = this.startNode();
      this.next();
      return this.parseFunction(node, 0)

    case types._class:
      return this.parseClass(this.startNode(), false)

    case types._new:
      return this.parseNew()

    case types.backQuote:
      return this.parseTemplate()

    case types._import:
      if (this.options.ecmaVersion > 10) {
        return this.parseDynamicImport()
      } else {
        return this.unexpected()
      }

    default:
      this.unexpected();
    }
  };

  pp$3.parseDynamicImport = function() {
    var node = this.startNode();
    this.next();
    if (this.type !== types.parenL) {
      this.unexpected();
    }
    return this.finishNode(node, "Import")
  };

  pp$3.parseLiteral = function(value) {
    var node = this.startNode();
    node.value = value;
    node.raw = this.input.slice(this.start, this.end);
    if (node.raw.charCodeAt(node.raw.length - 1) === 110) { node.bigint = node.raw.slice(0, -1); }
    this.next();
    return this.finishNode(node, "Literal")
  };

  pp$3.parseParenExpression = function() {
    this.expect(types.parenL);
    var val = this.parseExpression();
    this.expect(types.parenR);
    return val
  };

  pp$3.parseParenAndDistinguishExpression = function(canBeArrow) {
    var startPos = this.start, startLoc = this.startLoc, val, allowTrailingComma = this.options.ecmaVersion >= 8;
    if (this.options.ecmaVersion >= 6) {
      this.next();

      var innerStartPos = this.start, innerStartLoc = this.startLoc;
      var exprList = [], first = true, lastIsComma = false;
      var refDestructuringErrors = new DestructuringErrors, oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, spreadStart;
      this.yieldPos = 0;
      this.awaitPos = 0;
      // Do not save awaitIdentPos to allow checking awaits nested in parameters
      while (this.type !== types.parenR) {
        first ? first = false : this.expect(types.comma);
        if (allowTrailingComma && this.afterTrailingComma(types.parenR, true)) {
          lastIsComma = true;
          break
        } else if (this.type === types.ellipsis) {
          spreadStart = this.start;
          exprList.push(this.parseParenItem(this.parseRestBinding()));
          if (this.type === types.comma) { this.raise(this.start, "Comma is not permitted after the rest element"); }
          break
        } else {
          exprList.push(this.parseMaybeAssign(false, refDestructuringErrors, this.parseParenItem));
        }
      }
      var innerEndPos = this.start, innerEndLoc = this.startLoc;
      this.expect(types.parenR);

      if (canBeArrow && !this.canInsertSemicolon() && this.eat(types.arrow)) {
        this.checkPatternErrors(refDestructuringErrors, false);
        this.checkYieldAwaitInDefaultParams();
        this.yieldPos = oldYieldPos;
        this.awaitPos = oldAwaitPos;
        return this.parseParenArrowList(startPos, startLoc, exprList)
      }

      if (!exprList.length || lastIsComma) { this.unexpected(this.lastTokStart); }
      if (spreadStart) { this.unexpected(spreadStart); }
      this.checkExpressionErrors(refDestructuringErrors, true);
      this.yieldPos = oldYieldPos || this.yieldPos;
      this.awaitPos = oldAwaitPos || this.awaitPos;

      if (exprList.length > 1) {
        val = this.startNodeAt(innerStartPos, innerStartLoc);
        val.expressions = exprList;
        this.finishNodeAt(val, "SequenceExpression", innerEndPos, innerEndLoc);
      } else {
        val = exprList[0];
      }
    } else {
      val = this.parseParenExpression();
    }

    if (this.options.preserveParens) {
      var par = this.startNodeAt(startPos, startLoc);
      par.expression = val;
      return this.finishNode(par, "ParenthesizedExpression")
    } else {
      return val
    }
  };

  pp$3.parseParenItem = function(item) {
    return item
  };

  pp$3.parseParenArrowList = function(startPos, startLoc, exprList) {
    return this.parseArrowExpression(this.startNodeAt(startPos, startLoc), exprList)
  };

  // New's precedence is slightly tricky. It must allow its argument to
  // be a `[]` or dot subscript expression, but not a call — at least,
  // not without wrapping it in parentheses. Thus, it uses the noCalls
  // argument to parseSubscripts to prevent it from consuming the
  // argument list.

  var empty$1 = [];

  pp$3.parseNew = function() {
    var node = this.startNode();
    var meta = this.parseIdent(true);
    if (this.options.ecmaVersion >= 6 && this.eat(types.dot)) {
      node.meta = meta;
      var containsEsc = this.containsEsc;
      node.property = this.parseIdent(true);
      if (node.property.name !== "target" || containsEsc)
        { this.raiseRecoverable(node.property.start, "The only valid meta property for new is new.target"); }
      if (!this.inNonArrowFunction())
        { this.raiseRecoverable(node.start, "new.target can only be used in functions"); }
      return this.finishNode(node, "MetaProperty")
    }
    var startPos = this.start, startLoc = this.startLoc;
    node.callee = this.parseSubscripts(this.parseExprAtom(), startPos, startLoc, true);
    if (this.options.ecmaVersion > 10 && node.callee.type === "Import") {
      this.raise(node.callee.start, "Cannot use new with import(...)");
    }
    if (this.eat(types.parenL)) { node.arguments = this.parseExprList(types.parenR, this.options.ecmaVersion >= 8 && node.callee.type !== "Import", false); }
    else { node.arguments = empty$1; }
    return this.finishNode(node, "NewExpression")
  };

  // Parse template expression.

  pp$3.parseTemplateElement = function(ref) {
    var isTagged = ref.isTagged;

    var elem = this.startNode();
    if (this.type === types.invalidTemplate) {
      if (!isTagged) {
        this.raiseRecoverable(this.start, "Bad escape sequence in untagged template literal");
      }
      elem.value = {
        raw: this.value,
        cooked: null
      };
    } else {
      elem.value = {
        raw: this.input.slice(this.start, this.end).replace(/\r\n?/g, "\n"),
        cooked: this.value
      };
    }
    this.next();
    elem.tail = this.type === types.backQuote;
    return this.finishNode(elem, "TemplateElement")
  };

  pp$3.parseTemplate = function(ref) {
    if ( ref === void 0 ) { ref = {}; }
    var isTagged = ref.isTagged; if ( isTagged === void 0 ) { isTagged = false; }

    var node = this.startNode();
    this.next();
    node.expressions = [];
    var curElt = this.parseTemplateElement({isTagged: isTagged});
    node.quasis = [curElt];
    while (!curElt.tail) {
      if (this.type === types.eof) { this.raise(this.pos, "Unterminated template literal"); }
      this.expect(types.dollarBraceL);
      node.expressions.push(this.parseExpression());
      this.expect(types.braceR);
      node.quasis.push(curElt = this.parseTemplateElement({isTagged: isTagged}));
    }
    this.next();
    return this.finishNode(node, "TemplateLiteral")
  };

  pp$3.isAsyncProp = function(prop) {
    return !prop.computed && prop.key.type === "Identifier" && prop.key.name === "async" &&
      (this.type === types.name || this.type === types.num || this.type === types.string || this.type === types.bracketL || this.type.keyword || (this.options.ecmaVersion >= 9 && this.type === types.star)) &&
      !lineBreak.test(this.input.slice(this.lastTokEnd, this.start))
  };

  // Parse an object literal or binding pattern.

  pp$3.parseObj = function(isPattern, refDestructuringErrors) {
    var node = this.startNode(), first = true, propHash = {};
    node.properties = [];
    this.next();
    while (!this.eat(types.braceR)) {
      if (!first) {
        this.expect(types.comma);
        if (this.afterTrailingComma(types.braceR)) { break }
      } else { first = false; }

      var prop = this.parseProperty(isPattern, refDestructuringErrors);
      if (!isPattern) { this.checkPropClash(prop, propHash, refDestructuringErrors); }
      node.properties.push(prop);
    }
    return this.finishNode(node, isPattern ? "ObjectPattern" : "ObjectExpression")
  };

  pp$3.parseProperty = function(isPattern, refDestructuringErrors) {
    var prop = this.startNode(), isGenerator, isAsync, startPos, startLoc;
    if (this.options.ecmaVersion >= 9 && this.eat(types.ellipsis)) {
      if (isPattern) {
        prop.argument = this.parseIdent(false);
        if (this.type === types.comma) {
          this.raise(this.start, "Comma is not permitted after the rest element");
        }
        return this.finishNode(prop, "RestElement")
      }
      // To disallow parenthesized identifier via `this.toAssignable()`.
      if (this.type === types.parenL && refDestructuringErrors) {
        if (refDestructuringErrors.parenthesizedAssign < 0) {
          refDestructuringErrors.parenthesizedAssign = this.start;
        }
        if (refDestructuringErrors.parenthesizedBind < 0) {
          refDestructuringErrors.parenthesizedBind = this.start;
        }
      }
      // Parse argument.
      prop.argument = this.parseMaybeAssign(false, refDestructuringErrors);
      // To disallow trailing comma via `this.toAssignable()`.
      if (this.type === types.comma && refDestructuringErrors && refDestructuringErrors.trailingComma < 0) {
        refDestructuringErrors.trailingComma = this.start;
      }
      // Finish
      return this.finishNode(prop, "SpreadElement")
    }
    if (this.options.ecmaVersion >= 6) {
      prop.method = false;
      prop.shorthand = false;
      if (isPattern || refDestructuringErrors) {
        startPos = this.start;
        startLoc = this.startLoc;
      }
      if (!isPattern)
        { isGenerator = this.eat(types.star); }
    }
    var containsEsc = this.containsEsc;
    this.parsePropertyName(prop);
    if (!isPattern && !containsEsc && this.options.ecmaVersion >= 8 && !isGenerator && this.isAsyncProp(prop)) {
      isAsync = true;
      isGenerator = this.options.ecmaVersion >= 9 && this.eat(types.star);
      this.parsePropertyName(prop, refDestructuringErrors);
    } else {
      isAsync = false;
    }
    this.parsePropertyValue(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc);
    return this.finishNode(prop, "Property")
  };

  pp$3.parsePropertyValue = function(prop, isPattern, isGenerator, isAsync, startPos, startLoc, refDestructuringErrors, containsEsc) {
    if ((isGenerator || isAsync) && this.type === types.colon)
      { this.unexpected(); }

    if (this.eat(types.colon)) {
      prop.value = isPattern ? this.parseMaybeDefault(this.start, this.startLoc) : this.parseMaybeAssign(false, refDestructuringErrors);
      prop.kind = "init";
    } else if (this.options.ecmaVersion >= 6 && this.type === types.parenL) {
      if (isPattern) { this.unexpected(); }
      prop.kind = "init";
      prop.method = true;
      prop.value = this.parseMethod(isGenerator, isAsync);
    } else if (!isPattern && !containsEsc &&
               this.options.ecmaVersion >= 5 && !prop.computed && prop.key.type === "Identifier" &&
               (prop.key.name === "get" || prop.key.name === "set") &&
               (this.type !== types.comma && this.type !== types.braceR)) {
      if (isGenerator || isAsync) { this.unexpected(); }
      prop.kind = prop.key.name;
      this.parsePropertyName(prop);
      prop.value = this.parseMethod(false);
      var paramCount = prop.kind === "get" ? 0 : 1;
      if (prop.value.params.length !== paramCount) {
        var start = prop.value.start;
        if (prop.kind === "get")
          { this.raiseRecoverable(start, "getter should have no params"); }
        else
          { this.raiseRecoverable(start, "setter should have exactly one param"); }
      } else {
        if (prop.kind === "set" && prop.value.params[0].type === "RestElement")
          { this.raiseRecoverable(prop.value.params[0].start, "Setter cannot use rest params"); }
      }
    } else if (this.options.ecmaVersion >= 6 && !prop.computed && prop.key.type === "Identifier") {
      if (isGenerator || isAsync) { this.unexpected(); }
      this.checkUnreserved(prop.key);
      if (prop.key.name === "await" && !this.awaitIdentPos)
        { this.awaitIdentPos = startPos; }
      prop.kind = "init";
      if (isPattern) {
        prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
      } else if (this.type === types.eq && refDestructuringErrors) {
        if (refDestructuringErrors.shorthandAssign < 0)
          { refDestructuringErrors.shorthandAssign = this.start; }
        prop.value = this.parseMaybeDefault(startPos, startLoc, prop.key);
      } else {
        prop.value = prop.key;
      }
      prop.shorthand = true;
    } else { this.unexpected(); }
  };

  pp$3.parsePropertyName = function(prop) {
    if (this.options.ecmaVersion >= 6) {
      if (this.eat(types.bracketL)) {
        prop.computed = true;
        prop.key = this.parseMaybeAssign();
        this.expect(types.bracketR);
        return prop.key
      } else {
        prop.computed = false;
      }
    }
    return prop.key = this.type === types.num || this.type === types.string ? this.parseExprAtom() : this.parseIdent(this.options.allowReserved !== "never")
  };

  // Initialize empty function node.

  pp$3.initFunction = function(node) {
    node.id = null;
    if (this.options.ecmaVersion >= 6) { node.generator = node.expression = false; }
    if (this.options.ecmaVersion >= 8) { node.async = false; }
  };

  // Parse object or class method.

  pp$3.parseMethod = function(isGenerator, isAsync, allowDirectSuper) {
    var node = this.startNode(), oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;

    this.initFunction(node);
    if (this.options.ecmaVersion >= 6)
      { node.generator = isGenerator; }
    if (this.options.ecmaVersion >= 8)
      { node.async = !!isAsync; }

    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;
    this.enterScope(functionFlags(isAsync, node.generator) | SCOPE_SUPER | (allowDirectSuper ? SCOPE_DIRECT_SUPER : 0));

    this.expect(types.parenL);
    node.params = this.parseBindingList(types.parenR, false, this.options.ecmaVersion >= 8);
    this.checkYieldAwaitInDefaultParams();
    this.parseFunctionBody(node, false, true);

    this.yieldPos = oldYieldPos;
    this.awaitPos = oldAwaitPos;
    this.awaitIdentPos = oldAwaitIdentPos;
    return this.finishNode(node, "FunctionExpression")
  };

  // Parse arrow function expression with given parameters.

  pp$3.parseArrowExpression = function(node, params, isAsync) {
    var oldYieldPos = this.yieldPos, oldAwaitPos = this.awaitPos, oldAwaitIdentPos = this.awaitIdentPos;

    this.enterScope(functionFlags(isAsync, false) | SCOPE_ARROW);
    this.initFunction(node);
    if (this.options.ecmaVersion >= 8) { node.async = !!isAsync; }

    this.yieldPos = 0;
    this.awaitPos = 0;
    this.awaitIdentPos = 0;

    node.params = this.toAssignableList(params, true);
    this.parseFunctionBody(node, true, false);

    this.yieldPos = oldYieldPos;
    this.awaitPos = oldAwaitPos;
    this.awaitIdentPos = oldAwaitIdentPos;
    return this.finishNode(node, "ArrowFunctionExpression")
  };

  // Parse function body and check parameters.

  pp$3.parseFunctionBody = function(node, isArrowFunction, isMethod) {
    var isExpression = isArrowFunction && this.type !== types.braceL;
    var oldStrict = this.strict, useStrict = false;

    if (isExpression) {
      node.body = this.parseMaybeAssign();
      node.expression = true;
      this.checkParams(node, false);
    } else {
      var nonSimple = this.options.ecmaVersion >= 7 && !this.isSimpleParamList(node.params);
      if (!oldStrict || nonSimple) {
        useStrict = this.strictDirective(this.end);
        // If this is a strict mode function, verify that argument names
        // are not repeated, and it does not try to bind the words `eval`
        // or `arguments`.
        if (useStrict && nonSimple)
          { this.raiseRecoverable(node.start, "Illegal 'use strict' directive in function with non-simple parameter list"); }
      }
      // Start a new scope with regard to labels and the `inFunction`
      // flag (restore them to their old value afterwards).
      var oldLabels = this.labels;
      this.labels = [];
      if (useStrict) { this.strict = true; }

      // Add the params to varDeclaredNames to ensure that an error is thrown
      // if a let/const declaration in the function clashes with one of the params.
      this.checkParams(node, !oldStrict && !useStrict && !isArrowFunction && !isMethod && this.isSimpleParamList(node.params));
      node.body = this.parseBlock(false);
      node.expression = false;
      this.adaptDirectivePrologue(node.body.body);
      this.labels = oldLabels;
    }
    this.exitScope();

    // Ensure the function name isn't a forbidden identifier in strict mode, e.g. 'eval'
    if (this.strict && node.id) { this.checkLVal(node.id, BIND_OUTSIDE); }
    this.strict = oldStrict;
  };

  pp$3.isSimpleParamList = function(params) {
    for (var i = 0, list = params; i < list.length; i += 1)
      {
      var param = list[i];

      if (param.type !== "Identifier") { return false
    } }
    return true
  };

  // Checks function params for various disallowed patterns such as using "eval"
  // or "arguments" and duplicate parameters.

  pp$3.checkParams = function(node, allowDuplicates) {
    var nameHash = {};
    for (var i = 0, list = node.params; i < list.length; i += 1)
      {
      var param = list[i];

      this.checkLVal(param, BIND_VAR, allowDuplicates ? null : nameHash);
    }
  };

  // Parses a comma-separated list of expressions, and returns them as
  // an array. `close` is the token type that ends the list, and
  // `allowEmpty` can be turned on to allow subsequent commas with
  // nothing in between them to be parsed as `null` (which is needed
  // for array literals).

  pp$3.parseExprList = function(close, allowTrailingComma, allowEmpty, refDestructuringErrors) {
    var elts = [], first = true;
    while (!this.eat(close)) {
      if (!first) {
        this.expect(types.comma);
        if (allowTrailingComma && this.afterTrailingComma(close)) { break }
      } else { first = false; }

      var elt = (void 0);
      if (allowEmpty && this.type === types.comma)
        { elt = null; }
      else if (this.type === types.ellipsis) {
        elt = this.parseSpread(refDestructuringErrors);
        if (refDestructuringErrors && this.type === types.comma && refDestructuringErrors.trailingComma < 0)
          { refDestructuringErrors.trailingComma = this.start; }
      } else {
        elt = this.parseMaybeAssign(false, refDestructuringErrors);
      }
      elts.push(elt);
    }
    return elts
  };

  pp$3.checkUnreserved = function(ref) {
    var start = ref.start;
    var end = ref.end;
    var name = ref.name;

    if (this.inGenerator && name === "yield")
      { this.raiseRecoverable(start, "Cannot use 'yield' as identifier inside a generator"); }
    if (this.inAsync && name === "await")
      { this.raiseRecoverable(start, "Cannot use 'await' as identifier inside an async function"); }
    if (this.keywords.test(name))
      { this.raise(start, ("Unexpected keyword '" + name + "'")); }
    if (this.options.ecmaVersion < 6 &&
      this.input.slice(start, end).indexOf("\\") !== -1) { return }
    var re = this.strict ? this.reservedWordsStrict : this.reservedWords;
    if (re.test(name)) {
      if (!this.inAsync && name === "await")
        { this.raiseRecoverable(start, "Cannot use keyword 'await' outside an async function"); }
      this.raiseRecoverable(start, ("The keyword '" + name + "' is reserved"));
    }
  };

  // Parse the next token as an identifier. If `liberal` is true (used
  // when parsing properties), it will also convert keywords into
  // identifiers.

  pp$3.parseIdent = function(liberal, isBinding) {
    var node = this.startNode();
    if (this.type === types.name) {
      node.name = this.value;
    } else if (this.type.keyword) {
      node.name = this.type.keyword;

      // To fix https://github.com/acornjs/acorn/issues/575
      // `class` and `function` keywords push new context into this.context.
      // But there is no chance to pop the context if the keyword is consumed as an identifier such as a property name.
      // If the previous token is a dot, this does not apply because the context-managing code already ignored the keyword
      if ((node.name === "class" || node.name === "function") &&
          (this.lastTokEnd !== this.lastTokStart + 1 || this.input.charCodeAt(this.lastTokStart) !== 46)) {
        this.context.pop();
      }
    } else {
      this.unexpected();
    }
    this.next();
    this.finishNode(node, "Identifier");
    if (!liberal) {
      this.checkUnreserved(node);
      if (node.name === "await" && !this.awaitIdentPos)
        { this.awaitIdentPos = node.start; }
    }
    return node
  };

  // Parses yield expression inside generator.

  pp$3.parseYield = function(noIn) {
    if (!this.yieldPos) { this.yieldPos = this.start; }

    var node = this.startNode();
    this.next();
    if (this.type === types.semi || this.canInsertSemicolon() || (this.type !== types.star && !this.type.startsExpr)) {
      node.delegate = false;
      node.argument = null;
    } else {
      node.delegate = this.eat(types.star);
      node.argument = this.parseMaybeAssign(noIn);
    }
    return this.finishNode(node, "YieldExpression")
  };

  pp$3.parseAwait = function() {
    if (!this.awaitPos) { this.awaitPos = this.start; }

    var node = this.startNode();
    this.next();
    node.argument = this.parseMaybeUnary(null, true);
    return this.finishNode(node, "AwaitExpression")
  };

  var pp$4 = Parser.prototype;

  // This function is used to raise exceptions on parse errors. It
  // takes an offset integer (into the current `input`) to indicate
  // the location of the error, attaches the position to the end
  // of the error message, and then raises a `SyntaxError` with that
  // message.

  pp$4.raise = function(pos, message) {
    var loc = getLineInfo(this.input, pos);
    message += " (" + loc.line + ":" + loc.column + ")";
    var err = new SyntaxError(message);
    err.pos = pos; err.loc = loc; err.raisedAt = this.pos;
    throw err
  };

  pp$4.raiseRecoverable = pp$4.raise;

  pp$4.curPosition = function() {
    if (this.options.locations) {
      return new Position(this.curLine, this.pos - this.lineStart)
    }
  };

  var pp$5 = Parser.prototype;

  var Scope = function Scope(flags) {
    this.flags = flags;
    // A list of var-declared names in the current lexical scope
    this.var = [];
    // A list of lexically-declared names in the current lexical scope
    this.lexical = [];
    // A list of lexically-declared FunctionDeclaration names in the current lexical scope
    this.functions = [];
  };

  // The functions in this module keep track of declared variables in the current scope in order to detect duplicate variable names.

  pp$5.enterScope = function(flags) {
    this.scopeStack.push(new Scope(flags));
  };

  pp$5.exitScope = function() {
    this.scopeStack.pop();
  };

  // The spec says:
  // > At the top level of a function, or script, function declarations are
  // > treated like var declarations rather than like lexical declarations.
  pp$5.treatFunctionsAsVarInScope = function(scope) {
    return (scope.flags & SCOPE_FUNCTION) || !this.inModule && (scope.flags & SCOPE_TOP)
  };

  pp$5.declareName = function(name, bindingType, pos) {
    var redeclared = false;
    if (bindingType === BIND_LEXICAL) {
      var scope = this.currentScope();
      redeclared = scope.lexical.indexOf(name) > -1 || scope.functions.indexOf(name) > -1 || scope.var.indexOf(name) > -1;
      scope.lexical.push(name);
      if (this.inModule && (scope.flags & SCOPE_TOP))
        { delete this.undefinedExports[name]; }
    } else if (bindingType === BIND_SIMPLE_CATCH) {
      var scope$1 = this.currentScope();
      scope$1.lexical.push(name);
    } else if (bindingType === BIND_FUNCTION) {
      var scope$2 = this.currentScope();
      if (this.treatFunctionsAsVar)
        { redeclared = scope$2.lexical.indexOf(name) > -1; }
      else
        { redeclared = scope$2.lexical.indexOf(name) > -1 || scope$2.var.indexOf(name) > -1; }
      scope$2.functions.push(name);
    } else {
      for (var i = this.scopeStack.length - 1; i >= 0; --i) {
        var scope$3 = this.scopeStack[i];
        if (scope$3.lexical.indexOf(name) > -1 && !((scope$3.flags & SCOPE_SIMPLE_CATCH) && scope$3.lexical[0] === name) ||
            !this.treatFunctionsAsVarInScope(scope$3) && scope$3.functions.indexOf(name) > -1) {
          redeclared = true;
          break
        }
        scope$3.var.push(name);
        if (this.inModule && (scope$3.flags & SCOPE_TOP))
          { delete this.undefinedExports[name]; }
        if (scope$3.flags & SCOPE_VAR) { break }
      }
    }
    if (redeclared) { this.raiseRecoverable(pos, ("Identifier '" + name + "' has already been declared")); }
  };

  pp$5.checkLocalExport = function(id) {
    // scope.functions must be empty as Module code is always strict.
    if (this.scopeStack[0].lexical.indexOf(id.name) === -1 &&
        this.scopeStack[0].var.indexOf(id.name) === -1) {
      this.undefinedExports[id.name] = id;
    }
  };

  pp$5.currentScope = function() {
    return this.scopeStack[this.scopeStack.length - 1]
  };

  pp$5.currentVarScope = function() {
    for (var i = this.scopeStack.length - 1;; i--) {
      var scope = this.scopeStack[i];
      if (scope.flags & SCOPE_VAR) { return scope }
    }
  };

  // Could be useful for `this`, `new.target`, `super()`, `super.property`, and `super[property]`.
  pp$5.currentThisScope = function() {
    for (var i = this.scopeStack.length - 1;; i--) {
      var scope = this.scopeStack[i];
      if (scope.flags & SCOPE_VAR && !(scope.flags & SCOPE_ARROW)) { return scope }
    }
  };

  var Node = function Node(parser, pos, loc) {
    this.type = "";
    this.start = pos;
    this.end = 0;
    if (parser.options.locations)
      { this.loc = new SourceLocation(parser, loc); }
    if (parser.options.directSourceFile)
      { this.sourceFile = parser.options.directSourceFile; }
    if (parser.options.ranges)
      { this.range = [pos, 0]; }
  };

  // Start an AST node, attaching a start offset.

  var pp$6 = Parser.prototype;

  pp$6.startNode = function() {
    return new Node(this, this.start, this.startLoc)
  };

  pp$6.startNodeAt = function(pos, loc) {
    return new Node(this, pos, loc)
  };

  // Finish an AST node, adding `type` and `end` properties.

  function finishNodeAt(node, type, pos, loc) {
    node.type = type;
    node.end = pos;
    if (this.options.locations)
      { node.loc.end = loc; }
    if (this.options.ranges)
      { node.range[1] = pos; }
    return node
  }

  pp$6.finishNode = function(node, type) {
    return finishNodeAt.call(this, node, type, this.lastTokEnd, this.lastTokEndLoc)
  };

  // Finish node at given position

  pp$6.finishNodeAt = function(node, type, pos, loc) {
    return finishNodeAt.call(this, node, type, pos, loc)
  };

  // The algorithm used to determine whether a regexp can appear at a

  var TokContext = function TokContext(token, isExpr, preserveSpace, override, generator) {
    this.token = token;
    this.isExpr = !!isExpr;
    this.preserveSpace = !!preserveSpace;
    this.override = override;
    this.generator = !!generator;
  };

  var types$1 = {
    b_stat: new TokContext("{", false),
    b_expr: new TokContext("{", true),
    b_tmpl: new TokContext("${", false),
    p_stat: new TokContext("(", false),
    p_expr: new TokContext("(", true),
    q_tmpl: new TokContext("`", true, true, function (p) { return p.tryReadTemplateToken(); }),
    f_stat: new TokContext("function", false),
    f_expr: new TokContext("function", true),
    f_expr_gen: new TokContext("function", true, false, null, true),
    f_gen: new TokContext("function", false, false, null, true)
  };

  var pp$7 = Parser.prototype;

  pp$7.initialContext = function() {
    return [types$1.b_stat]
  };

  pp$7.braceIsBlock = function(prevType) {
    var parent = this.curContext();
    if (parent === types$1.f_expr || parent === types$1.f_stat)
      { return true }
    if (prevType === types.colon && (parent === types$1.b_stat || parent === types$1.b_expr))
      { return !parent.isExpr }

    // The check for `tt.name && exprAllowed` detects whether we are
    // after a `yield` or `of` construct. See the `updateContext` for
    // `tt.name`.
    if (prevType === types._return || prevType === types.name && this.exprAllowed)
      { return lineBreak.test(this.input.slice(this.lastTokEnd, this.start)) }
    if (prevType === types._else || prevType === types.semi || prevType === types.eof || prevType === types.parenR || prevType === types.arrow)
      { return true }
    if (prevType === types.braceL)
      { return parent === types$1.b_stat }
    if (prevType === types._var || prevType === types._const || prevType === types.name)
      { return false }
    return !this.exprAllowed
  };

  pp$7.inGeneratorContext = function() {
    for (var i = this.context.length - 1; i >= 1; i--) {
      var context = this.context[i];
      if (context.token === "function")
        { return context.generator }
    }
    return false
  };

  pp$7.updateContext = function(prevType) {
    var update, type = this.type;
    if (type.keyword && prevType === types.dot)
      { this.exprAllowed = false; }
    else if (update = type.updateContext)
      { update.call(this, prevType); }
    else
      { this.exprAllowed = type.beforeExpr; }
  };

  // Token-specific context update code

  types.parenR.updateContext = types.braceR.updateContext = function() {
    if (this.context.length === 1) {
      this.exprAllowed = true;
      return
    }
    var out = this.context.pop();
    if (out === types$1.b_stat && this.curContext().token === "function") {
      out = this.context.pop();
    }
    this.exprAllowed = !out.isExpr;
  };

  types.braceL.updateContext = function(prevType) {
    this.context.push(this.braceIsBlock(prevType) ? types$1.b_stat : types$1.b_expr);
    this.exprAllowed = true;
  };

  types.dollarBraceL.updateContext = function() {
    this.context.push(types$1.b_tmpl);
    this.exprAllowed = true;
  };

  types.parenL.updateContext = function(prevType) {
    var statementParens = prevType === types._if || prevType === types._for || prevType === types._with || prevType === types._while;
    this.context.push(statementParens ? types$1.p_stat : types$1.p_expr);
    this.exprAllowed = true;
  };

  types.incDec.updateContext = function() {
    // tokExprAllowed stays unchanged
  };

  types._function.updateContext = types._class.updateContext = function(prevType) {
    if (prevType.beforeExpr && prevType !== types.semi && prevType !== types._else &&
        !(prevType === types._return && lineBreak.test(this.input.slice(this.lastTokEnd, this.start))) &&
        !((prevType === types.colon || prevType === types.braceL) && this.curContext() === types$1.b_stat))
      { this.context.push(types$1.f_expr); }
    else
      { this.context.push(types$1.f_stat); }
    this.exprAllowed = false;
  };

  types.backQuote.updateContext = function() {
    if (this.curContext() === types$1.q_tmpl)
      { this.context.pop(); }
    else
      { this.context.push(types$1.q_tmpl); }
    this.exprAllowed = false;
  };

  types.star.updateContext = function(prevType) {
    if (prevType === types._function) {
      var index = this.context.length - 1;
      if (this.context[index] === types$1.f_expr)
        { this.context[index] = types$1.f_expr_gen; }
      else
        { this.context[index] = types$1.f_gen; }
    }
    this.exprAllowed = true;
  };

  types.name.updateContext = function(prevType) {
    var allowed = false;
    if (this.options.ecmaVersion >= 6 && prevType !== types.dot) {
      if (this.value === "of" && !this.exprAllowed ||
          this.value === "yield" && this.inGeneratorContext())
        { allowed = true; }
    }
    this.exprAllowed = allowed;
  };

  // This file contains Unicode properties extracted from the ECMAScript
  // specification. The lists are extracted like so:
  // $$('#table-binary-unicode-properties > figure > table > tbody > tr > td:nth-child(1) code').map(el => el.innerText)

  // #table-binary-unicode-properties
  var ecma9BinaryProperties = "ASCII ASCII_Hex_Digit AHex Alphabetic Alpha Any Assigned Bidi_Control Bidi_C Bidi_Mirrored Bidi_M Case_Ignorable CI Cased Changes_When_Casefolded CWCF Changes_When_Casemapped CWCM Changes_When_Lowercased CWL Changes_When_NFKC_Casefolded CWKCF Changes_When_Titlecased CWT Changes_When_Uppercased CWU Dash Default_Ignorable_Code_Point DI Deprecated Dep Diacritic Dia Emoji Emoji_Component Emoji_Modifier Emoji_Modifier_Base Emoji_Presentation Extender Ext Grapheme_Base Gr_Base Grapheme_Extend Gr_Ext Hex_Digit Hex IDS_Binary_Operator IDSB IDS_Trinary_Operator IDST ID_Continue IDC ID_Start IDS Ideographic Ideo Join_Control Join_C Logical_Order_Exception LOE Lowercase Lower Math Noncharacter_Code_Point NChar Pattern_Syntax Pat_Syn Pattern_White_Space Pat_WS Quotation_Mark QMark Radical Regional_Indicator RI Sentence_Terminal STerm Soft_Dotted SD Terminal_Punctuation Term Unified_Ideograph UIdeo Uppercase Upper Variation_Selector VS White_Space space XID_Continue XIDC XID_Start XIDS";
  var ecma10BinaryProperties = ecma9BinaryProperties + " Extended_Pictographic";
  var ecma11BinaryProperties = ecma10BinaryProperties;
  var unicodeBinaryProperties = {
    9: ecma9BinaryProperties,
    10: ecma10BinaryProperties,
    11: ecma11BinaryProperties
  };

  // #table-unicode-general-category-values
  var unicodeGeneralCategoryValues = "Cased_Letter LC Close_Punctuation Pe Connector_Punctuation Pc Control Cc cntrl Currency_Symbol Sc Dash_Punctuation Pd Decimal_Number Nd digit Enclosing_Mark Me Final_Punctuation Pf Format Cf Initial_Punctuation Pi Letter L Letter_Number Nl Line_Separator Zl Lowercase_Letter Ll Mark M Combining_Mark Math_Symbol Sm Modifier_Letter Lm Modifier_Symbol Sk Nonspacing_Mark Mn Number N Open_Punctuation Ps Other C Other_Letter Lo Other_Number No Other_Punctuation Po Other_Symbol So Paragraph_Separator Zp Private_Use Co Punctuation P punct Separator Z Space_Separator Zs Spacing_Mark Mc Surrogate Cs Symbol S Titlecase_Letter Lt Unassigned Cn Uppercase_Letter Lu";

  // #table-unicode-script-values
  var ecma9ScriptValues = "Adlam Adlm Ahom Ahom Anatolian_Hieroglyphs Hluw Arabic Arab Armenian Armn Avestan Avst Balinese Bali Bamum Bamu Bassa_Vah Bass Batak Batk Bengali Beng Bhaiksuki Bhks Bopomofo Bopo Brahmi Brah Braille Brai Buginese Bugi Buhid Buhd Canadian_Aboriginal Cans Carian Cari Caucasian_Albanian Aghb Chakma Cakm Cham Cham Cherokee Cher Common Zyyy Coptic Copt Qaac Cuneiform Xsux Cypriot Cprt Cyrillic Cyrl Deseret Dsrt Devanagari Deva Duployan Dupl Egyptian_Hieroglyphs Egyp Elbasan Elba Ethiopic Ethi Georgian Geor Glagolitic Glag Gothic Goth Grantha Gran Greek Grek Gujarati Gujr Gurmukhi Guru Han Hani Hangul Hang Hanunoo Hano Hatran Hatr Hebrew Hebr Hiragana Hira Imperial_Aramaic Armi Inherited Zinh Qaai Inscriptional_Pahlavi Phli Inscriptional_Parthian Prti Javanese Java Kaithi Kthi Kannada Knda Katakana Kana Kayah_Li Kali Kharoshthi Khar Khmer Khmr Khojki Khoj Khudawadi Sind Lao Laoo Latin Latn Lepcha Lepc Limbu Limb Linear_A Lina Linear_B Linb Lisu Lisu Lycian Lyci Lydian Lydi Mahajani Mahj Malayalam Mlym Mandaic Mand Manichaean Mani Marchen Marc Masaram_Gondi Gonm Meetei_Mayek Mtei Mende_Kikakui Mend Meroitic_Cursive Merc Meroitic_Hieroglyphs Mero Miao Plrd Modi Modi Mongolian Mong Mro Mroo Multani Mult Myanmar Mymr Nabataean Nbat New_Tai_Lue Talu Newa Newa Nko Nkoo Nushu Nshu Ogham Ogam Ol_Chiki Olck Old_Hungarian Hung Old_Italic Ital Old_North_Arabian Narb Old_Permic Perm Old_Persian Xpeo Old_South_Arabian Sarb Old_Turkic Orkh Oriya Orya Osage Osge Osmanya Osma Pahawh_Hmong Hmng Palmyrene Palm Pau_Cin_Hau Pauc Phags_Pa Phag Phoenician Phnx Psalter_Pahlavi Phlp Rejang Rjng Runic Runr Samaritan Samr Saurashtra Saur Sharada Shrd Shavian Shaw Siddham Sidd SignWriting Sgnw Sinhala Sinh Sora_Sompeng Sora Soyombo Soyo Sundanese Sund Syloti_Nagri Sylo Syriac Syrc Tagalog Tglg Tagbanwa Tagb Tai_Le Tale Tai_Tham Lana Tai_Viet Tavt Takri Takr Tamil Taml Tangut Tang Telugu Telu Thaana Thaa Thai Thai Tibetan Tibt Tifinagh Tfng Tirhuta Tirh Ugaritic Ugar Vai Vaii Warang_Citi Wara Yi Yiii Zanabazar_Square Zanb";
  var ecma10ScriptValues = ecma9ScriptValues + " Dogra Dogr Gunjala_Gondi Gong Hanifi_Rohingya Rohg Makasar Maka Medefaidrin Medf Old_Sogdian Sogo Sogdian Sogd";
  var ecma11ScriptValues = ecma10ScriptValues + " Elymaic Elym Nandinagari Nand Nyiakeng_Puachue_Hmong Hmnp Wancho Wcho";
  var unicodeScriptValues = {
    9: ecma9ScriptValues,
    10: ecma10ScriptValues,
    11: ecma11ScriptValues
  };

  var data = {};
  function buildUnicodeData(ecmaVersion) {
    var d = data[ecmaVersion] = {
      binary: wordsRegexp(unicodeBinaryProperties[ecmaVersion] + " " + unicodeGeneralCategoryValues),
      nonBinary: {
        General_Category: wordsRegexp(unicodeGeneralCategoryValues),
        Script: wordsRegexp(unicodeScriptValues[ecmaVersion])
      }
    };
    d.nonBinary.Script_Extensions = d.nonBinary.Script;

    d.nonBinary.gc = d.nonBinary.General_Category;
    d.nonBinary.sc = d.nonBinary.Script;
    d.nonBinary.scx = d.nonBinary.Script_Extensions;
  }
  buildUnicodeData(9);
  buildUnicodeData(10);
  buildUnicodeData(11);

  var pp$8 = Parser.prototype;

  var RegExpValidationState = function RegExpValidationState(parser) {
    this.parser = parser;
    this.validFlags = "gim" + (parser.options.ecmaVersion >= 6 ? "uy" : "") + (parser.options.ecmaVersion >= 9 ? "s" : "");
    this.unicodeProperties = data[parser.options.ecmaVersion >= 11 ? 11 : parser.options.ecmaVersion];
    this.source = "";
    this.flags = "";
    this.start = 0;
    this.switchU = false;
    this.switchN = false;
    this.pos = 0;
    this.lastIntValue = 0;
    this.lastStringValue = "";
    this.lastAssertionIsQuantifiable = false;
    this.numCapturingParens = 0;
    this.maxBackReference = 0;
    this.groupNames = [];
    this.backReferenceNames = [];
  };

  RegExpValidationState.prototype.reset = function reset (start, pattern, flags) {
    var unicode = flags.indexOf("u") !== -1;
    this.start = start | 0;
    this.source = pattern + "";
    this.flags = flags;
    this.switchU = unicode && this.parser.options.ecmaVersion >= 6;
    this.switchN = unicode && this.parser.options.ecmaVersion >= 9;
  };

  RegExpValidationState.prototype.raise = function raise (message) {
    this.parser.raiseRecoverable(this.start, ("Invalid regular expression: /" + (this.source) + "/: " + message));
  };

  // If u flag is given, this returns the code point at the index (it combines a surrogate pair).
  // Otherwise, this returns the code unit of the index (can be a part of a surrogate pair).
  RegExpValidationState.prototype.at = function at (i) {
    var s = this.source;
    var l = s.length;
    if (i >= l) {
      return -1
    }
    var c = s.charCodeAt(i);
    if (!this.switchU || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l) {
      return c
    }
    var next = s.charCodeAt(i + 1);
    return next >= 0xDC00 && next <= 0xDFFF ? (c << 10) + next - 0x35FDC00 : c
  };

  RegExpValidationState.prototype.nextIndex = function nextIndex (i) {
    var s = this.source;
    var l = s.length;
    if (i >= l) {
      return l
    }
    var c = s.charCodeAt(i), next;
    if (!this.switchU || c <= 0xD7FF || c >= 0xE000 || i + 1 >= l ||
        (next = s.charCodeAt(i + 1)) < 0xDC00 || next > 0xDFFF) {
      return i + 1
    }
    return i + 2
  };

  RegExpValidationState.prototype.current = function current () {
    return this.at(this.pos)
  };

  RegExpValidationState.prototype.lookahead = function lookahead () {
    return this.at(this.nextIndex(this.pos))
  };

  RegExpValidationState.prototype.advance = function advance () {
    this.pos = this.nextIndex(this.pos);
  };

  RegExpValidationState.prototype.eat = function eat (ch) {
    if (this.current() === ch) {
      this.advance();
      return true
    }
    return false
  };

  function codePointToString(ch) {
    if (ch <= 0xFFFF) { return String.fromCharCode(ch) }
    ch -= 0x10000;
    return String.fromCharCode((ch >> 10) + 0xD800, (ch & 0x03FF) + 0xDC00)
  }

  /**
   * Validate the flags part of a given RegExpLiteral.
   *
   * @param {RegExpValidationState} state The state to validate RegExp.
   * @returns {void}
   */
  pp$8.validateRegExpFlags = function(state) {
    var validFlags = state.validFlags;
    var flags = state.flags;

    for (var i = 0; i < flags.length; i++) {
      var flag = flags.charAt(i);
      if (validFlags.indexOf(flag) === -1) {
        this.raise(state.start, "Invalid regular expression flag");
      }
      if (flags.indexOf(flag, i + 1) > -1) {
        this.raise(state.start, "Duplicate regular expression flag");
      }
    }
  };

  /**
   * Validate the pattern part of a given RegExpLiteral.
   *
   * @param {RegExpValidationState} state The state to validate RegExp.
   * @returns {void}
   */
  pp$8.validateRegExpPattern = function(state) {
    this.regexp_pattern(state);

    // The goal symbol for the parse is |Pattern[~U, ~N]|. If the result of
    // parsing contains a |GroupName|, reparse with the goal symbol
    // |Pattern[~U, +N]| and use this result instead. Throw a *SyntaxError*
    // exception if _P_ did not conform to the grammar, if any elements of _P_
    // were not matched by the parse, or if any Early Error conditions exist.
    if (!state.switchN && this.options.ecmaVersion >= 9 && state.groupNames.length > 0) {
      state.switchN = true;
      this.regexp_pattern(state);
    }
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Pattern
  pp$8.regexp_pattern = function(state) {
    state.pos = 0;
    state.lastIntValue = 0;
    state.lastStringValue = "";
    state.lastAssertionIsQuantifiable = false;
    state.numCapturingParens = 0;
    state.maxBackReference = 0;
    state.groupNames.length = 0;
    state.backReferenceNames.length = 0;

    this.regexp_disjunction(state);

    if (state.pos !== state.source.length) {
      // Make the same messages as V8.
      if (state.eat(0x29 /* ) */)) {
        state.raise("Unmatched ')'");
      }
      if (state.eat(0x5D /* [ */) || state.eat(0x7D /* } */)) {
        state.raise("Lone quantifier brackets");
      }
    }
    if (state.maxBackReference > state.numCapturingParens) {
      state.raise("Invalid escape");
    }
    for (var i = 0, list = state.backReferenceNames; i < list.length; i += 1) {
      var name = list[i];

      if (state.groupNames.indexOf(name) === -1) {
        state.raise("Invalid named capture referenced");
      }
    }
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Disjunction
  pp$8.regexp_disjunction = function(state) {
    this.regexp_alternative(state);
    while (state.eat(0x7C /* | */)) {
      this.regexp_alternative(state);
    }

    // Make the same message as V8.
    if (this.regexp_eatQuantifier(state, true)) {
      state.raise("Nothing to repeat");
    }
    if (state.eat(0x7B /* { */)) {
      state.raise("Lone quantifier brackets");
    }
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Alternative
  pp$8.regexp_alternative = function(state) {
    while (state.pos < state.source.length && this.regexp_eatTerm(state))
      { }
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Term
  pp$8.regexp_eatTerm = function(state) {
    if (this.regexp_eatAssertion(state)) {
      // Handle `QuantifiableAssertion Quantifier` alternative.
      // `state.lastAssertionIsQuantifiable` is true if the last eaten Assertion
      // is a QuantifiableAssertion.
      if (state.lastAssertionIsQuantifiable && this.regexp_eatQuantifier(state)) {
        // Make the same message as V8.
        if (state.switchU) {
          state.raise("Invalid quantifier");
        }
      }
      return true
    }

    if (state.switchU ? this.regexp_eatAtom(state) : this.regexp_eatExtendedAtom(state)) {
      this.regexp_eatQuantifier(state);
      return true
    }

    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-Assertion
  pp$8.regexp_eatAssertion = function(state) {
    var start = state.pos;
    state.lastAssertionIsQuantifiable = false;

    // ^, $
    if (state.eat(0x5E /* ^ */) || state.eat(0x24 /* $ */)) {
      return true
    }

    // \b \B
    if (state.eat(0x5C /* \ */)) {
      if (state.eat(0x42 /* B */) || state.eat(0x62 /* b */)) {
        return true
      }
      state.pos = start;
    }

    // Lookahead / Lookbehind
    if (state.eat(0x28 /* ( */) && state.eat(0x3F /* ? */)) {
      var lookbehind = false;
      if (this.options.ecmaVersion >= 9) {
        lookbehind = state.eat(0x3C /* < */);
      }
      if (state.eat(0x3D /* = */) || state.eat(0x21 /* ! */)) {
        this.regexp_disjunction(state);
        if (!state.eat(0x29 /* ) */)) {
          state.raise("Unterminated group");
        }
        state.lastAssertionIsQuantifiable = !lookbehind;
        return true
      }
    }

    state.pos = start;
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Quantifier
  pp$8.regexp_eatQuantifier = function(state, noError) {
    if ( noError === void 0 ) { noError = false; }

    if (this.regexp_eatQuantifierPrefix(state, noError)) {
      state.eat(0x3F /* ? */);
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-QuantifierPrefix
  pp$8.regexp_eatQuantifierPrefix = function(state, noError) {
    return (
      state.eat(0x2A /* * */) ||
      state.eat(0x2B /* + */) ||
      state.eat(0x3F /* ? */) ||
      this.regexp_eatBracedQuantifier(state, noError)
    )
  };
  pp$8.regexp_eatBracedQuantifier = function(state, noError) {
    var start = state.pos;
    if (state.eat(0x7B /* { */)) {
      var min = 0, max = -1;
      if (this.regexp_eatDecimalDigits(state)) {
        min = state.lastIntValue;
        if (state.eat(0x2C /* , */) && this.regexp_eatDecimalDigits(state)) {
          max = state.lastIntValue;
        }
        if (state.eat(0x7D /* } */)) {
          // SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-term
          if (max !== -1 && max < min && !noError) {
            state.raise("numbers out of order in {} quantifier");
          }
          return true
        }
      }
      if (state.switchU && !noError) {
        state.raise("Incomplete quantifier");
      }
      state.pos = start;
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Atom
  pp$8.regexp_eatAtom = function(state) {
    return (
      this.regexp_eatPatternCharacters(state) ||
      state.eat(0x2E /* . */) ||
      this.regexp_eatReverseSolidusAtomEscape(state) ||
      this.regexp_eatCharacterClass(state) ||
      this.regexp_eatUncapturingGroup(state) ||
      this.regexp_eatCapturingGroup(state)
    )
  };
  pp$8.regexp_eatReverseSolidusAtomEscape = function(state) {
    var start = state.pos;
    if (state.eat(0x5C /* \ */)) {
      if (this.regexp_eatAtomEscape(state)) {
        return true
      }
      state.pos = start;
    }
    return false
  };
  pp$8.regexp_eatUncapturingGroup = function(state) {
    var start = state.pos;
    if (state.eat(0x28 /* ( */)) {
      if (state.eat(0x3F /* ? */) && state.eat(0x3A /* : */)) {
        this.regexp_disjunction(state);
        if (state.eat(0x29 /* ) */)) {
          return true
        }
        state.raise("Unterminated group");
      }
      state.pos = start;
    }
    return false
  };
  pp$8.regexp_eatCapturingGroup = function(state) {
    if (state.eat(0x28 /* ( */)) {
      if (this.options.ecmaVersion >= 9) {
        this.regexp_groupSpecifier(state);
      } else if (state.current() === 0x3F /* ? */) {
        state.raise("Invalid group");
      }
      this.regexp_disjunction(state);
      if (state.eat(0x29 /* ) */)) {
        state.numCapturingParens += 1;
        return true
      }
      state.raise("Unterminated group");
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedAtom
  pp$8.regexp_eatExtendedAtom = function(state) {
    return (
      state.eat(0x2E /* . */) ||
      this.regexp_eatReverseSolidusAtomEscape(state) ||
      this.regexp_eatCharacterClass(state) ||
      this.regexp_eatUncapturingGroup(state) ||
      this.regexp_eatCapturingGroup(state) ||
      this.regexp_eatInvalidBracedQuantifier(state) ||
      this.regexp_eatExtendedPatternCharacter(state)
    )
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-InvalidBracedQuantifier
  pp$8.regexp_eatInvalidBracedQuantifier = function(state) {
    if (this.regexp_eatBracedQuantifier(state, true)) {
      state.raise("Nothing to repeat");
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-SyntaxCharacter
  pp$8.regexp_eatSyntaxCharacter = function(state) {
    var ch = state.current();
    if (isSyntaxCharacter(ch)) {
      state.lastIntValue = ch;
      state.advance();
      return true
    }
    return false
  };
  function isSyntaxCharacter(ch) {
    return (
      ch === 0x24 /* $ */ ||
      ch >= 0x28 /* ( */ && ch <= 0x2B /* + */ ||
      ch === 0x2E /* . */ ||
      ch === 0x3F /* ? */ ||
      ch >= 0x5B /* [ */ && ch <= 0x5E /* ^ */ ||
      ch >= 0x7B /* { */ && ch <= 0x7D /* } */
    )
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-PatternCharacter
  // But eat eager.
  pp$8.regexp_eatPatternCharacters = function(state) {
    var start = state.pos;
    var ch = 0;
    while ((ch = state.current()) !== -1 && !isSyntaxCharacter(ch)) {
      state.advance();
    }
    return state.pos !== start
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ExtendedPatternCharacter
  pp$8.regexp_eatExtendedPatternCharacter = function(state) {
    var ch = state.current();
    if (
      ch !== -1 &&
      ch !== 0x24 /* $ */ &&
      !(ch >= 0x28 /* ( */ && ch <= 0x2B /* + */) &&
      ch !== 0x2E /* . */ &&
      ch !== 0x3F /* ? */ &&
      ch !== 0x5B /* [ */ &&
      ch !== 0x5E /* ^ */ &&
      ch !== 0x7C /* | */
    ) {
      state.advance();
      return true
    }
    return false
  };

  // GroupSpecifier[U] ::
  //   [empty]
  //   `?` GroupName[?U]
  pp$8.regexp_groupSpecifier = function(state) {
    if (state.eat(0x3F /* ? */)) {
      if (this.regexp_eatGroupName(state)) {
        if (state.groupNames.indexOf(state.lastStringValue) !== -1) {
          state.raise("Duplicate capture group name");
        }
        state.groupNames.push(state.lastStringValue);
        return
      }
      state.raise("Invalid group");
    }
  };

  // GroupName[U] ::
  //   `<` RegExpIdentifierName[?U] `>`
  // Note: this updates `state.lastStringValue` property with the eaten name.
  pp$8.regexp_eatGroupName = function(state) {
    state.lastStringValue = "";
    if (state.eat(0x3C /* < */)) {
      if (this.regexp_eatRegExpIdentifierName(state) && state.eat(0x3E /* > */)) {
        return true
      }
      state.raise("Invalid capture group name");
    }
    return false
  };

  // RegExpIdentifierName[U] ::
  //   RegExpIdentifierStart[?U]
  //   RegExpIdentifierName[?U] RegExpIdentifierPart[?U]
  // Note: this updates `state.lastStringValue` property with the eaten name.
  pp$8.regexp_eatRegExpIdentifierName = function(state) {
    state.lastStringValue = "";
    if (this.regexp_eatRegExpIdentifierStart(state)) {
      state.lastStringValue += codePointToString(state.lastIntValue);
      while (this.regexp_eatRegExpIdentifierPart(state)) {
        state.lastStringValue += codePointToString(state.lastIntValue);
      }
      return true
    }
    return false
  };

  // RegExpIdentifierStart[U] ::
  //   UnicodeIDStart
  //   `$`
  //   `_`
  //   `\` RegExpUnicodeEscapeSequence[?U]
  pp$8.regexp_eatRegExpIdentifierStart = function(state) {
    var start = state.pos;
    var ch = state.current();
    state.advance();

    if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state)) {
      ch = state.lastIntValue;
    }
    if (isRegExpIdentifierStart(ch)) {
      state.lastIntValue = ch;
      return true
    }

    state.pos = start;
    return false
  };
  function isRegExpIdentifierStart(ch) {
    return isIdentifierStart(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */
  }

  // RegExpIdentifierPart[U] ::
  //   UnicodeIDContinue
  //   `$`
  //   `_`
  //   `\` RegExpUnicodeEscapeSequence[?U]
  //   <ZWNJ>
  //   <ZWJ>
  pp$8.regexp_eatRegExpIdentifierPart = function(state) {
    var start = state.pos;
    var ch = state.current();
    state.advance();

    if (ch === 0x5C /* \ */ && this.regexp_eatRegExpUnicodeEscapeSequence(state)) {
      ch = state.lastIntValue;
    }
    if (isRegExpIdentifierPart(ch)) {
      state.lastIntValue = ch;
      return true
    }

    state.pos = start;
    return false
  };
  function isRegExpIdentifierPart(ch) {
    return isIdentifierChar(ch, true) || ch === 0x24 /* $ */ || ch === 0x5F /* _ */ || ch === 0x200C /* <ZWNJ> */ || ch === 0x200D /* <ZWJ> */
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-AtomEscape
  pp$8.regexp_eatAtomEscape = function(state) {
    if (
      this.regexp_eatBackReference(state) ||
      this.regexp_eatCharacterClassEscape(state) ||
      this.regexp_eatCharacterEscape(state) ||
      (state.switchN && this.regexp_eatKGroupName(state))
    ) {
      return true
    }
    if (state.switchU) {
      // Make the same message as V8.
      if (state.current() === 0x63 /* c */) {
        state.raise("Invalid unicode escape");
      }
      state.raise("Invalid escape");
    }
    return false
  };
  pp$8.regexp_eatBackReference = function(state) {
    var start = state.pos;
    if (this.regexp_eatDecimalEscape(state)) {
      var n = state.lastIntValue;
      if (state.switchU) {
        // For SyntaxError in https://www.ecma-international.org/ecma-262/8.0/#sec-atomescape
        if (n > state.maxBackReference) {
          state.maxBackReference = n;
        }
        return true
      }
      if (n <= state.numCapturingParens) {
        return true
      }
      state.pos = start;
    }
    return false
  };
  pp$8.regexp_eatKGroupName = function(state) {
    if (state.eat(0x6B /* k */)) {
      if (this.regexp_eatGroupName(state)) {
        state.backReferenceNames.push(state.lastStringValue);
        return true
      }
      state.raise("Invalid named reference");
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-CharacterEscape
  pp$8.regexp_eatCharacterEscape = function(state) {
    return (
      this.regexp_eatControlEscape(state) ||
      this.regexp_eatCControlLetter(state) ||
      this.regexp_eatZero(state) ||
      this.regexp_eatHexEscapeSequence(state) ||
      this.regexp_eatRegExpUnicodeEscapeSequence(state) ||
      (!state.switchU && this.regexp_eatLegacyOctalEscapeSequence(state)) ||
      this.regexp_eatIdentityEscape(state)
    )
  };
  pp$8.regexp_eatCControlLetter = function(state) {
    var start = state.pos;
    if (state.eat(0x63 /* c */)) {
      if (this.regexp_eatControlLetter(state)) {
        return true
      }
      state.pos = start;
    }
    return false
  };
  pp$8.regexp_eatZero = function(state) {
    if (state.current() === 0x30 /* 0 */ && !isDecimalDigit(state.lookahead())) {
      state.lastIntValue = 0;
      state.advance();
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-ControlEscape
  pp$8.regexp_eatControlEscape = function(state) {
    var ch = state.current();
    if (ch === 0x74 /* t */) {
      state.lastIntValue = 0x09; /* \t */
      state.advance();
      return true
    }
    if (ch === 0x6E /* n */) {
      state.lastIntValue = 0x0A; /* \n */
      state.advance();
      return true
    }
    if (ch === 0x76 /* v */) {
      state.lastIntValue = 0x0B; /* \v */
      state.advance();
      return true
    }
    if (ch === 0x66 /* f */) {
      state.lastIntValue = 0x0C; /* \f */
      state.advance();
      return true
    }
    if (ch === 0x72 /* r */) {
      state.lastIntValue = 0x0D; /* \r */
      state.advance();
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-ControlLetter
  pp$8.regexp_eatControlLetter = function(state) {
    var ch = state.current();
    if (isControlLetter(ch)) {
      state.lastIntValue = ch % 0x20;
      state.advance();
      return true
    }
    return false
  };
  function isControlLetter(ch) {
    return (
      (ch >= 0x41 /* A */ && ch <= 0x5A /* Z */) ||
      (ch >= 0x61 /* a */ && ch <= 0x7A /* z */)
    )
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-RegExpUnicodeEscapeSequence
  pp$8.regexp_eatRegExpUnicodeEscapeSequence = function(state) {
    var start = state.pos;

    if (state.eat(0x75 /* u */)) {
      if (this.regexp_eatFixedHexDigits(state, 4)) {
        var lead = state.lastIntValue;
        if (state.switchU && lead >= 0xD800 && lead <= 0xDBFF) {
          var leadSurrogateEnd = state.pos;
          if (state.eat(0x5C /* \ */) && state.eat(0x75 /* u */) && this.regexp_eatFixedHexDigits(state, 4)) {
            var trail = state.lastIntValue;
            if (trail >= 0xDC00 && trail <= 0xDFFF) {
              state.lastIntValue = (lead - 0xD800) * 0x400 + (trail - 0xDC00) + 0x10000;
              return true
            }
          }
          state.pos = leadSurrogateEnd;
          state.lastIntValue = lead;
        }
        return true
      }
      if (
        state.switchU &&
        state.eat(0x7B /* { */) &&
        this.regexp_eatHexDigits(state) &&
        state.eat(0x7D /* } */) &&
        isValidUnicode(state.lastIntValue)
      ) {
        return true
      }
      if (state.switchU) {
        state.raise("Invalid unicode escape");
      }
      state.pos = start;
    }

    return false
  };
  function isValidUnicode(ch) {
    return ch >= 0 && ch <= 0x10FFFF
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-IdentityEscape
  pp$8.regexp_eatIdentityEscape = function(state) {
    if (state.switchU) {
      if (this.regexp_eatSyntaxCharacter(state)) {
        return true
      }
      if (state.eat(0x2F /* / */)) {
        state.lastIntValue = 0x2F; /* / */
        return true
      }
      return false
    }

    var ch = state.current();
    if (ch !== 0x63 /* c */ && (!state.switchN || ch !== 0x6B /* k */)) {
      state.lastIntValue = ch;
      state.advance();
      return true
    }

    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalEscape
  pp$8.regexp_eatDecimalEscape = function(state) {
    state.lastIntValue = 0;
    var ch = state.current();
    if (ch >= 0x31 /* 1 */ && ch <= 0x39 /* 9 */) {
      do {
        state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
        state.advance();
      } while ((ch = state.current()) >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */)
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClassEscape
  pp$8.regexp_eatCharacterClassEscape = function(state) {
    var ch = state.current();

    if (isCharacterClassEscape(ch)) {
      state.lastIntValue = -1;
      state.advance();
      return true
    }

    if (
      state.switchU &&
      this.options.ecmaVersion >= 9 &&
      (ch === 0x50 /* P */ || ch === 0x70 /* p */)
    ) {
      state.lastIntValue = -1;
      state.advance();
      if (
        state.eat(0x7B /* { */) &&
        this.regexp_eatUnicodePropertyValueExpression(state) &&
        state.eat(0x7D /* } */)
      ) {
        return true
      }
      state.raise("Invalid property name");
    }

    return false
  };
  function isCharacterClassEscape(ch) {
    return (
      ch === 0x64 /* d */ ||
      ch === 0x44 /* D */ ||
      ch === 0x73 /* s */ ||
      ch === 0x53 /* S */ ||
      ch === 0x77 /* w */ ||
      ch === 0x57 /* W */
    )
  }

  // UnicodePropertyValueExpression ::
  //   UnicodePropertyName `=` UnicodePropertyValue
  //   LoneUnicodePropertyNameOrValue
  pp$8.regexp_eatUnicodePropertyValueExpression = function(state) {
    var start = state.pos;

    // UnicodePropertyName `=` UnicodePropertyValue
    if (this.regexp_eatUnicodePropertyName(state) && state.eat(0x3D /* = */)) {
      var name = state.lastStringValue;
      if (this.regexp_eatUnicodePropertyValue(state)) {
        var value = state.lastStringValue;
        this.regexp_validateUnicodePropertyNameAndValue(state, name, value);
        return true
      }
    }
    state.pos = start;

    // LoneUnicodePropertyNameOrValue
    if (this.regexp_eatLoneUnicodePropertyNameOrValue(state)) {
      var nameOrValue = state.lastStringValue;
      this.regexp_validateUnicodePropertyNameOrValue(state, nameOrValue);
      return true
    }
    return false
  };
  pp$8.regexp_validateUnicodePropertyNameAndValue = function(state, name, value) {
    if (!has(state.unicodeProperties.nonBinary, name))
      { state.raise("Invalid property name"); }
    if (!state.unicodeProperties.nonBinary[name].test(value))
      { state.raise("Invalid property value"); }
  };
  pp$8.regexp_validateUnicodePropertyNameOrValue = function(state, nameOrValue) {
    if (!state.unicodeProperties.binary.test(nameOrValue))
      { state.raise("Invalid property name"); }
  };

  // UnicodePropertyName ::
  //   UnicodePropertyNameCharacters
  pp$8.regexp_eatUnicodePropertyName = function(state) {
    var ch = 0;
    state.lastStringValue = "";
    while (isUnicodePropertyNameCharacter(ch = state.current())) {
      state.lastStringValue += codePointToString(ch);
      state.advance();
    }
    return state.lastStringValue !== ""
  };
  function isUnicodePropertyNameCharacter(ch) {
    return isControlLetter(ch) || ch === 0x5F /* _ */
  }

  // UnicodePropertyValue ::
  //   UnicodePropertyValueCharacters
  pp$8.regexp_eatUnicodePropertyValue = function(state) {
    var ch = 0;
    state.lastStringValue = "";
    while (isUnicodePropertyValueCharacter(ch = state.current())) {
      state.lastStringValue += codePointToString(ch);
      state.advance();
    }
    return state.lastStringValue !== ""
  };
  function isUnicodePropertyValueCharacter(ch) {
    return isUnicodePropertyNameCharacter(ch) || isDecimalDigit(ch)
  }

  // LoneUnicodePropertyNameOrValue ::
  //   UnicodePropertyValueCharacters
  pp$8.regexp_eatLoneUnicodePropertyNameOrValue = function(state) {
    return this.regexp_eatUnicodePropertyValue(state)
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-CharacterClass
  pp$8.regexp_eatCharacterClass = function(state) {
    if (state.eat(0x5B /* [ */)) {
      state.eat(0x5E /* ^ */);
      this.regexp_classRanges(state);
      if (state.eat(0x5D /* [ */)) {
        return true
      }
      // Unreachable since it threw "unterminated regular expression" error before.
      state.raise("Unterminated character class");
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-ClassRanges
  // https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRanges
  // https://www.ecma-international.org/ecma-262/8.0/#prod-NonemptyClassRangesNoDash
  pp$8.regexp_classRanges = function(state) {
    while (this.regexp_eatClassAtom(state)) {
      var left = state.lastIntValue;
      if (state.eat(0x2D /* - */) && this.regexp_eatClassAtom(state)) {
        var right = state.lastIntValue;
        if (state.switchU && (left === -1 || right === -1)) {
          state.raise("Invalid character class");
        }
        if (left !== -1 && right !== -1 && left > right) {
          state.raise("Range out of order in character class");
        }
      }
    }
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtom
  // https://www.ecma-international.org/ecma-262/8.0/#prod-ClassAtomNoDash
  pp$8.regexp_eatClassAtom = function(state) {
    var start = state.pos;

    if (state.eat(0x5C /* \ */)) {
      if (this.regexp_eatClassEscape(state)) {
        return true
      }
      if (state.switchU) {
        // Make the same message as V8.
        var ch$1 = state.current();
        if (ch$1 === 0x63 /* c */ || isOctalDigit(ch$1)) {
          state.raise("Invalid class escape");
        }
        state.raise("Invalid escape");
      }
      state.pos = start;
    }

    var ch = state.current();
    if (ch !== 0x5D /* [ */) {
      state.lastIntValue = ch;
      state.advance();
      return true
    }

    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassEscape
  pp$8.regexp_eatClassEscape = function(state) {
    var start = state.pos;

    if (state.eat(0x62 /* b */)) {
      state.lastIntValue = 0x08; /* <BS> */
      return true
    }

    if (state.switchU && state.eat(0x2D /* - */)) {
      state.lastIntValue = 0x2D; /* - */
      return true
    }

    if (!state.switchU && state.eat(0x63 /* c */)) {
      if (this.regexp_eatClassControlLetter(state)) {
        return true
      }
      state.pos = start;
    }

    return (
      this.regexp_eatCharacterClassEscape(state) ||
      this.regexp_eatCharacterEscape(state)
    )
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-ClassControlLetter
  pp$8.regexp_eatClassControlLetter = function(state) {
    var ch = state.current();
    if (isDecimalDigit(ch) || ch === 0x5F /* _ */) {
      state.lastIntValue = ch % 0x20;
      state.advance();
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
  pp$8.regexp_eatHexEscapeSequence = function(state) {
    var start = state.pos;
    if (state.eat(0x78 /* x */)) {
      if (this.regexp_eatFixedHexDigits(state, 2)) {
        return true
      }
      if (state.switchU) {
        state.raise("Invalid escape");
      }
      state.pos = start;
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-DecimalDigits
  pp$8.regexp_eatDecimalDigits = function(state) {
    var start = state.pos;
    var ch = 0;
    state.lastIntValue = 0;
    while (isDecimalDigit(ch = state.current())) {
      state.lastIntValue = 10 * state.lastIntValue + (ch - 0x30 /* 0 */);
      state.advance();
    }
    return state.pos !== start
  };
  function isDecimalDigit(ch) {
    return ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigits
  pp$8.regexp_eatHexDigits = function(state) {
    var start = state.pos;
    var ch = 0;
    state.lastIntValue = 0;
    while (isHexDigit(ch = state.current())) {
      state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
      state.advance();
    }
    return state.pos !== start
  };
  function isHexDigit(ch) {
    return (
      (ch >= 0x30 /* 0 */ && ch <= 0x39 /* 9 */) ||
      (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) ||
      (ch >= 0x61 /* a */ && ch <= 0x66 /* f */)
    )
  }
  function hexToInt(ch) {
    if (ch >= 0x41 /* A */ && ch <= 0x46 /* F */) {
      return 10 + (ch - 0x41 /* A */)
    }
    if (ch >= 0x61 /* a */ && ch <= 0x66 /* f */) {
      return 10 + (ch - 0x61 /* a */)
    }
    return ch - 0x30 /* 0 */
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-annexB-LegacyOctalEscapeSequence
  // Allows only 0-377(octal) i.e. 0-255(decimal).
  pp$8.regexp_eatLegacyOctalEscapeSequence = function(state) {
    if (this.regexp_eatOctalDigit(state)) {
      var n1 = state.lastIntValue;
      if (this.regexp_eatOctalDigit(state)) {
        var n2 = state.lastIntValue;
        if (n1 <= 3 && this.regexp_eatOctalDigit(state)) {
          state.lastIntValue = n1 * 64 + n2 * 8 + state.lastIntValue;
        } else {
          state.lastIntValue = n1 * 8 + n2;
        }
      } else {
        state.lastIntValue = n1;
      }
      return true
    }
    return false
  };

  // https://www.ecma-international.org/ecma-262/8.0/#prod-OctalDigit
  pp$8.regexp_eatOctalDigit = function(state) {
    var ch = state.current();
    if (isOctalDigit(ch)) {
      state.lastIntValue = ch - 0x30; /* 0 */
      state.advance();
      return true
    }
    state.lastIntValue = 0;
    return false
  };
  function isOctalDigit(ch) {
    return ch >= 0x30 /* 0 */ && ch <= 0x37 /* 7 */
  }

  // https://www.ecma-international.org/ecma-262/8.0/#prod-Hex4Digits
  // https://www.ecma-international.org/ecma-262/8.0/#prod-HexDigit
  // And HexDigit HexDigit in https://www.ecma-international.org/ecma-262/8.0/#prod-HexEscapeSequence
  pp$8.regexp_eatFixedHexDigits = function(state, length) {
    var start = state.pos;
    state.lastIntValue = 0;
    for (var i = 0; i < length; ++i) {
      var ch = state.current();
      if (!isHexDigit(ch)) {
        state.pos = start;
        return false
      }
      state.lastIntValue = 16 * state.lastIntValue + hexToInt(ch);
      state.advance();
    }
    return true
  };

  // Object type used to represent tokens. Note that normally, tokens
  // simply exist as properties on the parser object. This is only
  // used for the onToken callback and the external tokenizer.

  var Token = function Token(p) {
    this.type = p.type;
    this.value = p.value;
    this.start = p.start;
    this.end = p.end;
    if (p.options.locations)
      { this.loc = new SourceLocation(p, p.startLoc, p.endLoc); }
    if (p.options.ranges)
      { this.range = [p.start, p.end]; }
  };

  // ## Tokenizer

  var pp$9 = Parser.prototype;

  // Move to the next token

  pp$9.next = function() {
    if (this.options.onToken)
      { this.options.onToken(new Token(this)); }

    this.lastTokEnd = this.end;
    this.lastTokStart = this.start;
    this.lastTokEndLoc = this.endLoc;
    this.lastTokStartLoc = this.startLoc;
    this.nextToken();
  };

  pp$9.getToken = function() {
    this.next();
    return new Token(this)
  };

  // If we're in an ES6 environment, make parsers iterable
  if (typeof Symbol !== "undefined")
    { pp$9[Symbol.iterator] = function() {
      var this$1 = this;

      return {
        next: function () {
          var token = this$1.getToken();
          return {
            done: token.type === types.eof,
            value: token
          }
        }
      }
    }; }

  // Toggle strict mode. Re-reads the next number or string to please
  // pedantic tests (`"use strict"; 010;` should fail).

  pp$9.curContext = function() {
    return this.context[this.context.length - 1]
  };

  // Read a single token, updating the parser object's token-related
  // properties.

  pp$9.nextToken = function() {
    var curContext = this.curContext();
    if (!curContext || !curContext.preserveSpace) { this.skipSpace(); }

    this.start = this.pos;
    if (this.options.locations) { this.startLoc = this.curPosition(); }
    if (this.pos >= this.input.length) { return this.finishToken(types.eof) }

    if (curContext.override) { return curContext.override(this) }
    else { this.readToken(this.fullCharCodeAtPos()); }
  };

  pp$9.readToken = function(code) {
    // Identifier or keyword. '\uXXXX' sequences are allowed in
    // identifiers, so '\' also dispatches to that.
    if (isIdentifierStart(code, this.options.ecmaVersion >= 6) || code === 92 /* '\' */)
      { return this.readWord() }

    return this.getTokenFromCode(code)
  };

  pp$9.fullCharCodeAtPos = function() {
    var code = this.input.charCodeAt(this.pos);
    if (code <= 0xd7ff || code >= 0xe000) { return code }
    var next = this.input.charCodeAt(this.pos + 1);
    return (code << 10) + next - 0x35fdc00
  };

  pp$9.skipBlockComment = function() {
    var startLoc = this.options.onComment && this.curPosition();
    var start = this.pos, end = this.input.indexOf("*/", this.pos += 2);
    if (end === -1) { this.raise(this.pos - 2, "Unterminated comment"); }
    this.pos = end + 2;
    if (this.options.locations) {
      lineBreakG.lastIndex = start;
      var match;
      while ((match = lineBreakG.exec(this.input)) && match.index < this.pos) {
        ++this.curLine;
        this.lineStart = match.index + match[0].length;
      }
    }
    if (this.options.onComment)
      { this.options.onComment(true, this.input.slice(start + 2, end), start, this.pos,
                             startLoc, this.curPosition()); }
  };

  pp$9.skipLineComment = function(startSkip) {
    var start = this.pos;
    var startLoc = this.options.onComment && this.curPosition();
    var ch = this.input.charCodeAt(this.pos += startSkip);
    while (this.pos < this.input.length && !isNewLine(ch)) {
      ch = this.input.charCodeAt(++this.pos);
    }
    if (this.options.onComment)
      { this.options.onComment(false, this.input.slice(start + startSkip, this.pos), start, this.pos,
                             startLoc, this.curPosition()); }
  };

  // Called at the start of the parse and after every token. Skips
  // whitespace and comments, and.

  pp$9.skipSpace = function() {
    loop: while (this.pos < this.input.length) {
      var ch = this.input.charCodeAt(this.pos);
      switch (ch) {
      case 32: case 160: // ' '
        ++this.pos;
        break
      case 13:
        if (this.input.charCodeAt(this.pos + 1) === 10) {
          ++this.pos;
        }
      case 10: case 8232: case 8233:
        ++this.pos;
        if (this.options.locations) {
          ++this.curLine;
          this.lineStart = this.pos;
        }
        break
      case 47: // '/'
        switch (this.input.charCodeAt(this.pos + 1)) {
        case 42: // '*'
          this.skipBlockComment();
          break
        case 47:
          this.skipLineComment(2);
          break
        default:
          break loop
        }
        break
      default:
        if (ch > 8 && ch < 14 || ch >= 5760 && nonASCIIwhitespace.test(String.fromCharCode(ch))) {
          ++this.pos;
        } else {
          break loop
        }
      }
    }
  };

  // Called at the end of every token. Sets `end`, `val`, and
  // maintains `context` and `exprAllowed`, and skips the space after
  // the token, so that the next one's `start` will point at the
  // right position.

  pp$9.finishToken = function(type, val) {
    this.end = this.pos;
    if (this.options.locations) { this.endLoc = this.curPosition(); }
    var prevType = this.type;
    this.type = type;
    this.value = val;

    this.updateContext(prevType);
  };

  // ### Token reading

  // This is the function that is called to fetch the next token. It
  // is somewhat obscure, because it works in character codes rather
  // than characters, and because operator parsing has been inlined
  // into it.
  //
  // All in the name of speed.
  //
  pp$9.readToken_dot = function() {
    var next = this.input.charCodeAt(this.pos + 1);
    if (next >= 48 && next <= 57) { return this.readNumber(true) }
    var next2 = this.input.charCodeAt(this.pos + 2);
    if (this.options.ecmaVersion >= 6 && next === 46 && next2 === 46) { // 46 = dot '.'
      this.pos += 3;
      return this.finishToken(types.ellipsis)
    } else {
      ++this.pos;
      return this.finishToken(types.dot)
    }
  };

  pp$9.readToken_slash = function() { // '/'
    var next = this.input.charCodeAt(this.pos + 1);
    if (this.exprAllowed) { ++this.pos; return this.readRegexp() }
    if (next === 61) { return this.finishOp(types.assign, 2) }
    return this.finishOp(types.slash, 1)
  };

  pp$9.readToken_mult_modulo_exp = function(code) { // '%*'
    var next = this.input.charCodeAt(this.pos + 1);
    var size = 1;
    var tokentype = code === 42 ? types.star : types.modulo;

    // exponentiation operator ** and **=
    if (this.options.ecmaVersion >= 7 && code === 42 && next === 42) {
      ++size;
      tokentype = types.starstar;
      next = this.input.charCodeAt(this.pos + 2);
    }

    if (next === 61) { return this.finishOp(types.assign, size + 1) }
    return this.finishOp(tokentype, size)
  };

  pp$9.readToken_pipe_amp = function(code) { // '|&'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === code) { return this.finishOp(code === 124 ? types.logicalOR : types.logicalAND, 2) }
    if (next === 61) { return this.finishOp(types.assign, 2) }
    return this.finishOp(code === 124 ? types.bitwiseOR : types.bitwiseAND, 1)
  };

  pp$9.readToken_caret = function() { // '^'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 61) { return this.finishOp(types.assign, 2) }
    return this.finishOp(types.bitwiseXOR, 1)
  };

  pp$9.readToken_plus_min = function(code) { // '+-'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === code) {
      if (next === 45 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 62 &&
          (this.lastTokEnd === 0 || lineBreak.test(this.input.slice(this.lastTokEnd, this.pos)))) {
        // A `-->` line comment
        this.skipLineComment(3);
        this.skipSpace();
        return this.nextToken()
      }
      return this.finishOp(types.incDec, 2)
    }
    if (next === 61) { return this.finishOp(types.assign, 2) }
    return this.finishOp(types.plusMin, 1)
  };

  pp$9.readToken_lt_gt = function(code) { // '<>'
    var next = this.input.charCodeAt(this.pos + 1);
    var size = 1;
    if (next === code) {
      size = code === 62 && this.input.charCodeAt(this.pos + 2) === 62 ? 3 : 2;
      if (this.input.charCodeAt(this.pos + size) === 61) { return this.finishOp(types.assign, size + 1) }
      return this.finishOp(types.bitShift, size)
    }
    if (next === 33 && code === 60 && !this.inModule && this.input.charCodeAt(this.pos + 2) === 45 &&
        this.input.charCodeAt(this.pos + 3) === 45) {
      // `<!--`, an XML-style comment that should be interpreted as a line comment
      this.skipLineComment(4);
      this.skipSpace();
      return this.nextToken()
    }
    if (next === 61) { size = 2; }
    return this.finishOp(types.relational, size)
  };

  pp$9.readToken_eq_excl = function(code) { // '=!'
    var next = this.input.charCodeAt(this.pos + 1);
    if (next === 61) { return this.finishOp(types.equality, this.input.charCodeAt(this.pos + 2) === 61 ? 3 : 2) }
    if (code === 61 && next === 62 && this.options.ecmaVersion >= 6) { // '=>'
      this.pos += 2;
      return this.finishToken(types.arrow)
    }
    return this.finishOp(code === 61 ? types.eq : types.prefix, 1)
  };

  pp$9.getTokenFromCode = function(code) {
    switch (code) {
    // The interpretation of a dot depends on whether it is followed
    // by a digit or another two dots.
    case 46: // '.'
      return this.readToken_dot()

    // Punctuation tokens.
    case 40: ++this.pos; return this.finishToken(types.parenL)
    case 41: ++this.pos; return this.finishToken(types.parenR)
    case 59: ++this.pos; return this.finishToken(types.semi)
    case 44: ++this.pos; return this.finishToken(types.comma)
    case 91: ++this.pos; return this.finishToken(types.bracketL)
    case 93: ++this.pos; return this.finishToken(types.bracketR)
    case 123: ++this.pos; return this.finishToken(types.braceL)
    case 125: ++this.pos; return this.finishToken(types.braceR)
    case 58: ++this.pos; return this.finishToken(types.colon)
    case 63: ++this.pos; return this.finishToken(types.question)

    case 96: // '`'
      if (this.options.ecmaVersion < 6) { break }
      ++this.pos;
      return this.finishToken(types.backQuote)

    case 48: // '0'
      var next = this.input.charCodeAt(this.pos + 1);
      if (next === 120 || next === 88) { return this.readRadixNumber(16) } // '0x', '0X' - hex number
      if (this.options.ecmaVersion >= 6) {
        if (next === 111 || next === 79) { return this.readRadixNumber(8) } // '0o', '0O' - octal number
        if (next === 98 || next === 66) { return this.readRadixNumber(2) } // '0b', '0B' - binary number
      }

    // Anything else beginning with a digit is an integer, octal
    // number, or float.
    case 49: case 50: case 51: case 52: case 53: case 54: case 55: case 56: case 57: // 1-9
      return this.readNumber(false)

    // Quotes produce strings.
    case 34: case 39: // '"', "'"
      return this.readString(code)

    // Operators are parsed inline in tiny state machines. '=' (61) is
    // often referred to. `finishOp` simply skips the amount of
    // characters it is given as second argument, and returns a token
    // of the type given by its first argument.

    case 47: // '/'
      return this.readToken_slash()

    case 37: case 42: // '%*'
      return this.readToken_mult_modulo_exp(code)

    case 124: case 38: // '|&'
      return this.readToken_pipe_amp(code)

    case 94: // '^'
      return this.readToken_caret()

    case 43: case 45: // '+-'
      return this.readToken_plus_min(code)

    case 60: case 62: // '<>'
      return this.readToken_lt_gt(code)

    case 61: case 33: // '=!'
      return this.readToken_eq_excl(code)

    case 126: // '~'
      return this.finishOp(types.prefix, 1)
    }

    this.raise(this.pos, "Unexpected character '" + codePointToString$1(code) + "'");
  };

  pp$9.finishOp = function(type, size) {
    var str = this.input.slice(this.pos, this.pos + size);
    this.pos += size;
    return this.finishToken(type, str)
  };

  pp$9.readRegexp = function() {
    var escaped, inClass, start = this.pos;
    for (;;) {
      if (this.pos >= this.input.length) { this.raise(start, "Unterminated regular expression"); }
      var ch = this.input.charAt(this.pos);
      if (lineBreak.test(ch)) { this.raise(start, "Unterminated regular expression"); }
      if (!escaped) {
        if (ch === "[") { inClass = true; }
        else if (ch === "]" && inClass) { inClass = false; }
        else if (ch === "/" && !inClass) { break }
        escaped = ch === "\\";
      } else { escaped = false; }
      ++this.pos;
    }
    var pattern = this.input.slice(start, this.pos);
    ++this.pos;
    var flagsStart = this.pos;
    var flags = this.readWord1();
    if (this.containsEsc) { this.unexpected(flagsStart); }

    // Validate pattern
    var state = this.regexpState || (this.regexpState = new RegExpValidationState(this));
    state.reset(start, pattern, flags);
    this.validateRegExpFlags(state);
    this.validateRegExpPattern(state);

    // Create Literal#value property value.
    var value = null;
    try {
      value = new RegExp(pattern, flags);
    } catch (e) {
      // ESTree requires null if it failed to instantiate RegExp object.
      // https://github.com/estree/estree/blob/a27003adf4fd7bfad44de9cef372a2eacd527b1c/es5.md#regexpliteral
    }

    return this.finishToken(types.regexp, {pattern: pattern, flags: flags, value: value})
  };

  // Read an integer in the given radix. Return null if zero digits
  // were read, the integer value otherwise. When `len` is given, this
  // will return `null` unless the integer has exactly `len` digits.

  pp$9.readInt = function(radix, len) {
    var start = this.pos, total = 0;
    for (var i = 0, e = len == null ? Infinity : len; i < e; ++i) {
      var code = this.input.charCodeAt(this.pos), val = (void 0);
      if (code >= 97) { val = code - 97 + 10; } // a
      else if (code >= 65) { val = code - 65 + 10; } // A
      else if (code >= 48 && code <= 57) { val = code - 48; } // 0-9
      else { val = Infinity; }
      if (val >= radix) { break }
      ++this.pos;
      total = total * radix + val;
    }
    if (this.pos === start || len != null && this.pos - start !== len) { return null }

    return total
  };

  pp$9.readRadixNumber = function(radix) {
    var start = this.pos;
    this.pos += 2; // 0x
    var val = this.readInt(radix);
    if (val == null) { this.raise(this.start + 2, "Expected number in radix " + radix); }
    if (this.options.ecmaVersion >= 11 && this.input.charCodeAt(this.pos) === 110) {
      val = typeof BigInt !== "undefined" ? BigInt(this.input.slice(start, this.pos)) : null;
      ++this.pos;
    } else if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
    return this.finishToken(types.num, val)
  };

  // Read an integer, octal integer, or floating-point number.

  pp$9.readNumber = function(startsWithDot) {
    var start = this.pos;
    if (!startsWithDot && this.readInt(10) === null) { this.raise(start, "Invalid number"); }
    var octal = this.pos - start >= 2 && this.input.charCodeAt(start) === 48;
    if (octal && this.strict) { this.raise(start, "Invalid number"); }
    if (octal && /[89]/.test(this.input.slice(start, this.pos))) { octal = false; }
    var next = this.input.charCodeAt(this.pos);
    if (!octal && !startsWithDot && this.options.ecmaVersion >= 11 && next === 110) {
      var str$1 = this.input.slice(start, this.pos);
      var val$1 = typeof BigInt !== "undefined" ? BigInt(str$1) : null;
      ++this.pos;
      if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }
      return this.finishToken(types.num, val$1)
    }
    if (next === 46 && !octal) { // '.'
      ++this.pos;
      this.readInt(10);
      next = this.input.charCodeAt(this.pos);
    }
    if ((next === 69 || next === 101) && !octal) { // 'eE'
      next = this.input.charCodeAt(++this.pos);
      if (next === 43 || next === 45) { ++this.pos; } // '+-'
      if (this.readInt(10) === null) { this.raise(start, "Invalid number"); }
    }
    if (isIdentifierStart(this.fullCharCodeAtPos())) { this.raise(this.pos, "Identifier directly after number"); }

    var str = this.input.slice(start, this.pos);
    var val = octal ? parseInt(str, 8) : parseFloat(str);
    return this.finishToken(types.num, val)
  };

  // Read a string value, interpreting backslash-escapes.

  pp$9.readCodePoint = function() {
    var ch = this.input.charCodeAt(this.pos), code;

    if (ch === 123) { // '{'
      if (this.options.ecmaVersion < 6) { this.unexpected(); }
      var codePos = ++this.pos;
      code = this.readHexChar(this.input.indexOf("}", this.pos) - this.pos);
      ++this.pos;
      if (code > 0x10FFFF) { this.invalidStringToken(codePos, "Code point out of bounds"); }
    } else {
      code = this.readHexChar(4);
    }
    return code
  };

  function codePointToString$1(code) {
    // UTF-16 Decoding
    if (code <= 0xFFFF) { return String.fromCharCode(code) }
    code -= 0x10000;
    return String.fromCharCode((code >> 10) + 0xD800, (code & 1023) + 0xDC00)
  }

  pp$9.readString = function(quote) {
    var out = "", chunkStart = ++this.pos;
    for (;;) {
      if (this.pos >= this.input.length) { this.raise(this.start, "Unterminated string constant"); }
      var ch = this.input.charCodeAt(this.pos);
      if (ch === quote) { break }
      if (ch === 92) { // '\'
        out += this.input.slice(chunkStart, this.pos);
        out += this.readEscapedChar(false);
        chunkStart = this.pos;
      } else {
        if (isNewLine(ch, this.options.ecmaVersion >= 10)) { this.raise(this.start, "Unterminated string constant"); }
        ++this.pos;
      }
    }
    out += this.input.slice(chunkStart, this.pos++);
    return this.finishToken(types.string, out)
  };

  // Reads template string tokens.

  var INVALID_TEMPLATE_ESCAPE_ERROR = {};

  pp$9.tryReadTemplateToken = function() {
    this.inTemplateElement = true;
    try {
      this.readTmplToken();
    } catch (err) {
      if (err === INVALID_TEMPLATE_ESCAPE_ERROR) {
        this.readInvalidTemplateToken();
      } else {
        throw err
      }
    }

    this.inTemplateElement = false;
  };

  pp$9.invalidStringToken = function(position, message) {
    if (this.inTemplateElement && this.options.ecmaVersion >= 9) {
      throw INVALID_TEMPLATE_ESCAPE_ERROR
    } else {
      this.raise(position, message);
    }
  };

  pp$9.readTmplToken = function() {
    var out = "", chunkStart = this.pos;
    for (;;) {
      if (this.pos >= this.input.length) { this.raise(this.start, "Unterminated template"); }
      var ch = this.input.charCodeAt(this.pos);
      if (ch === 96 || ch === 36 && this.input.charCodeAt(this.pos + 1) === 123) { // '`', '${'
        if (this.pos === this.start && (this.type === types.template || this.type === types.invalidTemplate)) {
          if (ch === 36) {
            this.pos += 2;
            return this.finishToken(types.dollarBraceL)
          } else {
            ++this.pos;
            return this.finishToken(types.backQuote)
          }
        }
        out += this.input.slice(chunkStart, this.pos);
        return this.finishToken(types.template, out)
      }
      if (ch === 92) { // '\'
        out += this.input.slice(chunkStart, this.pos);
        out += this.readEscapedChar(true);
        chunkStart = this.pos;
      } else if (isNewLine(ch)) {
        out += this.input.slice(chunkStart, this.pos);
        ++this.pos;
        switch (ch) {
        case 13:
          if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; }
        case 10:
          out += "\n";
          break
        default:
          out += String.fromCharCode(ch);
          break
        }
        if (this.options.locations) {
          ++this.curLine;
          this.lineStart = this.pos;
        }
        chunkStart = this.pos;
      } else {
        ++this.pos;
      }
    }
  };

  // Reads a template token to search for the end, without validating any escape sequences
  pp$9.readInvalidTemplateToken = function() {
    for (; this.pos < this.input.length; this.pos++) {
      switch (this.input[this.pos]) {
      case "\\":
        ++this.pos;
        break

      case "$":
        if (this.input[this.pos + 1] !== "{") {
          break
        }
      // falls through

      case "`":
        return this.finishToken(types.invalidTemplate, this.input.slice(this.start, this.pos))

      // no default
      }
    }
    this.raise(this.start, "Unterminated template");
  };

  // Used to read escaped characters

  pp$9.readEscapedChar = function(inTemplate) {
    var ch = this.input.charCodeAt(++this.pos);
    ++this.pos;
    switch (ch) {
    case 110: return "\n" // 'n' -> '\n'
    case 114: return "\r" // 'r' -> '\r'
    case 120: return String.fromCharCode(this.readHexChar(2)) // 'x'
    case 117: return codePointToString$1(this.readCodePoint()) // 'u'
    case 116: return "\t" // 't' -> '\t'
    case 98: return "\b" // 'b' -> '\b'
    case 118: return "\u000b" // 'v' -> '\u000b'
    case 102: return "\f" // 'f' -> '\f'
    case 13: if (this.input.charCodeAt(this.pos) === 10) { ++this.pos; } // '\r\n'
    case 10: // ' \n'
      if (this.options.locations) { this.lineStart = this.pos; ++this.curLine; }
      return ""
    default:
      if (ch >= 48 && ch <= 55) {
        var octalStr = this.input.substr(this.pos - 1, 3).match(/^[0-7]+/)[0];
        var octal = parseInt(octalStr, 8);
        if (octal > 255) {
          octalStr = octalStr.slice(0, -1);
          octal = parseInt(octalStr, 8);
        }
        this.pos += octalStr.length - 1;
        ch = this.input.charCodeAt(this.pos);
        if ((octalStr !== "0" || ch === 56 || ch === 57) && (this.strict || inTemplate)) {
          this.invalidStringToken(
            this.pos - 1 - octalStr.length,
            inTemplate
              ? "Octal literal in template string"
              : "Octal literal in strict mode"
          );
        }
        return String.fromCharCode(octal)
      }
      if (isNewLine(ch)) {
        // Unicode new line characters after \ get removed from output in both
        // template literals and strings
        return ""
      }
      return String.fromCharCode(ch)
    }
  };

  // Used to read character escape sequences ('\x', '\u', '\U').

  pp$9.readHexChar = function(len) {
    var codePos = this.pos;
    var n = this.readInt(16, len);
    if (n === null) { this.invalidStringToken(codePos, "Bad character escape sequence"); }
    return n
  };

  // Read an identifier, and return it as a string. Sets `this.containsEsc`
  // to whether the word contained a '\u' escape.
  //
  // Incrementally adds only escaped chars, adding other chunks as-is
  // as a micro-optimization.

  pp$9.readWord1 = function() {
    this.containsEsc = false;
    var word = "", first = true, chunkStart = this.pos;
    var astral = this.options.ecmaVersion >= 6;
    while (this.pos < this.input.length) {
      var ch = this.fullCharCodeAtPos();
      if (isIdentifierChar(ch, astral)) {
        this.pos += ch <= 0xffff ? 1 : 2;
      } else if (ch === 92) { // "\"
        this.containsEsc = true;
        word += this.input.slice(chunkStart, this.pos);
        var escStart = this.pos;
        if (this.input.charCodeAt(++this.pos) !== 117) // "u"
          { this.invalidStringToken(this.pos, "Expecting Unicode escape sequence \\uXXXX"); }
        ++this.pos;
        var esc = this.readCodePoint();
        if (!(first ? isIdentifierStart : isIdentifierChar)(esc, astral))
          { this.invalidStringToken(escStart, "Invalid Unicode escape"); }
        word += codePointToString$1(esc);
        chunkStart = this.pos;
      } else {
        break
      }
      first = false;
    }
    return word + this.input.slice(chunkStart, this.pos)
  };

  // Read an identifier or keyword token. Will check for reserved
  // words when necessary.

  pp$9.readWord = function() {
    var word = this.readWord1();
    var type = types.name;
    if (this.keywords.test(word)) {
      if (this.containsEsc) { this.raiseRecoverable(this.start, "Escape sequence in keyword " + word); }
      type = keywords$1[word];
    }
    return this.finishToken(type, word)
  };

  // Acorn is a tiny, fast JavaScript parser written in JavaScript.

  var version = "6.4.0";

  Parser.acorn = {
    Parser: Parser,
    version: version,
    defaultOptions: defaultOptions,
    Position: Position,
    SourceLocation: SourceLocation,
    getLineInfo: getLineInfo,
    Node: Node,
    TokenType: TokenType,
    tokTypes: types,
    keywordTypes: keywords$1,
    TokContext: TokContext,
    tokContexts: types$1,
    isIdentifierChar: isIdentifierChar,
    isIdentifierStart: isIdentifierStart,
    Token: Token,
    isNewLine: isNewLine,
    lineBreak: lineBreak,
    lineBreakG: lineBreakG,
    nonASCIIwhitespace: nonASCIIwhitespace
  };

  // The main exported interface (under `self.acorn` when in the
  // browser) is a `parse` function that takes a code string and
  // returns an abstract syntax tree as specified by [Mozilla parser
  // API][api].
  //
  // [api]: https://developer.mozilla.org/en-US/docs/SpiderMonkey/Parser_API

  function parse$1(input, options) {
    return Parser.parse(input, options)
  }

  // This function tries to parse a single expression at a given
  // offset in a string. Useful for parsing mixed-language formats
  // that embed JavaScript expressions.

  function parseExpressionAt(input, pos, options) {
    return Parser.parseExpressionAt(input, pos, options)
  }

  // Acorn is organized as a tokenizer and a recursive-descent parser.
  // The `tokenizer` export provides an interface to the tokenizer.

  function tokenizer(input, options) {
    return Parser.tokenizer(input, options)
  }

  var acorn = /*#__PURE__*/Object.freeze({
    __proto__: null,
    Node: Node,
    Parser: Parser,
    Position: Position,
    SourceLocation: SourceLocation,
    TokContext: TokContext,
    Token: Token,
    TokenType: TokenType,
    defaultOptions: defaultOptions,
    getLineInfo: getLineInfo,
    isIdentifierChar: isIdentifierChar,
    isIdentifierStart: isIdentifierStart,
    isNewLine: isNewLine,
    keywordTypes: keywords$1,
    lineBreak: lineBreak,
    lineBreakG: lineBreakG,
    nonASCIIwhitespace: nonASCIIwhitespace,
    parse: parse$1,
    parseExpressionAt: parseExpressionAt,
    tokContexts: types$1,
    tokTypes: types,
    tokenizer: tokenizer,
    version: version
  });

  var xhtml = {
    quot: '\u0022',
    amp: '&',
    apos: '\u0027',
    lt: '<',
    gt: '>',
    nbsp: '\u00A0',
    iexcl: '\u00A1',
    cent: '\u00A2',
    pound: '\u00A3',
    curren: '\u00A4',
    yen: '\u00A5',
    brvbar: '\u00A6',
    sect: '\u00A7',
    uml: '\u00A8',
    copy: '\u00A9',
    ordf: '\u00AA',
    laquo: '\u00AB',
    not: '\u00AC',
    shy: '\u00AD',
    reg: '\u00AE',
    macr: '\u00AF',
    deg: '\u00B0',
    plusmn: '\u00B1',
    sup2: '\u00B2',
    sup3: '\u00B3',
    acute: '\u00B4',
    micro: '\u00B5',
    para: '\u00B6',
    middot: '\u00B7',
    cedil: '\u00B8',
    sup1: '\u00B9',
    ordm: '\u00BA',
    raquo: '\u00BB',
    frac14: '\u00BC',
    frac12: '\u00BD',
    frac34: '\u00BE',
    iquest: '\u00BF',
    Agrave: '\u00C0',
    Aacute: '\u00C1',
    Acirc: '\u00C2',
    Atilde: '\u00C3',
    Auml: '\u00C4',
    Aring: '\u00C5',
    AElig: '\u00C6',
    Ccedil: '\u00C7',
    Egrave: '\u00C8',
    Eacute: '\u00C9',
    Ecirc: '\u00CA',
    Euml: '\u00CB',
    Igrave: '\u00CC',
    Iacute: '\u00CD',
    Icirc: '\u00CE',
    Iuml: '\u00CF',
    ETH: '\u00D0',
    Ntilde: '\u00D1',
    Ograve: '\u00D2',
    Oacute: '\u00D3',
    Ocirc: '\u00D4',
    Otilde: '\u00D5',
    Ouml: '\u00D6',
    times: '\u00D7',
    Oslash: '\u00D8',
    Ugrave: '\u00D9',
    Uacute: '\u00DA',
    Ucirc: '\u00DB',
    Uuml: '\u00DC',
    Yacute: '\u00DD',
    THORN: '\u00DE',
    szlig: '\u00DF',
    agrave: '\u00E0',
    aacute: '\u00E1',
    acirc: '\u00E2',
    atilde: '\u00E3',
    auml: '\u00E4',
    aring: '\u00E5',
    aelig: '\u00E6',
    ccedil: '\u00E7',
    egrave: '\u00E8',
    eacute: '\u00E9',
    ecirc: '\u00EA',
    euml: '\u00EB',
    igrave: '\u00EC',
    iacute: '\u00ED',
    icirc: '\u00EE',
    iuml: '\u00EF',
    eth: '\u00F0',
    ntilde: '\u00F1',
    ograve: '\u00F2',
    oacute: '\u00F3',
    ocirc: '\u00F4',
    otilde: '\u00F5',
    ouml: '\u00F6',
    divide: '\u00F7',
    oslash: '\u00F8',
    ugrave: '\u00F9',
    uacute: '\u00FA',
    ucirc: '\u00FB',
    uuml: '\u00FC',
    yacute: '\u00FD',
    thorn: '\u00FE',
    yuml: '\u00FF',
    OElig: '\u0152',
    oelig: '\u0153',
    Scaron: '\u0160',
    scaron: '\u0161',
    Yuml: '\u0178',
    fnof: '\u0192',
    circ: '\u02C6',
    tilde: '\u02DC',
    Alpha: '\u0391',
    Beta: '\u0392',
    Gamma: '\u0393',
    Delta: '\u0394',
    Epsilon: '\u0395',
    Zeta: '\u0396',
    Eta: '\u0397',
    Theta: '\u0398',
    Iota: '\u0399',
    Kappa: '\u039A',
    Lambda: '\u039B',
    Mu: '\u039C',
    Nu: '\u039D',
    Xi: '\u039E',
    Omicron: '\u039F',
    Pi: '\u03A0',
    Rho: '\u03A1',
    Sigma: '\u03A3',
    Tau: '\u03A4',
    Upsilon: '\u03A5',
    Phi: '\u03A6',
    Chi: '\u03A7',
    Psi: '\u03A8',
    Omega: '\u03A9',
    alpha: '\u03B1',
    beta: '\u03B2',
    gamma: '\u03B3',
    delta: '\u03B4',
    epsilon: '\u03B5',
    zeta: '\u03B6',
    eta: '\u03B7',
    theta: '\u03B8',
    iota: '\u03B9',
    kappa: '\u03BA',
    lambda: '\u03BB',
    mu: '\u03BC',
    nu: '\u03BD',
    xi: '\u03BE',
    omicron: '\u03BF',
    pi: '\u03C0',
    rho: '\u03C1',
    sigmaf: '\u03C2',
    sigma: '\u03C3',
    tau: '\u03C4',
    upsilon: '\u03C5',
    phi: '\u03C6',
    chi: '\u03C7',
    psi: '\u03C8',
    omega: '\u03C9',
    thetasym: '\u03D1',
    upsih: '\u03D2',
    piv: '\u03D6',
    ensp: '\u2002',
    emsp: '\u2003',
    thinsp: '\u2009',
    zwnj: '\u200C',
    zwj: '\u200D',
    lrm: '\u200E',
    rlm: '\u200F',
    ndash: '\u2013',
    mdash: '\u2014',
    lsquo: '\u2018',
    rsquo: '\u2019',
    sbquo: '\u201A',
    ldquo: '\u201C',
    rdquo: '\u201D',
    bdquo: '\u201E',
    dagger: '\u2020',
    Dagger: '\u2021',
    bull: '\u2022',
    hellip: '\u2026',
    permil: '\u2030',
    prime: '\u2032',
    Prime: '\u2033',
    lsaquo: '\u2039',
    rsaquo: '\u203A',
    oline: '\u203E',
    frasl: '\u2044',
    euro: '\u20AC',
    image: '\u2111',
    weierp: '\u2118',
    real: '\u211C',
    trade: '\u2122',
    alefsym: '\u2135',
    larr: '\u2190',
    uarr: '\u2191',
    rarr: '\u2192',
    darr: '\u2193',
    harr: '\u2194',
    crarr: '\u21B5',
    lArr: '\u21D0',
    uArr: '\u21D1',
    rArr: '\u21D2',
    dArr: '\u21D3',
    hArr: '\u21D4',
    forall: '\u2200',
    part: '\u2202',
    exist: '\u2203',
    empty: '\u2205',
    nabla: '\u2207',
    isin: '\u2208',
    notin: '\u2209',
    ni: '\u220B',
    prod: '\u220F',
    sum: '\u2211',
    minus: '\u2212',
    lowast: '\u2217',
    radic: '\u221A',
    prop: '\u221D',
    infin: '\u221E',
    ang: '\u2220',
    and: '\u2227',
    or: '\u2228',
    cap: '\u2229',
    cup: '\u222A',
    'int': '\u222B',
    there4: '\u2234',
    sim: '\u223C',
    cong: '\u2245',
    asymp: '\u2248',
    ne: '\u2260',
    equiv: '\u2261',
    le: '\u2264',
    ge: '\u2265',
    sub: '\u2282',
    sup: '\u2283',
    nsub: '\u2284',
    sube: '\u2286',
    supe: '\u2287',
    oplus: '\u2295',
    otimes: '\u2297',
    perp: '\u22A5',
    sdot: '\u22C5',
    lceil: '\u2308',
    rceil: '\u2309',
    lfloor: '\u230A',
    rfloor: '\u230B',
    lang: '\u2329',
    rang: '\u232A',
    loz: '\u25CA',
    spades: '\u2660',
    clubs: '\u2663',
    hearts: '\u2665',
    diams: '\u2666'
  };

  var _acorn = getCjsExportFromNamespace(acorn);

  var acornJsx = createCommonjsModule(function (module) {



  var hexNumber = /^[\da-fA-F]+$/;
  var decimalNumber = /^\d+$/;

  // The map to `acorn-jsx` tokens from `acorn` namespace objects.
  var acornJsxMap = new WeakMap();

  // Get the original tokens for the given `acorn` namespace object.
  function getJsxTokens(acorn) {
    acorn = acorn.Parser.acorn || acorn;
    var acornJsx = acornJsxMap.get(acorn);
    if (!acornJsx) {
      var tt = acorn.tokTypes;
      var TokContext = acorn.TokContext;
      var TokenType = acorn.TokenType;
      var tc_oTag = new TokContext('<tag', false);
      var tc_cTag = new TokContext('</tag', false);
      var tc_expr = new TokContext('<tag>...</tag>', true, true);
      var tokContexts = {
        tc_oTag: tc_oTag,
        tc_cTag: tc_cTag,
        tc_expr: tc_expr
      };
      var tokTypes = {
        jsxName: new TokenType('jsxName'),
        jsxText: new TokenType('jsxText', {beforeExpr: true}),
        jsxTagStart: new TokenType('jsxTagStart'),
        jsxTagEnd: new TokenType('jsxTagEnd')
      };

      tokTypes.jsxTagStart.updateContext = function() {
        this.context.push(tc_expr); // treat as beginning of JSX expression
        this.context.push(tc_oTag); // start opening tag context
        this.exprAllowed = false;
      };
      tokTypes.jsxTagEnd.updateContext = function(prevType) {
        var out = this.context.pop();
        if (out === tc_oTag && prevType === tt.slash || out === tc_cTag) {
          this.context.pop();
          this.exprAllowed = this.curContext() === tc_expr;
        } else {
          this.exprAllowed = true;
        }
      };

      acornJsx = { tokContexts: tokContexts, tokTypes: tokTypes };
      acornJsxMap.set(acorn, acornJsx);
    }

    return acornJsx;
  }

  // Transforms JSX element name to string.

  function getQualifiedJSXName(object) {
    if (!object)
      { return object; }

    if (object.type === 'JSXIdentifier')
      { return object.name; }

    if (object.type === 'JSXNamespacedName')
      { return object.namespace.name + ':' + object.name.name; }

    if (object.type === 'JSXMemberExpression')
      { return getQualifiedJSXName(object.object) + '.' +
      getQualifiedJSXName(object.property); }
  }

  module.exports = function(options) {
    options = options || {};
    return function(Parser) {
      return plugin({
        allowNamespaces: options.allowNamespaces !== false,
        allowNamespacedObjects: !!options.allowNamespacedObjects
      }, Parser);
    };
  };

  // This is `tokTypes` of the peer dep.
  // This can be different instances from the actual `tokTypes` this plugin uses.
  Object.defineProperty(module.exports, "tokTypes", {
    get: function get_tokTypes() {
      return getJsxTokens(_acorn).tokTypes;
    },
    configurable: true,
    enumerable: true
  });

  function plugin(options, Parser) {
    var acorn = Parser.acorn || _acorn;
    var acornJsx = getJsxTokens(acorn);
    var tt = acorn.tokTypes;
    var tok = acornJsx.tokTypes;
    var tokContexts = acorn.tokContexts;
    var tc_oTag = acornJsx.tokContexts.tc_oTag;
    var tc_cTag = acornJsx.tokContexts.tc_cTag;
    var tc_expr = acornJsx.tokContexts.tc_expr;
    var isNewLine = acorn.isNewLine;
    var isIdentifierStart = acorn.isIdentifierStart;
    var isIdentifierChar = acorn.isIdentifierChar;

    return /*@__PURE__*/(function (Parser) {
      function anonymous () {
        Parser.apply(this, arguments);
      }

      if ( Parser ) anonymous.__proto__ = Parser;
      anonymous.prototype = Object.create( Parser && Parser.prototype );
      anonymous.prototype.constructor = anonymous;

      var staticAccessors = { acornJsx: { configurable: true } };

      staticAccessors.acornJsx.get = function () {
        return acornJsx;
      };

      // Reads inline JSX contents token.
      anonymous.prototype.jsx_readToken = function jsx_readToken () {
        var out = '', chunkStart = this.pos;
        for (;;) {
          if (this.pos >= this.input.length)
            { this.raise(this.start, 'Unterminated JSX contents'); }
          var ch = this.input.charCodeAt(this.pos);

          switch (ch) {
          case 60: // '<'
          case 123: // '{'
            if (this.pos === this.start) {
              if (ch === 60 && this.exprAllowed) {
                ++this.pos;
                return this.finishToken(tok.jsxTagStart);
              }
              return this.getTokenFromCode(ch);
            }
            out += this.input.slice(chunkStart, this.pos);
            return this.finishToken(tok.jsxText, out);

          case 38: // '&'
            out += this.input.slice(chunkStart, this.pos);
            out += this.jsx_readEntity();
            chunkStart = this.pos;
            break;

          case 62: // '>'
          case 125: // '}'
            this.raise(
              this.pos,
              "Unexpected token `" + this.input[this.pos] + "`. Did you mean `" +
                (ch === 62 ? "&gt;" : "&rbrace;") + "` or " + "`{\"" + this.input[this.pos] + "\"}" + "`?"
            );

          default:
            if (isNewLine(ch)) {
              out += this.input.slice(chunkStart, this.pos);
              out += this.jsx_readNewLine(true);
              chunkStart = this.pos;
            } else {
              ++this.pos;
            }
          }
        }
      };

      anonymous.prototype.jsx_readNewLine = function jsx_readNewLine (normalizeCRLF) {
        var ch = this.input.charCodeAt(this.pos);
        var out;
        ++this.pos;
        if (ch === 13 && this.input.charCodeAt(this.pos) === 10) {
          ++this.pos;
          out = normalizeCRLF ? '\n' : '\r\n';
        } else {
          out = String.fromCharCode(ch);
        }
        if (this.options.locations) {
          ++this.curLine;
          this.lineStart = this.pos;
        }

        return out;
      };

      anonymous.prototype.jsx_readString = function jsx_readString (quote) {
        var out = '', chunkStart = ++this.pos;
        for (;;) {
          if (this.pos >= this.input.length)
            { this.raise(this.start, 'Unterminated string constant'); }
          var ch = this.input.charCodeAt(this.pos);
          if (ch === quote) { break; }
          if (ch === 38) { // '&'
            out += this.input.slice(chunkStart, this.pos);
            out += this.jsx_readEntity();
            chunkStart = this.pos;
          } else if (isNewLine(ch)) {
            out += this.input.slice(chunkStart, this.pos);
            out += this.jsx_readNewLine(false);
            chunkStart = this.pos;
          } else {
            ++this.pos;
          }
        }
        out += this.input.slice(chunkStart, this.pos++);
        return this.finishToken(tt.string, out);
      };

      anonymous.prototype.jsx_readEntity = function jsx_readEntity () {
        var str = '', count = 0, entity;
        var ch = this.input[this.pos];
        if (ch !== '&')
          { this.raise(this.pos, 'Entity must start with an ampersand'); }
        var startPos = ++this.pos;
        while (this.pos < this.input.length && count++ < 10) {
          ch = this.input[this.pos++];
          if (ch === ';') {
            if (str[0] === '#') {
              if (str[1] === 'x') {
                str = str.substr(2);
                if (hexNumber.test(str))
                  { entity = String.fromCharCode(parseInt(str, 16)); }
              } else {
                str = str.substr(1);
                if (decimalNumber.test(str))
                  { entity = String.fromCharCode(parseInt(str, 10)); }
              }
            } else {
              entity = xhtml[str];
            }
            break;
          }
          str += ch;
        }
        if (!entity) {
          this.pos = startPos;
          return '&';
        }
        return entity;
      };

      // Read a JSX identifier (valid tag or attribute name).
      //
      // Optimized version since JSX identifiers can't contain
      // escape characters and so can be read as single slice.
      // Also assumes that first character was already checked
      // by isIdentifierStart in readToken.

      anonymous.prototype.jsx_readWord = function jsx_readWord () {
        var ch, start = this.pos;
        do {
          ch = this.input.charCodeAt(++this.pos);
        } while (isIdentifierChar(ch) || ch === 45); // '-'
        return this.finishToken(tok.jsxName, this.input.slice(start, this.pos));
      };

      // Parse next token as JSX identifier

      anonymous.prototype.jsx_parseIdentifier = function jsx_parseIdentifier () {
        var node = this.startNode();
        if (this.type === tok.jsxName)
          { node.name = this.value; }
        else if (this.type.keyword)
          { node.name = this.type.keyword; }
        else
          { this.unexpected(); }
        this.next();
        return this.finishNode(node, 'JSXIdentifier');
      };

      // Parse namespaced identifier.

      anonymous.prototype.jsx_parseNamespacedName = function jsx_parseNamespacedName () {
        var startPos = this.start, startLoc = this.startLoc;
        var name = this.jsx_parseIdentifier();
        if (!options.allowNamespaces || !this.eat(tt.colon)) { return name; }
        var node = this.startNodeAt(startPos, startLoc);
        node.namespace = name;
        node.name = this.jsx_parseIdentifier();
        return this.finishNode(node, 'JSXNamespacedName');
      };

      // Parses element name in any form - namespaced, member
      // or single identifier.

      anonymous.prototype.jsx_parseElementName = function jsx_parseElementName () {
        if (this.type === tok.jsxTagEnd) { return ''; }
        var startPos = this.start, startLoc = this.startLoc;
        var node = this.jsx_parseNamespacedName();
        if (this.type === tt.dot && node.type === 'JSXNamespacedName' && !options.allowNamespacedObjects) {
          this.unexpected();
        }
        while (this.eat(tt.dot)) {
          var newNode = this.startNodeAt(startPos, startLoc);
          newNode.object = node;
          newNode.property = this.jsx_parseIdentifier();
          node = this.finishNode(newNode, 'JSXMemberExpression');
        }
        return node;
      };

      // Parses any type of JSX attribute value.

      anonymous.prototype.jsx_parseAttributeValue = function jsx_parseAttributeValue () {
        switch (this.type) {
        case tt.braceL:
          var node = this.jsx_parseExpressionContainer();
          if (node.expression.type === 'JSXEmptyExpression')
            { this.raise(node.start, 'JSX attributes must only be assigned a non-empty expression'); }
          return node;

        case tok.jsxTagStart:
        case tt.string:
          return this.parseExprAtom();

        default:
          this.raise(this.start, 'JSX value should be either an expression or a quoted JSX text');
        }
      };

      // JSXEmptyExpression is unique type since it doesn't actually parse anything,
      // and so it should start at the end of last read token (left brace) and finish
      // at the beginning of the next one (right brace).

      anonymous.prototype.jsx_parseEmptyExpression = function jsx_parseEmptyExpression () {
        var node = this.startNodeAt(this.lastTokEnd, this.lastTokEndLoc);
        return this.finishNodeAt(node, 'JSXEmptyExpression', this.start, this.startLoc);
      };

      // Parses JSX expression enclosed into curly brackets.

      anonymous.prototype.jsx_parseExpressionContainer = function jsx_parseExpressionContainer () {
        var node = this.startNode();
        this.next();
        node.expression = this.type === tt.braceR
          ? this.jsx_parseEmptyExpression()
          : this.parseExpression();
        this.expect(tt.braceR);
        return this.finishNode(node, 'JSXExpressionContainer');
      };

      // Parses following JSX attribute name-value pair.

      anonymous.prototype.jsx_parseAttribute = function jsx_parseAttribute () {
        var node = this.startNode();
        if (this.eat(tt.braceL)) {
          this.expect(tt.ellipsis);
          node.argument = this.parseMaybeAssign();
          this.expect(tt.braceR);
          return this.finishNode(node, 'JSXSpreadAttribute');
        }
        node.name = this.jsx_parseNamespacedName();
        node.value = this.eat(tt.eq) ? this.jsx_parseAttributeValue() : null;
        return this.finishNode(node, 'JSXAttribute');
      };

      // Parses JSX opening tag starting after '<'.

      anonymous.prototype.jsx_parseOpeningElementAt = function jsx_parseOpeningElementAt (startPos, startLoc) {
        var node = this.startNodeAt(startPos, startLoc);
        node.attributes = [];
        var nodeName = this.jsx_parseElementName();
        if (nodeName) { node.name = nodeName; }
        while (this.type !== tt.slash && this.type !== tok.jsxTagEnd)
          { node.attributes.push(this.jsx_parseAttribute()); }
        node.selfClosing = this.eat(tt.slash);
        this.expect(tok.jsxTagEnd);
        return this.finishNode(node, nodeName ? 'JSXOpeningElement' : 'JSXOpeningFragment');
      };

      // Parses JSX closing tag starting after '</'.

      anonymous.prototype.jsx_parseClosingElementAt = function jsx_parseClosingElementAt (startPos, startLoc) {
        var node = this.startNodeAt(startPos, startLoc);
        var nodeName = this.jsx_parseElementName();
        if (nodeName) { node.name = nodeName; }
        this.expect(tok.jsxTagEnd);
        return this.finishNode(node, nodeName ? 'JSXClosingElement' : 'JSXClosingFragment');
      };

      // Parses entire JSX element, including it's opening tag
      // (starting after '<'), attributes, contents and closing tag.

      anonymous.prototype.jsx_parseElementAt = function jsx_parseElementAt (startPos, startLoc) {
        var node = this.startNodeAt(startPos, startLoc);
        var children = [];
        var openingElement = this.jsx_parseOpeningElementAt(startPos, startLoc);
        var closingElement = null;

        if (!openingElement.selfClosing) {
          contents: for (;;) {
            switch (this.type) {
            case tok.jsxTagStart:
              startPos = this.start; startLoc = this.startLoc;
              this.next();
              if (this.eat(tt.slash)) {
                closingElement = this.jsx_parseClosingElementAt(startPos, startLoc);
                break contents;
              }
              children.push(this.jsx_parseElementAt(startPos, startLoc));
              break;

            case tok.jsxText:
              children.push(this.parseExprAtom());
              break;

            case tt.braceL:
              children.push(this.jsx_parseExpressionContainer());
              break;

            default:
              this.unexpected();
            }
          }
          if (getQualifiedJSXName(closingElement.name) !== getQualifiedJSXName(openingElement.name)) {
            this.raise(
              closingElement.start,
              'Expected corresponding JSX closing tag for <' + getQualifiedJSXName(openingElement.name) + '>');
          }
        }
        var fragmentOrElement = openingElement.name ? 'Element' : 'Fragment';

        node['opening' + fragmentOrElement] = openingElement;
        node['closing' + fragmentOrElement] = closingElement;
        node.children = children;
        if (this.type === tt.relational && this.value === "<") {
          this.raise(this.start, "Adjacent JSX elements must be wrapped in an enclosing tag");
        }
        return this.finishNode(node, 'JSX' + fragmentOrElement);
      };

      // Parse JSX text

      anonymous.prototype.jsx_parseText = function jsx_parseText () {
        var node = this.parseLiteral(this.value);
        node.type = "JSXText";
        return node;
      };

      // Parses entire JSX element from current position.

      anonymous.prototype.jsx_parseElement = function jsx_parseElement () {
        var startPos = this.start, startLoc = this.startLoc;
        this.next();
        return this.jsx_parseElementAt(startPos, startLoc);
      };

      anonymous.prototype.parseExprAtom = function parseExprAtom (refShortHandDefaultPos) {
        if (this.type === tok.jsxText)
          { return this.jsx_parseText(); }
        else if (this.type === tok.jsxTagStart)
          { return this.jsx_parseElement(); }
        else
          { return Parser.prototype.parseExprAtom.call(this, refShortHandDefaultPos); }
      };

      anonymous.prototype.readToken = function readToken (code) {
        var context = this.curContext();

        if (context === tc_expr) { return this.jsx_readToken(); }

        if (context === tc_oTag || context === tc_cTag) {
          if (isIdentifierStart(code)) { return this.jsx_readWord(); }

          if (code == 62) {
            ++this.pos;
            return this.finishToken(tok.jsxTagEnd);
          }

          if ((code === 34 || code === 39) && context == tc_oTag)
            { return this.jsx_readString(code); }
        }

        if (code === 60 && this.exprAllowed && this.input.charCodeAt(this.pos + 1) !== 33) {
          ++this.pos;
          return this.finishToken(tok.jsxTagStart);
        }
        return Parser.prototype.readToken.call(this, code);
      };

      anonymous.prototype.updateContext = function updateContext (prevType) {
        if (this.type == tt.braceL) {
          var curContext = this.curContext();
          if (curContext == tc_oTag) { this.context.push(tokContexts.b_expr); }
          else if (curContext == tc_expr) { this.context.push(tokContexts.b_tmpl); }
          else { Parser.prototype.updateContext.call(this, prevType); }
          this.exprAllowed = true;
        } else if (this.type === tt.slash && prevType === tok.jsxTagStart) {
          this.context.length -= 2; // do not consider JSX expr -> JSX open tag -> ... anymore
          this.context.push(tc_cTag); // reconsider as closing tag context
          this.exprAllowed = false;
        } else {
          return Parser.prototype.updateContext.call(this, prevType);
        }
      };

      Object.defineProperties( anonymous, staticAccessors );

      return anonymous;
    }(Parser));
  }
  });

  var lib = createCommonjsModule(function (module, exports) {

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  exports.DynamicImportKey = undefined;

  var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) { descriptor.writable = true; } Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) { defineProperties(Constructor.prototype, protoProps); } if (staticProps) { defineProperties(Constructor, staticProps); } return Constructor; }; }();

  var _get = function () {
    function get(object, property, receiver) { if (object === null) { object = Function.prototype; } var desc = Object.getOwnPropertyDescriptor(object, property); if (desc === undefined) { var parent = Object.getPrototypeOf(object); if (parent === null) { return undefined; } else { return get(parent, property, receiver); } } else if ("value" in desc) { return desc.value; } else { var getter = desc.get; if (getter === undefined) { return undefined; } return getter.call(receiver); } }

    return get;
  }();

  exports['default'] = dynamicImport;



  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

  function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

  function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) { Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; } } /* eslint-disable no-underscore-dangle */


  var DynamicImportKey = exports.DynamicImportKey = 'Import';

  // NOTE: This allows `yield import()` to parse correctly.
  _acorn.tokTypes._import.startsExpr = true;

  function parseDynamicImport() {
    var node = this.startNode();
    this.next();
    if (this.type !== _acorn.tokTypes.parenL) {
      this.unexpected();
    }
    return this.finishNode(node, DynamicImportKey);
  }

  function parenAfter() {
    return (/^(\s|\/\/.*|\/\*[^]*?\*\/)*\(/.test(this.input.slice(this.pos))
    );
  }

  function dynamicImport(Parser) {
    return function (_Parser) {
      _inherits(_class, _Parser);

      function _class() {
        _classCallCheck(this, _class);

        return _possibleConstructorReturn(this, (_class.__proto__ || Object.getPrototypeOf(_class)).apply(this, arguments));
      }

      _createClass(_class, [{
        key: 'parseStatement',
        value: function () {
          function parseStatement(context, topLevel, exports) {
            if (this.type === _acorn.tokTypes._import && parenAfter.call(this)) {
              return this.parseExpressionStatement(this.startNode(), this.parseExpression());
            }
            return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), 'parseStatement', this).call(this, context, topLevel, exports);
          }

          return parseStatement;
        }()
      }, {
        key: 'parseExprAtom',
        value: function () {
          function parseExprAtom(refDestructuringErrors) {
            if (this.type === _acorn.tokTypes._import) {
              return parseDynamicImport.call(this);
            }
            return _get(_class.prototype.__proto__ || Object.getPrototypeOf(_class.prototype), 'parseExprAtom', this).call(this, refDestructuringErrors);
          }

          return parseExprAtom;
        }()
      }]);

      return _class;
    }(Parser);
  }
  });

  var acornDynamicImport = unwrapExports(lib);
  var lib_1 = lib.DynamicImportKey;

  // used for debugging, without the noise created by
  // circular references
  function toJSON(node) {
  	var obj = {};

  	Object.keys(node).forEach(function (key) {
  		if (
  			key === 'parent' ||
  			key === 'program' ||
  			key === 'keys' ||
  			key === '__wrapped'
  		)
  			{ return; }

  		if (Array.isArray(node[key])) {
  			obj[key] = node[key].map(toJSON);
  		} else if (node[key] && node[key].toJSON) {
  			obj[key] = node[key].toJSON();
  		} else {
  			obj[key] = node[key];
  		}
  	});

  	return obj;
  }

  var Node$1 = function Node () {};

  Node$1.prototype.ancestor = function ancestor (level) {
  	var node = this;
  	while (level--) {
  		node = node.parent;
  		if (!node) { return null; }
  	}

  	return node;
  };

  Node$1.prototype.contains = function contains (node) {
  	while (node) {
  		if (node === this) { return true; }
  		node = node.parent;
  	}

  	return false;
  };

  Node$1.prototype.findLexicalBoundary = function findLexicalBoundary () {
  	return this.parent.findLexicalBoundary();
  };

  Node$1.prototype.findNearest = function findNearest (type) {
  	if (typeof type === 'string') { type = new RegExp(("^" + type + "$")); }
  	if (type.test(this.type)) { return this; }
  	return this.parent.findNearest(type);
  };

  Node$1.prototype.unparenthesizedParent = function unparenthesizedParent () {
  	var node = this.parent;
  	while (node && node.type === 'ParenthesizedExpression') {
  		node = node.parent;
  	}
  	return node;
  };

  Node$1.prototype.unparenthesize = function unparenthesize () {
  	var node = this;
  	while (node.type === 'ParenthesizedExpression') {
  		node = node.expression;
  	}
  	return node;
  };

  Node$1.prototype.findScope = function findScope (functionScope) {
  	return this.parent.findScope(functionScope);
  };

  Node$1.prototype.getIndentation = function getIndentation () {
  	return this.parent.getIndentation();
  };

  Node$1.prototype.initialise = function initialise (transforms) {
  	for (var i = 0, list = this.keys; i < list.length; i += 1) {
  		var key = list[i];

  		var value = this[key];

  		if (Array.isArray(value)) {
  			value.forEach(function (node) { return node && node.initialise(transforms); });
  		} else if (value && typeof value === 'object') {
  			value.initialise(transforms);
  		}
  	}
  };

  Node$1.prototype.toJSON = function toJSON$1 () {
  	return toJSON(this);
  };

  Node$1.prototype.toString = function toString () {
  	return this.program.magicString.original.slice(this.start, this.end);
  };

  Node$1.prototype.transpile = function transpile (code, transforms) {
  	for (var i = 0, list = this.keys; i < list.length; i += 1) {
  		var key = list[i];

  		var value = this[key];

  		if (Array.isArray(value)) {
  			value.forEach(function (node) { return node && node.transpile(code, transforms); });
  		} else if (value && typeof value === 'object') {
  			value.transpile(code, transforms);
  		}
  	}
  };

  function extractNames(node) {
  	var names = [];
  	extractors[node.type](names, node);
  	return names;
  }

  var extractors = {
  	Identifier: function Identifier(names, node) {
  		names.push(node);
  	},

  	ObjectPattern: function ObjectPattern(names, node) {
  		for (var i = 0, list = node.properties; i < list.length; i += 1) {
  			var prop = list[i];

  			extractors[prop.type](names, prop);
  		}
  	},

  	Property: function Property(names, node) {
  		extractors[node.value.type](names, node.value);
  	},

  	ArrayPattern: function ArrayPattern(names, node) {
  		for (var i = 0, list = node.elements; i < list.length; i += 1) {
  			var element = list[i];

  			if (element) { extractors[element.type](names, element); }
  		}
  	},

  	RestElement: function RestElement(names, node) {
  		extractors[node.argument.type](names, node.argument);
  	},

  	AssignmentPattern: function AssignmentPattern(names, node) {
  		extractors[node.left.type](names, node.left);
  	}
  };

  var reserved = Object.create(null);
  'do if in for let new try var case else enum eval null this true void with await break catch class const false super throw while yield delete export import public return static switch typeof default extends finally package private continue debugger function arguments interface protected implements instanceof'
  	.split(' ')
  	.forEach(function (word) { return (reserved[word] = true); });

  function Scope$1(options) {
  	options = options || {};

  	this.parent = options.parent;
  	this.isBlockScope = !!options.block;
  	this.createDeclarationCallback = options.declare;

  	var scope = this;
  	while (scope.isBlockScope) { scope = scope.parent; }
  	this.functionScope = scope;

  	this.identifiers = [];
  	this.declarations = Object.create(null);
  	this.references = Object.create(null);
  	this.blockScopedDeclarations = this.isBlockScope ? null : Object.create(null);
  	this.aliases = Object.create(null);
  }

  Scope$1.prototype = {
  	addDeclaration: function addDeclaration(node, kind) {
  		for (var i = 0, list = extractNames(node); i < list.length; i += 1) {
  			var identifier = list[i];

  			var name = identifier.name;

  			var declaration = { name: name, node: identifier, kind: kind, instances: [] };
  			this.declarations[name] = declaration;

  			if (this.isBlockScope) {
  				if (!this.functionScope.blockScopedDeclarations[name])
  					{ this.functionScope.blockScopedDeclarations[name] = []; }
  				this.functionScope.blockScopedDeclarations[name].push(declaration);
  			}
  		}
  	},

  	addReference: function addReference(identifier) {
  		if (this.consolidated) {
  			this.consolidateReference(identifier);
  		} else {
  			this.identifiers.push(identifier);
  		}
  	},

  	consolidate: function consolidate() {
  		for (var i = 0; i < this.identifiers.length; i += 1) {
  			// we might push to the array during consolidation, so don't cache length
  			var identifier = this.identifiers[i];
  			this.consolidateReference(identifier);
  		}

  		this.consolidated = true; // TODO understand why this is necessary... seems bad
  	},

  	consolidateReference: function consolidateReference(identifier) {
  		var declaration = this.declarations[identifier.name];
  		if (declaration) {
  			declaration.instances.push(identifier);
  		} else {
  			this.references[identifier.name] = true;
  			if (this.parent) { this.parent.addReference(identifier); }
  		}
  	},

  	contains: function contains(name) {
  		return (
  			this.declarations[name] ||
  			(this.parent ? this.parent.contains(name) : false)
  		);
  	},

  	createIdentifier: function createIdentifier(base) {
  		if (typeof base === 'number') { base = base.toString(); }

  		base = base
  			.replace(/\s/g, '')
  			.replace(/\[([^\]]+)\]/g, '_$1')
  			.replace(/[^a-zA-Z0-9_$]/g, '_')
  			.replace(/_{2,}/, '_');

  		var name = base;
  		var counter = 1;

  		while (
  			this.declarations[name] ||
  			this.references[name] ||
  			this.aliases[name] ||
  			name in reserved
  		) {
  			name = base + "$" + (counter++);
  		}

  		this.aliases[name] = true;
  		return name;
  	},

  	createDeclaration: function createDeclaration(base) {
  		var id = this.createIdentifier(base);
  		this.createDeclarationCallback(id);
  		return id;
  	},

  	findDeclaration: function findDeclaration(name) {
  		return (
  			this.declarations[name] ||
  			(this.parent && this.parent.findDeclaration(name))
  		);
  	},

  	// Sometimes, block scope declarations change name during transpilation
  	resolveName: function resolveName(name) {
  		var declaration = this.findDeclaration(name);
  		return declaration ? declaration.name : name;
  	}
  };

  function locate(source, index) {
  	var lines = source.split('\n');
  	var len = lines.length;

  	var lineStart = 0;
  	var i;

  	for (i = 0; i < len; i += 1) {
  		var line = lines[i];
  		var lineEnd = lineStart + line.length + 1; // +1 for newline

  		if (lineEnd > index) {
  			return { line: i + 1, column: index - lineStart, char: i };
  		}

  		lineStart = lineEnd;
  	}

  	throw new Error('Could not determine location of character');
  }

  function pad(num, len) {
  	var result = String(num);
  	return result + repeat(' ', len - result.length);
  }

  function repeat(str, times) {
  	var result = '';
  	while (times--) { result += str; }
  	return result;
  }

  function getSnippet(source, loc, length) {
  	if ( length === void 0 ) { length = 1; }

  	var first = Math.max(loc.line - 5, 0);
  	var last = loc.line;

  	var numDigits = String(last).length;

  	var lines = source.split('\n').slice(first, last);

  	var lastLine = lines[lines.length - 1];
  	var offset = lastLine.slice(0, loc.column).replace(/\t/g, '  ').length;

  	var snippet = lines
  		.map(function (line, i) { return ((pad(i + first + 1, numDigits)) + " : " + (line.replace(/\t/g, '  '))); })
  		.join('\n');

  	snippet += '\n' + repeat(' ', numDigits + 3 + offset) + repeat('^', length);

  	return snippet;
  }

  var CompileError = /*@__PURE__*/(function (Error) {
  	function CompileError(message, node) {
  		Error.call(this, message);

  		this.name = 'CompileError';
  		if (!node) {
  			return;
  		}

  		var source = node.program.magicString.original;
  		var loc = locate(source, node.start);

  		this.message = message + " (" + (loc.line) + ":" + (loc.column) + ")";

  		this.stack = new Error().stack.replace(
  			new RegExp((".+new " + (this.name) + ".+\\n"), 'm'),
  			''
  		);

  		this.loc = loc;
  		this.snippet = getSnippet(source, loc, node.end - node.start);
  	}

  	if ( Error ) CompileError.__proto__ = Error;
  	CompileError.prototype = Object.create( Error && Error.prototype );
  	CompileError.prototype.constructor = CompileError;

  	CompileError.prototype.toString = function toString () {
  		return ((this.name) + ": " + (this.message) + "\n" + (this.snippet));
  	};

  	CompileError.missingTransform = function missingTransform (feature, transformKey, node, dangerousKey) {
  		if ( dangerousKey === void 0 ) { dangerousKey = null; }

  		var maybeDangerous = dangerousKey ? (", or `transforms: { " + dangerousKey + ": true }` if you know what you're doing") : '';
  		throw new CompileError(("Transforming " + feature + " is not " + (dangerousKey ? "fully supported" : "implemented") + ". Use `transforms: { " + transformKey + ": false }` to skip transformation and disable this error" + maybeDangerous + "."), node);
  	};

  	return CompileError;
  }(Error));

  function findIndex(array, fn) {
  	for (var i = 0; i < array.length; i += 1) {
  		if (fn(array[i], i)) { return i; }
  	}

  	return -1;
  }

  var handlers = {
  	Identifier: destructureIdentifier,
  	AssignmentPattern: destructureAssignmentPattern,
  	ArrayPattern: destructureArrayPattern,
  	ObjectPattern: destructureObjectPattern
  };

  function destructure(
  	code,
  	createIdentifier,
  	resolveName,
  	node,
  	ref,
  	inline,
  	statementGenerators
  ) {
  	handlers[node.type](code, createIdentifier, resolveName, node, ref, inline, statementGenerators);
  }

  function destructureIdentifier(
  	code,
  	createIdentifier,
  	resolveName,
  	node,
  	ref,
  	inline,
  	statementGenerators
  ) {
  	statementGenerators.push(function (start, prefix, suffix) {
  		code.overwrite(node.start, node.end, (inline ? prefix : (prefix + "var ")) + resolveName(node) + " = " + ref + suffix);
  		code.move(node.start, node.end, start);
  	});
  }

  function destructureMemberExpression(
  	code,
  	createIdentifier,
  	resolveName,
  	node,
  	ref,
  	inline,
  	statementGenerators
  ) {
  	statementGenerators.push(function (start, prefix, suffix) {
  		code.prependRight(node.start, inline ? prefix : (prefix + "var "));
  		code.appendLeft(node.end, (" = " + ref + suffix));
  		code.move(node.start, node.end, start);
  	});
  }

  function destructureAssignmentPattern(
  	code,
  	createIdentifier,
  	resolveName,
  	node,
  	ref,
  	inline,
  	statementGenerators
  ) {
  	var isIdentifier = node.left.type === 'Identifier';
  	var name = isIdentifier ? node.left.name : ref;

  	if (!inline) {
  		statementGenerators.push(function (start, prefix, suffix) {
  			code.prependRight(
  				node.left.end,
  				(prefix + "if ( " + name + " === void 0 ) " + name)
  			);
  			code.move(node.left.end, node.right.end, start);
  			code.appendLeft(node.right.end, suffix);
  		});
  	}

  	if (!isIdentifier) {
  		destructure(code, createIdentifier, resolveName, node.left, ref, inline, statementGenerators);
  	}
  }

  function destructureArrayPattern(
  	code,
  	createIdentifier,
  	resolveName,
  	node,
  	ref,
  	inline,
  	statementGenerators
  ) {
  	var c = node.start;

  	node.elements.forEach(function (element, i) {
  		if (!element) { return; }

  		if (element.type === 'RestElement') {
  			handleProperty(
  				code,
  				createIdentifier,
  				resolveName,
  				c,
  				element.argument,
  				(ref + ".slice(" + i + ")"),
  				inline,
  				statementGenerators
  			);
  		} else {
  			handleProperty(
  				code,
  				createIdentifier,
  				resolveName,
  				c,
  				element,
  				(ref + "[" + i + "]"),
  				inline,
  				statementGenerators
  			);
  		}
  		c = element.end;
  	});

  	code.remove(c, node.end);
  }

  function destructureObjectPattern(
  	code,
  	createIdentifier,
  	resolveName,
  	node,
  	ref,
  	inline,
  	statementGenerators
  ) {
  	var this$1 = this;

  	var c = node.start;

  	var nonRestKeys = [];
  	node.properties.forEach(function (prop) {
  		var value;
  		var content;
  		if (prop.type === 'Property') {
  			content = prop.value;
  			if (!prop.computed && prop.key.type === 'Identifier') {
  				value = ref + "." + (prop.key.name);
  				nonRestKeys.push(("\"" + (prop.key.name) + "\""));
  			} else if (!prop.computed && prop.key.type === 'Literal') {
  				value = ref + "[" + (prop.key.raw) + "]";
  				nonRestKeys.push(JSON.stringify(String(prop.key.value)));
  			} else {
  				var expr = code.slice(prop.key.start, prop.key.end);
  				value = ref + "[" + expr + "]";
  				nonRestKeys.push(("String(" + expr + ")"));
  			}
  		} else if (prop.type === 'RestElement') {
  			content = prop.argument;
  			value = createIdentifier('rest');
  			statementGenerators.push(function (start, prefix, suffix) {
  				var helper = prop.program.getObjectWithoutPropertiesHelper(code);
  				code.overwrite(
  					prop.start,
  					(c = prop.argument.start),
  					(inline ? prefix : (prefix + "var ")) + value + " = " + helper + "( " + ref + ", [" + (nonRestKeys.join(', ')) + "] )" + suffix
  				);
  				code.move(prop.start, c, start);
  			});
  		} else {
  			throw new CompileError(
  				this$1,
  				("Unexpected node of type " + (prop.type) + " in object pattern")
  			);
  		}
  		handleProperty(code, createIdentifier, resolveName, c, content, value, inline, statementGenerators);
  		c = prop.end;
  	});

  	code.remove(c, node.end);
  }

  function handleProperty(
  	code,
  	createIdentifier,
  	resolveName,
  	c,
  	node,
  	value,
  	inline,
  	statementGenerators
  ) {
  	switch (node.type) {
  		case 'Identifier': {
  			code.remove(c, node.start);
  			destructureIdentifier(
  				code,
  				createIdentifier,
  				resolveName,
  				node,
  				value,
  				inline,
  				statementGenerators
  			);
  			break;
  		}

  		case 'MemberExpression':
  			code.remove(c, node.start);
  			destructureMemberExpression(
  				code,
  				createIdentifier,
  				resolveName,
  				node,
  				value,
  				true,
  				statementGenerators
  			);
  			break;

  		case 'AssignmentPattern': {
  			var name;

  			var isIdentifier = node.left.type === 'Identifier';

  			if (isIdentifier) {
  				name = resolveName(node.left);
  			} else {
  				name = createIdentifier(value);
  			}

  			statementGenerators.push(function (start, prefix, suffix) {
  				if (inline) {
  					code.prependRight(
  						node.right.start,
  						(name + " = " + value + ", " + name + " = " + name + " === void 0 ? ")
  					);
  					code.appendLeft(node.right.end, (" : " + name + suffix));
  				} else {
  					code.prependRight(
  						node.right.start,
  						(prefix + "var " + name + " = " + value + "; if ( " + name + " === void 0 ) " + name + " = ")
  					);
  					code.appendLeft(node.right.end, suffix);
  				}

  				code.move(node.right.start, node.right.end, start);
  			});

  			if (isIdentifier) {
  				code.remove(c, node.right.start);
  			} else {
  				code.remove(c, node.left.start);
  				code.remove(node.left.end, node.right.start);
  				handleProperty(
  					code,
  					createIdentifier,
  					resolveName,
  					c,
  					node.left,
  					name,
  					inline,
  					statementGenerators
  				);
  			}

  			break;
  		}

  		case 'ObjectPattern': {
  			code.remove(c, (c = node.start));

  			var ref = value;
  			if (node.properties.length > 1) {
  				ref = createIdentifier(value);

  				statementGenerators.push(function (start, prefix, suffix) {
  					// this feels a tiny bit hacky, but we can't do a
  					// straightforward appendLeft and keep correct order...
  					code.prependRight(node.start, (inline ? '' : (prefix + "var ")) + ref + " = ");
  					code.overwrite(node.start, (c = node.start + 1), value);
  					code.appendLeft(c, suffix);

  					code.overwrite(
  						node.start,
  						(c = node.start + 1),
  						(inline ? '' : (prefix + "var ")) + ref + " = " + value + suffix
  					);
  					code.move(node.start, c, start);
  				});
  			}

  			destructureObjectPattern(
  				code,
  				createIdentifier,
  				resolveName,
  				node,
  				ref,
  				inline,
  				statementGenerators
  			);

  			break;
  		}

  		case 'ArrayPattern': {
  			code.remove(c, (c = node.start));

  			if (node.elements.filter(Boolean).length > 1) {
  				var ref$1 = createIdentifier(value);

  				statementGenerators.push(function (start, prefix, suffix) {
  					code.prependRight(node.start, (inline ? '' : (prefix + "var ")) + ref$1 + " = ");
  					code.overwrite(node.start, (c = node.start + 1), value, {
  						contentOnly: true
  					});
  					code.appendLeft(c, suffix);

  					code.move(node.start, c, start);
  				});

  				node.elements.forEach(function (element, i) {
  					if (!element) { return; }

  					if (element.type === 'RestElement') {
  						handleProperty(
  							code,
  							createIdentifier,
  							resolveName,
  							c,
  							element.argument,
  							(ref$1 + ".slice(" + i + ")"),
  							inline,
  							statementGenerators
  						);
  					} else {
  						handleProperty(
  							code,
  							createIdentifier,
  							resolveName,
  							c,
  							element,
  							(ref$1 + "[" + i + "]"),
  							inline,
  							statementGenerators
  						);
  					}
  					c = element.end;
  				});
  			} else {
  				var index = findIndex(node.elements, Boolean);
  				var element = node.elements[index];
  				if (element.type === 'RestElement') {
  					handleProperty(
  						code,
  						createIdentifier,
  						resolveName,
  						c,
  						element.argument,
  						(value + ".slice(" + index + ")"),
  						inline,
  						statementGenerators
  					);
  				} else {
  					handleProperty(
  						code,
  						createIdentifier,
  						resolveName,
  						c,
  						element,
  						(value + "[" + index + "]"),
  						inline,
  						statementGenerators
  					);
  				}
  				c = element.end;
  			}

  			code.remove(c, node.end);
  			break;
  		}

  		default: {
  			throw new Error(("Unexpected node type in destructuring (" + (node.type) + ")"));
  		}
  	}
  }

  function isUseStrict(node) {
  	if (!node) { return false; }
  	if (node.type !== 'ExpressionStatement') { return false; }
  	if (node.expression.type !== 'Literal') { return false; }
  	return node.expression.value === 'use strict';
  }

  var BlockStatement = /*@__PURE__*/(function (Node) {
  	function BlockStatement () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) BlockStatement.__proto__ = Node;
  	BlockStatement.prototype = Object.create( Node && Node.prototype );
  	BlockStatement.prototype.constructor = BlockStatement;

  	BlockStatement.prototype.createScope = function createScope () {
  		var this$1 = this;

  		this.parentIsFunction = /Function/.test(this.parent.type);
  		this.isFunctionBlock = this.parentIsFunction || this.parent.type === 'Root';
  		this.scope = new Scope$1({
  			block: !this.isFunctionBlock,
  			parent: this.parent.findScope(false),
  			declare: function (id) { return this$1.createdDeclarations.push(id); }
  		});

  		if (this.parentIsFunction) {
  			this.parent.params.forEach(function (node) {
  				this$1.scope.addDeclaration(node, 'param');
  			});
  		}
  	};

  	BlockStatement.prototype.initialise = function initialise (transforms) {
  		this.thisAlias = null;
  		this.argumentsAlias = null;
  		this.defaultParameters = [];
  		this.createdDeclarations = [];

  		// normally the scope gets created here, during initialisation,
  		// but in some cases (e.g. `for` statements), we need to create
  		// the scope early, as it pertains to both the init block and
  		// the body of the statement
  		if (!this.scope) { this.createScope(); }

  		this.body.forEach(function (node) { return node.initialise(transforms); });

  		this.scope.consolidate();
  	};

  	BlockStatement.prototype.findLexicalBoundary = function findLexicalBoundary () {
  		if (this.type === 'Program') { return this; }
  		if (/^Function/.test(this.parent.type)) { return this; }

  		return this.parent.findLexicalBoundary();
  	};

  	BlockStatement.prototype.findScope = function findScope (functionScope) {
  		if (functionScope && !this.isFunctionBlock)
  			{ return this.parent.findScope(functionScope); }
  		return this.scope;
  	};

  	BlockStatement.prototype.getArgumentsAlias = function getArgumentsAlias () {
  		if (!this.argumentsAlias) {
  			this.argumentsAlias = this.scope.createIdentifier('arguments');
  		}

  		return this.argumentsAlias;
  	};

  	BlockStatement.prototype.getArgumentsArrayAlias = function getArgumentsArrayAlias () {
  		if (!this.argumentsArrayAlias) {
  			this.argumentsArrayAlias = this.scope.createIdentifier('argsArray');
  		}

  		return this.argumentsArrayAlias;
  	};

  	BlockStatement.prototype.getThisAlias = function getThisAlias () {
  		if (!this.thisAlias) {
  			this.thisAlias = this.scope.createIdentifier('this');
  		}

  		return this.thisAlias;
  	};

  	BlockStatement.prototype.getIndentation = function getIndentation () {
  		if (this.indentation === undefined) {
  			var source = this.program.magicString.original;

  			var useOuter = this.synthetic || !this.body.length;
  			var c = useOuter ? this.start : this.body[0].start;

  			while (c && source[c] !== '\n') { c -= 1; }

  			this.indentation = '';

  			// eslint-disable-next-line no-constant-condition
  			while (true) {
  				c += 1;
  				var char = source[c];

  				if (char !== ' ' && char !== '\t') { break; }

  				this.indentation += char;
  			}

  			var indentString = this.program.magicString.getIndentString();

  			// account for dedented class constructors
  			var parent = this.parent;
  			while (parent) {
  				if (parent.kind === 'constructor' && !parent.parent.parent.superClass) {
  					this.indentation = this.indentation.replace(indentString, '');
  				}

  				parent = parent.parent;
  			}

  			if (useOuter) { this.indentation += indentString; }
  		}

  		return this.indentation;
  	};

  	BlockStatement.prototype.transpile = function transpile (code, transforms) {
  		var this$1 = this;

  		var indentation = this.getIndentation();

  		var introStatementGenerators = [];

  		if (this.argumentsAlias) {
  			introStatementGenerators.push(function (start, prefix, suffix) {
  				var assignment = prefix + "var " + (this$1.argumentsAlias) + " = arguments" + suffix;
  				code.appendLeft(start, assignment);
  			});
  		}

  		if (this.thisAlias) {
  			introStatementGenerators.push(function (start, prefix, suffix) {
  				var assignment = prefix + "var " + (this$1.thisAlias) + " = this" + suffix;
  				code.appendLeft(start, assignment);
  			});
  		}

  		if (this.argumentsArrayAlias) {
  			introStatementGenerators.push(function (start, prefix, suffix) {
  				var i = this$1.scope.createIdentifier('i');
  				var assignment = prefix + "var " + i + " = arguments.length, " + (this$1.argumentsArrayAlias) + " = Array(" + i + ");\n" + indentation + "while ( " + i + "-- ) " + (this$1.argumentsArrayAlias) + "[" + i + "] = arguments[" + i + "]" + suffix;
  				code.appendLeft(start, assignment);
  			});
  		}

  		if (/Function/.test(this.parent.type)) {
  			this.transpileParameters(
  				this.parent.params,
  				code,
  				transforms,
  				indentation,
  				introStatementGenerators
  			);
  		} else if ('CatchClause' === this.parent.type) {
  			this.transpileParameters(
  				[this.parent.param],
  				code,
  				transforms,
  				indentation,
  				introStatementGenerators
  			);
  		}

  		if (transforms.letConst && this.isFunctionBlock) {
  			this.transpileBlockScopedIdentifiers(code);
  		}

  		Node.prototype.transpile.call(this, code, transforms);

  		if (this.createdDeclarations.length) {
  			introStatementGenerators.push(function (start, prefix, suffix) {
  				var assignment = prefix + "var " + (this$1.createdDeclarations.join(', ')) + suffix;
  				code.appendLeft(start, assignment);
  			});
  		}

  		if (this.synthetic) {
  			if (this.parent.type === 'ArrowFunctionExpression') {
  				var expr = this.body[0];

  				if (introStatementGenerators.length) {
  					code
  						.appendLeft(this.start, "{")
  						.prependRight(this.end, ((this.parent.getIndentation()) + "}"));

  					code.prependRight(expr.start, ("\n" + indentation + "return "));
  					code.appendLeft(expr.end, ";\n");
  				} else if (transforms.arrow) {
  					code.prependRight(expr.start, "{ return ");
  					code.appendLeft(expr.end, "; }");
  				}
  			} else if (introStatementGenerators.length) {
  				code.prependRight(this.start, "{").appendLeft(this.end, "}");
  			}
  		}

  		var start;
  		if (isUseStrict(this.body[0])) {
  			start = this.body[0].end;
  		} else if (this.synthetic || this.parent.type === 'Root') {
  			start = this.start;
  		} else {
  			start = this.start + 1;
  		}

  		var prefix = "\n" + indentation;
  		var suffix = ';';
  		introStatementGenerators.forEach(function (fn, i) {
  			if (i === introStatementGenerators.length - 1) { suffix = ";\n"; }
  			fn(start, prefix, suffix);
  		});
  	};

  	BlockStatement.prototype.transpileParameters = function transpileParameters (params, code, transforms, indentation, introStatementGenerators) {
  		var this$1 = this;

  		params.forEach(function (param) {
  			if (
  				param.type === 'AssignmentPattern' &&
  				param.left.type === 'Identifier'
  			) {
  				if (transforms.defaultParameter) {
  					introStatementGenerators.push(function (start, prefix, suffix) {
  						var lhs = prefix + "if ( " + (param.left.name) + " === void 0 ) " + (param.left.name);

  						code
  							.prependRight(param.left.end, lhs)
  							.move(param.left.end, param.right.end, start)
  							.appendLeft(param.right.end, suffix);
  					});
  				}
  			} else if (param.type === 'RestElement') {
  				if (transforms.spreadRest) {
  					introStatementGenerators.push(function (start, prefix, suffix) {
  						var penultimateParam = params[params.length - 2];

  						if (penultimateParam) {
  							code.remove(
  								penultimateParam ? penultimateParam.end : param.start,
  								param.end
  							);
  						} else {
  							var start$1 = param.start,
  								end = param.end; // TODO https://gitlab.com/Rich-Harris/buble/issues/8

  							while (/\s/.test(code.original[start$1 - 1])) { start$1 -= 1; }
  							while (/\s/.test(code.original[end])) { end += 1; }

  							code.remove(start$1, end);
  						}

  						var name = param.argument.name;
  						var len = this$1.scope.createIdentifier('len');
  						var count = params.length - 1;

  						if (count) {
  							code.prependRight(
  								start,
  								(prefix + "var " + name + " = [], " + len + " = arguments.length - " + count + ";\n" + indentation + "while ( " + len + "-- > 0 ) " + name + "[ " + len + " ] = arguments[ " + len + " + " + count + " ]" + suffix)
  							);
  						} else {
  							code.prependRight(
  								start,
  								(prefix + "var " + name + " = [], " + len + " = arguments.length;\n" + indentation + "while ( " + len + "-- ) " + name + "[ " + len + " ] = arguments[ " + len + " ]" + suffix)
  							);
  						}
  					});
  				}
  			} else if (param.type !== 'Identifier') {
  				if (transforms.parameterDestructuring) {
  					var ref = this$1.scope.createIdentifier('ref');
  					destructure(
  						code,
  						function (id) { return this$1.scope.createIdentifier(id); },
  						function (ref) {
  							var name = ref.name;

  							return this$1.scope.resolveName(name);
  					},
  						param,
  						ref,
  						false,
  						introStatementGenerators
  					);
  					code.prependRight(param.start, ref);
  				}
  			}
  		});
  	};

  	BlockStatement.prototype.transpileBlockScopedIdentifiers = function transpileBlockScopedIdentifiers (code) {
  		var this$1 = this;

  		Object.keys(this.scope.blockScopedDeclarations).forEach(function (name) {
  			var declarations = this$1.scope.blockScopedDeclarations[name];

  			for (var i$2 = 0, list$2 = declarations; i$2 < list$2.length; i$2 += 1) {
  				var declaration = list$2[i$2];

  				var cont = false; // TODO implement proper continue...

  				if (declaration.kind === 'for.let') {
  					// special case
  					var forStatement = declaration.node.findNearest('ForStatement');

  					if (forStatement.shouldRewriteAsFunction) {
  						var outerAlias = this$1.scope.createIdentifier(name);
  						var innerAlias = forStatement.reassigned[name]
  							? this$1.scope.createIdentifier(name)
  							: name;

  						declaration.name = outerAlias;
  						code.overwrite(
  							declaration.node.start,
  							declaration.node.end,
  							outerAlias,
  							{ storeName: true }
  						);

  						forStatement.aliases[name] = {
  							outer: outerAlias,
  							inner: innerAlias
  						};

  						for (var i = 0, list = declaration.instances; i < list.length; i += 1) {
  							var identifier = list[i];

  							var alias = forStatement.body.contains(identifier)
  								? innerAlias
  								: outerAlias;

  							if (name !== alias) {
  								code.overwrite(identifier.start, identifier.end, alias, {
  									storeName: true
  								});
  							}
  						}

  						cont = true;
  					}
  				}

  				if (!cont) {
  					var alias$1 = this$1.scope.createIdentifier(name);

  					if (name !== alias$1) {
  						declaration.name = alias$1;
  						code.overwrite(
  							declaration.node.start,
  							declaration.node.end,
  							alias$1,
  							{ storeName: true }
  						);

  						for (var i$1 = 0, list$1 = declaration.instances; i$1 < list$1.length; i$1 += 1) {
  							var identifier$1 = list$1[i$1];

  							identifier$1.rewritten = true;
  							code.overwrite(identifier$1.start, identifier$1.end, alias$1, {
  								storeName: true
  							});
  						}
  					}
  				}
  			}
  		});
  	};

  	return BlockStatement;
  }(Node$1));

  function isArguments(node) {
  	return node.type === 'Identifier' && node.name === 'arguments';
  }

  function inlineSpreads(
  	code,
  	node,
  	elements
  ) {
  	var i = elements.length;

  	while (i--) {
  		var element = elements[i];
  		if (!element || element.type !== 'SpreadElement') {
  			continue;
  		}
  		var argument = element.argument;
  		if (argument.type !== 'ArrayExpression') {
  			continue;
  		}
  		var subelements = argument.elements;
  		if (subelements.some(function (subelement) { return subelement === null; })) {
  			// Not even going to try inlining spread arrays with holes.
  			// It's a lot of work (got to be VERY careful in comma counting for
  			// ArrayExpression, and turn blanks into undefined for
  			// CallExpression and NewExpression), and probably literally no one
  			// would ever benefit from it.
  			continue;
  		}
  		// We can inline it: drop the `...[` and `]` and sort out any commas.
  		var isLast = i === elements.length - 1;
  		if (subelements.length === 0) {
  			code.remove(
  				isLast && i !== 0
  					? elements[i - 1].end  // Take the previous comma too
  					: element.start,
  				isLast
  					? node.end - 1  // Must remove trailing comma; element.end wouldn’t
  					: elements[i + 1].start);
  		} else {
  			// Strip the `...[` and the `]` with a possible trailing comma before it,
  			// leaving just the possible trailing comma after it.
  			code.remove(element.start, subelements[0].start);
  			code.remove(
  				// Strip a possible trailing comma after the last element
  				subelements[subelements.length - 1].end,
  				// And also a possible trailing comma after the spread
  				isLast
  					? node.end - 1
  					: element.end
  			);
  		}
  		elements.splice.apply(elements, [ i, 1 ].concat( subelements ));
  		i += subelements.length;
  	}
  }

  // Returns false if it’s safe to simply append a method call to the node,
  // e.g. `a` → `a.concat()`.
  //
  // Returns true if it may not be and so parentheses should be employed,
  // e.g. `a ? b : c` → `a ? b : c.concat()` would be wrong.
  //
  // This test may be overcautious; if desired it can be refined over time.
  function needsParentheses(node) {
  	switch (node.type) {
  		// Currently whitelisted are all relevant ES5 node types ('Literal' and
  		// 'ObjectExpression' are skipped as irrelevant for array/call spread.)
  		case 'ArrayExpression':
  		case 'CallExpression':
  		case 'Identifier':
  		case 'ParenthesizedExpression':
  		case 'ThisExpression':
  			return false;
  		default:
  			return true;
  	}
  }

  function spread(
  	code,
  	elements,
  	start,
  	argumentsArrayAlias,
  	isNew
  ) {
  	var i = elements.length;
  	var firstSpreadIndex = -1;

  	while (i--) {
  		var element$1 = elements[i];
  		if (element$1 && element$1.type === 'SpreadElement') {
  			if (isArguments(element$1.argument)) {
  				code.overwrite(
  					element$1.argument.start,
  					element$1.argument.end,
  					argumentsArrayAlias
  				);
  			}

  			firstSpreadIndex = i;
  		}
  	}

  	if (firstSpreadIndex === -1) { return false; } // false indicates no spread elements

  	if (isNew) {
  		for (i = 0; i < elements.length; i += 1) {
  			var element$2 = elements[i];
  			if (element$2.type === 'SpreadElement') {
  				code.remove(element$2.start, element$2.argument.start);
  			} else {
  				code.prependRight(element$2.start, '[');
  				code.prependRight(element$2.end, ']');
  			}
  		}

  		return true; // true indicates some spread elements
  	}

  	var element = elements[firstSpreadIndex];
  	var previousElement = elements[firstSpreadIndex - 1];

  	if (!previousElement) {
  		// We may need to parenthesize it to handle ternaries like [...a ? b : c].
  		var addClosingParen;
  		if (start !== element.start) {
  			if ((addClosingParen = needsParentheses(element.argument))) {
  				code.overwrite(start, element.start, '( ');
  			} else {
  				code.remove(start, element.start);
  			}
  		} else if (element.parent.type === 'CallExpression') {
  			// CallExpression inserts `( ` itself, we add the ).
  			// (Yeah, CallExpression did the needsParentheses call already,
  			// but we don’t have its result handy, so do it again. It’s cheap.)
  			addClosingParen = needsParentheses(element.argument);
  		} else {
  			// Should be unreachable, but doing this is more robust.
  			throw new CompileError(
  				'Unsupported spread construct, please raise an issue at https://github.com/bublejs/buble/issues',
  				element
  			);
  		}
  		code.overwrite(element.end, elements[1].start,
  			addClosingParen ? ' ).concat( ' : '.concat( ');
  	} else {
  		code.overwrite(previousElement.end, element.start, ' ].concat( ');
  	}

  	for (i = firstSpreadIndex; i < elements.length; i += 1) {
  		element = elements[i];

  		if (element) {
  			if (element.type === 'SpreadElement') {
  				code.remove(element.start, element.argument.start);
  			} else {
  				code.appendLeft(element.start, '[');
  				code.appendLeft(element.end, ']');
  			}
  		}
  	}

  	return true; // true indicates some spread elements
  }

  var ArrayExpression = /*@__PURE__*/(function (Node) {
  	function ArrayExpression () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) ArrayExpression.__proto__ = Node;
  	ArrayExpression.prototype = Object.create( Node && Node.prototype );
  	ArrayExpression.prototype.constructor = ArrayExpression;

  	ArrayExpression.prototype.initialise = function initialise (transforms) {
  		if (transforms.spreadRest && this.elements.length) {
  			var lexicalBoundary = this.findLexicalBoundary();

  			var i = this.elements.length;
  			while (i--) {
  				var element = this.elements[i];
  				if (
  					element &&
  					element.type === 'SpreadElement' &&
  					isArguments(element.argument)
  				) {
  					this.argumentsArrayAlias = lexicalBoundary.getArgumentsArrayAlias();
  				}
  			}
  		}

  		Node.prototype.initialise.call(this, transforms);
  	};

  	ArrayExpression.prototype.transpile = function transpile (code, transforms) {
  		Node.prototype.transpile.call(this, code, transforms);

  		if (transforms.spreadRest) {
  			inlineSpreads(code, this, this.elements);
  			// erase trailing comma after last array element if not an array hole
  			if (this.elements.length) {
  				var lastElement = this.elements[this.elements.length - 1];
  				if (
  					lastElement &&
  					/\s*,/.test(code.original.slice(lastElement.end, this.end))
  				) {
  					code.overwrite(lastElement.end, this.end - 1, ' ');
  				}
  			}

  			if (this.elements.length === 1) {
  				var element = this.elements[0];

  				if (element && element.type === 'SpreadElement') {
  					// special case – [ ...arguments ]
  					if (isArguments(element.argument)) {
  						code.overwrite(
  							this.start,
  							this.end,
  							("[].concat( " + (this.argumentsArrayAlias) + " )")
  						); // TODO if this is the only use of argsArray, don't bother concating
  					} else {
  						code.overwrite(this.start, element.argument.start, '[].concat( ');
  						code.overwrite(element.end, this.end, ' )');
  					}
  				}
  			} else {
  				var hasSpreadElements = spread(
  					code,
  					this.elements,
  					this.start,
  					this.argumentsArrayAlias
  				);

  				if (hasSpreadElements) {
  					code.overwrite(this.end - 1, this.end, ')');
  				}
  			}
  		}
  	};

  	return ArrayExpression;
  }(Node$1));

  function removeTrailingComma(code, c) {
  	while (code.original[c] !== ')') {
  		if (code.original[c] === ',') {
  			code.remove(c, c + 1);
  			return;
  		}

  		if (code.original[c] === '/') {
  			if (code.original[c + 1] === '/') {
  				c = code.original.indexOf('\n', c);
  			} else {
  				c = code.original.indexOf('*/', c) + 1;
  			}
  		}
  		c += 1;
  	}
  }

  var ArrowFunctionExpression = /*@__PURE__*/(function (Node) {
  	function ArrowFunctionExpression () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) ArrowFunctionExpression.__proto__ = Node;
  	ArrowFunctionExpression.prototype = Object.create( Node && Node.prototype );
  	ArrowFunctionExpression.prototype.constructor = ArrowFunctionExpression;

  	ArrowFunctionExpression.prototype.initialise = function initialise (transforms) {
  		if (this.async && transforms.asyncAwait) {
  			CompileError.missingTransform("async arrow functions", "asyncAwait", this);
  		}
  		this.body.createScope();
  		Node.prototype.initialise.call(this, transforms);
  	};

  	ArrowFunctionExpression.prototype.transpile = function transpile (code, transforms) {
  		var openParensPos = this.start;
  		for (var end = (this.body || this.params[0]).start - 1; code.original[openParensPos] !== '(' && openParensPos < end;) {
  			++openParensPos;
  		}
  		if (code.original[openParensPos] !== '(') { openParensPos = -1; }
  		var naked = openParensPos === -1;

  		if (transforms.arrow || this.needsArguments(transforms)) {
  			// remove arrow
  			var charIndex = this.body.start;
  			while (code.original[charIndex] !== '=') {
  				charIndex -= 1;
  			}
  			code.remove(charIndex, this.body.start);

  			Node.prototype.transpile.call(this, code, transforms);

  			// wrap naked parameter
  			if (naked) {
  				code.prependRight(this.params[0].start, '(');
  				code.appendLeft(this.params[0].end, ')');
  			}

  			// standalone expression statement
  			var standalone = this.parent && this.parent.type === 'ExpressionStatement';
  			var start, text = standalone ? '!' : '';
  			if (this.async) { text += 'async '; }
  			text += 'function';
  			if (!standalone) { text += ' '; }
  			if (naked) {
  				start = this.params[0].start;
  			} else {
  				start = openParensPos;
  			}
  			// add function
  			if (start > this.start) {
  				code.overwrite(this.start, start, text);
  			} else {
  				code.prependRight(this.start, text);
  			}
  		} else {
  			Node.prototype.transpile.call(this, code, transforms);
  		}

  		if (transforms.trailingFunctionCommas && this.params.length && !naked) {
  			removeTrailingComma(code, this.params[this.params.length - 1].end);
  		}
  	};

  	// Returns whether any transforms that will happen use `arguments`
  	ArrowFunctionExpression.prototype.needsArguments = function needsArguments (transforms) {
  		return (
  			transforms.spreadRest &&
  			this.params.filter(function (param) { return param.type === 'RestElement'; }).length > 0
  		);
  	};

  	return ArrowFunctionExpression;
  }(Node$1));

  function checkConst(identifier, scope) {
  	var declaration = scope.findDeclaration(identifier.name);
  	if (declaration && declaration.kind === 'const') {
  		throw new CompileError(((identifier.name) + " is read-only"), identifier);
  	}
  }

  var AssignmentExpression = /*@__PURE__*/(function (Node) {
  	function AssignmentExpression () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) AssignmentExpression.__proto__ = Node;
  	AssignmentExpression.prototype = Object.create( Node && Node.prototype );
  	AssignmentExpression.prototype.constructor = AssignmentExpression;

  	AssignmentExpression.prototype.initialise = function initialise (transforms) {
  		if (this.left.type === 'Identifier') {
  			var declaration = this.findScope(false).findDeclaration(this.left.name);
  			// special case – https://gitlab.com/Rich-Harris/buble/issues/11
  			var statement = declaration && declaration.node.ancestor(3);
  			if (
  				statement &&
  				statement.type === 'ForStatement' &&
  				statement.body.contains(this)
  			) {
  				statement.reassigned[this.left.name] = true;
  			}
  		}

  		Node.prototype.initialise.call(this, transforms);
  	};

  	AssignmentExpression.prototype.transpile = function transpile (code, transforms) {
  		if (this.left.type === 'Identifier') {
  			// Do this check after everything has been initialized to find
  			// shadowing declarations after this expression
  			checkConst(this.left, this.findScope(false));
  		}

  		if (this.operator === '**=' && transforms.exponentiation) {
  			this.transpileExponentiation(code, transforms);
  		} else if (/Pattern/.test(this.left.type) && transforms.destructuring) {
  			this.transpileDestructuring(code);
  		}

  		Node.prototype.transpile.call(this, code, transforms);
  	};

  	AssignmentExpression.prototype.transpileDestructuring = function transpileDestructuring (code) {
  		var this$1 = this;

  		var writeScope = this.findScope(true);
  		var lookupScope = this.findScope(false);
  		var assign = writeScope.createDeclaration('assign');
  		code.appendRight(this.left.end, ("(" + assign));

  		code.appendLeft(this.right.end, ', ');
  		var statementGenerators = [];
  		destructure(
  			code,
  			function (id) { return writeScope.createDeclaration(id); },
  			function (node) {
  				var name = lookupScope.resolveName(node.name);
  				checkConst(node, lookupScope);
  				return name;
  			},
  			this.left,
  			assign,
  			true,
  			statementGenerators
  		);

  		var suffix = ', ';
  		statementGenerators.forEach(function (fn, j) {
  			if (j === statementGenerators.length - 1) {
  				suffix = '';
  			}

  			fn(this$1.end, '', suffix);
  		});

  		if (this.unparenthesizedParent().type === 'ExpressionStatement') {
  			// no rvalue needed for expression statement
  			code.prependRight(this.end, ")");
  		} else {
  			// destructuring is part of an expression - need an rvalue
  			code.appendRight(this.end, (", " + assign + ")"));
  		}
  	};

  	AssignmentExpression.prototype.transpileExponentiation = function transpileExponentiation (code) {
  		var scope = this.findScope(false);

  		// first, the easy part – `**=` -> `=`
  		var charIndex = this.left.end;
  		while (code.original[charIndex] !== '*') { charIndex += 1; }
  		code.remove(charIndex, charIndex + 2);

  		// how we do the next part depends on a number of factors – whether
  		// this is a top-level statement, and whether we're updating a
  		// simple or complex reference
  		var base;

  		var left = this.left.unparenthesize();

  		if (left.type === 'Identifier') {
  			base = scope.resolveName(left.name);
  		} else if (left.type === 'MemberExpression') {
  			var object;
  			var needsObjectVar = false;
  			var property;
  			var needsPropertyVar = false;

  			var statement = this.findNearest(/(?:Statement|Declaration)$/);
  			var i0 = statement.getIndentation();

  			if (left.property.type === 'Identifier') {
  				property = left.computed
  					? scope.resolveName(left.property.name)
  					: left.property.name;
  			} else {
  				property = scope.createDeclaration('property');
  				needsPropertyVar = true;
  			}

  			if (left.object.type === 'Identifier') {
  				object = scope.resolveName(left.object.name);
  			} else {
  				object = scope.createDeclaration('object');
  				needsObjectVar = true;
  			}

  			if (left.start === statement.start) {
  				if (needsObjectVar && needsPropertyVar) {
  					code.prependRight(statement.start, (object + " = "));
  					code.overwrite(
  						left.object.end,
  						left.property.start,
  						(";\n" + i0 + property + " = ")
  					);
  					code.overwrite(
  						left.property.end,
  						left.end,
  						(";\n" + i0 + object + "[" + property + "]")
  					);
  				} else if (needsObjectVar) {
  					code.prependRight(statement.start, (object + " = "));
  					code.appendLeft(left.object.end, (";\n" + i0));
  					code.appendLeft(left.object.end, object);
  				} else if (needsPropertyVar) {
  					code.prependRight(left.property.start, (property + " = "));
  					code.appendLeft(left.property.end, (";\n" + i0));
  					code.move(left.property.start, left.property.end, this.start);

  					code.appendLeft(left.object.end, ("[" + property + "]"));
  					code.remove(left.object.end, left.property.start);
  					code.remove(left.property.end, left.end);
  				}
  			} else {
  				if (needsObjectVar && needsPropertyVar) {
  					code.prependRight(left.start, ("( " + object + " = "));
  					code.overwrite(
  						left.object.end,
  						left.property.start,
  						(", " + property + " = ")
  					);
  					code.overwrite(
  						left.property.end,
  						left.end,
  						(", " + object + "[" + property + "]")
  					);
  				} else if (needsObjectVar) {
  					code.prependRight(left.start, ("( " + object + " = "));
  					code.appendLeft(left.object.end, (", " + object));
  				} else if (needsPropertyVar) {
  					code.prependRight(left.property.start, ("( " + property + " = "));
  					code.appendLeft(left.property.end, ", ");
  					code.move(left.property.start, left.property.end, left.start);

  					code.overwrite(left.object.end, left.property.start, ("[" + property + "]"));
  					code.remove(left.property.end, left.end);
  				}

  				if (needsPropertyVar) {
  					code.appendLeft(this.end, " )");
  				}
  			}

  			base =
  				object +
  				(left.computed || needsPropertyVar ? ("[" + property + "]") : ("." + property));
  		}

  		code.prependRight(this.right.start, ("Math.pow( " + base + ", "));
  		code.appendLeft(this.right.end, " )");
  	};

  	return AssignmentExpression;
  }(Node$1));

  var AwaitExpression = /*@__PURE__*/(function (Node) {
  	function AwaitExpression () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) AwaitExpression.__proto__ = Node;
  	AwaitExpression.prototype = Object.create( Node && Node.prototype );
  	AwaitExpression.prototype.constructor = AwaitExpression;

  	AwaitExpression.prototype.initialise = function initialise (transforms) {
  		if (transforms.asyncAwait) {
  			CompileError.missingTransform("await", "asyncAwait", this);
  		}
  		Node.prototype.initialise.call(this, transforms);
  	};

  	return AwaitExpression;
  }(Node$1));

  var BinaryExpression = /*@__PURE__*/(function (Node) {
  	function BinaryExpression () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) BinaryExpression.__proto__ = Node;
  	BinaryExpression.prototype = Object.create( Node && Node.prototype );
  	BinaryExpression.prototype.constructor = BinaryExpression;

  	BinaryExpression.prototype.transpile = function transpile (code, transforms) {
  		if (this.operator === '**' && transforms.exponentiation) {
  			code.prependRight(this.start, "Math.pow( ");
  			code.overwrite(this.left.end, this.right.start, ", ");
  			code.appendLeft(this.end, " )");
  		}
  		Node.prototype.transpile.call(this, code, transforms);
  	};

  	return BinaryExpression;
  }(Node$1));

  var loopStatement = /(?:For(?:In|Of)?|While)Statement/;

  var BreakStatement = /*@__PURE__*/(function (Node) {
  	function BreakStatement () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) BreakStatement.__proto__ = Node;
  	BreakStatement.prototype = Object.create( Node && Node.prototype );
  	BreakStatement.prototype.constructor = BreakStatement;

  	BreakStatement.prototype.initialise = function initialise () {
  		var loop = this.findNearest(loopStatement);
  		var switchCase = this.findNearest('SwitchCase');

  		if (loop && (!switchCase || loop.depth > switchCase.depth)) {
  			loop.canBreak = true;
  			this.loop = loop;
  		}
  	};

  	BreakStatement.prototype.transpile = function transpile (code) {
  		if (this.loop && this.loop.shouldRewriteAsFunction) {
  			if (this.label)
  				{ throw new CompileError(
  					'Labels are not currently supported in a loop with locally-scoped variables',
  					this
  				); }
  			code.overwrite(this.start, this.start + 5, "return 'break'");
  		}
  	};

  	return BreakStatement;
  }(Node$1));

  var CallExpression = /*@__PURE__*/(function (Node) {
  	function CallExpression () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) CallExpression.__proto__ = Node;
  	CallExpression.prototype = Object.create( Node && Node.prototype );
  	CallExpression.prototype.constructor = CallExpression;

  	CallExpression.prototype.initialise = function initialise (transforms) {
  		if (transforms.spreadRest && this.arguments.length > 1) {
  			var lexicalBoundary = this.findLexicalBoundary();

  			var i = this.arguments.length;
  			while (i--) {
  				var arg = this.arguments[i];
  				if (arg.type === 'SpreadElement' && isArguments(arg.argument)) {
  					this.argumentsArrayAlias = lexicalBoundary.getArgumentsArrayAlias();
  				}
  			}
  		}

  		Node.prototype.initialise.call(this, transforms);
  	};

  	CallExpression.prototype.transpile = function transpile (code, transforms) {
  		if (transforms.spreadRest && this.arguments.length) {
  			inlineSpreads(code, this, this.arguments);
  			// this.arguments.length may have changed, must retest.
  		}

  		if (transforms.spreadRest && this.arguments.length) {
  			var hasSpreadElements = false;
  			var context;

  			var firstArgument = this.arguments[0];

  			if (this.arguments.length === 1) {
  				if (firstArgument.type === 'SpreadElement') {
  					code.remove(firstArgument.start, firstArgument.argument.start);
  					hasSpreadElements = true;
  				}
  			} else {
  				hasSpreadElements = spread(
  					code,
  					this.arguments,
  					firstArgument.start,
  					this.argumentsArrayAlias
  				);
  			}

  			if (hasSpreadElements) {
  				// we need to handle super() and super.method() differently
  				// due to its instance
  				var _super = null;
  				if (this.callee.type === 'Super') {
  					_super = this.callee;
  				} else if (
  					this.callee.type === 'MemberExpression' &&
  					this.callee.object.type === 'Super'
  				) {
  					_super = this.callee.object;
  				}

  				if (!_super && this.callee.type === 'MemberExpression') {
  					if (this.callee.object.type === 'Identifier') {
  						context = this.callee.object.name;
  					} else {
  						context = this.findScope(true).createDeclaration('ref');
  						var callExpression = this.callee.object;
  						code.prependRight(callExpression.start, ("(" + context + " = "));
  						code.appendLeft(callExpression.end, ")");
  					}
  				} else {
  					context = 'void 0';
  				}

  				code.appendLeft(this.callee.end, '.apply');

  				if (_super) {
  					_super.noCall = true; // bit hacky...

  					if (this.arguments.length > 1) {
  						if (firstArgument.type === 'SpreadElement') {
  							if (needsParentheses(firstArgument.argument)) {
  								code.prependRight(firstArgument.start, "( ");
  							}
  						} else {
  							code.prependRight(firstArgument.start, "[ ");
  						}

  						code.appendLeft(
  							this.arguments[this.arguments.length - 1].end,
  							' )'
  						);
  					}
  				} else if (this.arguments.length === 1) {
  					code.prependRight(firstArgument.start, (context + ", "));
  				} else {
  					if (firstArgument.type === 'SpreadElement') {
  						if (needsParentheses(firstArgument.argument)) {
  							code.appendLeft(firstArgument.start, (context + ", ( "));
  						} else {
  							code.appendLeft(firstArgument.start, (context + ", "));
  						}
  					} else {
  						code.appendLeft(firstArgument.start, (context + ", [ "));
  					}

  					code.appendLeft(this.arguments[this.arguments.length - 1].end, ' )');
  				}
  			}
  		}

  		if (transforms.trailingFunctionCommas && this.arguments.length) {
  			removeTrailingComma(code, this.arguments[this.arguments.length - 1].end);
  		}

  		Node.prototype.transpile.call(this, code, transforms);
  	};

  	return CallExpression;
  }(Node$1));

  // TODO this code is pretty wild, tidy it up
  var ClassBody = /*@__PURE__*/(function (Node) {
  	function ClassBody () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) ClassBody.__proto__ = Node;
  	ClassBody.prototype = Object.create( Node && Node.prototype );
  	ClassBody.prototype.constructor = ClassBody;

  	ClassBody.prototype.transpile = function transpile (code, transforms, inFunctionExpression, superName) {
  		var this$1 = this;

  		if (transforms.classes) {
  			var name = this.parent.name;

  			var indentStr = code.getIndentString();
  			var i0 =
  				this.getIndentation() + (inFunctionExpression ? indentStr : '');
  			var i1 = i0 + indentStr;

  			var constructorIndex = findIndex(
  				this.body,
  				function (node) { return node.kind === 'constructor'; }
  			);
  			var constructor = this.body[constructorIndex];

  			var introBlock = '';
  			var outroBlock = '';

  			if (this.body.length) {
  				code.remove(this.start, this.body[0].start);
  				code.remove(this.body[this.body.length - 1].end, this.end);
  			} else {
  				code.remove(this.start, this.end);
  			}

  			if (constructor) {
  				constructor.value.body.isConstructorBody = true;

  				var previousMethod = this.body[constructorIndex - 1];
  				var nextMethod = this.body[constructorIndex + 1];

  				// ensure constructor is first
  				if (constructorIndex > 0) {
  					code.remove(previousMethod.end, constructor.start);
  					code.move(
  						constructor.start,
  						nextMethod ? nextMethod.start : this.end - 1,
  						this.body[0].start
  					);
  				}

  				if (!inFunctionExpression) { code.appendLeft(constructor.end, ';'); }
  			}

  			var namedFunctions =
  				this.program.options.namedFunctionExpressions !== false;
  			var namedConstructor =
  				namedFunctions ||
  				this.parent.superClass ||
  				this.parent.type !== 'ClassDeclaration';
  			if (this.parent.superClass) {
  				var inheritanceBlock = "if ( " + superName + " ) " + name + ".__proto__ = " + superName + ";\n" + i0 + name + ".prototype = Object.create( " + superName + " && " + superName + ".prototype );\n" + i0 + name + ".prototype.constructor = " + name + ";";

  				if (constructor) {
  					introBlock += "\n\n" + i0 + inheritanceBlock;
  				} else {
  					var fn =
  						"function " + name + " () {" +
  						(superName
  							? ("\n" + i1 + superName + ".apply(this, arguments);\n" + i0 + "}")
  							: "}") +
  						(inFunctionExpression ? '' : ';') +
  						(this.body.length ? ("\n\n" + i0) : '');

  					inheritanceBlock = fn + inheritanceBlock;
  					introBlock += inheritanceBlock + "\n\n" + i0;
  				}
  			} else if (!constructor) {
  				var fn$1 = 'function ' + (namedConstructor ? name + ' ' : '') + '() {}';
  				if (this.parent.type === 'ClassDeclaration') { fn$1 += ';'; }
  				if (this.body.length) { fn$1 += "\n\n" + i0; }

  				introBlock += fn$1;
  			}

  			var scope = this.findScope(false);

  			var prototypeGettersAndSetters = [];
  			var staticGettersAndSetters = [];
  			var prototypeAccessors;
  			var staticAccessors;

  			this.body.forEach(function (method, i) {
  				if ((method.kind === 'get' || method.kind === 'set') && transforms.getterSetter) {
  					CompileError.missingTransform("getters and setters", "getterSetter", method);
  				}

  				if (method.kind === 'constructor') {
  					var constructorName = namedConstructor ? ' ' + name : '';
  					code.overwrite(
  						method.key.start,
  						method.key.end,
  						("function" + constructorName)
  					);
  					return;
  				}

  				if (method.static) {
  					var len = code.original[method.start + 6] == ' ' ? 7 : 6;
  					code.remove(method.start, method.start + len);
  				}

  				var isAccessor = method.kind !== 'method';
  				var lhs;

  				var methodName = method.key.name;
  				if (
  					reserved[methodName] ||
  					method.value.body.scope.references[methodName]
  				) {
  					methodName = scope.createIdentifier(methodName);
  				}

  				// when method name is a string or a number let's pretend it's a computed method

  				var fake_computed = false;
  				if (!method.computed && method.key.type === 'Literal') {
  					fake_computed = true;
  					method.computed = true;
  				}

  				if (isAccessor) {
  					if (method.computed) {
  						throw new Error(
  							'Computed accessor properties are not currently supported'
  						);
  					}

  					code.remove(method.start, method.key.start);

  					if (method.static) {
  						if (!~staticGettersAndSetters.indexOf(method.key.name))
  							{ staticGettersAndSetters.push(method.key.name); }
  						if (!staticAccessors)
  							{ staticAccessors = scope.createIdentifier('staticAccessors'); }

  						lhs = "" + staticAccessors;
  					} else {
  						if (!~prototypeGettersAndSetters.indexOf(method.key.name))
  							{ prototypeGettersAndSetters.push(method.key.name); }
  						if (!prototypeAccessors)
  							{ prototypeAccessors = scope.createIdentifier('prototypeAccessors'); }

  						lhs = "" + prototypeAccessors;
  					}
  				} else {
  					lhs = method.static ? ("" + name) : (name + ".prototype");
  				}

  				if (!method.computed) { lhs += '.'; }

  				var insertNewlines =
  					(constructorIndex > 0 && i === constructorIndex + 1) ||
  					(i === 0 && constructorIndex === this$1.body.length - 1);

  				if (insertNewlines) { lhs = "\n\n" + i0 + lhs; }

  				var c = method.key.end;
  				if (method.computed) {
  					if (fake_computed) {
  						code.prependRight(method.key.start, '[');
  						code.appendLeft(method.key.end, ']');
  					} else {
  						while (code.original[c] !== ']') { c += 1; }
  						c += 1;
  					}
  				}

  				var funcName =
  					method.computed || isAccessor || !namedFunctions
  						? ''
  						: (methodName + " ");
  				var rhs =
  					(isAccessor ? ("." + (method.kind)) : '') +
  					" = " + (method.value.async ? 'async ' : '') + "function" +
  					(method.value.generator ? '* ' : ' ') +
  					funcName;
  				code.remove(c, method.value.start);
  				code.prependRight(method.value.start, rhs);
  				code.appendLeft(method.end, ';');

  				if (method.value.generator) { code.remove(method.start, method.key.start); }

  				var start = method.key.start;
  				if (method.computed && !fake_computed) {
  					while (code.original[start] != '[') {
  						--start;
  					}
  				}
  				if (method.start < start) {
  					code.overwrite(method.start, start, lhs);
  				} else {
  					code.prependRight(method.start, lhs);
  				}
  			});

  			if (prototypeGettersAndSetters.length || staticGettersAndSetters.length) {
  				var intro = [];
  				var outro = [];

  				if (prototypeGettersAndSetters.length) {
  					intro.push(
  						("var " + prototypeAccessors + " = { " + (prototypeGettersAndSetters
  							.map(function (name) { return (name + ": { configurable: true }"); })
  							.join(',')) + " };")
  					);
  					outro.push(
  						("Object.defineProperties( " + name + ".prototype, " + prototypeAccessors + " );")
  					);
  				}

  				if (staticGettersAndSetters.length) {
  					intro.push(
  						("var " + staticAccessors + " = { " + (staticGettersAndSetters
  							.map(function (name) { return (name + ": { configurable: true }"); })
  							.join(',')) + " };")
  					);
  					outro.push(("Object.defineProperties( " + name + ", " + staticAccessors + " );"));
  				}

  				if (constructor) { introBlock += "\n\n" + i0; }
  				introBlock += intro.join(("\n" + i0));
  				if (!constructor) { introBlock += "\n\n" + i0; }

  				outroBlock += "\n\n" + i0 + outro.join(("\n" + i0));
  			}

  			if (constructor) {
  				code.appendLeft(constructor.end, introBlock);
  			} else {
  				code.prependRight(this.start, introBlock);
  			}

  			code.appendLeft(this.end, outroBlock);
  		}

  		Node.prototype.transpile.call(this, code, transforms);
  	};

  	return ClassBody;
  }(Node$1));

  // TODO this function is slightly flawed – it works on the original string,
  // not its current edited state.
  // That's not a problem for the way that it's currently used, but it could
  // be in future...
  function deindent(node, code) {
  	var start = node.start;
  	var end = node.end;

  	var indentStr = code.getIndentString();
  	var indentStrLen = indentStr.length;
  	var indentStart = start - indentStrLen;

  	if (
  		!node.program.indentExclusions[indentStart] &&
  		code.original.slice(indentStart, start) === indentStr
  	) {
  		code.remove(indentStart, start);
  	}

  	var pattern = new RegExp(indentStr + '\\S', 'g');
  	var slice = code.original.slice(start, end);
  	var match;

  	while ((match = pattern.exec(slice))) {
  		var removeStart = start + match.index;
  		if (!node.program.indentExclusions[removeStart]) {
  			code.remove(removeStart, removeStart + indentStrLen);
  		}
  	}
  }

  var ClassDeclaration = /*@__PURE__*/(function (Node) {
  	function ClassDeclaration () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) ClassDeclaration.__proto__ = Node;
  	ClassDeclaration.prototype = Object.create( Node && Node.prototype );
  	ClassDeclaration.prototype.constructor = ClassDeclaration;

  	ClassDeclaration.prototype.initialise = function initialise (transforms) {
  		if (this.id) {
  			this.name = this.id.name;
  			this.findScope(true).addDeclaration(this.id, 'class');
  		} else {
  			this.name = this.findScope(true).createIdentifier("defaultExport");
  		}

  		Node.prototype.initialise.call(this, transforms);
  	};

  	ClassDeclaration.prototype.transpile = function transpile (code, transforms) {
  		if (transforms.classes) {
  			if (!this.superClass) { deindent(this.body, code); }

  			var superName =
  				this.superClass && (this.superClass.name || 'superclass');

  			var i0 = this.getIndentation();
  			var i1 = i0 + code.getIndentString();

  			// if this is an export default statement, we have to move the export to
  			// after the declaration, because `export default var Foo = ...` is illegal
  			var isExportDefaultDeclaration = this.parent.type === 'ExportDefaultDeclaration';

  			if (isExportDefaultDeclaration) {
  				code.remove(this.parent.start, this.start);
  			}

  			var c = this.start;
  			if (this.id) {
  				code.overwrite(c, this.id.start, 'var ');
  				c = this.id.end;
  			} else {
  				code.prependLeft(c, ("var " + (this.name)));
  			}

  			if (this.superClass) {
  				if (this.superClass.end === this.body.start) {
  					code.remove(c, this.superClass.start);
  					code.appendLeft(c, (" = /*@__PURE__*/(function (" + superName + ") {\n" + i1));
  				} else {
  					code.overwrite(c, this.superClass.start, ' = ');
  					code.overwrite(
  						this.superClass.end,
  						this.body.start,
  						("/*@__PURE__*/(function (" + superName + ") {\n" + i1)
  					);
  				}
  			} else {
  				if (c === this.body.start) {
  					code.appendLeft(c, ' = ');
  				} else {
  					code.overwrite(c, this.body.start, ' = ');
  				}
  			}

  			this.body.transpile(code, transforms, !!this.superClass, superName);

  			var syntheticDefaultExport =
  				isExportDefaultDeclaration
  					? ("\n\n" + i0 + "export default " + (this.name) + ";")
  					: '';
  			if (this.superClass) {
  				code.appendLeft(this.end, ("\n\n" + i1 + "return " + (this.name) + ";\n" + i0 + "}("));
  				code.move(this.superClass.start, this.superClass.end, this.end);
  				code.prependRight(this.end, ("));" + syntheticDefaultExport));
  			} else if (syntheticDefaultExport) {
  				code.prependRight(this.end, syntheticDefaultExport);
  			}
  		} else {
  			this.body.transpile(code, transforms, false, null);
  		}
  	};

  	return ClassDeclaration;
  }(Node$1));

  var ClassExpression = /*@__PURE__*/(function (Node) {
  	function ClassExpression () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) ClassExpression.__proto__ = Node;
  	ClassExpression.prototype = Object.create( Node && Node.prototype );
  	ClassExpression.prototype.constructor = ClassExpression;

  	ClassExpression.prototype.initialise = function initialise (transforms) {
  		this.name = (this.id
  			? this.id.name
  			: this.parent.type === 'VariableDeclarator'
  				? this.parent.id.name
  				: this.parent.type !== 'AssignmentExpression'
  					? null
  					: this.parent.left.type === 'Identifier'
  						? this.parent.left.name
  						: this.parent.left.type === 'MemberExpression'
  							? this.parent.left.property.name
  							: null) || this.findScope(true).createIdentifier('anonymous');

  		Node.prototype.initialise.call(this, transforms);
  	};

  	ClassExpression.prototype.transpile = function transpile (code, transforms) {
  		if (transforms.classes) {
  			var superName =
  				this.superClass && (this.superClass.name || 'superclass');

  			var i0 = this.getIndentation();
  			var i1 = i0 + code.getIndentString();

  			if (this.superClass) {
  				code.remove(this.start, this.superClass.start);
  				code.remove(this.superClass.end, this.body.start);
  				code.appendRight(this.start, ("/*@__PURE__*/(function (" + superName + ") {\n" + i1));
  			} else {
  				code.overwrite(this.start, this.body.start, ("/*@__PURE__*/(function () {\n" + i1));
  			}

  			this.body.transpile(code, transforms, true, superName);

  			var superClass = '';
  			if (this.superClass) {
  				superClass = code.slice(this.superClass.start, this.superClass.end);
  				code.remove(this.superClass.start, this.superClass.end);
  			}
  			code.appendLeft(this.end, ("\n\n" + i1 + "return " + (this.name) + ";\n" + i0 + "}(" + superClass + "))"));
  		} else {
  			this.body.transpile(code, transforms, false);
  		}
  	};

  	return ClassExpression;
  }(Node$1));

  var ContinueStatement = /*@__PURE__*/(function (Node) {
  	function ContinueStatement () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) ContinueStatement.__proto__ = Node;
  	ContinueStatement.prototype = Object.create( Node && Node.prototype );
  	ContinueStatement.prototype.constructor = ContinueStatement;

  	ContinueStatement.prototype.transpile = function transpile (code) {
  		var loop = this.findNearest(loopStatement);
  		if (loop.shouldRewriteAsFunction) {
  			if (this.label)
  				{ throw new CompileError(
  					'Labels are not currently supported in a loop with locally-scoped variables',
  					this
  				); }
  			code.overwrite(this.start, this.start + 8, 'return');
  		}
  	};

  	return ContinueStatement;
  }(Node$1));

  var ExportDefaultDeclaration = /*@__PURE__*/(function (Node) {
  	function ExportDefaultDeclaration () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) ExportDefaultDeclaration.__proto__ = Node;
  	ExportDefaultDeclaration.prototype = Object.create( Node && Node.prototype );
  	ExportDefaultDeclaration.prototype.constructor = ExportDefaultDeclaration;

  	ExportDefaultDeclaration.prototype.initialise = function initialise (transforms) {
  		if (transforms.moduleExport)
  			{ CompileError.missingTransform("export", "moduleExport", this); }
  		Node.prototype.initialise.call(this, transforms);
  	};

  	return ExportDefaultDeclaration;
  }(Node$1));

  var ExportNamedDeclaration = /*@__PURE__*/(function (Node) {
  	function ExportNamedDeclaration () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) ExportNamedDeclaration.__proto__ = Node;
  	ExportNamedDeclaration.prototype = Object.create( Node && Node.prototype );
  	ExportNamedDeclaration.prototype.constructor = ExportNamedDeclaration;

  	ExportNamedDeclaration.prototype.initialise = function initialise (transforms) {
  		if (transforms.moduleExport)
  			{ CompileError.missingTransform("export", "moduleExport", this); }
  		Node.prototype.initialise.call(this, transforms);
  	};

  	return ExportNamedDeclaration;
  }(Node$1));

  var LoopStatement = /*@__PURE__*/(function (Node) {
  	function LoopStatement () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) LoopStatement.__proto__ = Node;
  	LoopStatement.prototype = Object.create( Node && Node.prototype );
  	LoopStatement.prototype.constructor = LoopStatement;

  	LoopStatement.prototype.findScope = function findScope (functionScope) {
  		return functionScope || !this.createdScope
  			? this.parent.findScope(functionScope)
  			: this.body.scope;
  	};

  	LoopStatement.prototype.initialise = function initialise (transforms) {
  		this.body.createScope();
  		this.createdScope = true;

  		// this is populated as and when reassignments occur
  		this.reassigned = Object.create(null);
  		this.aliases = Object.create(null);

  		this.thisRefs = [];

  		Node.prototype.initialise.call(this, transforms);

  		if (transforms.letConst) {
  			// see if any block-scoped declarations are referenced
  			// inside function expressions
  			var names = Object.keys(this.body.scope.declarations);

  			var i = names.length;
  			while (i--) {
  				var name = names[i];
  				var declaration = this.body.scope.declarations[name];

  				var j = declaration.instances.length;
  				while (j--) {
  					var instance = declaration.instances[j];
  					var nearestFunctionExpression = instance.findNearest(/Function/);

  					if (
  						nearestFunctionExpression &&
  						nearestFunctionExpression.depth > this.depth
  					) {
  						this.shouldRewriteAsFunction = true;
  						for (var i$1 = 0, list = this.thisRefs; i$1 < list.length; i$1 += 1) {
  							var node = list[i$1];

  							node.alias = node.alias || node.findLexicalBoundary().getThisAlias();
  						}
  						break;
  					}
  				}

  				if (this.shouldRewriteAsFunction) { break; }
  			}
  		}
  	};

  	LoopStatement.prototype.transpile = function transpile (code, transforms) {
  		var needsBlock =
  			this.type != 'ForOfStatement' &&
  			(this.body.type !== 'BlockStatement' ||
  				(this.body.type === 'BlockStatement' && this.body.synthetic));

  		if (this.shouldRewriteAsFunction) {
  			var i0 = this.getIndentation();
  			var i1 = i0 + code.getIndentString();

  			var argString = this.args ? (" " + (this.args.join(', ')) + " ") : '';
  			var paramString = this.params ? (" " + (this.params.join(', ')) + " ") : '';

  			var functionScope = this.findScope(true);
  			var loop = functionScope.createIdentifier('loop');

  			var before =
  				"var " + loop + " = function (" + paramString + ") " +
  				(this.body.synthetic ? ("{\n" + i0 + (code.getIndentString())) : '');
  			var after = (this.body.synthetic ? ("\n" + i0 + "}") : '') + ";\n\n" + i0;

  			code.prependRight(this.body.start, before);
  			code.appendLeft(this.body.end, after);
  			code.move(this.start, this.body.start, this.body.end);

  			if (this.canBreak || this.canReturn) {
  				var returned = functionScope.createIdentifier('returned');

  				var insert = "{\n" + i1 + "var " + returned + " = " + loop + "(" + argString + ");\n";
  				if (this.canBreak)
  					{ insert += "\n" + i1 + "if ( " + returned + " === 'break' ) break;"; }
  				if (this.canReturn)
  					{ insert += "\n" + i1 + "if ( " + returned + " ) return " + returned + ".v;"; }
  				insert += "\n" + i0 + "}";

  				code.prependRight(this.body.end, insert);
  			} else {
  				var callExpression = loop + "(" + argString + ");";

  				if (this.type === 'DoWhileStatement') {
  					code.overwrite(
  						this.start,
  						this.body.start,
  						("do {\n" + i1 + callExpression + "\n" + i0 + "}")
  					);
  				} else {
  					code.prependRight(this.body.end, callExpression);
  				}
  			}
  		} else if (needsBlock) {
  			code.appendLeft(this.body.start, '{ ');
  			code.prependRight(this.body.end, ' }');
  		}

  		Node.prototype.transpile.call(this, code, transforms);
  	};

  	return LoopStatement;
  }(Node$1));

  var ForStatement = /*@__PURE__*/(function (LoopStatement) {
  	function ForStatement () {
  		LoopStatement.apply(this, arguments);
  	}

  	if ( LoopStatement ) ForStatement.__proto__ = LoopStatement;
  	ForStatement.prototype = Object.create( LoopStatement && LoopStatement.prototype );
  	ForStatement.prototype.constructor = ForStatement;

  	ForStatement.prototype.findScope = function findScope (functionScope) {
  		return functionScope || !this.createdScope
  			? this.parent.findScope(functionScope)
  			: this.body.scope;
  	};

  	ForStatement.prototype.transpile = function transpile (code, transforms) {
  		var this$1 = this;

  		var i1 = this.getIndentation() + code.getIndentString();

  		if (this.shouldRewriteAsFunction) {
  			// which variables are declared in the init statement?
  			var names = this.init.type === 'VariableDeclaration'
  				? this.init.declarations.map(function (declarator) { return extractNames(declarator.id); })
  				: [];

  			var aliases = this.aliases;

  			this.args = names.map(
  				function (name) { return (name in this$1.aliases ? this$1.aliases[name].outer : name); }
  			);
  			this.params = names.map(
  				function (name) { return (name in this$1.aliases ? this$1.aliases[name].inner : name); }
  			);

  			var updates = Object.keys(this.reassigned).map(
  				function (name) { return ((aliases[name].outer) + " = " + (aliases[name].inner) + ";"); }
  			);

  			if (updates.length) {
  				if (this.body.synthetic) {
  					code.appendLeft(this.body.body[0].end, ("; " + (updates.join(" "))));
  				} else {
  					var lastStatement = this.body.body[this.body.body.length - 1];
  					code.appendLeft(
  						lastStatement.end,
  						("\n\n" + i1 + (updates.join(("\n" + i1))))
  					);
  				}
  			}
  		}

  		LoopStatement.prototype.transpile.call(this, code, transforms);
  	};

  	return ForStatement;
  }(LoopStatement));

  var ForInStatement = /*@__PURE__*/(function (LoopStatement) {
  	function ForInStatement () {
  		LoopStatement.apply(this, arguments);
  	}

  	if ( LoopStatement ) ForInStatement.__proto__ = LoopStatement;
  	ForInStatement.prototype = Object.create( LoopStatement && LoopStatement.prototype );
  	ForInStatement.prototype.constructor = ForInStatement;

  	ForInStatement.prototype.findScope = function findScope (functionScope) {
  		return functionScope || !this.createdScope
  			? this.parent.findScope(functionScope)
  			: this.body.scope;
  	};

  	ForInStatement.prototype.transpile = function transpile (code, transforms) {
  		var this$1 = this;

  		var hasDeclaration = this.left.type === 'VariableDeclaration';

  		if (this.shouldRewriteAsFunction) {
  			// which variables are declared in the init statement?
  			var names = hasDeclaration
  				? this.left.declarations.map(function (declarator) { return extractNames(declarator.id); })
  				: [];

  			this.args = names.map(
  				function (name) { return (name in this$1.aliases ? this$1.aliases[name].outer : name); }
  			);
  			this.params = names.map(
  				function (name) { return (name in this$1.aliases ? this$1.aliases[name].inner : name); }
  			);
  		}

  		LoopStatement.prototype.transpile.call(this, code, transforms);

  		var maybePattern = hasDeclaration ? this.left.declarations[0].id : this.left;
  		if (maybePattern.type !== 'Identifier') {
  			this.destructurePattern(code, maybePattern, hasDeclaration);
  		}
  	};

  	ForInStatement.prototype.destructurePattern = function destructurePattern (code, pattern, isDeclaration) {
  		var scope = this.findScope(true);
  		var i0 = this.getIndentation();
  		var i1 = i0 + code.getIndentString();

  		var ref = scope.createIdentifier('ref');

  		var bodyStart = this.body.body.length ? this.body.body[0].start : this.body.start + 1;

  		code.move(pattern.start, pattern.end, bodyStart);

  		code.prependRight(pattern.end, isDeclaration ? ref : ("var " + ref));

  		var statementGenerators = [];
  		destructure(
  			code,
  			function (id) { return scope.createIdentifier(id); },
  			function (ref) {
  				var name = ref.name;

  				return scope.resolveName(name);
  		},
  			pattern,
  			ref,
  			false,
  			statementGenerators
  		);

  		var suffix = ";\n" + i1;
  		statementGenerators.forEach(function (fn, i) {
  			if (i === statementGenerators.length - 1) {
  				suffix = ";\n\n" + i1;
  			}

  			fn(bodyStart, '', suffix);
  		});
  	};

  	return ForInStatement;
  }(LoopStatement));

  var ForOfStatement = /*@__PURE__*/(function (LoopStatement) {
  	function ForOfStatement () {
  		LoopStatement.apply(this, arguments);
  	}

  	if ( LoopStatement ) ForOfStatement.__proto__ = LoopStatement;
  	ForOfStatement.prototype = Object.create( LoopStatement && LoopStatement.prototype );
  	ForOfStatement.prototype.constructor = ForOfStatement;

  	ForOfStatement.prototype.initialise = function initialise (transforms) {
  		if (transforms.forOf && !transforms.dangerousForOf)
  			{ CompileError.missingTransform("for-of statements", "forOf", this, "dangerousForOf"); }
  		if (this.await && transforms.asyncAwait)
  			{ CompileError.missingTransform("for-await-of statements", "asyncAwait", this); }
  		LoopStatement.prototype.initialise.call(this, transforms);
  	};

  	ForOfStatement.prototype.transpile = function transpile (code, transforms) {
  		LoopStatement.prototype.transpile.call(this, code, transforms);
  		if (!transforms.dangerousForOf) { return; }

  		// edge case (#80)
  		if (!this.body.body[0]) {
  			if (
  				this.left.type === 'VariableDeclaration' &&
  				this.left.kind === 'var'
  			) {
  				code.remove(this.start, this.left.start);
  				code.appendLeft(this.left.end, ';');
  				code.remove(this.left.end, this.end);
  			} else {
  				code.remove(this.start, this.end);
  			}

  			return;
  		}

  		var scope = this.findScope(true);
  		var i0 = this.getIndentation();
  		var i1 = i0 + code.getIndentString();

  		var key = scope.createIdentifier('i');
  		var list = scope.createIdentifier('list');

  		if (this.body.synthetic) {
  			code.prependRight(this.left.start, ("{\n" + i1));
  			code.appendLeft(this.body.body[0].end, ("\n" + i0 + "}"));
  		}

  		var bodyStart = this.body.body[0].start;

  		code.remove(this.left.end, this.right.start);
  		code.move(this.left.start, this.left.end, bodyStart);

  		code.prependRight(this.right.start, ("var " + key + " = 0, " + list + " = "));
  		code.appendLeft(this.right.end, ("; " + key + " < " + list + ".length; " + key + " += 1"));

  		var isDeclaration = this.left.type === 'VariableDeclaration';
  		var maybeDestructuring = isDeclaration ? this.left.declarations[0].id : this.left;
  		if (maybeDestructuring.type !== 'Identifier') {
  			var statementGenerators = [];
  			var ref = scope.createIdentifier('ref');
  			destructure(
  				code,
  				function (id) { return scope.createIdentifier(id); },
  				function (ref) {
  					var name = ref.name;

  					return scope.resolveName(name);
  			},
  				maybeDestructuring,
  				ref,
  				!isDeclaration,
  				statementGenerators
  			);

  			var suffix = ";\n" + i1;
  			statementGenerators.forEach(function (fn, i) {
  				if (i === statementGenerators.length - 1) {
  					suffix = ";\n\n" + i1;
  				}

  				fn(bodyStart, '', suffix);
  			});

  			if (isDeclaration) {
  				code.appendLeft(this.left.start + this.left.kind.length + 1, ref);
  				code.appendLeft(this.left.end, (" = " + list + "[" + key + "];\n" + i1));
  			} else {
  				code.appendLeft(this.left.end, ("var " + ref + " = " + list + "[" + key + "];\n" + i1));
  			}
  		} else {
  			code.appendLeft(this.left.end, (" = " + list + "[" + key + "];\n\n" + i1));
  		}
  	};

  	return ForOfStatement;
  }(LoopStatement));

  var FunctionDeclaration = /*@__PURE__*/(function (Node) {
  	function FunctionDeclaration () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) FunctionDeclaration.__proto__ = Node;
  	FunctionDeclaration.prototype = Object.create( Node && Node.prototype );
  	FunctionDeclaration.prototype.constructor = FunctionDeclaration;

  	FunctionDeclaration.prototype.initialise = function initialise (transforms) {
  		if (this.generator && transforms.generator) {
  			CompileError.missingTransform("generators", "generator", this);
  		}
  		if (this.async && transforms.asyncAwait) {
  			CompileError.missingTransform("async functions", "asyncAwait", this);
  		}

  		this.body.createScope();

  		if (this.id) {
  			this.findScope(true).addDeclaration(this.id, 'function');
  		}
  		Node.prototype.initialise.call(this, transforms);
  	};

  	FunctionDeclaration.prototype.transpile = function transpile (code, transforms) {
  		Node.prototype.transpile.call(this, code, transforms);
  		if (transforms.trailingFunctionCommas && this.params.length) {
  			removeTrailingComma(code, this.params[this.params.length - 1].end);
  		}
  	};

  	return FunctionDeclaration;
  }(Node$1));

  var FunctionExpression = /*@__PURE__*/(function (Node) {
  	function FunctionExpression () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) FunctionExpression.__proto__ = Node;
  	FunctionExpression.prototype = Object.create( Node && Node.prototype );
  	FunctionExpression.prototype.constructor = FunctionExpression;

  	FunctionExpression.prototype.initialise = function initialise (transforms) {
  		if (this.generator && transforms.generator) {
  			CompileError.missingTransform("generators", "generator", this);
  		}
  		if (this.async && transforms.asyncAwait) {
  			CompileError.missingTransform("async functions", "asyncAwait", this);
  		}

  		this.body.createScope();

  		if (this.id) {
  			// function expression IDs belong to the child scope...
  			this.body.scope.addDeclaration(this.id, 'function');
  		}

  		Node.prototype.initialise.call(this, transforms);

  		var parent = this.parent;
  		var methodName;

  		if (
  			transforms.conciseMethodProperty &&
  			parent.type === 'Property' &&
  			parent.kind === 'init' &&
  			parent.method &&
  			parent.key.type === 'Identifier'
  		) {
  			// object literal concise method
  			methodName = parent.key.name;
  		} else if (
  			transforms.classes &&
  			parent.type === 'MethodDefinition' &&
  			parent.kind === 'method' &&
  			parent.key.type === 'Identifier'
  		) {
  			// method definition in a class
  			methodName = parent.key.name;
  		} else if (this.id && this.id.type === 'Identifier') {
  			// naked function expression
  			methodName = this.id.alias || this.id.name;
  		}

  		if (methodName) {
  			for (var i$1 = 0, list$1 = this.params; i$1 < list$1.length; i$1 += 1) {
  				var param = list$1[i$1];

  				if (param.type === 'Identifier' && methodName === param.name) {
  					// workaround for Safari 9/WebKit bug:
  					// https://gitlab.com/Rich-Harris/buble/issues/154
  					// change parameter name when same as method name

  					var scope = this.body.scope;
  					var declaration = scope.declarations[methodName];

  					var alias = scope.createIdentifier(methodName);
  					param.alias = alias;

  					for (var i = 0, list = declaration.instances; i < list.length; i += 1) {
  						var identifier = list[i];

  						identifier.alias = alias;
  					}

  					break;
  				}
  			}
  		}
  	};

  	FunctionExpression.prototype.transpile = function transpile (code, transforms) {
  		Node.prototype.transpile.call(this, code, transforms);
  		if (transforms.trailingFunctionCommas && this.params.length) {
  			removeTrailingComma(code, this.params[this.params.length - 1].end);
  		}
  	};

  	return FunctionExpression;
  }(Node$1));

  function isReference(node, parent) {
  	if (node.type === 'MemberExpression') {
  		return !node.computed && isReference(node.object, node);
  	}

  	if (node.type === 'Identifier') {
  		// the only time we could have an identifier node without a parent is
  		// if it's the entire body of a function without a block statement –
  		// i.e. an arrow function expression like `a => a`
  		if (!parent) { return true; }

  		if (/(Function|Class)Expression/.test(parent.type)) { return false; }

  		if (parent.type === 'VariableDeclarator') { return node === parent.init; }

  		// TODO is this right?
  		if (
  			parent.type === 'MemberExpression' ||
  			parent.type === 'MethodDefinition'
  		) {
  			return parent.computed || node === parent.object;
  		}

  		if (parent.type === 'ArrayPattern') { return false; }

  		// disregard the `bar` in `{ bar: foo }`, but keep it in `{ [bar]: foo }`
  		if (parent.type === 'Property') {
  			if (parent.parent.type === 'ObjectPattern') { return false; }
  			return parent.computed || node === parent.value;
  		}

  		// disregard the `bar` in `class Foo { bar () {...} }`
  		if (parent.type === 'MethodDefinition') { return false; }

  		// disregard the `bar` in `export { foo as bar }`
  		if (parent.type === 'ExportSpecifier' && node !== parent.local)
  			{ return false; }

  		return true;
  	}
  }

  var Identifier = /*@__PURE__*/(function (Node) {
  	function Identifier () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) Identifier.__proto__ = Node;
  	Identifier.prototype = Object.create( Node && Node.prototype );
  	Identifier.prototype.constructor = Identifier;

  	Identifier.prototype.findScope = function findScope (functionScope) {
  		if (this.parent.params && ~this.parent.params.indexOf(this)) {
  			return this.parent.body.scope;
  		}

  		if (this.parent.type === 'FunctionExpression' && this === this.parent.id) {
  			return this.parent.body.scope;
  		}

  		return this.parent.findScope(functionScope);
  	};

  	Identifier.prototype.initialise = function initialise (transforms) {
  		if (isReference(this, this.parent)) {
  			if (
  				transforms.arrow &&
  				this.name === 'arguments' &&
  				!this.findScope(false).contains(this.name)
  			) {
  				var lexicalBoundary = this.findLexicalBoundary();
  				var arrowFunction = this.findNearest('ArrowFunctionExpression');
  				var loop = this.findNearest(loopStatement);

  				if (arrowFunction && arrowFunction.depth > lexicalBoundary.depth) {
  					this.alias = lexicalBoundary.getArgumentsAlias();
  				}

  				if (
  					loop &&
  					loop.body.contains(this) &&
  					loop.depth > lexicalBoundary.depth
  				) {
  					this.alias = lexicalBoundary.getArgumentsAlias();
  				}
  			}

  			this.findScope(false).addReference(this);
  		}
  	};

  	Identifier.prototype.transpile = function transpile (code) {
  		if (this.alias) {
  			code.overwrite(this.start, this.end, this.alias, {
  				storeName: true,
  				contentOnly: true
  			});
  		}
  	};

  	return Identifier;
  }(Node$1));

  var IfStatement = /*@__PURE__*/(function (Node) {
  	function IfStatement () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) IfStatement.__proto__ = Node;
  	IfStatement.prototype = Object.create( Node && Node.prototype );
  	IfStatement.prototype.constructor = IfStatement;

  	IfStatement.prototype.initialise = function initialise (transforms) {
  		Node.prototype.initialise.call(this, transforms);
  	};

  	IfStatement.prototype.transpile = function transpile (code, transforms) {
  		if (
  			this.consequent.type !== 'BlockStatement' ||
  			(this.consequent.type === 'BlockStatement' && this.consequent.synthetic)
  		) {
  			code.appendLeft(this.consequent.start, '{ ');
  			code.prependRight(this.consequent.end, ' }');
  		}

  		if (
  			this.alternate &&
  			this.alternate.type !== 'IfStatement' &&
  			(this.alternate.type !== 'BlockStatement' ||
  				(this.alternate.type === 'BlockStatement' && this.alternate.synthetic))
  		) {
  			code.appendLeft(this.alternate.start, '{ ');
  			code.prependRight(this.alternate.end, ' }');
  		}

  		Node.prototype.transpile.call(this, code, transforms);
  	};

  	return IfStatement;
  }(Node$1));

  var Import = /*@__PURE__*/(function (Node) {
  	function Import () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) Import.__proto__ = Node;
  	Import.prototype = Object.create( Node && Node.prototype );
  	Import.prototype.constructor = Import;

  	Import.prototype.initialise = function initialise (transforms) {
  		if (transforms.moduleImport) {
  			CompileError.missingTransform("dynamic import expressions", "moduleImport", this);
  		}
  		Node.prototype.initialise.call(this, transforms);
  	};

  	return Import;
  }(Node$1));

  var ImportDeclaration = /*@__PURE__*/(function (Node) {
  	function ImportDeclaration () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) ImportDeclaration.__proto__ = Node;
  	ImportDeclaration.prototype = Object.create( Node && Node.prototype );
  	ImportDeclaration.prototype.constructor = ImportDeclaration;

  	ImportDeclaration.prototype.initialise = function initialise (transforms) {
  		if (transforms.moduleImport)
  			{ CompileError.missingTransform("import", "moduleImport", this); }
  		Node.prototype.initialise.call(this, transforms);
  	};

  	return ImportDeclaration;
  }(Node$1));

  var ImportDefaultSpecifier = /*@__PURE__*/(function (Node) {
  	function ImportDefaultSpecifier () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) ImportDefaultSpecifier.__proto__ = Node;
  	ImportDefaultSpecifier.prototype = Object.create( Node && Node.prototype );
  	ImportDefaultSpecifier.prototype.constructor = ImportDefaultSpecifier;

  	ImportDefaultSpecifier.prototype.initialise = function initialise (transforms) {
  		this.findScope(true).addDeclaration(this.local, 'import');
  		Node.prototype.initialise.call(this, transforms);
  	};

  	return ImportDefaultSpecifier;
  }(Node$1));

  var ImportSpecifier = /*@__PURE__*/(function (Node) {
  	function ImportSpecifier () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) ImportSpecifier.__proto__ = Node;
  	ImportSpecifier.prototype = Object.create( Node && Node.prototype );
  	ImportSpecifier.prototype.constructor = ImportSpecifier;

  	ImportSpecifier.prototype.initialise = function initialise (transforms) {
  		this.findScope(true).addDeclaration(this.local, 'import');
  		Node.prototype.initialise.call(this, transforms);
  	};

  	return ImportSpecifier;
  }(Node$1));

  var hasDashes = function (val) { return /-/.test(val); };

  var formatKey = function (key) { return (hasDashes(key) ? ("'" + key + "'") : key); };

  var formatVal = function (val) { return (val ? '' : 'true'); };

  var JSXAttribute = /*@__PURE__*/(function (Node) {
  	function JSXAttribute () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) JSXAttribute.__proto__ = Node;
  	JSXAttribute.prototype = Object.create( Node && Node.prototype );
  	JSXAttribute.prototype.constructor = JSXAttribute;

  	JSXAttribute.prototype.transpile = function transpile (code, transforms) {
  		var ref = this.name;
  		var start = ref.start;
  		var name = ref.name;

  		// Overwrite equals sign if value is present.
  		var end = this.value ? this.value.start : this.name.end;

  		code.overwrite(start, end, ((formatKey(name)) + ": " + (formatVal(this.value))));

  		Node.prototype.transpile.call(this, code, transforms);
  	};

  	return JSXAttribute;
  }(Node$1));

  function containsNewLine(node) {
  	return (
  		node.type === 'JSXText' && !/\S/.test(node.value) && /\n/.test(node.value)
  	);
  }

  var JSXClosingElement = /*@__PURE__*/(function (Node) {
  	function JSXClosingElement () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) JSXClosingElement.__proto__ = Node;
  	JSXClosingElement.prototype = Object.create( Node && Node.prototype );
  	JSXClosingElement.prototype.constructor = JSXClosingElement;

  	JSXClosingElement.prototype.transpile = function transpile (code) {
  		var spaceBeforeParen = true;

  		var lastChild = this.parent.children[this.parent.children.length - 1];

  		// omit space before closing paren if
  		//   a) this is on a separate line, or
  		//   b) there are no children but there are attributes
  		if (
  			(lastChild && containsNewLine(lastChild)) ||
  			this.parent.openingElement.attributes.length
  		) {
  			spaceBeforeParen = false;
  		}

  		code.overwrite(this.start, this.end, spaceBeforeParen ? ' )' : ')');
  	};

  	return JSXClosingElement;
  }(Node$1));

  function containsNewLine$1(node) {
  	return (
  		node.type === 'JSXText' && !/\S/.test(node.value) && /\n/.test(node.value)
  	);
  }

  var JSXClosingFragment = /*@__PURE__*/(function (Node) {
  	function JSXClosingFragment () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) JSXClosingFragment.__proto__ = Node;
  	JSXClosingFragment.prototype = Object.create( Node && Node.prototype );
  	JSXClosingFragment.prototype.constructor = JSXClosingFragment;

  	JSXClosingFragment.prototype.transpile = function transpile (code) {
  		var spaceBeforeParen = true;

  		var lastChild = this.parent.children[this.parent.children.length - 1];

  		// omit space before closing paren if this is on a separate line
  		if (lastChild && containsNewLine$1(lastChild)) {
  			spaceBeforeParen = false;
  		}

  		code.overwrite(this.start, this.end, spaceBeforeParen ? ' )' : ')');
  	};

  	return JSXClosingFragment;
  }(Node$1));

  function normalise(str, removeTrailingWhitespace) {

  	str = str.replace(/\u00a0/g, '&nbsp;');

  	if (removeTrailingWhitespace && /\n/.test(str)) {
  		str = str.replace(/\s+$/, '');
  	}

  	str = str
  		.replace(/^\n\r?\s+/, '') // remove leading newline + space
  		.replace(/\s*\n\r?\s*/gm, ' '); // replace newlines with spaces

  	// TODO prefer single quotes?
  	return JSON.stringify(str);
  }

  var JSXElement = /*@__PURE__*/(function (Node) {
  	function JSXElement () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) JSXElement.__proto__ = Node;
  	JSXElement.prototype = Object.create( Node && Node.prototype );
  	JSXElement.prototype.constructor = JSXElement;

  	JSXElement.prototype.transpile = function transpile (code, transforms) {
  		Node.prototype.transpile.call(this, code, transforms);

  		var children = this.children.filter(function (child) {
  			if (child.type !== 'JSXText') { return true; }

  			// remove whitespace-only literals, unless on a single line
  			return /\S/.test(child.raw) || !/\n/.test(child.raw);
  		});

  		if (children.length) {
  			var c = (this.openingElement || this.openingFragment).end;

  			var i;
  			for (i = 0; i < children.length; i += 1) {
  				var child = children[i];

  				if (
  					child.type === 'JSXExpressionContainer' &&
  					child.expression.type === 'JSXEmptyExpression'
  				) ; else {
  					var tail =
  						code.original[c] === '\n' && child.type !== 'JSXText' ? '' : ' ';
  					code.appendLeft(c, ("," + tail));
  				}

  				if (child.type === 'JSXText') {
  					var str = normalise(child.value, i === children.length - 1);
  					code.overwrite(child.start, child.end, str);
  				}

  				c = child.end;
  			}
  		}
  	};

  	return JSXElement;
  }(Node$1));

  var JSXExpressionContainer = /*@__PURE__*/(function (Node) {
  	function JSXExpressionContainer () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) JSXExpressionContainer.__proto__ = Node;
  	JSXExpressionContainer.prototype = Object.create( Node && Node.prototype );
  	JSXExpressionContainer.prototype.constructor = JSXExpressionContainer;

  	JSXExpressionContainer.prototype.transpile = function transpile (code, transforms) {
  		code.remove(this.start, this.expression.start);
  		code.remove(this.expression.end, this.end);

  		Node.prototype.transpile.call(this, code, transforms);
  	};

  	return JSXExpressionContainer;
  }(Node$1));

  var JSXFragment = /*@__PURE__*/(function (JSXElement) {
  	function JSXFragment () {
  		JSXElement.apply(this, arguments);
  	}if ( JSXElement ) JSXFragment.__proto__ = JSXElement;
  	JSXFragment.prototype = Object.create( JSXElement && JSXElement.prototype );
  	JSXFragment.prototype.constructor = JSXFragment;

  	

  	return JSXFragment;
  }(JSXElement));

  var JSXOpeningElement = /*@__PURE__*/(function (Node) {
  	function JSXOpeningElement () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) JSXOpeningElement.__proto__ = Node;
  	JSXOpeningElement.prototype = Object.create( Node && Node.prototype );
  	JSXOpeningElement.prototype.constructor = JSXOpeningElement;

  	JSXOpeningElement.prototype.transpile = function transpile (code, transforms) {
  		Node.prototype.transpile.call(this, code, transforms);

  		code.overwrite(this.start, this.name.start, ((this.program.jsx) + "( "));

  		var html =
  			this.name.type === 'JSXIdentifier' &&
  			this.name.name[0] === this.name.name[0].toLowerCase();
  		if (html) { code.prependRight(this.name.start, "'"); }

  		var len = this.attributes.length;
  		var c = this.name.end;

  		if (len) {
  			var i;

  			var hasSpread = false;
  			for (i = 0; i < len; i += 1) {
  				if (this.attributes[i].type === 'JSXSpreadAttribute') {
  					hasSpread = true;
  					break;
  				}
  			}

  			c = this.attributes[0].end;

  			for (i = 0; i < len; i += 1) {
  				var attr = this.attributes[i];

  				if (i > 0) {
  					if (attr.start === c) { code.prependRight(c, ', '); }
  					else { code.overwrite(c, attr.start, ', '); }
  				}

  				if (hasSpread && attr.type !== 'JSXSpreadAttribute') {
  					var lastAttr = this.attributes[i - 1];
  					var nextAttr = this.attributes[i + 1];

  					if (!lastAttr || lastAttr.type === 'JSXSpreadAttribute') {
  						code.prependRight(attr.start, '{ ');
  					}

  					if (!nextAttr || nextAttr.type === 'JSXSpreadAttribute') {
  						code.appendLeft(attr.end, ' }');
  					}
  				}

  				c = attr.end;
  			}

  			var after;
  			var before;
  			if (hasSpread) {
  				if (len === 1) {
  					before = html ? "'," : ',';
  				} else {
  					if (!this.program.options.objectAssign) {
  						throw new CompileError(
  							"Mixed JSX attributes ending in spread requires specified objectAssign option with 'Object.assign' or polyfill helper.",
  							this
  						);
  					}
  					before = html
  						? ("', " + (this.program.options.objectAssign) + "({},")
  						: (", " + (this.program.options.objectAssign) + "({},");
  					after = ')';
  				}
  			} else {
  				before = html ? "', {" : ', {';
  				after = ' }';
  			}

  			code.prependRight(this.name.end, before);

  			if (after) {
  				code.appendLeft(this.attributes[len - 1].end, after);
  			}
  		} else {
  			code.appendLeft(this.name.end, html ? "', null" : ", null");
  			c = this.name.end;
  		}

  		if (this.selfClosing) {
  			code.overwrite(c, this.end, this.attributes.length ? ")" : " )");
  		} else {
  			code.remove(c, this.end);
  		}
  	};

  	return JSXOpeningElement;
  }(Node$1));

  var JSXOpeningFragment = /*@__PURE__*/(function (Node) {
  	function JSXOpeningFragment () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) JSXOpeningFragment.__proto__ = Node;
  	JSXOpeningFragment.prototype = Object.create( Node && Node.prototype );
  	JSXOpeningFragment.prototype.constructor = JSXOpeningFragment;

  	JSXOpeningFragment.prototype.transpile = function transpile (code) {
  		code.overwrite(this.start, this.end, ((this.program.jsx) + "( " + (this.program.jsxFragment) + ", null"));
  	};

  	return JSXOpeningFragment;
  }(Node$1));

  var JSXSpreadAttribute = /*@__PURE__*/(function (Node) {
  	function JSXSpreadAttribute () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) JSXSpreadAttribute.__proto__ = Node;
  	JSXSpreadAttribute.prototype = Object.create( Node && Node.prototype );
  	JSXSpreadAttribute.prototype.constructor = JSXSpreadAttribute;

  	JSXSpreadAttribute.prototype.transpile = function transpile (code, transforms) {
  		code.remove(this.start, this.argument.start);
  		code.remove(this.argument.end, this.end);

  		Node.prototype.transpile.call(this, code, transforms);
  	};

  	return JSXSpreadAttribute;
  }(Node$1));

  var nonAsciiLsOrPs = /[\u2028-\u2029]/g;

  var Literal = /*@__PURE__*/(function (Node) {
  	function Literal () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) Literal.__proto__ = Node;
  	Literal.prototype = Object.create( Node && Node.prototype );
  	Literal.prototype.constructor = Literal;

  	Literal.prototype.initialise = function initialise () {
  		if (typeof this.value === 'string') {
  			this.program.indentExclusionElements.push(this);
  		}
  	};

  	Literal.prototype.transpile = function transpile (code, transforms) {
  		if (transforms.numericLiteral) {
  			if (this.raw.match(/^0[bo]/i)) {
  				code.overwrite(this.start, this.end, String(this.value), {
  					storeName: true,
  					contentOnly: true
  				});
  			}
  		}

  		if (this.regex) {
  			var ref = this.regex;
  			var pattern = ref.pattern;
  			var flags = ref.flags;

  			if (transforms.stickyRegExp && /y/.test(flags))
  				{ CompileError.missingTransform('the regular expression sticky flag', 'stickyRegExp', this); }
  			if (transforms.unicodeRegExp && /u/.test(flags)) {
  				code.overwrite(
  					this.start,
  					this.end,
  					("/" + (rewritePattern_1(pattern, flags)) + "/" + (flags.replace('u', ''))),
  					{
  						contentOnly: true
  					}
  				);
  			}
  		} else if (typeof this.value === "string" && this.value.match(nonAsciiLsOrPs)) {
  			code.overwrite(
  				this.start,
  				this.end,
  				this.raw.replace(nonAsciiLsOrPs, function (m) { return m == '\u2028' ? '\\u2028' : '\\u2029'; }),
  				{
  					contentOnly: true
  				}
  			);
  		}
  	};

  	return Literal;
  }(Node$1));

  var MemberExpression = /*@__PURE__*/(function (Node) {
  	function MemberExpression () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) MemberExpression.__proto__ = Node;
  	MemberExpression.prototype = Object.create( Node && Node.prototype );
  	MemberExpression.prototype.constructor = MemberExpression;

  	MemberExpression.prototype.transpile = function transpile (code, transforms) {
  		if (transforms.reservedProperties && reserved[this.property.name]) {
  			code.overwrite(this.object.end, this.property.start, "['");
  			code.appendLeft(this.property.end, "']");
  		}

  		Node.prototype.transpile.call(this, code, transforms);
  	};

  	return MemberExpression;
  }(Node$1));

  var NewExpression = /*@__PURE__*/(function (Node) {
  	function NewExpression () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) NewExpression.__proto__ = Node;
  	NewExpression.prototype = Object.create( Node && Node.prototype );
  	NewExpression.prototype.constructor = NewExpression;

  	NewExpression.prototype.initialise = function initialise (transforms) {
  		if (transforms.spreadRest && this.arguments.length) {
  			var lexicalBoundary = this.findLexicalBoundary();

  			var i = this.arguments.length;
  			while (i--) {
  				var arg = this.arguments[i];
  				if (arg.type === 'SpreadElement' && isArguments(arg.argument)) {
  					this.argumentsArrayAlias = lexicalBoundary.getArgumentsArrayAlias();
  					break;
  				}
  			}
  		}

  		Node.prototype.initialise.call(this, transforms);
  	};

  	NewExpression.prototype.transpile = function transpile (code, transforms) {
  		Node.prototype.transpile.call(this, code, transforms);

  		if (transforms.spreadRest && this.arguments.length) {
  			inlineSpreads(code, this, this.arguments);
  			// this.arguments.length may have changed, must retest.
  		}

  		if (transforms.spreadRest && this.arguments.length) {
  			var firstArgument = this.arguments[0];
  			var isNew = true;
  			var hasSpreadElements = spread(
  				code,
  				this.arguments,
  				firstArgument.start,
  				this.argumentsArrayAlias,
  				isNew
  			);

  			if (hasSpreadElements) {
  				code.prependRight(
  					this.start + 'new'.length,
  					' (Function.prototype.bind.apply('
  				);
  				code.overwrite(
  					this.callee.end,
  					firstArgument.start,
  					', [ null ].concat( '
  				);
  				code.appendLeft(this.end, ' ))');
  			}
  		}

  		if (this.arguments.length) {
  			removeTrailingComma(code, this.arguments[this.arguments.length - 1].end);
  		}
  	};

  	return NewExpression;
  }(Node$1));

  var ObjectExpression = /*@__PURE__*/(function (Node) {
  	function ObjectExpression () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) ObjectExpression.__proto__ = Node;
  	ObjectExpression.prototype = Object.create( Node && Node.prototype );
  	ObjectExpression.prototype.constructor = ObjectExpression;

  	ObjectExpression.prototype.transpile = function transpile (code, transforms) {
  		var ref;

  		Node.prototype.transpile.call(this, code, transforms);

  		var firstPropertyStart = this.start + 1;
  		var spreadPropertyCount = 0;
  		var computedPropertyCount = 0;
  		var firstSpreadProperty = null;
  		var firstComputedProperty = null;

  		for (var i = 0; i < this.properties.length; ++i) {
  			var prop = this.properties[i];
  			if (prop.type === 'SpreadElement') {
  				// First see if we can inline the spread, to save needing objectAssign.
  				var argument = prop.argument;
  				if (
  					argument.type === 'ObjectExpression' || (
  						argument.type === 'Literal' &&
  						typeof argument.value !== 'string'
  					)
  				) {
  					if (argument.type === 'ObjectExpression' && argument.properties.length > 0) {
  						// Strip the `...{` and the `}` with a possible trailing comma before it,
  						// leaving just the possible trailing comma after it.
  						code.remove(prop.start, argument.properties[0].start);
  						code.remove(argument.properties[argument.properties.length - 1].end, prop.end);
  						(ref = this.properties).splice.apply(ref, [ i, 1 ].concat( argument.properties ));
  						i--;
  					} else {
  						// An empty object, boolean, null, undefined, number or regexp (but NOT
  						// string) will spread to nothing, so just remove the element altogether,
  						// including a possible trailing comma.
  						code.remove(prop.start, i === this.properties.length - 1
  							? prop.end
  							: this.properties[i + 1].start);
  						this.properties.splice(i, 1);
  						i--;
  					}
  				} else {
  					spreadPropertyCount += 1;
  					if (firstSpreadProperty === null) { firstSpreadProperty = i; }
  				}
  			} else if (prop.computed && transforms.computedProperty) {
  				computedPropertyCount += 1;
  				if (firstComputedProperty === null) { firstComputedProperty = i; }
  			}
  		}

  		if (spreadPropertyCount && !transforms.objectRestSpread && !(computedPropertyCount && transforms.computedProperty)) {
  			spreadPropertyCount = 0;
  			firstSpreadProperty = null;
  		} else if (spreadPropertyCount) {
  			if (!this.program.options.objectAssign) {
  				throw new CompileError(
  					"Object spread operator requires specified objectAssign option with 'Object.assign' or polyfill helper.",
  					this
  				);
  			}
  			var i$1 = this.properties.length;
  			while (i$1--) {
  				var prop$1 = this.properties[i$1];

  				// enclose run of non-spread properties in curlies
  				if (prop$1.type === 'Property' && !computedPropertyCount) {
  					var lastProp = this.properties[i$1 - 1];
  					var nextProp = this.properties[i$1 + 1];

  					if (!lastProp || lastProp.type !== 'Property') {
  						code.prependRight(prop$1.start, '{');
  					}

  					if (!nextProp || nextProp.type !== 'Property') {
  						code.appendLeft(prop$1.end, '}');
  					}
  				}

  				// Remove ellipsis on spread property
  				if (prop$1.type === 'SpreadElement') {
  					code.remove(prop$1.start, prop$1.argument.start);
  					code.remove(prop$1.argument.end, prop$1.end);
  				}
  			}

  			// wrap the whole thing in Object.assign
  			firstPropertyStart = this.properties[0].start;
  			if (!computedPropertyCount) {
  				code.overwrite(
  					this.start,
  					firstPropertyStart,
  					((this.program.options.objectAssign) + "({}, ")
  				);
  				code.overwrite(
  					this.properties[this.properties.length - 1].end,
  					this.end,
  					')'
  				);
  			} else if (this.properties[0].type === 'SpreadElement') {
  				code.overwrite(
  					this.start,
  					firstPropertyStart,
  					((this.program.options.objectAssign) + "({}, ")
  				);
  				code.remove(this.end - 1, this.end);
  				code.appendRight(this.end, ')');
  			} else {
  				code.prependLeft(this.start, ((this.program.options.objectAssign) + "("));
  				code.appendRight(this.end, ')');
  			}
  		}

  		if (computedPropertyCount && transforms.computedProperty) {
  			var i0 = this.getIndentation();

  			var isSimpleAssignment;
  			var name;

  			if (
  				this.parent.type === 'VariableDeclarator' &&
  				this.parent.parent.declarations.length === 1 &&
  				this.parent.id.type === 'Identifier'
  			) {
  				isSimpleAssignment = true;
  				name = this.parent.id.alias || this.parent.id.name; // TODO is this right?
  			} else if (
  				this.parent.type === 'AssignmentExpression' &&
  				this.parent.parent.type === 'ExpressionStatement' &&
  				this.parent.left.type === 'Identifier'
  			) {
  				isSimpleAssignment = true;
  				name = this.parent.left.alias || this.parent.left.name; // TODO is this right?
  			} else if (
  				this.parent.type === 'AssignmentPattern' &&
  				this.parent.left.type === 'Identifier'
  			) {
  				isSimpleAssignment = true;
  				name = this.parent.left.alias || this.parent.left.name; // TODO is this right?
  			}

  			if (spreadPropertyCount) { isSimpleAssignment = false; }

  			// handle block scoping
  			name = this.findScope(false).resolveName(name);

  			var start = firstPropertyStart;
  			var end = this.end;

  			if (isSimpleAssignment) ; else {
  				if (
  					firstSpreadProperty === null ||
  					firstComputedProperty < firstSpreadProperty
  				) {
  					name = this.findScope(true).createDeclaration('obj');

  					code.prependRight(this.start, ("( " + name + " = "));
  				} else { name = null; } // We don't actually need this variable
  			}

  			var len = this.properties.length;
  			var lastComputedProp;
  			var sawNonComputedProperty = false;
  			var isFirst = true;

  			for (var i$2 = 0; i$2 < len; i$2 += 1) {
  				var prop$2 = this.properties[i$2];
  				var moveStart = i$2 > 0 ? this.properties[i$2 - 1].end : start;

  				if (
  					prop$2.type === 'Property' &&
  					(prop$2.computed || (lastComputedProp && !spreadPropertyCount))
  				) {
  					if (i$2 === 0) { moveStart = this.start + 1; } // Trim leading whitespace
  					lastComputedProp = prop$2;

  					if (!name) {
  						name = this.findScope(true).createDeclaration('obj');

  						var propId = name + (prop$2.computed ? '' : '.');
  						code.appendRight(prop$2.start, ("( " + name + " = {}, " + propId));
  					} else {
  						var propId$1 =
  							(isSimpleAssignment ? (";\n" + i0 + name) : (", " + name)) +
  							(prop$2.key.type === 'Literal' || prop$2.computed ? '' : '.');

  						if (moveStart < prop$2.start) {
  							code.overwrite(moveStart, prop$2.start, propId$1);
  						} else {
  							code.prependRight(prop$2.start, propId$1);
  						}
  					}

  					var c = prop$2.key.end;
  					if (prop$2.computed) {
  						while (code.original[c] !== ']') { c += 1; }
  						c += 1;
  					}
  					if (prop$2.key.type === 'Literal' && !prop$2.computed) {
  						code.overwrite(
  							prop$2.start,
  							prop$2.value.start,
  							'[' + code.slice(prop$2.start, prop$2.key.end) + '] = '
  						);
  					} else if (prop$2.shorthand || (prop$2.method && !prop$2.computed && transforms.conciseMethodProperty)) {
  						// Replace : with = if Property::transpile inserted the :
  						code.overwrite(
  							prop$2.key.start,
  							prop$2.key.end,
  							code.slice(prop$2.key.start, prop$2.key.end).replace(/:/, ' =')
  						);
  					} else {
  						if (prop$2.value.start > c) { code.remove(c, prop$2.value.start); }
  						code.prependLeft(c, ' = ');
  					}

  					// This duplicates behavior from Property::transpile which is disabled
  					// for computed properties or if conciseMethodProperty is false
  					if (prop$2.method && (prop$2.computed || !transforms.conciseMethodProperty)) {
  						if (prop$2.value.generator) { code.remove(prop$2.start, prop$2.key.start); }
  						code.prependRight(prop$2.value.start, ("function" + (prop$2.value.generator ? '*' : '') + " "));
  					}
  				} else if (prop$2.type === 'SpreadElement') {
  					if (name && i$2 > 0) {
  						if (!lastComputedProp) {
  							lastComputedProp = this.properties[i$2 - 1];
  						}
  						code.appendLeft(lastComputedProp.end, (", " + name + " )"));

  						lastComputedProp = null;
  						name = null;
  					}
  				} else {
  					if (!isFirst && spreadPropertyCount) {
  						// We are in an Object.assign context, so we need to wrap regular properties
  						code.prependRight(prop$2.start, '{');
  						code.appendLeft(prop$2.end, '}');
  					}
  					sawNonComputedProperty = true;
  				}
  				if (isFirst && (prop$2.type === 'SpreadElement' || prop$2.computed)) {
  					var beginEnd = sawNonComputedProperty
  						? this.properties[this.properties.length - 1].end
  						: this.end - 1;
  					// Trim trailing comma because it can easily become a leading comma which is illegal
  					if (code.original[beginEnd] == ',') { ++beginEnd; }
  					var closing = code.slice(beginEnd, end);
  					code.prependLeft(moveStart, closing);
  					code.remove(beginEnd, end);
  					isFirst = false;
  				}

  				// Clean up some extranous whitespace
  				var c$1 = prop$2.end;
  				if (i$2 < len - 1 && !sawNonComputedProperty) {
  					while (code.original[c$1] !== ',') { c$1 += 1; }
  				} else if (i$2 == len - 1) { c$1 = this.end; }
  				if (prop$2.end != c$1) { code.overwrite(prop$2.end, c$1, '', {contentOnly: true}); }
  			}

  			if (!isSimpleAssignment && name) {
  				code.appendLeft(lastComputedProp.end, (", " + name + " )"));
  			}
  		}
  	};

  	return ObjectExpression;
  }(Node$1));

  var Property = /*@__PURE__*/(function (Node) {
  	function Property () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) Property.__proto__ = Node;
  	Property.prototype = Object.create( Node && Node.prototype );
  	Property.prototype.constructor = Property;

  	Property.prototype.initialise = function initialise (transforms) {
  		if ((this.kind === 'get' || this.kind === 'set') && transforms.getterSetter) {
  			CompileError.missingTransform("getters and setters", "getterSetter", this);
  		}
  		Node.prototype.initialise.call(this, transforms);
  	};

  	Property.prototype.transpile = function transpile (code, transforms) {
  		Node.prototype.transpile.call(this, code, transforms);

  		if (
  			transforms.conciseMethodProperty &&
  			!this.computed &&
  			this.parent.type !== 'ObjectPattern'
  		) {
  			if (this.shorthand) {
  				code.prependRight(this.start, ((this.key.name) + ": "));
  			} else if (this.method) {
  				var name = '';
  				if (this.program.options.namedFunctionExpressions !== false) {
  					if (
  						this.key.type === 'Literal' &&
  						typeof this.key.value === 'number'
  					) {
  						name = '';
  					} else if (this.key.type === 'Identifier') {
  						if (
  							reserved[this.key.name] ||
  							!/^[a-z_$][a-z0-9_$]*$/i.test(this.key.name) ||
  							this.value.body.scope.references[this.key.name]
  						) {
  							name = this.findScope(true).createIdentifier(this.key.name);
  						} else {
  							name = this.key.name;
  						}
  					} else {
  						name = this.findScope(true).createIdentifier(this.key.value);
  					}
  					name = ' ' + name;
  				}

  				if (this.start < this.key.start) { code.remove(this.start, this.key.start); }
  				code.appendLeft(
  					this.key.end,
  					(": " + (this.value.async ? 'async ' : '') + "function" + (this.value.generator ? '*' : '') + name)
  				);
  			}
  		}

  		if (transforms.reservedProperties && reserved[this.key.name]) {
  			code.prependRight(this.key.start, "'");
  			code.appendLeft(this.key.end, "'");
  		}
  	};

  	return Property;
  }(Node$1));

  var ReturnStatement = /*@__PURE__*/(function (Node) {
  	function ReturnStatement () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) ReturnStatement.__proto__ = Node;
  	ReturnStatement.prototype = Object.create( Node && Node.prototype );
  	ReturnStatement.prototype.constructor = ReturnStatement;

  	ReturnStatement.prototype.initialise = function initialise (transforms) {
  		this.loop = this.findNearest(loopStatement);
  		this.nearestFunction = this.findNearest(/Function/);

  		if (
  			this.loop &&
  			(!this.nearestFunction || this.loop.depth > this.nearestFunction.depth)
  		) {
  			this.loop.canReturn = true;
  			this.shouldWrap = true;
  		}

  		if (this.argument) { this.argument.initialise(transforms); }
  	};

  	ReturnStatement.prototype.transpile = function transpile (code, transforms) {
  		var shouldWrap =
  			this.shouldWrap && this.loop && this.loop.shouldRewriteAsFunction;

  		if (this.argument) {
  			if (shouldWrap) { code.prependRight(this.argument.start, "{ v: "); }
  			this.argument.transpile(code, transforms);
  			if (shouldWrap) { code.appendLeft(this.argument.end, " }"); }
  		} else if (shouldWrap) {
  			code.appendLeft(this.start + 6, ' {}');
  		}
  	};

  	return ReturnStatement;
  }(Node$1));

  var Super = /*@__PURE__*/(function (Node) {
  	function Super () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) Super.__proto__ = Node;
  	Super.prototype = Object.create( Node && Node.prototype );
  	Super.prototype.constructor = Super;

  	Super.prototype.initialise = function initialise (transforms) {
  		if (transforms.classes) {
  			this.method = this.findNearest('MethodDefinition');
  			if (!this.method)
  				{ throw new CompileError('use of super outside class method', this); }

  			var parentClass = this.findNearest('ClassBody').parent;
  			this.superClassName =
  				parentClass.superClass && (parentClass.superClass.name || 'superclass');

  			if (!this.superClassName)
  				{ throw new CompileError('super used in base class', this); }

  			this.isCalled =
  				this.parent.type === 'CallExpression' && this === this.parent.callee;

  			if (this.method.kind !== 'constructor' && this.isCalled) {
  				throw new CompileError(
  					'super() not allowed outside class constructor',
  					this
  				);
  			}

  			this.isMember = this.parent.type === 'MemberExpression';

  			if (!this.isCalled && !this.isMember) {
  				throw new CompileError(
  					'Unexpected use of `super` (expected `super(...)` or `super.*`)',
  					this
  				);
  			}
  		}

  		if (transforms.arrow) {
  			var lexicalBoundary = this.findLexicalBoundary();
  			var arrowFunction = this.findNearest('ArrowFunctionExpression');
  			var loop = this.findNearest(loopStatement);

  			if (arrowFunction && arrowFunction.depth > lexicalBoundary.depth) {
  				this.thisAlias = lexicalBoundary.getThisAlias();
  			}

  			if (
  				loop &&
  				loop.body.contains(this) &&
  				loop.depth > lexicalBoundary.depth
  			) {
  				this.thisAlias = lexicalBoundary.getThisAlias();
  			}
  		}
  	};

  	Super.prototype.transpile = function transpile (code, transforms) {
  		if (transforms.classes) {
  			var expression =
  				this.isCalled || this.method.static
  					? this.superClassName
  					: ((this.superClassName) + ".prototype");

  			code.overwrite(this.start, this.end, expression, {
  				storeName: true,
  				contentOnly: true
  			});

  			var callExpression = this.isCalled ? this.parent : this.parent.parent;

  			if (callExpression && callExpression.type === 'CallExpression') {
  				if (!this.noCall) {
  					// special case – `super( ...args )`
  					code.appendLeft(callExpression.callee.end, '.call');
  				}

  				var thisAlias = this.thisAlias || 'this';

  				if (callExpression.arguments.length) {
  					code.appendLeft(callExpression.arguments[0].start, (thisAlias + ", "));
  				} else {
  					code.appendLeft(callExpression.end - 1, ("" + thisAlias));
  				}
  			}
  		}
  	};

  	return Super;
  }(Node$1));

  var TaggedTemplateExpression = /*@__PURE__*/(function (Node) {
  	function TaggedTemplateExpression () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) TaggedTemplateExpression.__proto__ = Node;
  	TaggedTemplateExpression.prototype = Object.create( Node && Node.prototype );
  	TaggedTemplateExpression.prototype.constructor = TaggedTemplateExpression;

  	TaggedTemplateExpression.prototype.initialise = function initialise (transforms) {
  		if (
  			transforms.templateString &&
  			!transforms.dangerousTaggedTemplateString
  		) {
  			CompileError.missingTransform(
  				"tagged template strings", "templateString", this, "dangerousTaggedTemplateString"
  			);
  		}

  		Node.prototype.initialise.call(this, transforms);
  	};

  	TaggedTemplateExpression.prototype.transpile = function transpile (code, transforms) {
  		if (transforms.templateString && transforms.dangerousTaggedTemplateString) {
  			var ordered = this.quasi.expressions
  				.concat(this.quasi.quasis)
  				.sort(function (a, b) { return a.start - b.start; });

  			var program = this.program;
  			var rootScope = program.body.scope;

  			// insert strings at start
  			var templateStrings = this.quasi.quasis.map(function (quasi) { return JSON.stringify(quasi.value.cooked); }
  			).join(', ');

  			var templateObject = this.program.templateLiteralQuasis[templateStrings];
  			if (!templateObject) {
  				templateObject = rootScope.createIdentifier('templateObject');
  				code.prependLeft(this.program.prependAt, ("var " + templateObject + " = Object.freeze([" + templateStrings + "]);\n"));

  				this.program.templateLiteralQuasis[templateStrings] = templateObject;
  			}

  			code.overwrite(
  				this.tag.end,
  				ordered[0].start,
  				("(" + templateObject)
  			);

  			var lastIndex = ordered[0].start;
  			ordered.forEach(function (node) {
  				if (node.type === 'TemplateElement') {
  					code.remove(lastIndex, node.end);
  				} else {
  					code.overwrite(lastIndex, node.start, ', ');
  				}

  				lastIndex = node.end;
  			});

  			code.overwrite(lastIndex, this.end, ')');
  		}

  		Node.prototype.transpile.call(this, code, transforms);
  	};

  	return TaggedTemplateExpression;
  }(Node$1));

  var TemplateElement = /*@__PURE__*/(function (Node) {
  	function TemplateElement () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) TemplateElement.__proto__ = Node;
  	TemplateElement.prototype = Object.create( Node && Node.prototype );
  	TemplateElement.prototype.constructor = TemplateElement;

  	TemplateElement.prototype.initialise = function initialise () {
  		this.program.indentExclusionElements.push(this);
  	};

  	return TemplateElement;
  }(Node$1));

  var TemplateLiteral = /*@__PURE__*/(function (Node) {
  	function TemplateLiteral () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) TemplateLiteral.__proto__ = Node;
  	TemplateLiteral.prototype = Object.create( Node && Node.prototype );
  	TemplateLiteral.prototype.constructor = TemplateLiteral;

  	TemplateLiteral.prototype.transpile = function transpile (code, transforms) {
  		Node.prototype.transpile.call(this, code, transforms);

  		if (
  			transforms.templateString &&
  			this.parent.type !== 'TaggedTemplateExpression'
  		) {
  			var ordered = this.expressions
  				.concat(this.quasis)
  				.sort(function (a, b) { return a.start - b.start || a.end - b.end; })
  				.filter(function (node, i) {
  					// include all expressions
  					if (node.type !== 'TemplateElement') { return true; }

  					// include all non-empty strings
  					if (node.value.raw) { return true; }

  					// exclude all empty strings not at the head
  					return !i;
  				});

  			// special case – we may be able to skip the first element,
  			// if it's the empty string, but only if the second and
  			// third elements aren't both expressions (since they maybe
  			// be numeric, and `1 + 2 + '3' === '33'`)
  			if (ordered.length >= 3) {
  				var first = ordered[0];
  				var third = ordered[2];
  				if (
  					first.type === 'TemplateElement' &&
  					first.value.raw === '' &&
  					third.type === 'TemplateElement'
  				) {
  					ordered.shift();
  				}
  			}

  			var parenthesise =
  				(this.quasis.length !== 1 || this.expressions.length !== 0) &&
  				this.parent.type !== 'TemplateLiteral' &&
  				this.parent.type !== 'AssignmentExpression' &&
  				this.parent.type !== 'AssignmentPattern' &&
  				this.parent.type !== 'VariableDeclarator' &&
  				(this.parent.type !== 'BinaryExpression' ||
  					this.parent.operator !== '+');

  			if (parenthesise) { code.appendRight(this.start, '('); }

  			var lastIndex = this.start;

  			ordered.forEach(function (node, i) {
  				var prefix = i === 0 ? (parenthesise ? '(' : '') : ' + ';

  				if (node.type === 'TemplateElement') {
  					code.overwrite(
  						lastIndex,
  						node.end,
  						prefix + JSON.stringify(node.value.cooked)
  					);
  				} else {
  					var parenthesise$1 = node.type !== 'Identifier'; // TODO other cases where it's safe

  					if (parenthesise$1) { prefix += '('; }

  					code.remove(lastIndex, node.start);

  					if (prefix) { code.prependRight(node.start, prefix); }
  					if (parenthesise$1) { code.appendLeft(node.end, ')'); }
  				}

  				lastIndex = node.end;
  			});

  			if (parenthesise) { code.appendLeft(lastIndex, ')'); }
  			code.overwrite(lastIndex, this.end, "", { contentOnly: true });
  		}
  	};

  	return TemplateLiteral;
  }(Node$1));

  var ThisExpression = /*@__PURE__*/(function (Node) {
  	function ThisExpression () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) ThisExpression.__proto__ = Node;
  	ThisExpression.prototype = Object.create( Node && Node.prototype );
  	ThisExpression.prototype.constructor = ThisExpression;

  	ThisExpression.prototype.initialise = function initialise (transforms) {
  		var lexicalBoundary = this.findLexicalBoundary();

  		if (transforms.letConst) {
  			// save all loops up to the lexical boundary in case we need
  			// to alias them later for block-scoped declarations
  			var node = this.findNearest(loopStatement);
  			while (node && node.depth > lexicalBoundary.depth) {
  				node.thisRefs.push(this);
  				node = node.parent.findNearest(loopStatement);
  			}
  		}

  		if (transforms.arrow) {
  			var arrowFunction = this.findNearest('ArrowFunctionExpression');

  			if (arrowFunction && arrowFunction.depth > lexicalBoundary.depth) {
  				this.alias = lexicalBoundary.getThisAlias();
  			}
  		}
  	};

  	ThisExpression.prototype.transpile = function transpile (code) {
  		if (this.alias) {
  			code.overwrite(this.start, this.end, this.alias, {
  				storeName: true,
  				contentOnly: true
  			});
  		}
  	};

  	return ThisExpression;
  }(Node$1));

  var UpdateExpression = /*@__PURE__*/(function (Node) {
  	function UpdateExpression () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) UpdateExpression.__proto__ = Node;
  	UpdateExpression.prototype = Object.create( Node && Node.prototype );
  	UpdateExpression.prototype.constructor = UpdateExpression;

  	UpdateExpression.prototype.initialise = function initialise (transforms) {
  		if (this.argument.type === 'Identifier') {
  			var declaration = this.findScope(false).findDeclaration(
  				this.argument.name
  			);
  			// special case – https://gitlab.com/Rich-Harris/buble/issues/150
  			var statement = declaration && declaration.node.ancestor(3);
  			if (
  				statement &&
  				statement.type === 'ForStatement' &&
  				statement.body.contains(this)
  			) {
  				statement.reassigned[this.argument.name] = true;
  			}
  		}

  		Node.prototype.initialise.call(this, transforms);
  	};

  	UpdateExpression.prototype.transpile = function transpile (code, transforms) {
  		if (this.argument.type === 'Identifier') {
  			// Do this check after everything has been initialized to find
  			// shadowing declarations after this expression
  			checkConst(this.argument, this.findScope(false));
  		}
  		Node.prototype.transpile.call(this, code, transforms);
  	};

  	return UpdateExpression;
  }(Node$1));

  var VariableDeclaration = /*@__PURE__*/(function (Node) {
  	function VariableDeclaration () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) VariableDeclaration.__proto__ = Node;
  	VariableDeclaration.prototype = Object.create( Node && Node.prototype );
  	VariableDeclaration.prototype.constructor = VariableDeclaration;

  	VariableDeclaration.prototype.initialise = function initialise (transforms) {
  		this.scope = this.findScope(this.kind === 'var');
  		this.declarations.forEach(function (declarator) { return declarator.initialise(transforms); });
  	};

  	VariableDeclaration.prototype.transpile = function transpile (code, transforms) {
  		var this$1 = this;

  		var i0 = this.getIndentation();
  		var kind = this.kind;

  		if (transforms.letConst && kind !== 'var') {
  			kind = 'var';
  			code.overwrite(this.start, this.start + this.kind.length, kind, {
  				contentOnly: true,
  				storeName: true
  			});
  		}

  		if (transforms.destructuring && this.parent.type !== 'ForOfStatement' && this.parent.type !== 'ForInStatement') {
  			var c = this.start;
  			var lastDeclaratorIsPattern;

  			this.declarations.forEach(function (declarator, i) {
  				declarator.transpile(code, transforms);

  				if (declarator.id.type === 'Identifier') {
  					if (i > 0 && this$1.declarations[i - 1].id.type !== 'Identifier') {
  						code.overwrite(c, declarator.id.start, "var ");
  					}
  				} else {
  					var inline = loopStatement.test(this$1.parent.type);

  					if (i === 0) {
  						code.remove(c, declarator.id.start);
  					} else {
  						code.overwrite(c, declarator.id.start, (";\n" + i0));
  					}

  					var simple =
  						declarator.init.type === 'Identifier' && !declarator.init.rewritten;

  					var name = simple
  						? (declarator.init.alias || declarator.init.name)
  						: declarator.findScope(true).createIdentifier('ref');

  					c = declarator.start;

  					var statementGenerators = [];

  					if (simple) {
  						code.remove(declarator.id.end, declarator.end);
  					} else {
  						statementGenerators.push(function (start, prefix, suffix) {
  							code.prependRight(declarator.id.end, ("var " + name));
  							code.appendLeft(declarator.init.end, ("" + suffix));
  							code.move(declarator.id.end, declarator.end, start);
  						});
  					}

  					var scope = declarator.findScope(false);
  					destructure(
  						code,
  						function (id) { return scope.createIdentifier(id); },
  						function (ref) {
  							var name = ref.name;

  							return scope.resolveName(name);
  					},
  						declarator.id,
  						name,
  						inline,
  						statementGenerators
  					);

  					var prefix = inline ? 'var ' : '';
  					var suffix = inline ? ", " : (";\n" + i0);
  					statementGenerators.forEach(function (fn, j) {
  						if (
  							i === this$1.declarations.length - 1 &&
  							j === statementGenerators.length - 1
  						) {
  							suffix = inline ? '' : ';';
  						}

  						fn(declarator.start, j === 0 ? prefix : '', suffix);
  					});
  				}

  				c = declarator.end;
  				lastDeclaratorIsPattern = declarator.id.type !== 'Identifier';
  			});

  			if (lastDeclaratorIsPattern && this.end > c) {
  				code.overwrite(c, this.end, '', { contentOnly: true });
  			}
  		} else {
  			this.declarations.forEach(function (declarator) {
  				declarator.transpile(code, transforms);
  			});
  		}
  	};

  	return VariableDeclaration;
  }(Node$1));

  var VariableDeclarator = /*@__PURE__*/(function (Node) {
  	function VariableDeclarator () {
  		Node.apply(this, arguments);
  	}

  	if ( Node ) VariableDeclarator.__proto__ = Node;
  	VariableDeclarator.prototype = Object.create( Node && Node.prototype );
  	VariableDeclarator.prototype.constructor = VariableDeclarator;

  	VariableDeclarator.prototype.initialise = function initialise (transforms) {
  		var kind = this.parent.kind;
  		if (kind === 'let' && this.parent.parent.type === 'ForStatement') {
  			kind = 'for.let'; // special case...
  		}

  		this.parent.scope.addDeclaration(this.id, kind);
  		Node.prototype.initialise.call(this, transforms);
  	};

  	VariableDeclarator.prototype.transpile = function transpile (code, transforms) {
  		if (!this.init && transforms.letConst && this.parent.kind !== 'var') {
  			var inLoop = this.findNearest(
  				/Function|^For(In|Of)?Statement|^(?:Do)?WhileStatement/
  			);
  			if (
  				inLoop &&
  				!/Function/.test(inLoop.type) &&
  				!this.isLeftDeclaratorOfLoop()
  			) {
  				code.appendLeft(this.id.end, ' = (void 0)');
  			}
  		}

  		if (this.id) { this.id.transpile(code, transforms); }
  		if (this.init) { this.init.transpile(code, transforms); }
  	};

  	VariableDeclarator.prototype.isLeftDeclaratorOfLoop = function isLeftDeclaratorOfLoop () {
  		return (
  			this.parent &&
  			this.parent.type === 'VariableDeclaration' &&
  			this.parent.parent &&
  			(this.parent.parent.type === 'ForInStatement' ||
  				this.parent.parent.type === 'ForOfStatement') &&
  			this.parent.parent.left &&
  			this.parent.parent.left.declarations[0] === this
  		);
  	};

  	return VariableDeclarator;
  }(Node$1));

  var types$2 = {
  	ArrayExpression: ArrayExpression,
  	ArrowFunctionExpression: ArrowFunctionExpression,
  	AssignmentExpression: AssignmentExpression,
  	AwaitExpression: AwaitExpression,
  	BinaryExpression: BinaryExpression,
  	BreakStatement: BreakStatement,
  	CallExpression: CallExpression,
  	ClassBody: ClassBody,
  	ClassDeclaration: ClassDeclaration,
  	ClassExpression: ClassExpression,
  	ContinueStatement: ContinueStatement,
  	DoWhileStatement: LoopStatement,
  	ExportNamedDeclaration: ExportNamedDeclaration,
  	ExportDefaultDeclaration: ExportDefaultDeclaration,
  	ForStatement: ForStatement,
  	ForInStatement: ForInStatement,
  	ForOfStatement: ForOfStatement,
  	FunctionDeclaration: FunctionDeclaration,
  	FunctionExpression: FunctionExpression,
  	Identifier: Identifier,
  	IfStatement: IfStatement,
  	Import: Import,
  	ImportDeclaration: ImportDeclaration,
  	ImportDefaultSpecifier: ImportDefaultSpecifier,
  	ImportSpecifier: ImportSpecifier,
  	JSXAttribute: JSXAttribute,
  	JSXClosingElement: JSXClosingElement,
  	JSXClosingFragment: JSXClosingFragment,
  	JSXElement: JSXElement,
  	JSXExpressionContainer: JSXExpressionContainer,
  	JSXFragment: JSXFragment,
  	JSXOpeningElement: JSXOpeningElement,
  	JSXOpeningFragment: JSXOpeningFragment,
  	JSXSpreadAttribute: JSXSpreadAttribute,
  	Literal: Literal,
  	MemberExpression: MemberExpression,
  	NewExpression: NewExpression,
  	ObjectExpression: ObjectExpression,
  	Property: Property,
  	ReturnStatement: ReturnStatement,
  	Super: Super,
  	TaggedTemplateExpression: TaggedTemplateExpression,
  	TemplateElement: TemplateElement,
  	TemplateLiteral: TemplateLiteral,
  	ThisExpression: ThisExpression,
  	UpdateExpression: UpdateExpression,
  	VariableDeclaration: VariableDeclaration,
  	VariableDeclarator: VariableDeclarator,
  	WhileStatement: LoopStatement
  };

  var keys = {
  	Program: ['body'],
  	Literal: []
  };

  var statementsWithBlocks = {
  	IfStatement: 'consequent',
  	ForStatement: 'body',
  	ForInStatement: 'body',
  	ForOfStatement: 'body',
  	WhileStatement: 'body',
  	DoWhileStatement: 'body',
  	ArrowFunctionExpression: 'body'
  };

  function wrap$1(raw, parent) {
  	if (!raw) { return; }

  	if ('length' in raw) {
  		var i = raw.length;
  		while (i--) { wrap$1(raw[i], parent); }
  		return;
  	}

  	// with e.g. shorthand properties, key and value are
  	// the same node. We don't want to wrap an object twice
  	if (raw.__wrapped) { return; }
  	raw.__wrapped = true;

  	if (!keys[raw.type]) {
  		keys[raw.type] = Object.keys(raw).filter(
  			function (key) { return typeof raw[key] === 'object'; }
  		);
  	}

  	// special case – body-less if/for/while statements. TODO others?
  	var bodyType = statementsWithBlocks[raw.type];
  	if (bodyType && raw[bodyType].type !== 'BlockStatement') {
  		var expression = raw[bodyType];

  		// create a synthetic block statement, otherwise all hell
  		// breaks loose when it comes to block scoping
  		raw[bodyType] = {
  			start: expression.start,
  			end: expression.end,
  			type: 'BlockStatement',
  			body: [expression],
  			synthetic: true
  		};
  	}

  	raw.parent = parent;
  	raw.program = parent.program || parent;
  	raw.depth = parent.depth + 1;
  	raw.keys = keys[raw.type];
  	raw.indentation = undefined;

  	for (var i$1 = 0, list = keys[raw.type]; i$1 < list.length; i$1 += 1) {
  		var key = list[i$1];

  		wrap$1(raw[key], raw);
  	}

  	raw.program.magicString.addSourcemapLocation(raw.start);
  	raw.program.magicString.addSourcemapLocation(raw.end);

  	var type =
  		(raw.type === 'BlockStatement' ? BlockStatement : types$2[raw.type]) || Node$1;
  	raw.__proto__ = type.prototype;
  }

  function Program(source, ast, transforms, options) {
  	this.type = 'Root';

  	// options
  	this.jsx = options.jsx || 'React.createElement';
  	this.jsxFragment = options.jsxFragment || 'React.Fragment';
  	this.options = options;

  	this.source = source;
  	this.magicString = new MagicString(source);

  	this.ast = ast;
  	this.depth = 0;

  	wrap$1((this.body = ast), this);
  	this.body.__proto__ = BlockStatement.prototype;

  	this.templateLiteralQuasis = Object.create(null);
  	for (var i = 0; i < this.body.body.length; ++i) {
  		if (!this.body.body[i].directive) {
  			this.prependAt = this.body.body[i].start;
  			break;
  		}
  	}
  	this.objectWithoutPropertiesHelper = null;

  	this.indentExclusionElements = [];
  	this.body.initialise(transforms);

  	this.indentExclusions = Object.create(null);
  	for (var i$2 = 0, list = this.indentExclusionElements; i$2 < list.length; i$2 += 1) {
  		var node = list[i$2];

  		for (var i$1 = node.start; i$1 < node.end; i$1 += 1) {
  			this.indentExclusions[i$1] = true;
  		}
  	}

  	this.body.transpile(this.magicString, transforms);
  }

  Program.prototype = {
  	export: function export$1(options) {
  		if ( options === void 0 ) { options = {}; }

  		return {
  			code: this.magicString.toString(),
  			map: this.magicString.generateMap({
  				file: options.file,
  				source: options.source,
  				includeContent: options.includeContent !== false
  			})
  		};
  	},

  	findNearest: function findNearest() {
  		return null;
  	},

  	findScope: function findScope() {
  		return null;
  	},

  	getObjectWithoutPropertiesHelper: function getObjectWithoutPropertiesHelper(code) {
  		if (!this.objectWithoutPropertiesHelper) {
  			this.objectWithoutPropertiesHelper = this.body.scope.createIdentifier('objectWithoutProperties');
  			code.prependLeft(this.prependAt, "function " + (this.objectWithoutPropertiesHelper) + " (obj, exclude) { " +
  				"var target = {}; for (var k in obj) " +
  				"if (Object.prototype.hasOwnProperty.call(obj, k) && exclude.indexOf(k) === -1) " +
  				"target[k] = obj[k]; return target; }\n"
  			);
  		}
  		return this.objectWithoutPropertiesHelper;
  	}
  };

  var matrix = {
  	chrome: {
  		    48: 610719,
  		    49: 652287,
  		    50: 783359,
  		    51: 783359,
  		    52: 1045503,
  		    53: 1045503,
  		    54: 1045503,
  		    55: 3142655,
  		    56: 3142655,
  		    57: 3142655,
  		    58: 4191231,
  		    59: 4191231,
  		    60: 8385535,
  		    61: 8385535,
  		    62: 8385535,
  		    63: 8385535,
  		    64: 8385535,
  		    65: 8385535,
  		    66: 8385535,
  		    67: 8385535,
  		    68: 8385535,
  		    69: 8385535,
  		    70: 8385535,
  		    71: 8385535
  	},
  	firefox: {
  		    43: 643515,
  		    44: 643515,
  		    45: 643519,
  		    46: 774591,
  		    47: 774655,
  		    48: 774655,
  		    49: 774655,
  		    50: 774655,
  		    51: 775167,
  		    52: 4191231,
  		    53: 4191231,
  		    54: 4191231,
  		    55: 8385535,
  		    56: 8385535,
  		    57: 8385535,
  		    58: 8385535,
  		    59: 8385535,
  		    60: 8385535,
  		    61: 8385535,
  		    62: 8385535,
  		    63: 8385535,
  		    64: 8385535
  	},
  	safari: {
  		     8: 524297,
  		     9: 594141,
  		    10: 1831935,
  		'10.1': 4191231,
  		    11: 4191231,
  		'11.1': 8385535,
  		    12: 8385535
  	},
  	ie: {
  		     8: 0,
  		     9: 524289,
  		    10: 524289,
  		    11: 524289 // no let/const in for loops
  	},
  	edge: {
  		    12: 610459,
  		    13: 774559,
  		    14: 2085887,
  		    15: 4183039,
  		    16: 4183039,
  		    17: 4183039,
  		    18: 4183039,
  		    19: 4183039
  	},
  	node: {
  		'0.10': 524289,
  		'0.12': 524417,
  		     4: 594335,
  		     5: 594335,
  		     6: 783359,
  		     8: 4191231,
  		 '8.3': 8385535,
  		 '8.7': 8385535,
  		'8.10': 8385535
  	}
  };

  var features = [
  	'getterSetter',
  	'arrow',
  	'classes',
  	'computedProperty',
  	'conciseMethodProperty',
  	'defaultParameter',
  	'destructuring',
  	'forOf',
  	'generator',
  	'letConst',
  	'moduleExport',
  	'moduleImport',
  	'numericLiteral',
  	'parameterDestructuring',
  	'spreadRest',
  	'stickyRegExp',
  	'templateString',
  	'unicodeRegExp',

  	// ES2016
  	'exponentiation',

  	// additional transforms, not from
  	// https://featuretests.io
  	'reservedProperties',

  	'trailingFunctionCommas',
  	'asyncAwait',
  	'objectRestSpread'
  ];

  var parser$1 = Parser.extend(acornDynamicImport, acornJsx());

  var dangerousTransforms = ['dangerousTaggedTemplateString', 'dangerousForOf'];

  function target(target) {
  	var targets = Object.keys(target);
  	var bitmask = targets.length
  		? 8388607
  		: 524289;

  	Object.keys(target).forEach(function (environment) {
  		var versions = matrix[environment];
  		if (!versions)
  			{ throw new Error(
  				("Unknown environment '" + environment + "'. Please raise an issue at https://github.com/bublejs/buble/issues")
  			); }

  		var targetVersion = target[environment];
  		if (!(targetVersion in versions))
  			{ throw new Error(
  				("Support data exists for the following versions of " + environment + ": " + (Object.keys(
  					versions
  				).join(
  					', '
  				)) + ". Please raise an issue at https://github.com/bublejs/buble/issues")
  			); }
  		var support = versions[targetVersion];

  		bitmask &= support;
  	});

  	var transforms = Object.create(null);
  	features.forEach(function (name, i) {
  		transforms[name] = !(bitmask & (1 << i));
  	});

  	dangerousTransforms.forEach(function (name) {
  		transforms[name] = false;
  	});

  	return transforms;
  }

  function transform(source, options) {
  	if ( options === void 0 ) { options = {}; }

  	var ast;
  	var jsx = null;

  	try {
  		ast = parser$1.parse(source, {
  			ecmaVersion: 10,
  			preserveParens: true,
  			sourceType: 'module',
  			allowAwaitOutsideFunction: true,
  			allowReturnOutsideFunction: true,
  			allowHashBang: true,
  			onComment: function (block, text) {
  				if (!jsx) {
  					var match = /@jsx\s+([^\s]+)/.exec(text);
  					if (match) { jsx = match[1]; }
  				}
  			}
  		});
  		options.jsx = jsx || options.jsx;
  	} catch (err) {
  		err.snippet = getSnippet(source, err.loc);
  		err.toString = function () { return ((err.name) + ": " + (err.message) + "\n" + (err.snippet)); };
  		throw err;
  	}

  	var transforms = target(options.target || {});
  	Object.keys(options.transforms || {}).forEach(function (name) {
  		if (name === 'modules') {
  			if (!('moduleImport' in options.transforms))
  				{ transforms.moduleImport = options.transforms.modules; }
  			if (!('moduleExport' in options.transforms))
  				{ transforms.moduleExport = options.transforms.modules; }
  			return;
  		}

  		if (!(name in transforms)) { throw new Error(("Unknown transform '" + name + "'")); }
  		transforms[name] = options.transforms[name];
  	});
  	if (options.objectAssign === true) { options.objectAssign = 'Object.assign'; }
  	return new Program(source, ast, transforms, options).export(options);
  }

  function testES6() {
  	try {
  		new Function("(a = 0) => a; class X{}");
  		return true;
  	} catch (e) {
  		return false;
  	}
  }

  var ES6 = testES6();

  function transpileES6(code) {
  	return ES6 ? code : transform(code).code;
  }

  var IMPORT_RX = /^\s*import\s+(\S+)\s+from\s+(?:(\"[^"]+\")|(\'[^']+\')|([^"'][^;\s]*));?$/mg;
  var EXPORT_RX = /^\s*export\s+default\s+/m;

  function createScript(code, name) {
  	if (!name) { name = 'QuteLambda'; }
  	var deps = {};
  	var hasDeps = false;
  	code = code.replace(IMPORT_RX, function(m, p1, p2, p3, p4) {
  		var path = p2 || p3 || p4;

  		if (path) {
  			hasDeps = true;
  			deps[p1] = path;
  		}

  		return m.replace('import ', '//import ');
  	});
  	var hasExport = false;
  	code = code.replace(EXPORT_RX, function(m) {
  		hasExport = true;
  		return "var __DEFAULT_EXPORT__ = ";
  	});
  	code = new Compiler().transpile(code, {
  		removeNewLines: true,
  		// apply buble if needed
  		js: transpileES6,
  	});

  	if (hasExport) { code += '\nreturn __DEFAULT_EXPORT__;\n'; }
  	// for now script deps are expected to be declared above the script - otherwise compiling will fail
  	var comp = (new Function(code))();

  	var script = new Script();
  	script.name = comp ? name || capitalizeFirst(kebabToCamel(comp.prototype.$tag)) : null;
  	script.code = code;
  	script.deps = deps;
  	script.comp = comp; // exported component type

  	if (hasDeps) {
  		console.warn('Imports are ignored in dev version!');
  	}

  	return script;
  }

  function loadScript(scriptEl, wnd) {
  	return createScript(scriptEl.textContent, scriptEl.getAttribute('name')).load(wnd);
  }

  function load(wnd) {
  	var scripts = (wnd ? wnd.document : window$1.document).querySelectorAll('script[type="text/jsq"]');
  	for (var i=0,l=scripts.length; i<l; i++) {
  		loadScript(scripts[i], wnd);
  	}
  }


  function Script() {
  	this.name = null;
  	this.code = null;
  	this.comp = null;
  	this.deps = null;

  	this.load = function(wnd) {
  		if (this.name) { window$1__default[this.name] = this.comp; }
  		return this;
  	};

  /*
  	this.resolve = function(path) {
  		if (!this.file) return null;
  		var parts = this.file.split('/').pop();
  		path.split('/').forEach(function(part) {
  			if (part === '..') {
  				parts.pop();
  			} else if (part !== '.') {
  				parts.push(part);
  			}
  		});
  		return parts.join('/');
  	}
  */

  }

  Script.create = createScript;
  Script.load = loadScript;
  Script.load = load;

  Qute.Compiler = Compiler;
  Qute.compile = function(text, symbols) {
  	return new Compiler().compileFn(text, symbols);
  };

  Qute.css('x-tag { display:none; }\n');

  function loadXTag(text) {
  	new Compiler().loadXTags(text, function(xtagName, xtagFn, isCompiled) {
  		Qute.register(xtagName, xtagFn, isCompiled);
  	});
  }
  // load templates
  Qute.load = function(textOrId) {
  	if (!textOrId) {
  		var xtags = window$1.document.getElementsByTagName('x-tag');
  	    for (var i=0,l=xtags.length; i<l; i++) {
  	    	loadXTag(xtags[i].innerHTML);
  	    }
  	} else {
  		loadXTag(textOrId[0] === '#' ? window$1.document.getElementById(textOrId.substring(1)).textContent : textOrId);
  	}
  };

  Qute.transpile = function(source) {
  	return new Compiler().transpile(source, {
  		removeNewLines: true,
  		js: transpileES6,
  	});
  };

  Qute.Script = Script;
  Qute.loadScripts = function() {
  	Script.load();
  };

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
      obj[type+fn] = function(){ obj['e'+type+fn]( window$1__default.event ); };
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
    if (typeof window$1__default !== 'undefined') {
      this.location = window$1__default.location;
      this.history = window$1__default.history;
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
        on(window$1__default, 'popstate', this.checkUrl);
      } else {
        on(window$1__default, 'hashchange', this.checkUrl);
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
          this.history.replaceState({}, window$1.document.title, this.root + this.fragment);
        }

      }

      if (!this.options.silent) { return this.loadUrl(); }
    },

    // Disable Backbone.history, perhaps temporarily. Not useful in a real app,
    // but possibly useful for unit testing Routers.
    stop: function() {
      off(window$1__default, 'popstate', this.checkUrl);
      off(window$1__default, 'hashchange', this.checkUrl);
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
        this.history[options.replace ? 'replaceState' : 'pushState']({}, window$1.document.title, url);

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
  			window$1__default.removeEventListener('load', loadCb);
  		};
  		window$1__default.addEventListener('load', loadCb);
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

  /*
  @see https://tympanus.net/codrops/2013/06/25/nifty-modal-window-effects/ for modal effects
  @see https://davidwalsh.name/css-vertical-center for vertical centering using translate
  */

  function toggleScroll(enable) {
  	var body = window$1.document.body;
  	if (enable) {
          Object.assign(body.style, {overflow: 'initial', height: 'initial'});
  	} else {
          Object.assign(body.style, {overflow: 'hidden', height: '100vh'});
  	}
  }

  function getFocusableElements(root) {
  	return (root || window$1.document).querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
  }

  function createModal(id, content, effect) {
  	var container = window$1.document.createElement('DIV');
  	container.id = id;
  	var modal = window$1.document.createElement('DIV');
  	modal.className = effect ? 'md-modal md-effect-'+effect : 'md-modal';
  	modal.tabIndex = -1;
  	var contentEl = window$1.document.createElement('DIV');
  	contentEl.className = 'md-content';
  	modal.appendChild(contentEl);
  	var overlay = window$1.document.createElement('DIV');
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
  		this.activeElement = window$1.document.activeElement; // save the active element before opening
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
  				var toFocus, focus = window$1.document.activeElement;
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
  var index = Qute("modal", {
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
  	var left=0, top=0, right = window$1__default.innerWidth, bottom = window$1__default.innerHeight;
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
  	var el = window$1.document.createElement('DIV');
  	el.className = 'qute-popup';
  	var style = el.style;
  	style.visibility = 'hidden';
  	style.position = 'absolute';
  	style.overflow = 'hidden'; // needed by some effects (e.g. slide in)

  	var contentEl = window$1.document.createElement('DIV');
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


  		style.left = (out.left + window$1__default.pageXOffset)+'px';
  		style.top = (out.top + window$1__default.pageYOffset)+'px';
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
  				window$1__default.requestAnimationFrame(function() {
  					self.update(anchor);
  					updating = false;
  				});
  				updating = true;
  			}
  		};
  		var ofs = [],
  			body = window$1.document.body,
  			parent = anchor.parentNode;
  		while (parent && parent !== body) {
  			if (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth) {
  				ofs.push(parent);
  				parent.addEventListener('scroll', updateFn);
  			}
  			parent = parent.parentNode;
  		}
  		window$1__default.addEventListener('scroll', updateFn);
  		window$1__default.addEventListener('resize', updateFn);
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

  			window$1__default.setTimeout(function() {
  				window$1.document.addEventListener('click', closeOnClick);
  			}, 0);
  		}


  		this.cleanup = function() {
  			if (closeOnClick) {
  				window$1.document.removeEventListener('click', closeOnClick);
  			}
  			window$1__default.removeEventListener('resize', updateFn);
  			window$1__default.removeEventListener('scroll', updateFn);
  			for (var i=0,l=ofs.length; i<l; i++) {
  				ofs[i].removeEventListener('scroll', updateFn);
  			}
  		};

  		this.onOpen && this.onOpen(this);
  		// mount the popup
  		window$1.document.body.appendChild(this.el);
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
  var index$1 = Qute('popup', {
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
  	var el = window$1.document.createElement('DIV');

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

  	var div = window$1.document.createElement('DIV');
  	updateStyle(div, color, size);
  	div.className = 'bounce1';
  	el.appendChild(div);

  	div = window$1.document.createElement('DIV');
  	updateStyle(div, color, size);
  	div.className = 'bounce2';
  	el.appendChild(div);

  	div = window$1.document.createElement('DIV');
      updateStyle(div, color, size);
  	div.className = 'bounce3';
  	el.appendChild(div);

  	return el;
  });

  function liValueDirective(xattrs, valueExpr) {
      return function(el) {
          el.setAttribute('data-value', this.eval(valueExpr) || '');
      }
  }

  function groupDirective(xattrs, valueExpr) {
      var rendering = this, value, boundProp = (typeof valueExpr === 'string') ? valueExpr : null;

      if (boundProp && !rendering.vm) {
          // current component not a ViewModel - throw an error
          throw new Error('q:value bound to "'+valueExpr+'" property but the current component is not a ViewModel component!');
      }

      function setValue(el, newValue) {
          if (value !== newValue) {
              var children = el.children;
              for (var i=0,l=children.length; i<l; i++) {
                  var child = children[i];
                  if (child.tagName === 'LI') {
                      var liVal = child.getAttribute('data-value');
                      if (liVal === newValue) {
                          child.classList.add('active');
                      } else {
                          child.classList.remove('active');
                      }
                  }
              }
          }
      }

      function evalValueExpr() {
          return boundProp ? rendering.vm[boundProp] : rendering.eval(valueExpr);
      }

      return function(el) {
          el.addEventListener('click', function(e) {
              var li = e.target.closest('li');
              if (li) {
                  var liVal = li.getAttribute('data-value');
                  if (liVal && !li.classList.contains('active')) {
                      e.preventDefault();
                      e.stopPropagation();
                      setValue(el, liVal);
                      window$1__default.setTimeout(function() {
                          if (boundProp) { rendering.vm[boundProp] = liVal; }
                          el.dispatchEvent(new window$1__default.CustomEvent("change",
                              {bubbles: true, detail: liVal }));
                      }, 0);
                  }
              }
          });
          rendering.up(function() {
              setValue(el, evalValueExpr());
          });
          setValue(el, evalValueExpr());
      }
  }


  Qute.registerDirective('li', 'value', liValueDirective);
  Qute.registerDirective('ul', 'model', groupDirective);
  Qute.registerDirective('ol', 'model', groupDirective);

  // date constraints not yet polyfilled


  var EMAIL_RX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
  var URL_CHECKER;


  var TYPE_ERRORS = {
  	email: 'Please enter an email address.',
  	url: 'Please enter an URL.',
  	text: 'Bad Input.'
  };
  var REQUIRE_ERRORS = {
  	text: 'Please fill out this field.',
  	checkbox: 'Please check this box if you want to proceed.',
  	radio: 'Please select one of these options.',
      file: 'Please select a file.',
      select: 'Please select an item in the list.'
  };


  var TYPES = {
  	email: function(el) {
  		var val = el.value.trim();
  		if (!val) { return ''; }
  		if (EMAIL_RX.test(val)) { return val; }
  		// return undefined if not an email
  	},
  	url: function(el) {
  		var val = el.value.trim();
  		if (!val) { return ''; }
  		if(!URL_CHECKER) {
  			URL_CHECKER = document.createElement('a');
  		}
  		URL_CHECKER.href = val;
  		if (URL_CHECKER.href === val || URL_CHECKER.href === val+'/') { return val; }
  	},
  	number: function(el) {
  		var val = el.value.trim();
  		if (!val) { return ''; }
  		return Number(val);
  	},
  	checkbox: function(el) {
  		return !!el.checked;
  	},
  	text: function(el) {
  		return el.value.trim();
  	}
  };

  function createValidator(el) {
  	var validator = new Validator(el.type);
  	validator.getValue = TYPES[el.type] || TYPES.text;
  	validator.required = !!el.getAttribute('required');
  	var val = el.getAttribute('pattern');
  	if (val) {
  		validator.pattern = new RegExp('^'+val+'$');
  	}
  	val = el.getAttribute('minlength');
  	if (val) {
  		var n = parseInt(val);
  		if (!isNaN(n)) {
  			validator.minlen = n;
  		}
  	}
  	val = el.getAttribute('maxlength');
  	if (val) {
  		var n = parseInt(val);
  		if (!isNaN(n)) {
  			validator.maxlen = n;
  		}
  	}
  	val = el.getAttribute('min');
  	if (val) {
  		var n = parseInt(val);
  		if (!isNaN(n)) {
  			validator.min = n;
  		}
  	}
  	val = el.getAttribute('max');
  	if (val) {
  		var n = parseInt(val);
  		if (!isNaN(n)) {
  			validator.max = n;
  		}
  	}
  	/*
  	val = el.getAttribute('step');
  	if (val) {
  		var n = parseFloat(val);
  		if (!isNaN(n)) {
  			validator.step = n;
  		}
  	}
  	*/
  	return validator;
  }

  function createValidity() {
  	return {
  		badInput: false,
  		customError: false,
  		patternMismatch: false,
  		rangeOverflow: false,
  		rangeUnderflow: false,
  		stepMismatch: false,
  		tooLong: false,
  		tooShort: false,
  		typeMismatch: false,
  		valueMissing: false,
  		valid: true
  	}
  }

  function Validator(type) {
  	this.type = type;
  	this.required = null;
  	this.pattern = null;
  	this.maxlen = null;
  	this.minlen = null;
  }

  Validator.prototype = {
  	validate: function(el) {
  		var validity = createValidity();
  		el.validity = validity;
  		var msg = this._validate(validity);
  		if (!validity.valid) {
  			el.validationMessage = msg || TYPE_ERRORS.text;
  		} else {
  			el.validationMessage = '';
  		}
  		return validity.valid;
  	},
  	_validate: function(validity) {
  		var val = this.getValue(el);
  		if (val === undefined) { // cannot convert to type
  			validity.typeMismatch = true;
  			validity.valid = false;
  			return TYPE_ERRORS[this.type] || TYPE_ERRORS.text;
  		}
  		if (this.required && !val) {
  			validity.valueMissing = true;
  			validity.valid = false;
  			return REQUIRE_ERRORS[this.type] || REQUIRE_ERRORS.text;
  		}
  		var strVal = String(val);
  		if (this.pattern) {
  			if (!this.pattern.test(strVal)) {
  				validity.patternMismatch = true;
  				validity.valid = false;
  				return 'Please match the requested format.';
  			}
  		}
  		if (this.minLen != null) {
  			if (strVal.length < this.minLen) {
  				validity.tooShort = true;
  				validity.valid = false;
  				return 'Please enter a longer text. Minimum length is '+this.minLen+'.';
  			}
  		}
  		if (this.maxLen != null) {
  			if (strVal.length > this.maxLen) {
  				validity.tooLong = true;
  				validity.valid = false;
  				return 'Please enter a shorter text. Maximum length is '+this.maxLen+'.';
  			}
  		}

  		if (this.min != null) {
  			if (this.type === 'number') {
  				if (val < this.min) {
  					validity.rangeUnderflow = true;
  					validity.valid = false;
  					return 'Please enter a number greater or equal than '+this.min+'.';
  				}
  			}
  		}
  		if (this.max != null) {
  			if (this.type === 'number') {
  				if (val > this.max) {
  					validity.rangeOverflow = true;
  					validity.valid = false;
  					return 'Please enter a number less or equal than '+this.max+'.';
  				}
  			}
  		}
  		// TODO: dates and step not checked
  	}
  };


  // ---------------- polyfills -----------------

  function canValidate(el) {
  	var type = el.type;
  	return type !== 'hidden' && type !== 'button' && type !== 'reset';
  }

  function _setCustomValidity(msg) {
  	if (this.validity) {
  		this.validity.customError = true;
  		this.validity.valid = false;
  		this.validationMessage = msg;
  	}
  }

  function _checkValidity() {
  	var validator = this.__qute_validator;
  	if (validator) {
  		return validator.validate(this);
  	}

  	return true;
  }

  function polyfillFormCheckValidity(form) {
  	if (!form.checkValidity) {
  		form.checkValidity = function() {
  			var elements = this.elements;
  			for (var i=0,l=elements.length; i<l; i++) {
  				var el = elemrnts[i];
  				if (!el.checkValidity()) { return false; }
  			}
  			return true;
  		};
  	}
  }

  function polyfillFormControl(ctrl) {
  	if (el.checkValidity) { return; }
  	Object.defineProperty(el, 'willValidate', canValidate(el) ? {
  		get: function get() {
  			return !this.disabled;
  		}
  	} : { value: false });
  	var validator = createValidator(el);
  	el.__qute_validator = validator;
  	el.checkValidity = _checkValidity;
  	el.setCustomValidity = _setCustomValidity;
  	el.validationMessage = '';
  	validator.validate(el);
  }

  function reportFormValidity(form, config, asyncRun) {
  	var update = [];
  	var r = checkFormValidity(form, config, update);
  	// TODO async?
  	if (update.length) {
  		var _report = function() {
  			update.forEach(function(inputEl) {
  				reportValidationError(inputEl, config);
  			});
  		};
  		if (asyncRun) {
  			window.setTimeout(_report, 0);
  		} else {
  			_report();
  		}
  	}
  	return r;
  }

  function reportInputValidity(el, config, asyncRun) {
  	var inputEl = checkInputValidity(el);
  	if (inputEl) {
  		if (asyncRun) {
  			window.setTimeout(function() {
  				reportValidationError(inputEl, config);
  			}, 0);
  		} else {
  			reportValidationError(inputEl, config);
  		}
  	}
  	return inputEl;
  }

  function checkFormValidity(form, config, update) {
  	var elements = form.elements, isValid = true;
  	for (var i=0,l=elements.length; i<l; i++) {
  		var el = elements[i];
  		if (el.willValidate) {
  			el = checkInputValidity(el);
  			if (el) {
  				update && update.push(el);
  				if (!el.validity.valid) { isValid = false; }
  			}
  		}
  	}
  	return isValid;
  }

  /*
   * Return the input element if error sgtate should be updated (either input has error or error was fixed),
   * otherwise return null.
   */
  function checkInputValidity(el, config) {
  	var r = null;
  	el.__qute_validator && el.setCustomValidity('');
  	if (!el.checkValidity()) {
  		r = el;
  	} else if (el.__qute_validator) { // custom validator
  		var err = el.__qute_validator(el);
  		if (err) {
  			el.setCustomValidity(err);
  			r = el;
  		} else {
  			el.setCustomValidity('');
  		}
  	}
  	if (el.__qute_vmsg && !el.validationMessage) {
  		r = el; // error was fixed
  	}
  	el.__qute_vmsg = el.validationMessage;
  	return r;
  }

  function _errorKey(el) {
  	var validity = el.validity;
  	if (validity.customError || validity.valid) { return null; }

  	if (validity.valueMissing) {
  		return 'required';
  	} else if (validity.badInput || validity.typeMismatch) {
  		return 'type';
  	} else if (validity.patternMismatch) {
  		return 'pattern';
  	} else if (validity.tooLong) {
  		return 'maxlength';
  	} else if (validity.tooShort) {
  		return 'minlength';
  	} else if (validity.rangeOverflow) {
  		return 'max';
  	} else if (validity.rangeUnderflow) {
  		return 'min';
  	} else if (validity.stepMismatch) {
  		return 'step';
  	}
  	return null;
  }

  // get the actual validation message as defined by user
  function getValidationMessage(el, config) {
  	if (!el.validationMessage || !config.messages) {
  		return el.validationMessage;
  	}
  	var msg, key = _errorKey(el);
  	if (key) {
  		var msgs = config.messages[el.name];
  		if (msgs) {
  			if (typeof msgs === 'string') {
  				msg = msgs;
  			} else {
  				msg = msgs[key] || msgs['error'];
  			}
  		}
  		if (!msg) {
  			msgs = config.messages['*'];
  			if (msgs) {
  				if (typeof msgs === 'string') {
  					msg = msgs;
  				} else {
  					msg = msgs[key] || msgs['error'];
  				}
  			}
  		}
  	}
  	return msg || el.validationMessage;
  }

  function setupValidation(form, config) {
  	if (!form.checkValidity) {
  		polyfillFormCheckValidity(form);
  	}
  	var elements = form.elements;
  	for (var i=0,l=elements.length; i<l; i++) {
  		var el = elements[i];
  		if (!el.checkValidity) {
  			polyfillFormControl();
  		}
  		if (el.willValidate) {
  			if (config.onblur) {
  				el.addEventListener('blur', function(e) {
  					reportInputValidity(e.target, config);
  				});
  			}
  			el.addEventListener('change', function(e) {
  				reportInputValidity(e.target, config);
  			});
  		}
  	}
  }

  function reportValidationError(el, config) {
  	var msg = getValidationMessage(el, config);
  	if (config.report) {
  		config.report(el, msg);
  	} else {
  		var errorEl = el.form.getElementsByClassName('-q-valid-msg-'+el.name)[0];
  		if (errorEl) {
  			errorEl.textContent = msg;
  			if (el.validity.valid) { // clear any previous error
  				el.classList.remove('invalid');
  				errorEl.style.display = 'none';
  			} else { // display the current error
  				el.classList.add('invalid');
  				errorEl.style.display = '';
  			}
  		} else {
  			console.warn('No validation message placeholder defined for '+el.name+'. Insert an element: <span|div q:validation-message="'+el.name+'">');
  		}
  	}
  }

  function formValidateDirective(xattrs, valueExpr, el) {
  	var config = Object.assign({
  		onblur: true,
  		report: null,
  		messages: null
  	}, this.eval(valueExpr) || {});
  	if (el.tagName !== 'FORM') {
  		throw new Error('Cannot use q:validate: Target element is not a DOM form element!');
  	}
  	el.addEventListener('submit', function(e) {
  		if (!reportFormValidity(this, config, true)) {
  			e.stopImmediatePropagation();
  			e.preventDefault();
  		}
  	});
  	el.noValidate = true;
  	return function(el) {
  		setupValidation(el, config);
  	}
  }

  function validationMessageDirective(xattrs, valueExpr, el) {
  	var inputName = this.eval(valueExpr);
  	if (!inputName) { throw new Error('q:validation-message must take as value the related input name'); }
  	return function(el) {
  		el.className = (el.className ? el.className + ' -q-valid-msg-' : '-q-valid-msg-')+inputName;
  	}
  }

  // custom validation
  function inputValidationDirective(xattrs, valueExpr, el) {
  	el.__qute_validator = this.eval(valueExpr);
  }

  function inputValueDirective(xattrs, valueExpr) {
      var rendering = this, boundProp = (typeof valueExpr === 'string') ? valueExpr : null;

      if (boundProp && !rendering.vm) {
          // current component not a ViewModel - throw an error
          throw new Error('q:value bound to "'+valueExpr+'" property but the current component is not a ViewModel component!');
      }

      function getInputValue(el) {
          var type = el.type;
          if (type === 'checkbox') {
              return !!el.checked;
          } else {
              // in case of a radio the clicked radio should be
              // the selected one so it is correct to return the value
              return el.value;
          }
      }

      function setInputValue(el, value) {
          var type = el.type;
          if (type === 'checkbox') {
              el.checked = !!value;
          } else if (type === 'radio') {
              el.checked = el.value === value;
          } else if (el.value !== value) {
              el.value = value;
          }
      }

      function updateValue(el) {
          var newValue = boundProp ? rendering.vm[boundProp] : rendering.eval(valueExpr);
         	setInputValue(el, newValue);
      }

      return function(el) {
          if (boundProp) {
              // then automatically update prop when changed
              el.addEventListener('change', function(e) {
                  rendering.vm[boundProp] = getInputValue(el);
              });
          }
          //TODO we may use an update count to avoid updating if not necessarily
          rendering.up(function() { updateValue(el); });
          updateValue(el);
      }

  }

  function selectValueDirective(xattrs, valueExpr) {
      var rendering = this, value, boundProp = (typeof valueExpr === 'string') ? valueExpr : null;

      if (boundProp && !rendering.vm) {
          // current component not a ViewModel - throw an error
          throw new Error('q:value bound to "'+valueExpr+'" property but the current component is not a ViewModel component!');
      }

      //TODO impl multiple selection
      function updateSelectedValue(el) {
          var newValue = boundProp ? rendering.vm[boundProp] : rendering.eval(valueExpr);
          if (newValue !== value) {
              var opts = el.options;
              for (var i=0,l=opts.length; i<l; i++) {
                  var opt = opts[i];
                  if (opt.value === newValue) {
                      opt.selected = true;
                  } else if (opt.selected) {
                      opt.selected = false;
                  }
              }
          }
      }

      return function(el) {
          if (boundProp) {
              // then automatically update prop when changed
              el.addEventListener('change', function(e) {
                  rendering.vm[boundProp] = el.selectedIndex > -1 ? el.options[el.selectedIndex].value : undefined;
              });
          }
          rendering.up(function() { updateSelectedValue(el); });
          updateSelectedValue(el);
      }
  }

  // impl a q:model that can be used by components implementing custom form controls
  // the requirement for the component using this directive is to provide
  // a `value` property and to trigger a `change` event when the value changes

  function controlModelDirective(xattrs, valueExpr, compOrEl) {
      var rendering = this, boundProp = (typeof valueExpr === 'string') ? valueExpr : null;

      if ( !(Qute.isVM(compOrEl) && ("value" in compOrEl)) ) {
          throw new Error('Only ViewModel components with a "value" property can use q:model');
      }

      if (boundProp && !rendering.vm) {
          // current component not a ViewModel - throw an error
          throw new Error('q:model bound to "'+valueExpr+'" property but the current component is not a ViewModel component!');
      }

      function updateValue() {
          var newValue = boundProp ? rendering.vm[boundProp] : rendering.eval(valueExpr);
          compOrEl.value = newValue;
      }

      // we need to update the value now
      updateValue();
      rendering.up(function() { updateValue(); });

      return function(el) {
          if (boundProp) {
              // then automatically update prop when changed
              console.log('!!!!!!!!!!!', el);
              el.addEventListener('change', function(e) {
                  console.log('@@@@@@@@@@@@@@@@@changed');
                  rendering.vm[boundProp] = compOrEl.value;
              });
          }
      }

  }

  Qute.registerDirective('form', 'validate', formValidateDirective);
  Qute.registerDirective('input', 'model', inputValueDirective);
  Qute.registerDirective('select', 'model', selectValueDirective);
  Qute.registerDirective('textarea', 'model', inputValueDirective);
  Qute.registerDirective('input', 'validate', inputValidationDirective);
  Qute.registerDirective('textarea', 'validate', inputValidationDirective);
  Qute.registerDirective('select', 'validate', inputValidationDirective);
  Qute.registerDirective('validation-message', validationMessageDirective);

  var FormApi = {
  	// Enable the q:model directive on a custom form control
  	// The control must be implemented as a ViewModel component and must provide a 'value' reactive property.
  	// For bidirectional updates it must also trigger a change event when the control value is changed.
  	registerControl: function(tag) {
  		Qute.registerDirective(tag, 'model', controlModelDirective);
  	}
  };
  //TODO use Qute.registerModule('form', FormApi) which in prod does nothing
  Qute.$.form = FormApi;

  var fnToStr = Function.prototype.toString;

  var constructorRegex = /^\s*class\b/;
  var isES6ClassFn = function isES6ClassFunction(value) {
  	try {
  		var fnStr = fnToStr.call(value);
  		return constructorRegex.test(fnStr);
  	} catch (e) {
  		return false; // not a function
  	}
  };

  var tryFunctionObject = function tryFunctionToStr(value) {
  	try {
  		if (isES6ClassFn(value)) { return false; }
  		fnToStr.call(value);
  		return true;
  	} catch (e) {
  		return false;
  	}
  };
  var toStr = Object.prototype.toString;
  var fnClass = '[object Function]';
  var genClass = '[object GeneratorFunction]';
  var hasToStringTag = typeof Symbol === 'function' && typeof Symbol.toStringTag === 'symbol';

  var isCallable = function isCallable(value) {
  	if (!value) { return false; }
  	if (typeof value !== 'function' && typeof value !== 'object') { return false; }
  	if (typeof value === 'function' && !value.prototype) { return true; }
  	if (hasToStringTag) { return tryFunctionObject(value); }
  	if (isES6ClassFn(value)) { return false; }
  	var strClass = toStr.call(value);
  	return strClass === fnClass || strClass === genClass;
  };

  var toStr$1 = Object.prototype.toString;
  var hasOwnProperty$1 = Object.prototype.hasOwnProperty;

  var forEachArray = function forEachArray(array, iterator, receiver) {
      for (var i = 0, len = array.length; i < len; i++) {
          if (hasOwnProperty$1.call(array, i)) {
              if (receiver == null) {
                  iterator(array[i], i, array);
              } else {
                  iterator.call(receiver, array[i], i, array);
              }
          }
      }
  };

  var forEachString = function forEachString(string, iterator, receiver) {
      for (var i = 0, len = string.length; i < len; i++) {
          // no such thing as a sparse string.
          if (receiver == null) {
              iterator(string.charAt(i), i, string);
          } else {
              iterator.call(receiver, string.charAt(i), i, string);
          }
      }
  };

  var forEachObject = function forEachObject(object, iterator, receiver) {
      for (var k in object) {
          if (hasOwnProperty$1.call(object, k)) {
              if (receiver == null) {
                  iterator(object[k], k, object);
              } else {
                  iterator.call(receiver, object[k], k, object);
              }
          }
      }
  };

  var forEach = function forEach(list, iterator, thisArg) {
      if (!isCallable(iterator)) {
          throw new TypeError('iterator must be a function');
      }

      var receiver;
      if (arguments.length >= 3) {
          receiver = thisArg;
      }

      if (toStr$1.call(list) === '[object Array]') {
          forEachArray(list, iterator, receiver);
      } else if (typeof list === 'string') {
          forEachString(list, iterator, receiver);
      } else {
          forEachObject(list, iterator, receiver);
      }
  };

  var forEach_1 = forEach;

  /* eslint no-invalid-this: 1 */

  var ERROR_MESSAGE = 'Function.prototype.bind called on incompatible ';
  var slice = Array.prototype.slice;
  var toStr$2 = Object.prototype.toString;
  var funcType = '[object Function]';

  var implementation = function bind(that) {
      var target = this;
      if (typeof target !== 'function' || toStr$2.call(target) !== funcType) {
          throw new TypeError(ERROR_MESSAGE + target);
      }
      var args = slice.call(arguments, 1);

      var bound;
      var binder = function () {
          if (this instanceof bound) {
              var result = target.apply(
                  this,
                  args.concat(slice.call(arguments))
              );
              if (Object(result) === result) {
                  return result;
              }
              return this;
          } else {
              return target.apply(
                  that,
                  args.concat(slice.call(arguments))
              );
          }
      };

      var boundLength = Math.max(0, target.length - args.length);
      var boundArgs = [];
      for (var i = 0; i < boundLength; i++) {
          boundArgs.push('$' + i);
      }

      bound = Function('binder', 'return function (' + boundArgs.join(',') + '){ return binder.apply(this,arguments); }')(binder);

      if (target.prototype) {
          var Empty = function Empty() {};
          Empty.prototype = target.prototype;
          bound.prototype = new Empty();
          Empty.prototype = null;
      }

      return bound;
  };

  var functionBind = Function.prototype.bind || implementation;

  var src = functionBind.call(Function.call, Object.prototype.hasOwnProperty);

  var commonjsGlobal$1 = typeof globalThis !== 'undefined' ? globalThis : typeof window !== 'undefined' ? window : typeof global !== 'undefined' ? global : typeof self !== 'undefined' ? self : {};

  /* eslint complexity: [2, 18], max-statements: [2, 33] */
  var shams = function hasSymbols() {
  	if (typeof Symbol !== 'function' || typeof Object.getOwnPropertySymbols !== 'function') { return false; }
  	if (typeof Symbol.iterator === 'symbol') { return true; }

  	var obj = {};
  	var sym = Symbol('test');
  	var symObj = Object(sym);
  	if (typeof sym === 'string') { return false; }

  	if (Object.prototype.toString.call(sym) !== '[object Symbol]') { return false; }
  	if (Object.prototype.toString.call(symObj) !== '[object Symbol]') { return false; }

  	// temp disabled per https://github.com/ljharb/object.assign/issues/17
  	// if (sym instanceof Symbol) { return false; }
  	// temp disabled per https://github.com/WebReflection/get-own-property-symbols/issues/4
  	// if (!(symObj instanceof Symbol)) { return false; }

  	// if (typeof Symbol.prototype.toString !== 'function') { return false; }
  	// if (String(sym) !== Symbol.prototype.toString.call(sym)) { return false; }

  	var symVal = 42;
  	obj[sym] = symVal;
  	for (sym in obj) { return false; } // eslint-disable-line no-restricted-syntax
  	if (typeof Object.keys === 'function' && Object.keys(obj).length !== 0) { return false; }

  	if (typeof Object.getOwnPropertyNames === 'function' && Object.getOwnPropertyNames(obj).length !== 0) { return false; }

  	var syms = Object.getOwnPropertySymbols(obj);
  	if (syms.length !== 1 || syms[0] !== sym) { return false; }

  	if (!Object.prototype.propertyIsEnumerable.call(obj, sym)) { return false; }

  	if (typeof Object.getOwnPropertyDescriptor === 'function') {
  		var descriptor = Object.getOwnPropertyDescriptor(obj, sym);
  		if (descriptor.value !== symVal || descriptor.enumerable !== true) { return false; }
  	}

  	return true;
  };

  var origSymbol = commonjsGlobal$1.Symbol;


  var hasSymbols = function hasNativeSymbols() {
  	if (typeof origSymbol !== 'function') { return false; }
  	if (typeof Symbol !== 'function') { return false; }
  	if (typeof origSymbol('foo') !== 'symbol') { return false; }
  	if (typeof Symbol('bar') !== 'symbol') { return false; }

  	return shams();
  };

  /* globals
  	Atomics,
  	SharedArrayBuffer,
  */

  var undefined$1;

  var $TypeError = TypeError;

  var $gOPD = Object.getOwnPropertyDescriptor;
  if ($gOPD) {
  	try {
  		$gOPD({}, '');
  	} catch (e) {
  		$gOPD = null; // this is IE 8, which has a broken gOPD
  	}
  }

  var throwTypeError = function () { throw new $TypeError(); };
  var ThrowTypeError = $gOPD
  	? (function () {
  		try {
  			// eslint-disable-next-line no-unused-expressions, no-caller, no-restricted-properties
  			arguments.callee; // IE 8 does not throw here
  			return throwTypeError;
  		} catch (calleeThrows) {
  			try {
  				// IE 8 throws on Object.getOwnPropertyDescriptor(arguments, '')
  				return $gOPD(arguments, 'callee').get;
  			} catch (gOPDthrows) {
  				return throwTypeError;
  			}
  		}
  	}())
  	: throwTypeError;

  var hasSymbols$1 = hasSymbols();

  var getProto = Object.getPrototypeOf || function (x) { return x.__proto__; }; // eslint-disable-line no-proto
  var generatorFunction =  undefined$1;
  var asyncFunction =  undefined$1;
  var asyncGenFunction =  undefined$1;

  var TypedArray = typeof Uint8Array === 'undefined' ? undefined$1 : getProto(Uint8Array);

  var INTRINSICS = {
  	'%Array%': Array,
  	'%ArrayBuffer%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer,
  	'%ArrayBufferPrototype%': typeof ArrayBuffer === 'undefined' ? undefined$1 : ArrayBuffer.prototype,
  	'%ArrayIteratorPrototype%': hasSymbols$1 ? getProto([][Symbol.iterator]()) : undefined$1,
  	'%ArrayPrototype%': Array.prototype,
  	'%ArrayProto_entries%': Array.prototype.entries,
  	'%ArrayProto_forEach%': Array.prototype.forEach,
  	'%ArrayProto_keys%': Array.prototype.keys,
  	'%ArrayProto_values%': Array.prototype.values,
  	'%AsyncFromSyncIteratorPrototype%': undefined$1,
  	'%AsyncFunction%': asyncFunction,
  	'%AsyncFunctionPrototype%':  undefined$1,
  	'%AsyncGenerator%':  undefined$1,
  	'%AsyncGeneratorFunction%': asyncGenFunction,
  	'%AsyncGeneratorPrototype%':  undefined$1,
  	'%AsyncIteratorPrototype%':  undefined$1,
  	'%Atomics%': typeof Atomics === 'undefined' ? undefined$1 : Atomics,
  	'%Boolean%': Boolean,
  	'%BooleanPrototype%': Boolean.prototype,
  	'%DataView%': typeof DataView === 'undefined' ? undefined$1 : DataView,
  	'%DataViewPrototype%': typeof DataView === 'undefined' ? undefined$1 : DataView.prototype,
  	'%Date%': Date,
  	'%DatePrototype%': Date.prototype,
  	'%decodeURI%': decodeURI,
  	'%decodeURIComponent%': decodeURIComponent,
  	'%encodeURI%': encodeURI,
  	'%encodeURIComponent%': encodeURIComponent,
  	'%Error%': Error,
  	'%ErrorPrototype%': Error.prototype,
  	'%eval%': eval, // eslint-disable-line no-eval
  	'%EvalError%': EvalError,
  	'%EvalErrorPrototype%': EvalError.prototype,
  	'%Float32Array%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array,
  	'%Float32ArrayPrototype%': typeof Float32Array === 'undefined' ? undefined$1 : Float32Array.prototype,
  	'%Float64Array%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array,
  	'%Float64ArrayPrototype%': typeof Float64Array === 'undefined' ? undefined$1 : Float64Array.prototype,
  	'%Function%': Function,
  	'%FunctionPrototype%': Function.prototype,
  	'%Generator%':  undefined$1,
  	'%GeneratorFunction%': generatorFunction,
  	'%GeneratorPrototype%':  undefined$1,
  	'%Int8Array%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array,
  	'%Int8ArrayPrototype%': typeof Int8Array === 'undefined' ? undefined$1 : Int8Array.prototype,
  	'%Int16Array%': typeof Int16Array === 'undefined' ? undefined$1 : Int16Array,
  	'%Int16ArrayPrototype%': typeof Int16Array === 'undefined' ? undefined$1 : Int8Array.prototype,
  	'%Int32Array%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array,
  	'%Int32ArrayPrototype%': typeof Int32Array === 'undefined' ? undefined$1 : Int32Array.prototype,
  	'%isFinite%': isFinite,
  	'%isNaN%': isNaN,
  	'%IteratorPrototype%': hasSymbols$1 ? getProto(getProto([][Symbol.iterator]())) : undefined$1,
  	'%JSON%': typeof JSON === 'object' ? JSON : undefined$1,
  	'%JSONParse%': typeof JSON === 'object' ? JSON.parse : undefined$1,
  	'%Map%': typeof Map === 'undefined' ? undefined$1 : Map,
  	'%MapIteratorPrototype%': typeof Map === 'undefined' || !hasSymbols$1 ? undefined$1 : getProto(new Map()[Symbol.iterator]()),
  	'%MapPrototype%': typeof Map === 'undefined' ? undefined$1 : Map.prototype,
  	'%Math%': Math,
  	'%Number%': Number,
  	'%NumberPrototype%': Number.prototype,
  	'%Object%': Object,
  	'%ObjectPrototype%': Object.prototype,
  	'%ObjProto_toString%': Object.prototype.toString,
  	'%ObjProto_valueOf%': Object.prototype.valueOf,
  	'%parseFloat%': parseFloat,
  	'%parseInt%': parseInt,
  	'%Promise%': typeof Promise === 'undefined' ? undefined$1 : Promise,
  	'%PromisePrototype%': typeof Promise === 'undefined' ? undefined$1 : Promise.prototype,
  	'%PromiseProto_then%': typeof Promise === 'undefined' ? undefined$1 : Promise.prototype.then,
  	'%Promise_all%': typeof Promise === 'undefined' ? undefined$1 : Promise.all,
  	'%Promise_reject%': typeof Promise === 'undefined' ? undefined$1 : Promise.reject,
  	'%Promise_resolve%': typeof Promise === 'undefined' ? undefined$1 : Promise.resolve,
  	'%Proxy%': typeof Proxy === 'undefined' ? undefined$1 : Proxy,
  	'%RangeError%': RangeError,
  	'%RangeErrorPrototype%': RangeError.prototype,
  	'%ReferenceError%': ReferenceError,
  	'%ReferenceErrorPrototype%': ReferenceError.prototype,
  	'%Reflect%': typeof Reflect === 'undefined' ? undefined$1 : Reflect,
  	'%RegExp%': RegExp,
  	'%RegExpPrototype%': RegExp.prototype,
  	'%Set%': typeof Set === 'undefined' ? undefined$1 : Set,
  	'%SetIteratorPrototype%': typeof Set === 'undefined' || !hasSymbols$1 ? undefined$1 : getProto(new Set()[Symbol.iterator]()),
  	'%SetPrototype%': typeof Set === 'undefined' ? undefined$1 : Set.prototype,
  	'%SharedArrayBuffer%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer,
  	'%SharedArrayBufferPrototype%': typeof SharedArrayBuffer === 'undefined' ? undefined$1 : SharedArrayBuffer.prototype,
  	'%String%': String,
  	'%StringIteratorPrototype%': hasSymbols$1 ? getProto(''[Symbol.iterator]()) : undefined$1,
  	'%StringPrototype%': String.prototype,
  	'%Symbol%': hasSymbols$1 ? Symbol : undefined$1,
  	'%SymbolPrototype%': hasSymbols$1 ? Symbol.prototype : undefined$1,
  	'%SyntaxError%': SyntaxError,
  	'%SyntaxErrorPrototype%': SyntaxError.prototype,
  	'%ThrowTypeError%': ThrowTypeError,
  	'%TypedArray%': TypedArray,
  	'%TypedArrayPrototype%': TypedArray ? TypedArray.prototype : undefined$1,
  	'%TypeError%': $TypeError,
  	'%TypeErrorPrototype%': $TypeError.prototype,
  	'%Uint8Array%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array,
  	'%Uint8ArrayPrototype%': typeof Uint8Array === 'undefined' ? undefined$1 : Uint8Array.prototype,
  	'%Uint8ClampedArray%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray,
  	'%Uint8ClampedArrayPrototype%': typeof Uint8ClampedArray === 'undefined' ? undefined$1 : Uint8ClampedArray.prototype,
  	'%Uint16Array%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array,
  	'%Uint16ArrayPrototype%': typeof Uint16Array === 'undefined' ? undefined$1 : Uint16Array.prototype,
  	'%Uint32Array%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array,
  	'%Uint32ArrayPrototype%': typeof Uint32Array === 'undefined' ? undefined$1 : Uint32Array.prototype,
  	'%URIError%': URIError,
  	'%URIErrorPrototype%': URIError.prototype,
  	'%WeakMap%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap,
  	'%WeakMapPrototype%': typeof WeakMap === 'undefined' ? undefined$1 : WeakMap.prototype,
  	'%WeakSet%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet,
  	'%WeakSetPrototype%': typeof WeakSet === 'undefined' ? undefined$1 : WeakSet.prototype
  };


  var $replace = functionBind.call(Function.call, String.prototype.replace);

  /* adapted from https://github.com/lodash/lodash/blob/4.17.15/dist/lodash.js#L6735-L6744 */
  var rePropName = /[^%.[\]]+|\[(?:(-?\d+(?:\.\d+)?)|(["'])((?:(?!\2)[^\\]|\\.)*?)\2)\]|(?=(?:\.|\[\])(?:\.|\[\]|%$))/g;
  var reEscapeChar = /\\(\\)?/g; /** Used to match backslashes in property paths. */
  var stringToPath = function stringToPath(string) {
  	var result = [];
  	$replace(string, rePropName, function (match, number, quote, subString) {
  		result[result.length] = quote ? $replace(subString, reEscapeChar, '$1') : (number || match);
  	});
  	return result;
  };
  /* end adaptation */

  var getBaseIntrinsic = function getBaseIntrinsic(name, allowMissing) {
  	if (!(name in INTRINSICS)) {
  		throw new SyntaxError('intrinsic ' + name + ' does not exist!');
  	}

  	// istanbul ignore if // hopefully this is impossible to test :-)
  	if (typeof INTRINSICS[name] === 'undefined' && !allowMissing) {
  		throw new $TypeError('intrinsic ' + name + ' exists, but is not available. Please file an issue!');
  	}

  	return INTRINSICS[name];
  };

  var GetIntrinsic = function GetIntrinsic(name, allowMissing) {
  	if (typeof name !== 'string' || name.length === 0) {
  		throw new TypeError('intrinsic name must be a non-empty string');
  	}
  	if (arguments.length > 1 && typeof allowMissing !== 'boolean') {
  		throw new TypeError('"allowMissing" argument must be a boolean');
  	}

  	var parts = stringToPath(name);

  	var value = getBaseIntrinsic('%' + (parts.length > 0 ? parts[0] : '') + '%', allowMissing);
  	for (var i = 1; i < parts.length; i += 1) {
  		if (value != null) {
  			if ($gOPD && (i + 1) >= parts.length) {
  				var desc = $gOPD(value, parts[i]);
  				if (!allowMissing && !(parts[i] in value)) {
  					throw new $TypeError('base intrinsic for ' + name + ' exists, but the property is not available.');
  				}
  				value = desc ? (desc.get || desc.value) : value[parts[i]];
  			} else {
  				value = value[parts[i]];
  			}
  		}
  	}
  	return value;
  };

  var $Function = GetIntrinsic('%Function%');
  var $apply = $Function.apply;
  var $call = $Function.call;

  var callBind = function callBind() {
  	return functionBind.apply($call, arguments);
  };

  var apply = function applyBind() {
  	return functionBind.apply($apply, arguments);
  };
  callBind.apply = apply;

  var toStr$3 = Object.prototype.toString;

  var isArguments$1 = function isArguments(value) {
  	var str = toStr$3.call(value);
  	var isArgs = str === '[object Arguments]';
  	if (!isArgs) {
  		isArgs = str !== '[object Array]' &&
  			value !== null &&
  			typeof value === 'object' &&
  			typeof value.length === 'number' &&
  			value.length >= 0 &&
  			toStr$3.call(value.callee) === '[object Function]';
  	}
  	return isArgs;
  };

  var keysShim;
  if (!Object.keys) {
  	// modified from https://github.com/es-shims/es5-shim
  	var has$1 = Object.prototype.hasOwnProperty;
  	var toStr$4 = Object.prototype.toString;
  	var isArgs = isArguments$1; // eslint-disable-line global-require
  	var isEnumerable = Object.prototype.propertyIsEnumerable;
  	var hasDontEnumBug = !isEnumerable.call({ toString: null }, 'toString');
  	var hasProtoEnumBug = isEnumerable.call(function () {}, 'prototype');
  	var dontEnums = [
  		'toString',
  		'toLocaleString',
  		'valueOf',
  		'hasOwnProperty',
  		'isPrototypeOf',
  		'propertyIsEnumerable',
  		'constructor'
  	];
  	var equalsConstructorPrototype = function (o) {
  		var ctor = o.constructor;
  		return ctor && ctor.prototype === o;
  	};
  	var excludedKeys = {
  		$applicationCache: true,
  		$console: true,
  		$external: true,
  		$frame: true,
  		$frameElement: true,
  		$frames: true,
  		$innerHeight: true,
  		$innerWidth: true,
  		$onmozfullscreenchange: true,
  		$onmozfullscreenerror: true,
  		$outerHeight: true,
  		$outerWidth: true,
  		$pageXOffset: true,
  		$pageYOffset: true,
  		$parent: true,
  		$scrollLeft: true,
  		$scrollTop: true,
  		$scrollX: true,
  		$scrollY: true,
  		$self: true,
  		$webkitIndexedDB: true,
  		$webkitStorageInfo: true,
  		$window: true
  	};
  	var hasAutomationEqualityBug = (function () {
  		/* global window */
  		if (typeof window === 'undefined') { return false; }
  		for (var k in window) {
  			try {
  				if (!excludedKeys['$' + k] && has$1.call(window, k) && window[k] !== null && typeof window[k] === 'object') {
  					try {
  						equalsConstructorPrototype(window[k]);
  					} catch (e) {
  						return true;
  					}
  				}
  			} catch (e) {
  				return true;
  			}
  		}
  		return false;
  	}());
  	var equalsConstructorPrototypeIfNotBuggy = function (o) {
  		/* global window */
  		if (typeof window === 'undefined' || !hasAutomationEqualityBug) {
  			return equalsConstructorPrototype(o);
  		}
  		try {
  			return equalsConstructorPrototype(o);
  		} catch (e) {
  			return false;
  		}
  	};

  	keysShim = function keys(object) {
  		var isObject = object !== null && typeof object === 'object';
  		var isFunction = toStr$4.call(object) === '[object Function]';
  		var isArguments = isArgs(object);
  		var isString = isObject && toStr$4.call(object) === '[object String]';
  		var theKeys = [];

  		if (!isObject && !isFunction && !isArguments) {
  			throw new TypeError('Object.keys called on a non-object');
  		}

  		var skipProto = hasProtoEnumBug && isFunction;
  		if (isString && object.length > 0 && !has$1.call(object, 0)) {
  			for (var i = 0; i < object.length; ++i) {
  				theKeys.push(String(i));
  			}
  		}

  		if (isArguments && object.length > 0) {
  			for (var j = 0; j < object.length; ++j) {
  				theKeys.push(String(j));
  			}
  		} else {
  			for (var name in object) {
  				if (!(skipProto && name === 'prototype') && has$1.call(object, name)) {
  					theKeys.push(String(name));
  				}
  			}
  		}

  		if (hasDontEnumBug) {
  			var skipConstructor = equalsConstructorPrototypeIfNotBuggy(object);

  			for (var k = 0; k < dontEnums.length; ++k) {
  				if (!(skipConstructor && dontEnums[k] === 'constructor') && has$1.call(object, dontEnums[k])) {
  					theKeys.push(dontEnums[k]);
  				}
  			}
  		}
  		return theKeys;
  	};
  }
  var implementation$1 = keysShim;

  var slice$1 = Array.prototype.slice;


  var origKeys = Object.keys;
  var keysShim$1 = origKeys ? function keys(o) { return origKeys(o); } : implementation$1;

  var originalKeys = Object.keys;

  keysShim$1.shim = function shimObjectKeys() {
  	if (Object.keys) {
  		var keysWorksWithArguments = (function () {
  			// Safari 5.0 bug
  			var args = Object.keys(arguments);
  			return args && args.length === arguments.length;
  		}(1, 2));
  		if (!keysWorksWithArguments) {
  			Object.keys = function keys(object) { // eslint-disable-line func-name-matching
  				if (isArguments$1(object)) {
  					return originalKeys(slice$1.call(object));
  				}
  				return originalKeys(object);
  			};
  		}
  	} else {
  		Object.keys = keysShim$1;
  	}
  	return Object.keys || keysShim$1;
  };

  var objectKeys = keysShim$1;

  var hasSymbols$2 = typeof Symbol === 'function' && typeof Symbol('foo') === 'symbol';

  var toStr$5 = Object.prototype.toString;
  var concat = Array.prototype.concat;
  var origDefineProperty = Object.defineProperty;

  var isFunction = function (fn) {
  	return typeof fn === 'function' && toStr$5.call(fn) === '[object Function]';
  };

  var arePropertyDescriptorsSupported = function () {
  	var obj = {};
  	try {
  		origDefineProperty(obj, 'x', { enumerable: false, value: obj });
  		// eslint-disable-next-line no-unused-vars, no-restricted-syntax
  		for (var _ in obj) { // jscs:ignore disallowUnusedVariables
  			return false;
  		}
  		return obj.x === obj;
  	} catch (e) { /* this is IE 8. */
  		return false;
  	}
  };
  var supportsDescriptors = origDefineProperty && arePropertyDescriptorsSupported();

  var defineProperty$1 = function (object, name, value, predicate) {
  	if (name in object && (!isFunction(predicate) || !predicate())) {
  		return;
  	}
  	if (supportsDescriptors) {
  		origDefineProperty(object, name, {
  			configurable: true,
  			enumerable: false,
  			value: value,
  			writable: true
  		});
  	} else {
  		object[name] = value;
  	}
  };

  var defineProperties = function (object, map) {
  	var predicates = arguments.length > 2 ? arguments[2] : {};
  	var props = objectKeys(map);
  	if (hasSymbols$2) {
  		props = concat.call(props, Object.getOwnPropertySymbols(map));
  	}
  	for (var i = 0; i < props.length; i += 1) {
  		defineProperty$1(object, props[i], map[props[i]], predicates[props[i]]);
  	}
  };

  defineProperties.supportsDescriptors = !!supportsDescriptors;

  var defineProperties_1 = defineProperties;

  var $TypeError$1 = GetIntrinsic('%TypeError%');

  // http://www.ecma-international.org/ecma-262/5.1/#sec-9.10

  var CheckObjectCoercible = function CheckObjectCoercible(value, optMessage) {
  	if (value == null) {
  		throw new $TypeError$1(optMessage || ('Cannot call method on ' + value));
  	}
  	return value;
  };

  var $String = GetIntrinsic('%String%');
  var $TypeError$2 = GetIntrinsic('%TypeError%');

  // https://www.ecma-international.org/ecma-262/6.0/#sec-tostring

  var ToString = function ToString(argument) {
  	if (typeof argument === 'symbol') {
  		throw new $TypeError$2('Cannot convert a Symbol value to a string');
  	}
  	return $String(argument);
  };

  var $indexOf = callBind(GetIntrinsic('String.prototype.indexOf'));

  var callBound = function callBoundIntrinsic(name, allowMissing) {
  	var intrinsic = GetIntrinsic(name, !!allowMissing);
  	if (typeof intrinsic === 'function' && $indexOf(name, '.prototype.')) {
  		return callBind(intrinsic);
  	}
  	return intrinsic;
  };

  var $replace$1 = callBound('String.prototype.replace');

  /* eslint-disable no-control-regex */
  var leftWhitespace = /^[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]+/;
  var rightWhitespace = /[\x09\x0A\x0B\x0C\x0D\x20\xA0\u1680\u180E\u2000\u2001\u2002\u2003\u2004\u2005\u2006\u2007\u2008\u2009\u200A\u202F\u205F\u3000\u2028\u2029\uFEFF]+$/;
  /* eslint-enable no-control-regex */

  var implementation$2 = function trim() {
  	var S = ToString(CheckObjectCoercible(this));
  	return $replace$1($replace$1(S, leftWhitespace, ''), rightWhitespace, '');
  };

  var zeroWidthSpace = '\u200b';

  var polyfill = function getPolyfill() {
  	if (String.prototype.trim && zeroWidthSpace.trim() === zeroWidthSpace) {
  		return String.prototype.trim;
  	}
  	return implementation$2;
  };

  var shim = function shimStringTrim() {
  	var polyfill$1 = polyfill();
  	defineProperties_1(String.prototype, { trim: polyfill$1 }, {
  		trim: function testTrim() {
  			return String.prototype.trim !== polyfill$1;
  		}
  	});
  	return polyfill$1;
  };

  var boundTrim = callBind(polyfill());

  defineProperties_1(boundTrim, {
  	getPolyfill: polyfill,
  	implementation: implementation$2,
  	shim: shim
  });

  var string_prototype_trim = boundTrim;

  var warn = function warn(message) {
  };

  var replace = String.prototype.replace;
  var split = String.prototype.split;

  // #### Pluralization methods
  // The string that separates the different phrase possibilities.
  var delimiter = '||||';

  var russianPluralGroups = function (n) {
    var lastTwo = n % 100;
    var end = lastTwo % 10;
    if (lastTwo !== 11 && end === 1) {
      return 0;
    }
    if (2 <= end && end <= 4 && !(lastTwo >= 12 && lastTwo <= 14)) {
      return 1;
    }
    return 2;
  };

  var defaultPluralRules = {
    // Mapping from pluralization group plural logic.
    pluralTypes: {
      arabic: function (n) {
        // http://www.arabeyes.org/Plural_Forms
        if (n < 3) { return n; }
        var lastTwo = n % 100;
        if (lastTwo >= 3 && lastTwo <= 10) { return 3; }
        return lastTwo >= 11 ? 4 : 5;
      },
      bosnian_serbian: russianPluralGroups,
      chinese: function () { return 0; },
      croatian: russianPluralGroups,
      french: function (n) { return n > 1 ? 1 : 0; },
      german: function (n) { return n !== 1 ? 1 : 0; },
      russian: russianPluralGroups,
      lithuanian: function (n) {
        if (n % 10 === 1 && n % 100 !== 11) { return 0; }
        return n % 10 >= 2 && n % 10 <= 9 && (n % 100 < 11 || n % 100 > 19) ? 1 : 2;
      },
      czech: function (n) {
        if (n === 1) { return 0; }
        return (n >= 2 && n <= 4) ? 1 : 2;
      },
      polish: function (n) {
        if (n === 1) { return 0; }
        var end = n % 10;
        return 2 <= end && end <= 4 && (n % 100 < 10 || n % 100 >= 20) ? 1 : 2;
      },
      icelandic: function (n) { return (n % 10 !== 1 || n % 100 === 11) ? 1 : 0; },
      slovenian: function (n) {
        var lastTwo = n % 100;
        if (lastTwo === 1) {
          return 0;
        }
        if (lastTwo === 2) {
          return 1;
        }
        if (lastTwo === 3 || lastTwo === 4) {
          return 2;
        }
        return 3;
      }
    },

    // Mapping from pluralization group to individual language codes/locales.
    // Will look up based on exact match, if not found and it's a locale will parse the locale
    // for language code, and if that does not exist will default to 'en'
    pluralTypeToLanguages: {
      arabic: ['ar'],
      bosnian_serbian: ['bs-Latn-BA', 'bs-Cyrl-BA', 'srl-RS', 'sr-RS'],
      chinese: ['id', 'id-ID', 'ja', 'ko', 'ko-KR', 'lo', 'ms', 'th', 'th-TH', 'zh'],
      croatian: ['hr', 'hr-HR'],
      german: ['fa', 'da', 'de', 'en', 'es', 'fi', 'el', 'he', 'hi-IN', 'hu', 'hu-HU', 'it', 'nl', 'no', 'pt', 'sv', 'tr'],
      french: ['fr', 'tl', 'pt-br'],
      russian: ['ru', 'ru-RU'],
      lithuanian: ['lt'],
      czech: ['cs', 'cs-CZ', 'sk'],
      polish: ['pl'],
      icelandic: ['is'],
      slovenian: ['sl-SL']
    }
  };

  function langToTypeMap(mapping) {
    var ret = {};
    forEach_1(mapping, function (langs, type) {
      forEach_1(langs, function (lang) {
        ret[lang] = type;
      });
    });
    return ret;
  }

  function pluralTypeName(pluralRules, locale) {
    var langToPluralType = langToTypeMap(pluralRules.pluralTypeToLanguages);
    return langToPluralType[locale]
      || langToPluralType[split.call(locale, /-/, 1)[0]]
      || langToPluralType.en;
  }

  function pluralTypeIndex(pluralRules, locale, count) {
    return pluralRules.pluralTypes[pluralTypeName(pluralRules, locale)](count);
  }

  function escape(token) {
    return token.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }

  function constructTokenRegex(opts) {
    var prefix = (opts && opts.prefix) || '%{';
    var suffix = (opts && opts.suffix) || '}';

    if (prefix === delimiter || suffix === delimiter) {
      throw new RangeError('"' + delimiter + '" token is reserved for pluralization');
    }

    return new RegExp(escape(prefix) + '(.*?)' + escape(suffix), 'g');
  }

  var defaultTokenRegex = /%\{(.*?)\}/g;

  // ### transformPhrase(phrase, substitutions, locale)
  //
  // Takes a phrase string and transforms it by choosing the correct
  // plural form and interpolating it.
  //
  //     transformPhrase('Hello, %{name}!', {name: 'Spike'});
  //     // "Hello, Spike!"
  //
  // The correct plural form is selected if substitutions.smart_count
  // is set. You can pass in a number instead of an Object as `substitutions`
  // as a shortcut for `smart_count`.
  //
  //     transformPhrase('%{smart_count} new messages |||| 1 new message', {smart_count: 1}, 'en');
  //     // "1 new message"
  //
  //     transformPhrase('%{smart_count} new messages |||| 1 new message', {smart_count: 2}, 'en');
  //     // "2 new messages"
  //
  //     transformPhrase('%{smart_count} new messages |||| 1 new message', 5, 'en');
  //     // "5 new messages"
  //
  // You should pass in a third argument, the locale, to specify the correct plural type.
  // It defaults to `'en'` with 2 plural forms.
  function transformPhrase(phrase, substitutions, locale, tokenRegex, pluralRules) {
    if (typeof phrase !== 'string') {
      throw new TypeError('Polyglot.transformPhrase expects argument #1 to be string');
    }

    if (substitutions == null) {
      return phrase;
    }

    var result = phrase;
    var interpolationRegex = tokenRegex || defaultTokenRegex;
    var pluralRulesOrDefault = pluralRules || defaultPluralRules;

    // allow number as a pluralization shortcut
    var options = typeof substitutions === 'number' ? { smart_count: substitutions } : substitutions;

    // Select plural form: based on a phrase text that contains `n`
    // plural forms separated by `delimiter`, a `locale`, and a `substitutions.smart_count`,
    // choose the correct plural form. This is only done if `count` is set.
    if (options.smart_count != null && result) {
      var texts = split.call(result, delimiter);
      result = string_prototype_trim(texts[pluralTypeIndex(pluralRulesOrDefault, locale || 'en', options.smart_count)] || texts[0]);
    }

    // Interpolate: Creates a `RegExp` object for each interpolation placeholder.
    result = replace.call(result, interpolationRegex, function (expression, argument) {
      if (!src(options, argument) || options[argument] == null) { return expression; }
      return options[argument];
    });

    return result;
  }

  // ### Polyglot class constructor
  function Polyglot(options) {
    var opts = options || {};
    this.phrases = {};
    this.extend(opts.phrases || {});
    this.currentLocale = opts.locale || 'en';
    var allowMissing = opts.allowMissing ? transformPhrase : null;
    this.onMissingKey = typeof opts.onMissingKey === 'function' ? opts.onMissingKey : allowMissing;
    this.warn = opts.warn || warn;
    this.tokenRegex = constructTokenRegex(opts.interpolation);
    this.pluralRules = opts.pluralRules || defaultPluralRules;
  }

  // ### polyglot.locale([locale])
  //
  // Get or set locale. Internally, Polyglot only uses locale for pluralization.
  Polyglot.prototype.locale = function (newLocale) {
    if (newLocale) { this.currentLocale = newLocale; }
    return this.currentLocale;
  };

  // ### polyglot.extend(phrases)
  //
  // Use `extend` to tell Polyglot how to translate a given key.
  //
  //     polyglot.extend({
  //       "hello": "Hello",
  //       "hello_name": "Hello, %{name}"
  //     });
  //
  // The key can be any string.  Feel free to call `extend` multiple times;
  // it will override any phrases with the same key, but leave existing phrases
  // untouched.
  //
  // It is also possible to pass nested phrase objects, which get flattened
  // into an object with the nested keys concatenated using dot notation.
  //
  //     polyglot.extend({
  //       "nav": {
  //         "hello": "Hello",
  //         "hello_name": "Hello, %{name}",
  //         "sidebar": {
  //           "welcome": "Welcome"
  //         }
  //       }
  //     });
  //
  //     console.log(polyglot.phrases);
  //     // {
  //     //   'nav.hello': 'Hello',
  //     //   'nav.hello_name': 'Hello, %{name}',
  //     //   'nav.sidebar.welcome': 'Welcome'
  //     // }
  //
  // `extend` accepts an optional second argument, `prefix`, which can be used
  // to prefix every key in the phrases object with some string, using dot
  // notation.
  //
  //     polyglot.extend({
  //       "hello": "Hello",
  //       "hello_name": "Hello, %{name}"
  //     }, "nav");
  //
  //     console.log(polyglot.phrases);
  //     // {
  //     //   'nav.hello': 'Hello',
  //     //   'nav.hello_name': 'Hello, %{name}'
  //     // }
  //
  // This feature is used internally to support nested phrase objects.
  Polyglot.prototype.extend = function (morePhrases, prefix) {
    forEach_1(morePhrases, function (phrase, key) {
      var prefixedKey = prefix ? prefix + '.' + key : key;
      if (typeof phrase === 'object') {
        this.extend(phrase, prefixedKey);
      } else {
        this.phrases[prefixedKey] = phrase;
      }
    }, this);
  };

  // ### polyglot.unset(phrases)
  // Use `unset` to selectively remove keys from a polyglot instance.
  //
  //     polyglot.unset("some_key");
  //     polyglot.unset({
  //       "hello": "Hello",
  //       "hello_name": "Hello, %{name}"
  //     });
  //
  // The unset method can take either a string (for the key), or an object hash with
  // the keys that you would like to unset.
  Polyglot.prototype.unset = function (morePhrases, prefix) {
    if (typeof morePhrases === 'string') {
      delete this.phrases[morePhrases];
    } else {
      forEach_1(morePhrases, function (phrase, key) {
        var prefixedKey = prefix ? prefix + '.' + key : key;
        if (typeof phrase === 'object') {
          this.unset(phrase, prefixedKey);
        } else {
          delete this.phrases[prefixedKey];
        }
      }, this);
    }
  };

  // ### polyglot.clear()
  //
  // Clears all phrases. Useful for special cases, such as freeing
  // up memory if you have lots of phrases but no longer need to
  // perform any translation. Also used internally by `replace`.
  Polyglot.prototype.clear = function () {
    this.phrases = {};
  };

  // ### polyglot.replace(phrases)
  //
  // Completely replace the existing phrases with a new set of phrases.
  // Normally, just use `extend` to add more phrases, but under certain
  // circumstances, you may want to make sure no old phrases are lying around.
  Polyglot.prototype.replace = function (newPhrases) {
    this.clear();
    this.extend(newPhrases);
  };


  // ### polyglot.t(key, options)
  //
  // The most-used method. Provide a key, and `t` will return the
  // phrase.
  //
  //     polyglot.t("hello");
  //     => "Hello"
  //
  // The phrase value is provided first by a call to `polyglot.extend()` or
  // `polyglot.replace()`.
  //
  // Pass in an object as the second argument to perform interpolation.
  //
  //     polyglot.t("hello_name", {name: "Spike"});
  //     => "Hello, Spike"
  //
  // If you like, you can provide a default value in case the phrase is missing.
  // Use the special option key "_" to specify a default.
  //
  //     polyglot.t("i_like_to_write_in_language", {
  //       _: "I like to write in %{language}.",
  //       language: "JavaScript"
  //     });
  //     => "I like to write in JavaScript."
  //
  Polyglot.prototype.t = function (key, options) {
    var phrase, result;
    var opts = options == null ? {} : options;
    if (typeof this.phrases[key] === 'string') {
      phrase = this.phrases[key];
    } else if (typeof opts._ === 'string') {
      phrase = opts._;
    } else if (this.onMissingKey) {
      var onMissingKey = this.onMissingKey;
      result = onMissingKey(key, opts, this.currentLocale, this.tokenRegex, this.pluralRules);
    } else {
      this.warn('Missing translation for key: "' + key + '"');
      result = key;
    }
    if (typeof phrase === 'string') {
      result = transformPhrase(phrase, opts, this.currentLocale, this.tokenRegex, this.pluralRules);
    }
    return result;
  };


  // ### polyglot.has(key)
  //
  // Check if polyglot has a translation for given key
  Polyglot.prototype.has = function (key) {
    return src(this.phrases, key);
  };

  // export transformPhrase
  Polyglot.transformPhrase = function transform(phrase, substitutions, locale) {
    return transformPhrase(phrase, substitutions, locale);
  };

  var nodePolyglot = Polyglot;

  function fetchJSON(url, done) {
      var xhr = new XMLHttpRequest();
      xhr.open('GET', url);
      xhr.onload = function(e) {
          var json;
          if (xhr.status === 200) {
              json = JSON.parse(xhr.responseText);
          }
          done(json, xhr.status);
      };
      xhr.send();
  }

  function guessLanguage(defaultLang) {
      var locale = (navigator.languages && navigator.languages[0]) || navigator.language || navigator.userLanguage;
      if (locale) {
          return localeTolang(locale);
      }
      return defaultLang;
  }

  function QuteIntl(config) {
      var lang = null;
      if (!config) {
          config = { locale: lang };
      } else if (!config.locale) {
          config.locale = lang;
      } else {
          lang = localeTolang(config.locale);
      }
      this.lang = null;
      this.resources = config.resources || {};
      this.polyglot = new nodePolyglot(config);
      var translate = this.polyglot.t.bind(this.polyglot);
      this.t = translate;

      // install translation methods on ViewModel and functional component prototypes
      Qute.defineMethod('t', translate);
      Qute.i18n = this;
  }

  QuteIntl.prototype = {
      load: function load(lang) {
          if (!lang) { lang = 'guess'; }
          if (this.lang !== lang) {
              if (lang === 'guess') {
                  lang = guessLanguage('en');
              }
              var phrases = this.resources[lang];
              if (typeof phrases === 'string') {
                  var self = this;
                  return new Promise(function(resolve, reject) {
                      fetchJSON(phrases, function(json, status) {
                          if (json) {
                              self.lang = lang;
                              //self.resources[lang] = json;
                              self.polyglot.locale(lang);
                              self.polyglot.replace(json);
                              resolve(true);
                          } else {
                              resolve(false);
                          }
                      });
                  });
              } else if (phrases) {
                  this.lang = lang;
                  this.polyglot.locale(lang);
                  this.polyglot.replace(phrases);
                  return Promise.resolve(true);
              } else {
                  throw new Error('No phrases found for language: '+lang);
              }
          } else {
              return Promise.resolve(false);
          }
      }
  };

  Qute.Intl = QuteIntl;

  return Qute;

}(window));
//# sourceMappingURL=qute-dev-all.js.map
