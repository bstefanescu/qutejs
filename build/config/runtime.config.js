const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const buble = require('rollup-plugin-buble');
const uglify = require('rollup-plugin-uglify').uglify;


module.exports = function(project, args) {
    const PROD = args.indexOf('prod') > -1;
    const webName = project.config.webName || project.pascalCaseName;
    const webFile = project.config.webFile || project.kebabCaseName;

    const basePlugins = [
        nodeResolve( {preferBuiltins: true} ),
        commonjs(),
        buble({exclude: ["node_modules/**", "**/node_modules/**"]})
    ];

    function webConfig(prod) {
        return {
            input: project.file('src/index.js'),
            external: [ '@qutejs/window' ],
            plugins: [
                ...basePlugins,
                !!prod && uglify()
            ],
            output: {
                format: 'iife',
                file: project.ws.file(`web/dist/${webFile}-${project.version}.${prod?'min.js':'js'}`),
                sourcemap: true,
                name: webName,
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
        PROD && webConfig(true)
    ];
}
