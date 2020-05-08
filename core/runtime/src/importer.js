import { document } from '@qutejs/window';
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

export function insertScript(url, onload, onerror) {
    if (insertedUrls[url]) {
        onload && onload(url);
    } else {
        var script = document.createElement('script');
        script.setAttribute('src', url);
        script.onload = function() {
            onload && onload(url);
        };
        script.onerror = function() {
            var error = new Error("Failed to fetch script from: " + url);
            error.url = url;
            console.error(msg);
            onerror && onerror(error);
        }
        document.head.appendChild(script);
        insertedUrls[url] = true;
    }
}

export function importScript(script, onload, onerror) {
    var url = resolveScript(script);
    if (url) {
        insertScript(url, onload, onerror);
    }
}


function _importNext(imports, index, onload, onerror) {
    if (index < imports.length) {
        var script = imports[index];
        importScript(script,
            function() {
                _importNext(imports, index+1, onload, onerror);
            },
            onerror
        );
    } else {
        onload && onload(imports);
    }
}

function _importAll(imports, onload, onerror) {
    var cnt = imports.length, errors = [];
    for (var i=0,l=imports.length; i<l; i++) {
        var url = resolveScript(imports[i]);
        if (url) {
            insertScript(url,
                function(url) {
                    cnt--;
                    if (!cnt) {
                        cnt--;
                        onload && onload(imports);
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
        _importNext(imports, 0, onload, onerror);
    } else {
        importScript(imports, onload, onerror);
    }
}

export function importAll(imports, onload, onerror) {
    if (Array.isArray(imports)) {
        _importAll(imports, onload, onerror);
    } else {
        importScript(imports, onload, onerror);
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
/*
function _insertNodes(before, nodes) {
    if (nodes) {
        var parent = before.parentNode;
        for (var i=0,l=nodes.length; i<l; i++) {
            parent.insertBefore(nodes[i], before);
        }
    }
}

function _replaceNodes(start, end, nodes) {
    _deleteNodes(start, end);
    _insertNodes(end, nodes);
}
*/
export function LazyComponent(tag, imports, lookupTag) {
    // return a custom rendering function
    return function(r, xattrs, slots) {
        var frag = document.createDocumentFragment();
        var start = document.createComment('[lazy:'+tag+']');
        var end = document.createComment('[/lazy:'+tag+']');
        frag.appendChild(start);
        //TODO show a spinner?
        frag.appendChild(end);

        if (renderPending) {
            var el = renderPending(r);
            el && end.parentNode.insertBefore(el, end);
        }

        serialImport(imports,
            function() {
                //console.log('Loaded lazy tag', tag);
                var XTag = lookupTag(tag);
                if(!XTag) ERR("Could not resolve lazy component for tag: '%s'", tag);
                var node = r._v(XTag, xattrs, slots);
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



