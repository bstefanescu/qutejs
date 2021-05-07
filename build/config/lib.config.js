const commonjs = require('@rollup/plugin-commonjs');
const nodeResolve = require('@rollup/plugin-node-resolve').nodeResolve;


module.exports = function(project) {
	// projects that are build for the web like @qute/compiler must be transformed with buble
	// but projects that builds node libs like @qute/create are using async fucntions that
	// are throwing an error  in buble.
	// so we need to add buble only for projects targeting the browser.
	var useBuble = project.group !== 'tools';
	var nodeDeps = project.config.nodeDeps || [];

	var format = project.config.format || ['esm', 'cjs'];
	if (typeof format === 'string') format = [ format ];

	var output = format.map(fmt => {
		let r = {
			format: fmt,
			file: project.file(`dist/${fmt}/index.js`),
			sourcemap: true
		}
		if (fmt === 'cjs') {
			r.exports = 'auto' //TODO removing this is generating warnings for window, compiler, create, register, rollup-plugin-qute
		}
		return r;
	})

	return {
		input: project.file('src/index.js'),
		external: [ ... nodeDeps, ... project.runtimeDeps ],
		plugins: [
			nodeResolve( {preferBuiltins: true} ),
			commonjs(),
        	useBuble && require('@rollup/plugin-buble')({exclude: ["node_modules/**", "**/node_modules/**"]})
		],
		output: output
	}
}
