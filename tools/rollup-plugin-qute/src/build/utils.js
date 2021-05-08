import fs from 'fs';
import path from 'path';
import process from 'process';

export function findPackageDir(cwd) {
    cwd = cwd || process.cwd();
    if (fs.existsSync(path.join(cwd, 'package.json'))) {
        return cwd;
    } else {
        var parent = path.dirname(cwd);
        if (parent && parent !== cwd) {
            return findPackageDir(parent);
        } else {
            return null;
        }
    }
}

/**
 * Convert js import paths to os paths. On posix systems this does nothing. On wndows this replace / with \
 */
export function toOSPath(jspath) {
    if (path.sep !== '/') {
        return jspath.replace(/\\/g, '/');
    }
    return jspath;
}

export function loadPackage(pkgFile) {
    return JSON.parse(fs.readFileSync(pkgFile || path.join(findPackageDir(), 'package.json')));
}

export function externalFn(value) {
    if (!value) return null;
    if (Array.isArray(value)) {
        const set = new Set(value);
        return (id) => {
            return set.has(id) ? true : null;
        }
    } else {
        const type = typeof value;
        if (type === 'string') {
            return (id) => {
                return id === value ? true : null;
            }
        } else if (type === 'function') {
            return value;
        }
    }
    throw new Error('Invalid qute.external value: '+ value);
}


export function rollupExternalFn(externalOpt) {
    let fn;
    if (externalOpt) {
        if (Array.isArray(externalOpt)) {
            const externalSet = new Set(externalOpt);
            fn = function(id) {
                return externalSet.has(id);
            }
        } else if (typeof externalOpt === 'function') {
            fn = externalOpt;
        }
    }
    return fn || function() { return false; };
}

/**
 * Create a interop function to handle specific exports which delegates
 * to the previous value if any for unhandled exports
 * @param {function} fn
 * @param {string|boolean|function} interop
 */
export function interopFn(fn, interop) {
    let prevFn;
    if (interop != null) {
        if (typeof interop === 'function') {
            prevFn = interop;
        } else {
            prevFn = () => interop;
        }
    }
    return id => {
        let r = fn(id);
        if (r == null) { // not handled
            r = prevFn ? prevFn(id) : 'auto'; // 'auto' or true ? apparently true is deprecated
        }
        return r;
    }
}

export class PackageCache {
    constructor() {
        this.cache = {};
    }
    findPackageDir(fromFile) {
        return findPackageDir(fromFile);
    }
    findAndLoad(fromFile) {
        let pkg = null;
        const pkgDir = findPackageDir(fromFile);
        if (pkgDir) {
            pkg = this.load(pkgDir);
        }
        return pkg;
    }
    load(pkgDir) {
        let pkg = null;
        if (pkgDir) {
            pkg = this.cache[pkgDir];
            if (!pkg) {
                pkg = JSON.parse(fs.readFileSync(path.join(pkgDir, 'package.json')));
                this.cache[pkgDir] = pkg;
            }
        }
        return pkg;
    }

}