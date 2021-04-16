/*
Configure rollup and bundle CSS files for web builds
*/
import path from 'path';

import MagicString from 'magic-string';

import atImport from 'postcss-import'
import postcssExtendRule from 'postcss-extend-rule';
import postcssVars from 'postcss-advanced-variables';
import autoprefixer from 'autoprefixer';
import cssnano from 'cssnano';

import Processor from './postcss-processor.js';
import toExternalFn from './external.js';
import ThemeResolver from './themes.js';
import { findPackageDir } from './utils.js';

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

function getIncludedCssModules(modules, forceTreeshake) {
    return Array.from(this.getModuleIds()).reduce((r, id) => {
        if (id.endsWith('.css') || id.endsWith('.pcss')) {
            const module = this.getModuleInfo(id);
            if (module && module.importers) {
                if (forceTreeshake) {
                    const importers = module.importers;
                    for (let importer of importers) {
                        if (modules[importer]) {
                            r.add(id);
                        }
                    }
                } else {
                    r.add(id);
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
                if (userOpts.resolveCSS) {
                    file = userOpts.resolveCSS(id, basedir, importOptions);
                }
            }
            return file || id;
        }
    }) ];
    if (userOpts.cssExtend !== false) { // if not explictely disabled use it
        plugins.push(postcssExtendRule(userOpts.cssExtend || void(0)));
    }
    if (userOpts.cssVars !== false) { // if not explictely disabled use it
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

export default function quteWebBuild(userOpts) {
    if (!userOpts) userOpts = {};
    const projectType = userOpts.type || 'application';
    const forceTreeshake = userOpts.forceTreeshake || false;
    const cssPackages = (userOpts.packages || ['@qutejs/material']).map(pkg => path.sep+pkg+path.sep);

    let cssInject = userOpts.inject;
    const cssExtract = userOpts.extract;
    if (!cssInject && !cssExtract) {
        cssInject = true;
    }

    const themeName = userOpts.theme || 'default';
    const packageRoot = findPackageDir();
    const themeResolver = new ThemeResolver(packageRoot, cssPackages);

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

    const cssPlugins = computePostcssPlugins(userOpts, cssInject, resolveTheme);

    return {
        name: 'quteWebBuild',
        options(opts) {
            const origExternalFn = toExternalFn(opts.external);
            opts.external = function(id) {
                if (id === '@qutejs/window') return true; // always external
                if (projectType === 'component' && id === '@qutejs/qute') return true; // do not include qute in component builds
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
        },
        transform(code, id) {
            if (id.endsWith('.css') || id.endsWith('.pcss')) {
                return `/*!css module: ${path.relative(packageRoot, id)} */`;
            }
            if (forceTreeshake) {
                const isQuteLib = !!cssPackages.find(pkg => id.indexOf(pkg) > -1);
                if (isQuteLib) {
                    return { moduleSideEffects: false };
                }
            }
        },
        async renderChunk(code, chunk, opts) {
            if (chunk.type === 'chunk') {
                if (!opts.dir && !opts.file) return;
                const cssFiles = getIncludedCssModules.call(this, chunk.modules, forceTreeshake);
                if (!cssFiles || !cssFiles.size) return;

                const cssOpts = Object.assign({}, userOpts.postcss || {});
                const moduleSrc = path.relative(packageRoot, chunk.facadeModuleId);
                if (!cssOpts.from) {
                    cssOpts.from = moduleSrc+'.css';
                }
                if (!cssOpts.to) {
                    cssOpts.to = typeof cssExtract === 'string'
                        ? cssExtract : chunk.name+'.css';
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
                const result = await processor.processFiles(cssFiles);
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