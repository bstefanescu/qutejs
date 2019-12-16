'use strict';

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var Compiler = _interopDefault(require('@qutejs/compiler'));

//TODO relpath to view name and viewname to relpath

const EXT = ['.qute', '.jsq'];

function isQuteFile(file) {
    var i = file.lastIndexOf('.');
    if (i > -1) {
        var ext = file.substring(i);
        return EXT.indexOf(ext) > -1;
    }
    return false;
}

function genCode(path, source, symbols) {
    // TODO use symbols to customize compiler
    var out = new Compiler().transpile(source);
    //console.log("===================\n", out, "\n=======================");
    return out;

}


function qute (options = {}) {

    var symbols = options.symbols || null;

    return {
        name: 'qute',
        transform (source, path) {
            if (isQuteFile(path)) {
                return {
                    code: genCode(path, source),
                    map: null // we don't move code inside the file
                }
            }
        }
    }
}

module.exports = qute;
//# sourceMappingURL=index.cjs.js.map
