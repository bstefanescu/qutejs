const replace = require('@rollup/plugin-replace');
const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');
const buble = require('@rollup/plugin-buble');
const uglify = require('rollup-plugin-uglify').uglify;

//NOTE: replace and external are only used by i18n

module.exports = function(project, args) {
    const PROD = args.indexOf('prod') > -1;
    var globals = project.config.globals || {};
    var external = project.config.external || project.runtimeDeps;
    var input = project.file('src/index.js');
    var inputWeb = project.file('src/index-web.js');
    // project.file(project.config.input || 'src/index.jsq');
    // var inputWeb = project.config.webInput ? project.file(project.config.webInput) : input;
    var webFileName = project.kebabCaseName.replace('qutejs-', 'qute-');

    // we need to avoid requiring qute in global section for projects that don't depend on rollup-plugin-qute
    // since after a clean the rollup-plugin-qute link is removed from node_modules
    // instead we load qute and postcss only if needed - see hasJSQ below
    const postcss = require('rollup-plugin-postcss');
    const qute = require('@qutejs/rollup-plugin-qute');

    const basePlugins = [
        replace({ 'process.env.NODE_ENV': '"production"' }), // used by polyglot
        nodeResolve( {preferBuiltins: true} ),
        commonjs({
            include: ['node_modules/**'],
        }),
        postcss({
            inject: qute.injectStyle,
            plugins: [require('cssnano')()]
        }),
        qute(),
        qute.decorators(),
        buble({
            exclude: ["node_modules/**", "**/node_modules/**"],
            include: ["**/*.js", "**/*.jsq"]
        })
    ];

    function webConfig(prod) {
        return {
            input: inputWeb,
            external: external,
            plugins: [
                ...basePlugins,
                prod && uglify()
            ],
            output: {
                format: 'iife',
                file: project.file(`lib/${webFileName}.${prod?'min.js':'js'}`),
                sourcemap: true,
                name: project.pascalCaseName.replace('Qutejs', 'Qute'),
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

