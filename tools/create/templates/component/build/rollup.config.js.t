import qute from '@qutejs/rollup-plugin-qute'

import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import buble from 'rollup-plugin-buble'
import {uglify} from 'rollup-plugin-uglify'
import serve from 'rollup-plugin-serve'
import livereload from 'rollup-plugin-livereload'
import postcss from 'rollup-plugin-postcss'

import pkg from '../package.json';

const devMode = process.env.NODE_ENV === 'development';

let plugins = [
	nodeResolve( {preferBuiltins: true} ),
	commonjs(),
	postcss({inject: false}),
	qute(),
    buble({
        objectAssign: 'Object.assign',
        exclude: ['node_modules/**', '**/*.css'],
		include: ["**/*.js", "**/*.jsq"]
    })
];

let componentName = "%%componentName%%";
let moduleName = "%%name%%";
let moduleVersion = pkg.version;
let config;

if (devMode) { // dev mode
	config = {
		input: './build/dev/index.js',
		output: {
	        name: componentName,
	        file: './build/dev/'+moduleName+'-dev.js',
	        format: 'iife',
	        globals: {'@qutejs/window': 'window'},
	        sourcemap: true
		},
	    external: ['@qutejs/window'],
    	plugins: [
	    	...plugins,
		    serve({
		        port: 8090,
		        contentBase: '.',
		        openPage: '/build/dev/index.html',
		        open: true,
		        headers: { 'Access-Control-Allow-Origin': '*' }
		    }),
		    livereload('.')
	    ]
	};
} else { // build for production
	config = [{
		input: './src/index.jsq',
		output: {
	        name: componentName,
	        file: './lib/index.cjs.js',
	        format: 'cjs',
	        globals: {'@qutejs/window': 'window'},
	        sourcemap: true
		},
	    external: ['@qutejs/window'],
    	plugins
	},
	{
		input: './src/index.jsq',
		output: {
	        name: componentName,
	        file: './lib/index.esm.js',
	        format: 'esm',
	        globals: {'@qutejs/window': 'window'},
	        sourcemap: true
		},
	    external: ['@qutejs/window'],
    	plugins
	},
	{
		input: './src/index.jsq',
		output: {
	        name: componentName,
	        file: './dist/'+moduleName+'-'+moduleVersion+'.js',
	        format: 'iife',
	        globals: {'@qutejs/window': 'window', '@qutejs/runtime': 'Qute'},
	        sourcemap: true
		},
	    external: ['@qutejs/window', '@qutejs/runtime'],
    	plugins
	},
	{
		input: './src/index.jsq',
		output: {
	        name: componentName,
	        file: './dist/'+moduleName+'-'+moduleVersion+'.min.js',
	        format: 'iife',
	        globals: {'@qutejs/window': 'window', '@qutejs/runtime': 'Qute'},
	        sourcemap: true
		},
	    external: ['@qutejs/window', '@qutejs/runtime'],
    	plugins: [
	    	...plugins,
	    	uglify()
	    ]
	}];
}

export default config;
