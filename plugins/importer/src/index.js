import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

/**
 * Imports remote scripts.
 We are not using Promise to not depend on polyfill
 */

var customResolve = null;
var renderError = null;
var renderPending = null;
const exportMap = {};

function resolvePath(base, path) {
    base = base.substring(1); // remove the leading /
    const pathParts = path.split('/');
    const baseParts = base ? base.split('/') : [];
    baseParts.pop(); // remove the last segment
    for (var i=0,l=pathParts.length; i<l; i++) {
        var part = pathParts[i];
        if (!part || part === '.') {
            continue;
        } else if (part === '..') {
            if (baseParts.length === 0) throw new Error('Could not resolve path: "'+ path+'" against "'+ base+'"');
            baseParts.pop();
        } else {
            baseParts.push(part);
        }
    }
    return '/'+baseParts.join('/');
}

// default resolver
function resolveScript(nameOrUrl) {
    if (customResolve) {
        var r = customResolve(nameOrUrl);
        if (r !== false) {
            return r;
        }
    }
    if (nameOrUrl.indexOf('://') > -1) return nameOrUrl;

    if (nameOrUrl.charAt(0) === '@' || nameOrUrl.indexOf('/') === -1) {
        return 'https://unpkg.com/'+nameOrUrl;
    } else {
        const location = window.location;
        // resolve relative to the current window location if any
        if (nameOrUrl.charAt(0) === '/') {
            return location.protocol+'//'+location.host+nameOrUrl
        } else {
            return resolvePath(location.pathname || '/', nameOrUrl)
        }
    }
}

function insertScript(url, from, onload, onerror) {
    if (!from) from = url;
    if (from in exportMap) {
        onload && onload(exportMap[from]);
    } else {
        let document = window.document;
        var script = document.createElement('script');
        script.setAttribute('src', url);
        if (from != url) {
            script.setAttribute('data-import-from', from);
        }
        script.onload = function() {
            // the script should have been registered by calling Qute.import(component) from the script itself
            // for non Qute script we cannot get the script output.
            var scriptObj = exportMap[from];
            if (scriptObj == null) {
                // not a qute component - so we don't know how to get the script output.
                exportMap[from] = scriptObj = true;
            }
            onload && onload(scriptObj);
        };
        script.onerror = function() {
            var error = new Error("Failed to fetch script from: " + url);
            error.url = url;
            console.error(error);
            onerror && onerror(error);
        }
        document.head.appendChild(script);
    }
}

function importScript(script, onload, onerror) {
    var url = resolveScript(script);
    if (url) {
        insertScript(url, script, onload, onerror);
    }
}


function _importNext(imports, index, result, onload, onerror) {
    if (index < imports.length) {
        var script = imports[index];
        importScript(script,
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
    var cnt = imports.length, errors = [], result = {};
    for (var i=0,l=imports.length; i<l; i++) {
        var from = imports[i];
        var url = resolveScript(from);
        if (url) {
            insertScript(url,
                from,
                null,
                function(exportVar) {
                    result[from] = exportVar;
                    cnt--;
                    if (!cnt) {
                        cnt--;
                        onload && onload(result);
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

function serialImport(imports, onload, onerror) {
    if (Array.isArray(imports)) {
        _importNext(imports, 0, {}, onload, onerror);
    } else {
        importScript(imports, onload, onerror);
    }
}

function importAll(imports, onload, onerror) {
    if (Array.isArray(imports)) {
        _importAll(imports, onload, onerror);
    } else {
        importScript(imports, onload, onerror);
    }
}

function setImporterOptions(opts) {
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

function LazyComponent(location) {
    // return a render function that will inject the component when loaded
    return function renderLazyComponent(r, xattrs, slots) {
        let document = window.document;
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
            function(result) {
                if(!result) throw new Error("Could not resolve lazy component at '"+ location +"'");
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
                throw new Error('Failed to load lazy component from "'+location+'"');
            }
        );
        return frag;
    }
}

// ----------- import API -------------

function registerComponent(component) {
    const script = window.document.currentScript;
    if (!script) throw new Error('Qute.import must only be called while a component imported trough a script tag is intiializaing.');
    const importName = script.getAttribute('data-import-from') || script.src;
    return (exportMap[importName] = component);
}

function importComponent(componentOrFactory) {
    if (arguments.length > 1) {
        serialImport(Array.prototype.slice.call(arguments, 1),
        result => {
            const Comp = componentOrFactory.apply(null, result);
            if (Comp == null) {
                throw new Error('A Component factory must return a non null object');
            }
            registerComponent(Comp);
        },
        error => {
            throw error;
        });
    } else {
        registerComponent(componentOrFactory);
    }
}

// we augment the Qute api with an import function and exports property
Qute.import = importComponent;

export {
    insertScript, importScript,
    serialImport, importAll,
    setImporterOptions,
    importComponent,
    exportMap as exports,
    LazyComponent
}
