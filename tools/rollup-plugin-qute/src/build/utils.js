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
 * Convert js import paths to os paths. On posix systems this does nothing. On wndows this relace / with \
 */
export function toOSPath(jspath) {
    if (path.sep !== '/') {
        return jspath.replace(/\\/g, '/');
    }
    return jspath;
}
