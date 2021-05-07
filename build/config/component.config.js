const replace = require('@rollup/plugin-replace');
const commonjs = require('@rollup/plugin-commonjs');
const nodeResolve = require('@rollup/plugin-node-resolve').nodeResolve;
const buble = require('@rollup/plugin-buble');
const terser = require('rollup-plugin-terser').terser;

//NOTE: replace and external are only used by i18n
//TODO: remove globals, external

module.exports = function(project, args) {
    const PROD = args.indexOf('prod') > -1;
    var globals = project.config.globals || {};
    var external = project.config.external || project.runtimeDeps;
    var input = project.file('src/index.js');
    var inputWeb = project.file('src/index-web.js');
    // project.file(project.config.input || 'src/index.jsq');
    // var inputWeb = project.config.webInput ? project.file(project.config.webInput) : input;
    var webFileName = project.kebabCaseName.replace('qutejs-', 'qute-');

    const qute = require('@qutejs/rollup-plugin-qute');

    function basePlugins(quteConfig = {}) {
        if (quteConfig.web) {
            quteConfig.type = 'component';
        }
        return [
            replace({
                values: {'process.env.NODE_ENV': '"production"'},
                preventAssignment: true
            }), // used by polyglot
            qute(quteConfig),
            nodeResolve( {preferBuiltins: true} ),
            commonjs({
                include: ['**/node_modules/**', 'node_modules/**']
            }),
            quteConfig.web && buble({
                objectAssign: 'Object.assign',
                //exclude: ["node_modules/**", "**/node_modules/**"],
                include: ["**/*.js", "**/*.jsq"]
            })
        ];
    }

    function webConfig(prod) {
        return {
            input: inputWeb,
            external: external,
            plugins: basePlugins({web:true}),
            output: {
                format: 'iife',
                file: project.file(`dist/${webFileName}.${prod?'min.js':'js'}`),
                sourcemap: true,
                name: project.pascalCaseName.replace('Qutejs', 'Qute'),
                globals: {
                    '@qutejs/window': 'window',
                    '@qutejs/runtime': 'Qute',
                    ... globals
                },
                plugins: [
                    prod && terser()
                ]
            }
        }
    }

    return [
        {
            input: input,
            external: external,
            plugins: basePlugins(),
            output: {
                format: 'esm',
                dir: project.file('dist/esm'),
                sourcemap: true
            }
        },
        webConfig(false),
        PROD && webConfig(true)
    ];
}
