import window from '@qutejs/window';

import LocationBar from "./location-bar.js";
import PathMapping from "./path-mapping.js";
import {absPath, expandVars} from "./utils.js";

function detectCycles(redirects, from) {
	var visited = {};
	visited[from] = true;
	var to = redirects[from];
	while (to) {
		if (visited[to]) throw new Error('Found a redirection cycle: ['+from+"] -> ["+to+"]");
		visited[to] = true;
		to = redirects[to];
	}
}

function Router(bindings) {

	this.navigo = new LocationBar();
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
			self.navigate(expandVars(to, params), true); // replace the existing entry
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
			var self = this;
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
		if (!this.routes.bindings.length) throw new Error('No routes set!');
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
			window.removeEventListener('load', loadCb);
		};
		window.addEventListener('load', loadCb);
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
}

export default Router;
