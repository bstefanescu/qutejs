/*
Configure rollup and bundle CSS files for web builds
*/
import path from 'path';
import os from 'os';

import MagicString from 'magic-string';

import atImport from 'postcss-import'
import postcssExtendRule from 'postcss-extend-rule';
import postcssVars from 'postcss-advanced-variables';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

import Processor from './postcss-processor.js';
import ThemeResolver from './themes.js';
import { rollupExternalFn, externalFn, PackageCache } from './utils.js';

import InlineStyles from '../istyles.js';


const INJECT_STYLE_FN = `
(function (css, beforeTarget) {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    if (beforeTarget) {
        var target = document.getElementById(beforeTarget);
        if (target) {
            target.parentNode.insertBefore(style, target);
            return;
        }
    }
    (document.head || document.getElementsByTagName('head')[0]).appendChild(style);
})`.trim();

function getInjectSyleCode(css, target) {
    return `${INJECT_STYLE_FN}(${JSON.stringify(css)}, ${target});\n`;
}

function getIncludedCssModules(modules) {
    return Array.from(this.getModuleIds()).reduce((r, id) => {
        if (id.endsWith('.css') || id.endsWith('.pcss')) {
            const module = this.getModuleInfo(id);
            if (module && module.importers) {
                const importers = module.importers;
                for (let importer of importers) {
                    if (modules[importer]) {
                        r.add(id);
                    }
                }
            }
        }
        return r;
    }, new Set());
}

function computePostcssPlugins(userOpts, inject, resolveTheme) {
    // default plugins to use - can be extended using userOpts plugins
    // to remove default plugins use disablePlugins with any combination of
    // 'extend, vars, root, lookup, nested' or 'all' to disable them all
    let plugins = [ atImport({
        resolve(id, basedir, importOptions) {
            let file = resolveTheme(id, basedir, importOptions);
            if (!file) {
                if (userOpts.resolve) {
                    file = userOpts.resolve(id, basedir, importOptions);
                }
            }
            return file || id;
        }
    }) ];
    if (userOpts.useExtend !== false) { // if not explictely disabled use it
        plugins.push(postcssExtendRule(userOpts.cssExtend || void(0)));
    }
    if (userOpts.useVars !== false) { // if not explictely disabled use it
        plugins.push(postcssVars(userOpts.cssVars || {disable: '@import'}));
    }
    if (userOpts.plugins) {
        plugins = plugins.concat(userOpts.plugins);
    }
    if (userOpts.autoprefix) { // apply autprefixer at the end
        plugins.push(autoprefixer());
    }
    // force minimization if inject is true and no minimization was specified
    if (userOpts.minimize || (userOpts.minimize == null && inject)) {
        plugins.push(cssnano(typeof userOpts.minimize === 'object' ? userOpts.minimize : void(0)));
    }
    return plugins;
}

function generateWebFileName(pkg, suffix) {
    let name = pkg.name.replace(/\/_/g, '-');
    if (name.startsWith('@')) {
        name = name.substring(1);
    }
    return name+'-'+pkg.version+(suffix||'.js');
}

function generateWebVarName(pkg, suffix) {
    let name = pkg.name.replace(/\/_/g, '-');
    if (name.startsWith('@')) {
        name = name.substring(1);
    }
    return name.split('-').map(part => part[0].toUpperCase()+part.substring(1)).join('');
}

function generateCssFileName(jsFile, minimize, chunkName) {
    let base = path.basename(jsFile);
    if (base.endsWith('.min.js')) {
        base = base.slice(0,-7);
    } else if (base.endsWith('.js')) {
        base = base.slice(0,-3);
    } else {
        base = base;
    }
    return base +(minimize ? '.min.css' : '.css');
}

function getDefaultThemePackages(pkg) {
    if ((pkg.dependencies && '@qutejs/material' in pkg.dependencies)
        || (pkg.peerDependencies && '@qutejs/material' in pkg.peerDependencies)) {
        return ['@qutejs/material'];
    }
    return [];
}

/**
 * userOpts: {
 *   src: 'src', // the source directory
 *   dist: 'dist', // the dist directory
 *   external: function, // optional funxction to be able to overwrite the internal external function
 *   web: {
 *     type: 'application', // supported values: 'application' | 'component',
 *     forceTreeshake: false, // boolean | [] - you can use true to force tree shake for all modules or an array of package names to force only for mpdule inside these packages
 *     minimize: false, // whether or not to compress generated js and css files
 *     theme: 'default', string || object {name, packages} - packages where to lookup for themes (in the given order) If @qutejs/material is a depoendency it will be automatically added to the array
 *     css: {
 *       inject: true, // boolean
 *       extract: null, // boolean | filename | null
 *       resolve: function, // Optional. A resolve handler to be used by the postcss-import plugin
 *       useExtend: true, // whether or not to use postcss-extend plugin
 *       useVars: true, // whether or not to use postcss-advanced-vars plugin
 *       autoprefix: false, // whether or not to use postcss-advanced-vars plugin
 *       minimize: false, // whether or not to use cssnano plugin to minimize the extracted css file
 *     },
 *     postcss: {
 *       // postcss options if any
 *     }
 *   }
 * }
 * @param {*} userOpts
 * @param {*} istyles
 */
