//TODO relpath to view name and viewname to relpath

import Compiler from '@qutejs/compiler';
import {matchExtensions} from '../utils.js';

const EXT = ['.qute', '.jsq'];

function isQuteFile(file) {
    return matchExtensions(file, EXT);
}


function Styles() {
    this.styles = new Map();
    this.counter = 0;
}
Styles.prototype = {
    add(text, importer) {
        const key = '#qutejs-istyle-'+(++this.counter)+'.css';
        this.styles.set(key, {id: key, css: text, importer: importer});
        return key;
    },
    get(key) {
        return this.styles.get(key);
    },
    forEach(fn) {
        this.styles.forEach(fn);
    }
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


function qute (options = {}) {

    var symbols = options.symbols || null;
    var sourceMap = options.sourceMap || true;
    var styles = new Styles();

    var nodeBuildPlugin;

    return {
        name: 'qutejs-templates',

        buildStart(opts) {
            nodeBuildPlugin = opts.plugins.find(plugin => plugin.name === 'qutejs-node-build');
        },
        // styles are resolved by either quteNodeBuild or quteWebBuild plugins
        resolveId(id, importer) {
            if (id.startsWith('#qutejs-istyle-')) {
                return id;
            }
            return null;
        },
        load(id) {
            if (id.startsWith('#qutejs-istyle-')) {
                const style = styles.get(id);
                if (style) {
                    return style.css;
                }
            }
            return null;
        },
        transform (source, path) {
            if (isQuteFile(path)) {
                return genCode(path, source, symbols, sourceMap, styles);
            }
        },
        api: {
            getInlineStyle(key) {
                return styles.get(key);
            },
            forEachStyle(fn) {
                styles.forEach(fn);
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
