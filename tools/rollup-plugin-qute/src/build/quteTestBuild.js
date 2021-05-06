import multiEntryPlugin from '@rollup/plugin-multi-entry';
import InlineStyles from '../istyles.js';
import { findPackageDir, externalFn } from './utils.js';

/**
 * A rollup build to generate a test bundle.
 * This build is taking multiple entry points (the test files) and will generate
 * a single output file (by default in esm format).
 * The CSS files arre skipped (CSS imports removed)
 */
export default function quteTestBuild(opts = {}, testOpts, istyles) {
    const external = externalFn(opts.external);
    const packageRoot = findPackageDir();
    const multiEntry = multiEntryPlugin(testOpts);

    return {
        name: 'qutejs-test-build',
        options(opts) {
            opts = multiEntry.options.call(this, opts) || opts;
            // external is the same as in quteNodeBuiild
            opts.external = function(id) {
                if (external) {
                    // custom external function
                    let r = external(id);
                    if (typeof r != null) {
                        return !!r;
                    }
                }
                // the multi-entry input is not external
                if (id === 'multi-entry.js') return false;
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
            opts = multiEntry.outputOptions.call(this, opts) || opts;
            if (!opts.format) {
                opts.format = 'esm';
            }
            return opts;
        },
        buildStart(opts) {
            multiEntry.buildStart.call(this, opts);
        },
        // same as in quteWebBuild
        resolveId(id, importer) {
            if (InlineStyles.isStyleId(id)) {
                return id;
            } else {
                let r = multiEntry.resolveId.call(this, id, importer);
                return r;

            }
        },
        // same as in quteWebBuild
        load(id) {
            if (id.endsWith('.css') || id.endsWith('.pcss')) {
                return `/*!css module: ${id} */`;
            } else {
                return multiEntry.load.call(this, id);
            }
        }
    }
}