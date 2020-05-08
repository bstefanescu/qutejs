const commonjs = require('rollup-plugin-commonjs');
const nodeResolve = require('rollup-plugin-node-resolve');

module.exports = function(project) {
	// projects that are build for the web like @qute/compiler must be transformed with buble
	// but projects that builds node libs like @qute/create are using async fucntions that
	// are throwing an error  in buble.
	// so we need to add buble only for projects targeting the browser.
	var useBuble = project.group !== 'tools';
	var nodeDeps = project.config.nodeDeps || [];
	return {
		input: project.file('src/index.js'),
		external: [ ... nodeDeps, ... project.runtimeDeps ],
		plugins: [
			nodeResolve( {preferBuiltins: true} ),
			commonjs(),
        	useBuble && require('@rollup/plugin-buble')({exclude: ["node_modules/**", "**/node_modules/**"]})
		],
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
	}
}

