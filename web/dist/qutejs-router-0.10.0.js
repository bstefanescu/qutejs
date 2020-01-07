var QutejsRouter = (function (Qute, window) {
  'use strict';

  Qute = Qute && Qute.hasOwnProperty('default') ? Qute['default'] : Qute;
  var window__default = 'default' in window ? window['default'] : window;

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

  return QuteRouter;

}(Qute, window));
//# sourceMappingURL=qutejs-router-0.10.0.js.map
