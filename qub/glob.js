const fs = require('fs');
const micromatch = require('micromatch');

function Glob(inc, exc) {
	var flt = null;
	this.include = function() {
		if (!inc) inc = [];
		for (var i=0,l=arguments.length; i<l; i++) {
			inc.push(arguments[i]);
		}
		return this;
	}
	this.exclude = function() {
		if (!exc) exc = [];
		for (var i=0,l=arguments.length; i<l; i++) {
			exc.push(arguments[i]);
		}
		return this;
	}
	this.filter = function(filter) {
		flt = filter;
		return this;
	}

	this.match = function(dir, cb) {
		if (!cb) {
			var result = [];
			globTreeSync(dir, '', match, (path) => { result.push(path) });
			return result;
		} else {
			globTreeSync(dir, '', match, cb);
		}
	}

	// match only files not dirs
	this.matchFiles = function(dir) {
		var result = [];
		this.match(dir, (path, entry) => { if (!entry.isDirectory()) result.push(path) });
		return result;
	}

	function match(entry, path, abspath) {
		if (flt) {
			var r = flt(entry, path, abspath);
			if (r === true || r === false) return r;
		}
		if (exc && micromatch.isMatch(path, exc)) return false;
		if (inc && micromatch.isMatch(path, inc)) return true;
		return undefined;
	}

	function globTreeSync(dir, rpath, matchFn, cb) {
		var entries = fs.readdirSync(dir, {withFileTypes: true});
		for (var i=0,l=entries.length; i<l; i++) {
			var entry = entries[i];
			var name = entry.name;
			var entry_rpath = rpath ? rpath+'/'+name : name;
			var abspath = dir+'/'+name;
			var r = matchFn(entry, entry_rpath, abspath);
			if (r !== false) {
				if (r) {
					cb(abspath, entry);
				}
				if (entry.isDirectory()) { // continue traversal
					globTreeSync(abspath, entry_rpath, matchFn, cb);
				}
			}
		}
	}

}

Glob.create = function(patterns) {
	if (!patterns) return null;
	if (!Array.isArray(patterns)) {
		patterns = String(patterns).split(/\s*,\s*/);
	}
	var inc = [] , exc = [];
	var paths = patterns.forEach(function(path) {
		if (path.startsWith('!')) {
			exc.push(path.substring(1));
		} else {
			inc.push(path);
		}
	});
	return new Glob(inc, exc);
}

module.exports = Glob;
