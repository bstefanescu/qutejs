// Qute runtime build

const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const buble = require('rollup-plugin-buble');
const uglify = require('rollup-plugin-uglify').uglify;


module.exports = function(project, args) {
    const PROD = args.indexOf('prod') > -1;
    const IE = args.indexOf('ie') > -1;

    const basePlugins = [
        nodeResolve( {preferBuiltins: true} ),
        commonjs(),
        buble({exclude: ["node_modules/**", "**/node_modules/**"]})
    ];

    function webConfig(prod, ie) {
        const index = ie ? 'src/index-ie.js' : 'src/index.js';
        return {
            input: project.file(index),
            external: [ '@qutejs/window' ],
            plugins: [
                ...basePlugins,
                !!prod && uglify()
            ],
            output: {
                format: 'iife',
                file: project.file(`lib/qute${ie?'-ie.':'.'}${prod?'min.js':'js'}`),
                sourcemap: true,
                name: 'Qute',
                globals: {
                    '@qutejs/window': 'window'
                },
            }
        }
    }

    return [
        {
            input: project.file('src/index.js'),
            external: project.runtimeDeps,
            plugins: basePlugins,
            output: [
                {
                    format: 'esm',
                    file: project.file('lib/index.esm.js'),
                    sourcemap: true
                },
                {
                    format: 'cjs',
                    file: project.file('lib/index.cjs.js'),
                    sourcemap: true
                }
            ]
        },
        webConfig(false),
        PROD && webConfig(true),
        IE && webConfig(false, true),
        IE && PROD && webConfig(true, true)
    ];
}
