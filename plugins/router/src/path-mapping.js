import {absPath} from "./utils.js";


var PATH_VARS_RX = /<([^>:]*)(?:\:([^>]*))?>/;

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
		if (path === '/*') return ANY;
		var i = path.indexOf('<');
		if (i === -1) return TextMatcher(path);

		var m = PATH_VARS_RX.exec(path);

		if (!m) return TextMatcher(path);

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
			m = PATH_VARS_RX.exec(path);
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
}

export default PathMapping;
