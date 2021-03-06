import {importAll, serialImport} from '@qutejs/importer';

export const IGNORE_PACKAGES = {
    "@qutejs/runtime": true,
    "@qutejs/window": true,
    "@qutejs/dev": true,
    "@qutejs/importer": true,
}

export function loadScripts(urls) {
    if (!Array.isArray(urls)) {
        urls = Array.prototype.slice.call(arguments);
    }
    urls = urls.filter(function(url) {
        return !IGNORE_PACKAGES[url];
    });
    return new Promise(function(resolve, reject) {
        importAll(urls, resolve, reject);
    });
}


export function serialLoadScripts(urls) {
    if (!Array.isArray(urls)) {
        urls = Array.prototype.slice.call(arguments);
    }
    urls = urls.filter(function(url) {
        return !IGNORE_PACKAGES[url];
    });
    return new Promise(function(resolve, reject) {
        serialImport(urls, resolve, reject);
    });
}
