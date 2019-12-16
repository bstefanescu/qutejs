const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const buble = require('rollup-plugin-buble');
const uglify = require('rollup-plugin-uglify').uglify;

// we need to avoid requiring qute for projects that don't depend on rollup-plugin-qute
// since after a clean the rollup-plugin-qute link is removed from node_modules
// instead we load qute and postcss only if needed - see hasJSQ below
//const postcss = require('rollup-plugin-postcss');
//const qute = require('@qutejs/rollup-plugin-qute');

module.exports = function(project, args) {
    const PROD = args.indexOf('prod') > -1;
    var globals = project.config.globals || {};
    var input = project.file(project.config.input || 'src/index.jsq');

    var webFilePrefix = project.ws.file(`web/dist/${project.kebabCaseName}-${project.version}`);

    // if the project is not in components group directory then the project doesn't need postcss and qute rollup plugins
    hasJSQ = project.group === 'components';


    const basePlugins = [
        nodeResolve( {preferBuiltins: true} ),
        commonjs(),
        hasJSQ && require('rollup-plugin-postcss')({inject: false}),
        hasJSQ && require('@qutejs/rollup-plugin-qute')(),
        buble({exclude: ["node_modules/**", "**/node_modules/**"], include: ["**/*.js", "**/*.jsq"]})
    ];

    function webConfig(prod) {
        return {
            input: input,
            external: project.runtimeDeps,
            plugins: [
                ...basePlugins,
                prod && uglify()
            ],
            output: {
                format: 'iife',
                file: `${webFilePrefix}.${prod?'min.js':'js'}`,
                sourcemap: true,
                name: project.pascalCaseName,
                globals: {
                    '@qutejs/window': 'window',
                    '@qutejs/runtime': 'Qute',
                    ... globals
                }
            }
        }
    }

    return [
        {
            input: input,
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

