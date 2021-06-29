/**
 * The convention is to store theme files inside a "themes" directory directly under the package root.
 * Theme files must use either .css, either .pcss as extension. The default theme must be named 'default'.
 * Note that if you are using package exports you don't need to export your theme files.
 */

import fs from 'fs';
import path from 'path';

function findNodeModule(name, cwd) {
    // extract name parts to correctly handle scoped packages (e.g. @qutejs/material)
    const parts = name.split('/');
    parts.unshift(cwd || process.cwd(), 'node_modules');
    const dir = path.join.apply(path, parts);

    // test if package.json exists
    try {
        const stats = fs.statSync(path.join(dir, 'package.json'));
        return stats.isFile() ? dir : null;
    } catch (e) {
        if (e.code === 'ENOENT') {
            return null;
        }
        throw e;
    }
}

function getThemesDir(root) {
    let themesDir = path.join(root, 'themes');
    try {
        const stats = fs.statSync(themesDir);
        return stats.isDirectory() ? themesDir : null;
    } catch (e) {
        if (e.code === 'ENOENT') {
            return null;
        }
        throw e;
    }
}

function getThemeFile(root, relPath) {
    let themeFile = path.join(root, relPath);
    try {
        const stats = fs.statSync(themeFile);
        return stats.isFile() ? themeFile : null;
    } catch (e) {
        if (e.code === 'ENOENT') {
            return null;
        }
        throw e;
    }
    return null;
}

export default function ThemeResolver(root, packages) {
    this.themesDirs = packages ? packages.reduce((result, pkg) => {
        const dir = findNodeModule(pkg, root);
        if (dir) {
            let themesDir = getThemesDir(dir);
            if (themesDir) {
                result.push(themesDir);
            }
        } else {
            console.warn('Package not found: "'+pkg+'"');
        }
        return result;
    }, []) : [];
    var localThemesDir = getThemesDir(root);
    if (localThemesDir) {
        this.themesDirs.unshift(localThemesDir);
    }
    this.cache = {};
}
ThemeResolver.prototype = {
    _resolve(filePath) {
        for (let root of this.themesDirs) {
            let file = getThemeFile(root, filePath);
            if (file) {
                return file;
            }
        }
        return null;
    },

    resolve(location, themes) {
        if (!location.startsWith('theme:')) {
            return null;
        }
        let file = this.cache[location];
        if (file) {
            return file;
        }
        let normalizedLocation =  location[6] === '/' ? location.substring(7) : location.substring(6);
        const parts = normalizedLocation.split('/');
        if (parts.length === 1) {
            // push the active theme name (or default if none defined)
            parts.push(themes[parts[0]] || 'default');
        }
        const hasExt = parts[parts.length-1].indexOf('.') > -1;
        normalizedLocation = path.join.apply(path, parts);
        file = this.cache[normalizedLocation];
        if (file) {
            this.cache[location] = file;
            return file;
        }
        let ext;
        if (!hasExt) {
            ext = '.css';
            file = this._resolve(normalizedLocation+ext);
            if (!file) {
                ext = '.pcss';
                file = this._resolve(normalizedLocation+ext);
            }
        } else {
            file = this._resolve(normalizedLocation);
        }
        if (file) {
            this.cache[location] = file;
            this.cache[normalizedLocation] = file;
            if (ext) {
                this.cache[normalizedLocation+ext] = file;
            }
            return file;
        }
        return null;
    }
}
