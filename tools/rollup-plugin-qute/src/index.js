//TODO relpath to view name and viewname to relpath

import Compiler from '@qutejs/compiler';

const EXT = ['.qute', '.jsq'];

function isQuteFile(file) {
    var i = file.lastIndexOf('.');
    if (i > -1) {
        var ext = file.substring(i);
        return EXT.indexOf(ext) > -1;
    }
    return false;
}

function genCode(path, source, symbols, sourceMap) {
    // TODO use symbols to customize compiler
    var out = new Compiler().transpile(source, { sourceMap: sourceMap });
    //console.log("===================\n", out.code, "\n=======================");
    return out;

}


export default function qute (options = {}) {

    var symbols = options.symbols || null;
    var sourceMap = options.sourceMap || true;

    return {
        name: 'qute',
        transform (source, path) {
            if (isQuteFile(path)) {
                return genCode(path, source, symbols, sourceMap);
            }
        }
    }
}
