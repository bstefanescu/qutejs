
import fs from 'fs';
import os from 'os';
import path from 'path';

import findCacheDir from 'find-cache-dir';
import { addHook } from 'pirates';
import { sync as mkdirp } from 'mkdirp';

import Compiler from '@qutejs/compiler';

var revertHook = null; // set when hook installed
var transpiling = false;

var cache;

var DEFAULT_EXTS = ['.js', '.jsq', '.qute'];
var CACHE_FILE = findCacheDir({name: 'qute'}) || os.tmpdir();

function Cache(filename) {

	if (!filename) filename = path.join(CACHE_FILE, '/qute-register.json');

	this.get = function(key) {
		return data[key];
	}

	this.put = function(key, value) {
		data[key] = value;
		dirty = true;
	}
	this.clear = function() {
		data = {};
		dirty = true;
	}
	this.save = function() {
		c();
	}

	function load() {
		try {
		    return JSON.parse(fs.readFileSync(filename));
		} catch (err) {
			return {};
		}
	}

	function store() {
		if (dirty) {
			try {
				mkdirp(path.dirname(filename));
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

function transpile(code, isJsq) {
        if (isJsq) {
            code = new Compiler().transpile(code, {sourceMap: false}).code;
        }
        const r =  new Compiler.DecoratorTranspiler().transpile(code, false);
        return r ? r.code : code;
}

function cachedTranspile(code, filename, isJsq) {
	var key = filename; //TODO improve cache key
	var cached = cache.get(key);
	var tm = mtime(filename);
	if (!cached || cached.mtime !== tm) {
        cached = { code: transpile(code, isJsq), mtime: tm };
        cache.put(cached);
	}
	return cached.code;
}

function transpileHook(code, filename) {
	if (transpiling) return code;
	try {
        transpiling = true;
        try {
            const isJsq = filename.endsWith('.jsq') || filename.endsWith('.qute');
            code = cache ? cachedTranspile(code, filename, isJsq) : transpile(code, isJsq);
            //console.log('============= Code for ',filename,'=============\n', code, '\n=================================');
        } catch(e) {
            console.error('Qute transpiler: Failed to process '+filename, e);
            console.log('============= Code =============\n', code, '\n=================================');
            throw e;
        }
        return code;
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
  } else {
      cache = null;
  }

  revertHook = addHook(transpileHook, { exts: exts, ignoreNodeModules: ignoreNodeModules });
  return revert;
}

// register with default opts
register();

// allow re-registration with custom opts: require('qute-register')(opts)
export default function(opts) {
	return register(opts);
};

