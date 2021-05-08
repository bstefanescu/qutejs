import path from 'path';
import fs from 'fs';

import walk from 'fs-walker';

import { findPackageDir, externalFn } from './utils.js';
import InlineStyles from '../istyles.js';

/**
 * The node build plugin is building a Qute app or component as a reusable node nmodule, that can be imported by other Qute apps or components.
 * The esm format is used since Qute libraries are not expected to be used outside ESM packages.
 *
 * The CSS files are marked as external to avoid importing the content in the js file and then they are copied
 * alogn with all the js files in `./dist/esm`.
 * You can control the `./src` and `./dist` folder folder using the src and dist properties.
 * @param {*} userOpts
 */

 function makeTargetImportPath(importer, importee, srcDir, targetDir) {
    const sourceFile = path.resolve(path.dirname(importer), importee);
    return makeTargetPath(sourceFile, srcDir, targetDir);
 }

function makeTargetPath(sourceFile, srcDir, targetDir) {
    const relPath = path.relative(srcDir, sourceFile);
    return path.join(targetDir, relPath);
}


/**
 * opts: {
 *   src: 'src',
 *   dist: 'dist',
 *   external?
 * }
 * @param {*} opts
 */
export default function quteNodeBuild(opts = {}, istyles) {
    const packageRoot = findPackageDir();
    const srcDir = path.resolve(opts.src || 'src');
    let targetDir;
    const external = externalFn(opts.external);
    const formats = {
        'cjs': 'cjs',
        'es': 'esm',
        'esm': 'esm',
        'module': 'esm'
    }
    return {
        name: 'qutejs-node-build',
        options(opts) {
            opts = Object.assign({},opts);
            opts.external = function(id) {
                if (external) {
                    // custom external function
                    let r = external(id);
                    if (typeof r != null) {
                        return !!r;
                    }
                }
                // files inside the packageRoot (but not in node_modules dependencies) are not external
                if (id === '.' || id === '..' || id.startsWith('./') || id.startsWith('../')
                    || (id.startsWith(packageRoot) && id.indexOf('/node_modules/') === -1)) {
                    return false;
                }
                // all other ids are external
                return true;
            };
            return opts;
        },
        outputOptions(opts) {
            opts = Object.assign({},opts);
            let format;
            if (!opts.format) {
                opts.format = format = 'esm';
            } else {
                format = formats[opts.format];
                if(!format) {
                    this.error('Invalid "output.format". You should use either esm or cjs when building a Qute library')
                }
            }
            if (opts.dir === 'auto') {
                targetDir = path.join(path.resolve(opts.dist || 'dist'), format);
                opts.dir = targetDir;
                opts.file = void(0);
            } else if (opts.dir) {
                targetDir = opts.dir;
            }
            opts.preserveModules = true;
            opts.preserveModulesRoot = path.relative(packageRoot, srcDir);
            return opts;
        },
        resolveId(source, importer) {
            // we mark all css files as external and will copy source css in generateBundle
            if (source.endsWith('.css') || source.endsWith('.pcss')) {
                if (InlineStyles.isStyleId(source)) {
                    source = './'+source;
                }
                return { id: source, external: true };
            }
        },
        generateBundle() {
            const filter = {
                file: function(stats) {
                  return stats.name.endsWith('.css') || stats.name.endsWith('.pcss');
                }
            }
            // copy css files from src dir to dist dir
            walk.files(srcDir, filter, stats => {
                const sourceFile = stats.fullname;
                const targetFile = makeTargetPath(sourceFile, srcDir, targetDir);
                fs.mkdirSync(path.dirname(targetFile), { recursive: true }); // from node 10.12.0
                fs.writeFileSync(targetFile, fs.readFileSync(sourceFile));
            });
            // extract inline styles
            istyles && istyles.forEach(style => {
                const targetFile = makeTargetImportPath(style.importer, style.id, srcDir, targetDir);
                fs.mkdirSync(path.dirname(targetFile), { recursive: true }); // from node 10.12.0
                fs.writeFileSync(targetFile, style.css);
            });

        }
    }
}