import path from 'path';
import process from 'process';
import fs from 'fs';

import toExternalFn from './external.js';

import { findPackageDir } from './utils.js';

/**
 * The node build plugin is building a Qute app or component as a reusable node nmodule, that can be imported by other Qute apps or components.
 * The esm format is used since Qute libraries are not expected to be used outside ESM packages.
 *
 * The CSS files are marked as external to avoid importing the content in the js file and then they are copied
 * alogn with all the js files in `./dist/esm`.
 * You can control the `./src` and `./dist` folder folder using the src and dist properties.
 * @param {*} userOpts
 */
export default function quteNodeBuild(userOpts) {

    const opts = Object.assign({
        src: './src',
        dist: './dist'
    }, userOpts);

    //TODO use windows safe paths
    const srcDir = path.resolve(opts.src);
    const targetDir = path.join(path.resolve(opts.dist), 'esm');
    const files = new Map();

    const packageRoot = findPackageDir();

    return {
        name: 'quteNodeBuild',
        options(opts) {
            const origExternalFn = toExternalFn(opts.external);
            const pkg = require(path.join(packageRoot, 'package.json'));
            const deps = Object.assign(pkg.dependencies || {}, pkg.peerDependencies || {});
            deps['@qutejs/window'] = true; // make sure this package in external (it must always be external)
            opts.external = function(id) {
                if (id in deps || id.endsWith('.css') || id.endsWith('.pcss')) return true;
                return origExternalFn.apply(this, arguments);
            };
            return opts;
        },
        outputOptions(opts) {
            if (!opts.dir) {
                opts.dir = targetDir;
                opts.file = void(0);
            }
            if (!opts.format) {
                opts.format = 'esm';
            }
            opts.preserveModules = true;
            opts.preserveModulesRoot = path.relative(packageRoot, srcDir);
        },
        async resolveId(source, importer) {
            // copy CSS files too when buildiing the library
            if (source.endsWith('.css') || source.endsWith('.pcss')) {
                if (importer && importer.startsWith(srcDir)) {
                    // copy only owned css files (located in src)
                    const sourceFile = path.resolve(path.dirname(importer), source);
                    const relPath = path.relative(srcDir, sourceFile);
                    let targetFile = files.get(sourceFile);
                    if (!targetFile) {
                        targetFile = path.join(targetDir, relPath);
                        files.set(sourceFile, targetFile);
                        this.addWatchFile(sourceFile);
                    }
                }
                // mark it as external and use original import path
                return {id: source, external: true};
            }
        },
        generateBundle() {
            files.forEach((targetFile, sourceFile) => {
                fs.mkdirSync(path.dirname(targetFile), {recursive: true});
                fs.writeFileSync(targetFile, fs.readFileSync(sourceFile));
                //console.log('### copy css', sourceFile, '=>', targetFile);
            })
        }
    }
}