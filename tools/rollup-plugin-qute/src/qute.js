
import InlineStyles from './istyles.js';
import quteTemplates from './qute-templates.js';
import quteDecorators from './qute-decorators.js';
import quteWebBuild from './build/quteWebBuild.js';
import quteNodeBuild from './build/quteNodeBuild.js';
import quteTestBuild from './build/quteTestBuild.js';
import { merge } from './sourcemap/source-map-merge.js';
import { loadPackage } from './build/utils.js';

function invoke(ctx, plugin, method, args) {
    if (method in plugin) {
        return plugin[method].apply(ctx, Array.from(args));
    }
}

function transformHook(ctx, plugin, code, id) {
    let result = invoke(ctx, plugin, 'transform', [code, id]);
    if (result && typeof result === 'object') {
        return result;
    } else if (typeof result === 'string') {
        return { code: result };
    } else {
        return null;
    }
}

function transformChain(ctx, plugins, code, id) {
    let result = null;
    for (let plugin of plugins) {
        if (plugin) { // allow null plugins
            let r = transformHook(ctx, plugin, code, id);
            if (r) {
                if (!result) {
                    result = r;
                } else {
                    if (r.map && result.map) {
                        r.map = merge(result.map, r.map);
                    }
                    result = Object.assign(result, r);
                }
                if (r.code) {
                    code = r.code;
                }
            }
        }
    }
    return result;
}

/**
 * Options:
 * {
 *   src: src,     // the directory containing sources
 *   dist: 'dist',  // the directory where built artifacts are generated
 *   sourceMap: true, // whether or not to genrate sourcemaps when compiling Qute templates and class decorators
 *   templates: null, // possible values are null | false | object. If null the default options are used. If false then template processing is turned off. If an object it will be used as template processing options
 *   decorators: null, // possible values are null | false | object. If null the default options are used. If false then decorators processing is turned off. If an object it will be used as decorators processing options
 *   web: false, // whether or not to build a browser distribution. The defualt is false (a node library will be built)
 *
 * }
 * @param {*} options
 */
export default function qute (options = {}) {
    options = Object.assign({
        src: 'src',
        dist: 'dist',
        sourceMap: true
    }, options);

    let templateOpts = options.templates;
    if (templateOpts == null) {
        // default template options
        templateOpts = {
            sourceMap: !!options.sourceMap
        }
    }

    let decoratorOpts = options.decorators;
    if (decoratorOpts == null) {
        // default decorator options
        decoratorOpts = {
            sourceMap: !!options.sourceMap
        };
    }
    const web = options.web;
    const test = options.test;

    const disableTemplates = templateOpts === false;
    const disableDecorators = decoratorOpts === false;

    let istyles, templatesPlugin, decoratorsPlugin, buildPlugin;
    if (options.templates !== false) {
        istyles = new InlineStyles();
        templatesPlugin = quteTemplates(options.templates, istyles);
    }
    if (options.decorators !== false) {
        decoratorsPlugin = quteDecorators(options.decorators);
    }

    if (web) {
        buildPlugin = quteWebBuild(options, web === true ? {} : web, istyles);
    } else if (test) {
        buildPlugin = quteTestBuild(options, test === true ? {} : test, istyles);
    } else {
        buildPlugin = quteNodeBuild(options, istyles);
    }
    const pkg = loadPackage();

    return {
        name: 'qutejs',

        // node: resolveId, generateBundle
        // web: resolveId, load, transform, renderChunk
        // templates: [resolveId, load, -> only when used standalone], transform,
        // decorators: transform

        buildStart() {
            invoke(this, buildPlugin, 'buildStart', arguments);
        },
        options() {
            return invoke(this, buildPlugin, 'options', arguments);
        },
        outputOptions() {
            return invoke(this, buildPlugin, 'outputOptions', arguments);
        },

        resolveId() {
            return invoke(this, buildPlugin, 'resolveId', arguments);
        },
        load() {
            return invoke(this, buildPlugin, 'load', arguments);
        },

        transform (code, id) {
            return transformChain(this, [buildPlugin, templatesPlugin, decoratorsPlugin], code, id);
        },

        renderChunk() {
            return invoke(this, buildPlugin, 'renderChunk', arguments);
        },

        generateBundle() {
            return invoke(this, buildPlugin, 'generateBundle', arguments);
        },

    }
}
