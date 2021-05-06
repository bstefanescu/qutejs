//TODO relpath to view name and viewname to relpath

import Compiler from '@qutejs/compiler';
import {matchExtensions} from './utils.js';
import InlineStyles from './istyles.js';

const EXT = ['.qute', '.jsq'];

function isQuteFile(file) {
    return matchExtensions(file, EXT);
}


function genCode(path, source, symbols, sourceMap, styles) {
    // TODO use symbols to customize compiler
    let styleCnt = 0;
    let out = new Compiler().transpile(source, {
        sourceMap: sourceMap,
        compileStyle: function(compiler, attrs, text) {
            const key = styles.add(text, path);
            return 'import "'+key+'";';
        }
    });
    //console.log("===================\n", out.code, "\n=======================");
    return out;

}


export default function quteTemplates(options, istyles) {
    if (typeof options !== 'object') options = {};
    var symbols = options.symbols || null;
    var sourceMap = options.sourceMap == null ? true : !!options.sourceMap;

    if (!istyles) {
        istyles = new InlineStyles();
    }

    return {
        name: 'qutejs-templates',
        resolveId(id, importer) {
            if (InlineStyles.isStyleId(id)) {
                return id;
            }
            return null;
        },
        load(id) {
            if (InlineStyles.isStyleId(id)) {
                return istyles.css(id);
            }
            return null;
        },
        transform (source, path) {
            if (isQuteFile(path)) {
                return genCode(path, source, symbols, sourceMap, istyles);
            }
        }
    }
}
