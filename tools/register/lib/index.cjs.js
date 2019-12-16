'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var fs = _interopDefault(require('fs'));
var os = _interopDefault(require('os'));
var path = _interopDefault(require('path'));
var findCacheDir = _interopDefault(require('find-cache-dir'));
var pirates = require('pirates');
var mkdirp = require('mkdirp');
var Compiler = _interopDefault(require('@qutejs/compiler'));

var revertHook = null; // set when hook installed
var transpiling = false;

var cache;

var DEFAULT_EXTS = ['.jsq'];
var CACHE_FILE = findCacheDir({name: 'qute'}) || os.tmpdir();

function Cache(filename) {

	if (!filename) filename = path.join(CACHE_FILE, '/qute-register.json');

	this.get = function(key) {
		return data[key];
	};

	this.put = function(key, value) {
		data[key] = value;
		dirty = true;
	};
	this.clear = function() {
		data = {};
		dirty = true;
	};
	this.save = function() {
		store();
	};

	function load() {
		try {
		    return JSON.parse(fs.readFileSync(FILENAME));
		} catch (err) {
			return {};
		}
	}

	function store() {
		if (dirty) {
			try {
				mkdirp.sync(path.dirname(filename));
				fs.writeFileSync(filename, JSON.stringify(data, null, '  '));
			} catch(err) {
				console.log('Failed to write qute-register cache', err.stack);
				data = {};
			} finally {
				dirty = false;
			}
		}
	}

	var dirty = false;
	var data = load();

	process.on("exit", store);
  	process.nextTick(store);
}


function mtime(filename) {
  return fs.statSync(filename).mtime.getTime();
}

function transpile(code) {
	return new Compiler().transpile(code);
}

function cachedTranspile(code, filename) {
	var key = filename; //TODO improve cache key
	var cached = cache.get(key);
	var tm = mtime(filename);
	if (!cached || cached.mtime !== tm) {
		cached = { code: transpile(code), mtime: tm };
		cache.put(cached);
	}
	return cached.code;
}

function transpileHook(code, filename) {
	if (transpiling) return code;
	try {
		transpiling = true;
		return cache ? cachedTranspile(code, filename) : transpile(code);
	} finally {
		transpiling = false;
	}
}

function revert() {
  	if (revertHook) {
  		revertHook();
  		revertHook = null;
	}
}

/**
 * Default options:
 * - extensions: ['.jsq']
 * - ignoreNodeModules: true
 * - cache: true
 * - dev: false //TODO
 */
function register(opts) {
  var exts = DEFAULT_EXTS, ignoreNodeModules = true;
  if (opts) {
  	  if ('extensions' in opts) exts = opts.extensions;
  	  if ('ignoreNodeModules' in opts) ignoreNodeModules = opts.ignoreNodeModules;
  }

  revert();

  var useCache = !opts || opts.cache !== false;
  if (useCache && !cache) {
  	  cache = new Cache();
  }

  revertHook = pirates.addHook(transpileHook, { exts: exts, ignoreNodeModules: ignoreNodeModules });
  return revert;
}


// register with default opts
register();

// allow re-registration with custom opts: require('qute-register')(opts)
function index(opts) {
	return register(opts);
}

module.exports = index;
//# sourceMappingURL=index.cjs.js.map