export default function quteWebBuild(userOpts, webOpts, istyles) {
    const pkgCache = new PackageCache();
    const packageRoot = pkgCache.findPackageDir(process.cwd());
    const pkg = pkgCache.load(packageRoot);

    userOpts = Object.assign({
        src: 'src',
        dist: 'dist',
    }, userOpts || {});

    const userCssOpts = webOpts.css || {};
    if (webOpts.minimize && !('minimize' in userCssOpts)) {
        userCssOpts.minimize = true;
    }

    if (!webOpts.theme) {
        webOpts.theme = {name: 'default'};
    } else if (typeof webOpts.theme === 'string') {
        webOpts.theme = {name: webOpts.theme};
    }

    const external = externalFn(userOpts.external);

    const projectType = webOpts.type || 'application';
    const forceTreeshake = webOpts.forceTreeshake || false;
    if (Array.isArray(forceTreeshake)) {
        forceTreeshake = new Set(forceTreeshake);
    }

    let cssInject = userCssOpts.inject;
    const cssExtract = userCssOpts.extract;
    if (!cssInject && !cssExtract) {
        cssInject = true;
    }

    const themeName = webOpts.theme.name || 'default';
    const themeResolver = new ThemeResolver(packageRoot, webOpts.theme.packages || getDefaultThemePackages(pkg));

    const resolveTheme = (id, basedir, importOptions) => {
        if (id === '%theme') {
            return  themeResolver.resolve(themeName);
        } if (id.startsWith('%theme/')) {
            let file = themeResolver.resolve(themeName);
            if (file) {
                const parts = id.split('/');
                parts[0] = file;
                return path.join.apply(path, parts);
            }
        }
        return null;
    }

    const cssPlugins = computePostcssPlugins(userCssOpts, cssInject, resolveTheme);

    return {
        name: 'qutejs-web-build',
        options(opts) {
            const origExternalFn = rollupExternalFn(opts.external);
            opts.external = function(id) {
                if (external) {
                    let r = external(id);
                    if (r != null) {
                        return !!r;
                    }
                }
                // always external
                if (id === '@qutejs/window') return true;
                // do not include qute in component builds
                if (projectType === 'component' && id === '@qutejs/qute') return true;
                return origExternalFn.apply(this, arguments);
            };
            return opts;
        },
        outputOptions(opts) {
            if (!opts.format) {
                opts.format = 'iife';
            }
            if (!opts.globals) {
                opts.globals = {};
            }
            opts.globals['@qutejs/window'] = 'window';
            if (projectType === 'component') {
                opts.globals['@qutejs/runtime'] = 'Qute';
            }
            if (opts.file === 'auto') {
                opts.dir = null;
                opts.file = path.join(userOpts.dist, generateWebFileName(pkg, webOpts.minimize ? '.min.js': '.js'));
            }
            if (!opts.name) {
                opts.name = generateWebVarName(pkg);
            }
            return opts;
        },
        resolveId(id) {
            return InlineStyles.isStyleId(id) ? id : null;
        },
        load(id) {
            if (id.endsWith('.css') || id.endsWith('.pcss')) {
                return `/*!css module: ${id} */`;
            }
        },
        transform(code, id) {
            if (forceTreeshake) {
                let force = false;;
                if (forceTreeshake === true) {
                    force = true;
                } else {
                    const pkg = pkgCache.findAndLoad(id);
                    if (pkg && forceTreeshake.has(pkg.name)) {
                        force = true;
                    }
                }
                if (force) {
                    return { moduleSideEffects: false };
                }
            }
        },
        async renderChunk(code, chunk, opts) {
            if (chunk.type === 'chunk') {
                if (!opts.dir && !opts.file) return;
                const cssFiles = getIncludedCssModules.call(this, chunk.modules);
                if (!cssFiles || !cssFiles.size) return;

                const cssOpts = Object.assign({}, webOpts.postcss || {});
                const moduleSrc = path.relative(packageRoot, chunk.facadeModuleId);
                if (!cssOpts.from) {
                    cssOpts.from = moduleSrc+'.css';
                }
                if (!cssOpts.to) {
                    cssOpts.to = typeof cssExtract === 'string'
                        ? cssExtract : generateCssFileName(opts.file, webOpts.minimize, chunk.name); //? cssExtract : chunk.name+'.css';
                } else if (typeof cssOpts.to === 'function') {
                    cssOpts.to = cssOpts.to(moduleSrc, opts);
                }
                if (cssOpts.map == null) {
                    cssOpts.map = !!opts.sourcemap;
                }
                // avoid generating sourcemap for injected css
                if (cssInject) {
                    cssOpts.map = false;
                }
                const processor =  new Processor(this, cssPlugins, cssOpts);
                // generate CSS content importing all the referenced files
                const inlineCSS = [];
                const cssImports = [];
                for (let file of cssFiles) {
                    let inlineStyle = istyles ? istyles.css(file) : null;
                    if (inlineStyle != null) {
                        inlineCSS.push(inlineStyle.trim());
                    } else {
                        cssImports.push(`@import "${file}";`);
                    }
                }
                const css = cssImports.concat(inlineCSS).join(os.EOL);
                const result = await processor.process(css);
                if (cssExtract) {
                    this.emitFile({
                        type: 'asset',
                        fileName: cssOpts.to,
                        source: result.code
                    });
                    if (cssOpts && cssOpts.map.inline === false) {
                        this.emitFile({
                            type: 'asset',
                            fileName: cssOpts.to+'.map',
                            source: result.map.toString()
                        });
                    }
                } else { // inline css in js code
                    const cssInjectCode = getInjectSyleCode(result.code,
                        typeof cssInject === 'string' ? cssInject : null);
                    const ms = new MagicString(code);
                    ms.prependLeft(0, cssInjectCode);
                    return {
                        code: ms.toString(),
                        map: ms.generateMap()
                    }
                }
            }
        }
    }
}