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

function getThemeFile(root, theme) {
    let themeFile = path.join(root, 'themes', theme+'.css');
    if (fs.accessSync(themeFile, fs.constants.R_OK)) {
        return themeFile;
    } else {
        themeFile = path.join(root, 'themes', theme+'.pcss');
        if (fs.accessSync(themeFile, fs.constants.R_OK)) {
            return themeFile;
        }
    }
    return null;
}

export default function ThemeResolver(root, packages) {
    this.packages = packages ? packages.reduce((result, pkg) => {
        const dir = findNodeModule(pkg, root);
        if (dir) {
            result.push(dir);
        } else {
            console.warn('Package not found: "'+pkg+'"');
        }
    }, []) : [];
    this.root = root;
}
ThemeResolver.prototype = {
    resolve(theme) {
        let themeFile = getThemeFile(this.root, theme);
        if (themeFile) {
            return themeFile;
        }
        const packages = this.packages;
        for (pkg of packages) {
            themeFile = getThemeFile(this.root, theme);
            if (themeFile) return themeFile;
        }
        return null;
    }
}
