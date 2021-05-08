// Qute runtime build

const commonjs = require('@rollup/plugin-commonjs');
const nodeResolve = require('@rollup/plugin-node-resolve').nodeResolve;
const buble = require('@rollup/plugin-buble');
const terser = require('rollup-plugin-terser').terser;


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
            plugins: basePlugins,
            output: {
                format: 'iife',
                file: project.file(`dist/qute${ie?'-ie.':'.'}${prod?'min.js':'js'}`),
                sourcemap: true,
                name: 'Qute',
                globals: {
                    '@qutejs/window': 'window'
                },
                plugins: [
                    !!prod && terser()
                ],
                interop: id => {
                    return id === '@qutejs/window' ? 'default' : 'auto';
                }
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
                    file: project.file('dist/esm/index.js'),
                    sourcemap: true
                },
                // TODO we don't want to generate a cjs version ?
                {
                    format: 'cjs',
                    file: project.file('dist/cjs/index.js'),
                    sourcemap: true,
                    exports: 'auto'
                }
            ]
        },
        webConfig(false),
        PROD && webConfig(true),
        IE && webConfig(false, true),
        IE && PROD && webConfig(true, true)
    ];
}
