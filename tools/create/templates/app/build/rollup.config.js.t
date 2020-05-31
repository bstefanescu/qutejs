import qute from '@qutejs/rollup-plugin-qute'

import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import buble from 'rollup-plugin-buble'
import {uglify} from 'rollup-plugin-uglify'
import postcss from 'rollup-plugin-postcss'
import devServer from 'rollup-plugin-koa-devserver'
import cssnano fro 'cssnano'

import pkg from '../package.json'

const devMode = process.env.NODE_ENV === 'development';

let plugins = [
	nodeResolve( {preferBuiltins: true} ),
	commonjs(),
	postcss({
		inject: false,
		plugins: [cssnano()]
	}),
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
		input: './src/index.js',
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
		    devServer({
		    	port: 8090,
		    	root: '.',
		    	open: '/build/dev/index.html',
		    	livereload: {
		    		watch: 'build/dev'
		    	}
		    })
	    ]
	};
} else { // build for production
	config = [{
		input: './src/index.js',
		output: {
	        name: componentName,
	        file: './lib/'+moduleName+'-'+moduleVersion+'.js',
	        format: 'iife',
	        globals: {'@qutejs/window': 'window'},
	        sourcemap: true
		},
	    external: ['@qutejs/window'],
    	plugins
	},
	{
		input: './src/index.js',
		output: {
	        name: componentName,
	        file: './lib/'+moduleName+'-'+moduleVersion+'.min.js',
	        format: 'iife',
	        globals: {'@qutejs/window': 'window'},
	        sourcemap: true
		},
	    external: ['@qutejs/window'],
    	plugins: [
	    	...plugins,
	    	uglify()
	    ]
	}];
}

export default config;
