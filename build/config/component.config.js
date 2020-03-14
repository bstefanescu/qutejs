const replace = require('@rollup/plugin-replace');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const buble = require('rollup-plugin-buble');
const uglify = require('rollup-plugin-uglify').uglify;

//NOTE: replace and external are only used by i18n

// we need to avoid requiring qute for projects that don't depend on rollup-plugin-qute
// since after a clean the rollup-plugin-qute link is removed from node_modules
// instead we load qute and postcss only if needed - see hasJSQ below
//const postcss = require('rollup-plugin-postcss');
//const qute = require('@qutejs/rollup-plugin-qute');

module.exports = function(project, args) {
    const PROD = args.indexOf('prod') > -1;
    var globals = project.config.globals || {};
    var external = project.config.external || project.runtimeDeps;
    var input = project.file(project.config.input || 'src/index.jsq');
    var webFileName = project.kebabCaseName.replace('qutejs-', 'qute-');

    // if the project is not in components group directory then the project doesn't need postcss and qute rollup plugins
    hasJSQ = project.group === 'components';


    const basePlugins = [
        replace({ 'process.env.NODE_ENV': '"production"' }), // used by polyglot
        nodeResolve( {preferBuiltins: true} ),
        commonjs(),
        hasJSQ && require('rollup-plugin-postcss')({inject: false}),
        hasJSQ && require('@qutejs/rollup-plugin-qute')(),
        buble({exclude: ["node_modules/**", "**/node_modules/**"], include: ["**/*.js", "**/*.jsq"]})
    ];

    function webConfig(prod) {
        return {
            input: input,
            external: external,
            plugins: [
                ...basePlugins,
                prod && uglify()
            ],
            output: {
                format: 'iife',
                file: project.file(`lib/${webFileName}.${prod?'min.js':'js'}`),
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
            external: external,
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

