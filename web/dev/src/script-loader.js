import Qute from '@qutejs/runtime';

var IGNORE_PACKAGES = {
    "@qutejs/runtime": true,
    "@qutejs/window": true,
    "@qutejs/dev": true,
}

export function loadScripts(urls) {
    if (!Array.isArray(urls)) {
        urls = Array.prototype.slice.call(arguments);
    }
    urls = urls.filter(function(url) {
        return !IGNORE_PACKAGES[url];
    });
    return new Promise(function(resolve, reject) {
        Qute.importAll(urls, resolve, reject);
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
        Qute.import(urls, resolve, reject);
    });
}
