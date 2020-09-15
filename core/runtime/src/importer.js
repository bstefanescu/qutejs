import window, { document } from '@qutejs/window';
import ERR from './error.js';

/**
 * Imports remote scripts.
 We are not using Promise to not depend on polyfill
 */

var insertedUrls = {}; // inserted URLs
var customResolve = null;
var renderError = null;
var renderPending = null;

// default resolver
function resolveScript(nameOrUrl) {
    if (customResolve) {
        var r = customResolve(nameOrUrl);
        if (r !== false) {
            return r;
        }
    }
    if (nameOrUrl.charAt(0) === '@' || nameOrUrl.indexOf('/') === -1) {
        return 'https://unpkg.com/'+nameOrUrl;
    } else {
        return nameOrUrl;
    }
}

export function insertScript(url, exportName, onload, onerror) {
    if (url in insertedUrls) {
        onload && onload(insertedUrls[url]);
    } else {
        var script = document.createElement('script');
        script.setAttribute('src', url);
        script.onload = function() {
            // TODO if !exportName we can try to use window.__QUTE_IMPORT__ if any
            var scriptObj = exportName ? window[exportName] : window.__QUTE_IMPORT__;
            insertedUrls[url] = scriptObj;
            onload && onload(scriptObj);
        };
        script.onerror = function() {
            var error = new Error("Failed to fetch script from: " + url);
            error.url = url;
            console.error(error);
            onerror && onerror(error);
        }
        document.head.appendChild(script);
        window.__QUTE_IMPORT__ = null;
    }
}

export function importScript(script, exportName, onload, onerror) {
    var url = resolveScript(script);
    if (url) {
        insertScript(url, exportName, onload, onerror);
    }
}


function _importNext(imports, index, result, onload, onerror) {
    if (index < imports.length) {
        var script = imports[index];
        importScript(script,
            null,
            function(exportVar) {
                result[script] = exportVar;
                _importNext(imports, index+1, result, onload, onerror);
            },
            onerror
        );
    } else {
        onload && onload(result);
    }
}

function _importAll(imports, onload, onerror) {
    var cnt = imports.length, errors = [];
    for (var i=0,l=imports.length; i<l; i++) {
        var url = resolveScript(imports[i]);
        if (url) {
            insertScript(url,
                null,
                function() {
                    cnt--;
                    if (!cnt) {
                        cnt--;
                        onload && onload(null, imports);
                    }
                },
                function(url) {
                    errors.push(url);
                    cnt--;
                    if (!cnt) {
                        cnt--; // cnt will be -1
                        onerror && onerror(errors);
                    }
                }
            );
        } else {
            cnt--;
        }
    }
    if (!cnt) {
        cnt--;
        onload && onload(imports);
    }
}

export function serialImport(imports, onload, onerror) {
    if (Array.isArray(imports)) {
        _importNext(imports, 0, {}, onload, onerror);
    } else {
        importScript(imports, null, onload, onerror);
    }
}

export function importAll(imports, onload, onerror) {
    if (Array.isArray(imports)) {
        _importAll(imports, onload, onerror);
    } else {
        importScript(imports, null, onload, onerror);
    }
}

export function setImporterOptions(opts) {
    customResolve = opts.resolve || null;
    renderError = opts.renderError || null;
    renderPending = opts.renderPending || null;
}

// --------------- LazyComponent implementation ---------------


function _deleteNodes(from, to) {
    var parent = from.parentNode;
    var node = from.nextSibling;
    while (node && node !== to) {
        parent.removeChild(node);
        node = node.nextSibling;
    }
}

export function LazyComponent(location, exportName) {
    // return a render function that will inject the component when loaded
    return function renderLazyComponent(r, xattrs, slots) {
        var frag = document.createDocumentFragment();
        var start = document.createComment('[lazy '+location+']');
        var end = document.createComment('[/lazy '+location+']');
        frag.appendChild(start);
        frag.appendChild(end);

        if (renderPending) {
            var el = renderPending(r);
            if (el) {
                end.parentNode.insertBefore(el, end);
            }
        }

        importScript(location,
            exportName,
            function(result) {
                if(!result) ERR("Could not resolve lazy component at '%s'", location);
                var node = r._c(result, xattrs, slots);
                _deleteNodes(start, end);
                end.parentNode.insertBefore(node, end);
            },
            function(error) {
                // error loading component
                _deleteNodes(start, end);
                if (renderError) {
                    var el = renderError(r, error);
                    el && end.parentNode.insertBefore(el, end);
                }
            }
        );
        return frag;
    }
}
