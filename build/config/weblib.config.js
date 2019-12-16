const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const buble = require('rollup-plugin-buble');
const uglify = require('rollup-plugin-uglify').uglify;

module.exports = function(project, args) {
    const PROD = args.indexOf('prod') > -1;
    var globals = project.config.globals || {};
    var external = project.config.external || [];

    const basePlugins = [
        nodeResolve( {preferBuiltins: true} ),
        commonjs(),
        buble({exclude: ["node_modules/**", "**/node_modules/**"]})
    ];

    function webConfig(prod) {
        return {
            input: project.file('src/index.js'),
            external: [ '@qutejs/window', ... external ],
            plugins: [
                ...basePlugins,
                !!prod && uglify()
            ],
            output: {
                format: 'iife',
                file: project.ws.file(`web/dist/${project.kebabCaseName}-${project.version}.${prod?'min.js':'js'}`),
                sourcemap: true,
                name: project.pascalCaseName,
                globals: {
                    '@qutejs/window': 'window',
                    ... globals
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
        PROD && webConfig(true)
    ]
}
