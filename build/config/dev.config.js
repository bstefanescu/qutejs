const commonjs = require('@rollup/plugin-commonjs');
const nodeResolve = require('@rollup/plugin-node-resolve').nodeResolve;
const buble = require('@rollup/plugin-buble');
const terser = require('rollup-plugin-terser').terser;


module.exports = function(project, args) {
    const PROD = args.indexOf('prod') > -1;

    const basePlugins = [
        nodeResolve( {preferBuiltins: true} ),
        commonjs(),
        buble({
            // meriyah must be transpiled
            include: [
                "src/**",
                "../../core/compiler/node_modules/meriyah/**",
                "web/dev/src/**",
                "core/compiler/node_modules/meriyah/**"]
        })
    ];

    function webConfig(prod) {
    	var index = 'src/index.js';
    	var libName = 'qute-dev';
        return {
            input: project.file(index),
            external: [ '@qutejs/window' ],
            plugins: basePlugins,
            output: {
                format: 'iife',
                file: project.file(`dist/${libName}.${prod?'min.js':'js'}`),
                sourcemap: true,
                name: 'Qute',
                globals: {
                    '@qutejs/window': 'window'
                },
                plugins: [
                    !!prod && terser()
                ]
            }
        }
    }

    return [
    	// the dev package is not usable as esm or cjs - only web dist.
        webConfig(false),
        PROD && webConfig(true)
    ];
}
