//TODO relpath to view name and viewname to relpath

import Compiler from '@qutejs/compiler';
import {matchExtensions} from './utils.js';

const EXT = ['.qute', '.jsq'];

function isQuteFile(file) {
    return matchExtensions(file, EXT);
}


function Styles() {
    this.styles = new Map();
    this.counter = 0;
}
Styles.prototype = {
    add(text) {
        const key = '#qutejs-style-'+(++this.counter)+'.css';
        this.styles.set(key, text);
        return key;
    },
    get(key) {
        return this.styles.get(key);
    }
}

function genCode(path, source, symbols, sourceMap, styles) {
    // TODO use symbols to customize compiler
    let styleCnt = 0;
    let out = new Compiler().transpile(source, {
        sourceMap: sourceMap,
        compileStyle: function(compiler, attrs, text) {
            const key = styles.add(text);
            return 'import "'+key+'";';
        }
    });
    //console.log("===================\n", out.code, "\n=======================");
    return out;

}


function qute (options = {}) {

    var symbols = options.symbols || null;
    var sourceMap = options.sourceMap || true;
    var styles = new Styles();

    return {
        name: 'qute',
        resolveId(id, importer) {
            if (id.startsWith('#qutejs-style-')) return id;
            return null;
        },
        load(id) {
            if (id.startsWith('#qutejs-style-')) {
                const content = styles.get(id);
                if (content) {
                    return content;
                }
            }
            return null;
        },
        transform (source, path) {
            if (isQuteFile(path)) {
                return genCode(path, source, symbols, sourceMap, styles);
            }
        }
    }
}

qute.injectStyle = function(styleVar, id) {
    const beforeTarget = this.injectBefore; // this is the postcss options object
    let code = "\nimport injectStyle from '@qutejs/runtime/lib/inject-style.js';\n";
    if (beforeTarget) {
        return code + `injectStyle(${styleVar}, ${JSON.stringify(beforeTarget)});\n`;
    } else {
        return code + `injectStyle(${styleVar});\n`;
    }
}


export default qute;
