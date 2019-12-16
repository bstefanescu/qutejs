const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const uglify = require('rollup-plugin-uglify').uglify;

module.exports = function(project, args) {
    var basePlugins = [
        nodeResolve( {preferBuiltins: true} ),
        commonjs()
    ];
    function webConfig(input, fileName, prod) {
        return {
            input: project.file(input),
            external: [ '@qutejs/window' ],
            plugins: [
                ... basePlugins,
                !!prod && uglify()
            ],
            output: {
                format: 'iife',
                file: project.ws.file(`web/dist/${fileName}-${project.version}.${prod?'min.js':'js'}`),
                sourcemap: true,
                name: 'Qute',
                globals: {
                    '@qutejs/window': 'window'
                }
            }
        }
    }

    function devConfig() {
        return {
            input: project.file('src/qute-dev-all'),
            external: [ '@qutejs/window' ],
            plugins: basePlugins,
            output: {
                format: 'iife',
                file: project.ws.file(`web/dev/qute-dev-all.js`),
                sourcemap: true,
                name: 'Qute',
                globals: {
                    '@qutejs/window': 'window'
                }
            }
        }
    }

    const PROD = args.indexOf('prod') > -1;
    const DEV = args.indexOf('dev') > -1;

    return DEV ? devConfig() :
        [
            webConfig('src/qute-all.js', 'qute-all'),
            webConfig('src/qute-dev-all.js', 'qute-dev-all'),
            PROD && webConfig('src/qute-all.js', 'qute-all', true),
            PROD && webConfig('src/qute-dev-all.js', 'qute-dev-all', true)
        ];

}

