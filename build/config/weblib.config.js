const fs = require('fs');

const commonjs = require('@rollup/plugin-commonjs');
const nodeResolve = require('@rollup/plugin-node-resolve').nodeResolve;
const buble = require('@rollup/plugin-buble');
const terser = require('rollup-plugin-terser').terser;

module.exports = function(project, args) {
    const PROD = args.indexOf('prod') > -1;
    var globals = project.config.globals || {};
    var external = project.config.external || [];
    var webFileName = project.kebabCaseName.replace('qutejs-', 'qute-');

    const basePlugins = [
        nodeResolve( {preferBuiltins: true} ),
        commonjs(),
        buble({exclude: ["node_modules/**", "**/node_modules/**"]})
    ];

    function webConfig(prod) {
        // try web-index.js first
        let input = project.file('src/index-web.js');
        if (!fs.existsSync(input)) {
            input = project.file('src/index.js');
        }
        return {
            input: input,
            external: [ '@qutejs/window', ... external ],
            plugins: basePlugins,
            output: {
                format: 'iife',
                file: project.file(`dist/${webFileName}.${prod?'min.js':'js'}`),
                sourcemap: true,
                name: project.pascalCaseName.replace('Qutejs', 'Qute'),
                globals: {
                    '@qutejs/window': 'window',
                    ... globals
                },
                plugins: [
                    !!prod && terser()
                ],
                interop: id => {
                    return id === '@qutejs/window' || id === '@qutejs/runtime' ? 'default' : 'auto';
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
                /* we don't need a cjs version
                {
                    format: 'cjs',
                    file: project.file('dist/cjs/index.js'),
                    sourcemap: true
                }
                */
            ]
        },
        webConfig(false),
        PROD && webConfig(true)
    ]
}
