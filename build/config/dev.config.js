const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const buble = require('rollup-plugin-buble');
const uglify = require('rollup-plugin-uglify').uglify;


module.exports = function(project, args) {
    const PROD = args.indexOf('prod') > -1;
    const ALL = args.indexOf('all') > -1;

    const basePlugins = [
        nodeResolve( {preferBuiltins: true} ),
        commonjs(),
        buble({exclude: ["node_modules/**", "**/node_modules/**"]})
    ];

    function webConfig(prod, all) {
    	var index = 'src/index.js';
    	var libName = 'qute-dev';
    	if (all) {
    		index = 'src/index-all.js';
    		libName = 'qute-dev-all'
    	}
        return {
            input: project.file(index),
            external: [ '@qutejs/window' ],
            plugins: [
                ...basePlugins,
                !!prod && uglify()
            ],
            output: {
                format: 'iife',
                file: project.file(`lib/${libName}.${prod?'min.js':'js'}`),
                sourcemap: true,
                name: 'Qute',
                globals: {
                    '@qutejs/window': 'window'
                },
            }
        }
    }

    return [
    	// the dev package is not usable as esm or cjs - only web dist.
        webConfig(false, ALL),
        PROD && webConfig(true, ALL)
    ];
}
