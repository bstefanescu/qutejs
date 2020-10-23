import qute from '@qutejs/rollup-plugin-qute'

import commonjs from 'rollup-plugin-commonjs'
import nodeResolve from 'rollup-plugin-node-resolve'
import buble from 'rollup-plugin-buble'
import {uglify} from 'rollup-plugin-uglify'
import postcss from 'rollup-plugin-postcss'
import devServer from 'rollup-plugin-koa-devserver'
import cssnano from 'cssnano'
import quteCss from 'postcss-qute'

import pkg from '../package.json'

const DEFAULT_DEV_SERVER_PORT = 8090;
const devMode = process.env.NODE_ENV === 'development';

// use DEV_SERVER_PORT = 0 to disable the DevServer
let devServerPort = parseInt(process.env.DEV_SERVER_PORT);
if (isNaN(devServerPort)) {
    devServerPort = DEFAULT_DEV_SERVER_PORT;
} else if (!devServerPort) { // if port is 0 we disable the dev server
    devServerPort = void(0);
}

let plugins = [
	nodeResolve( {preferBuiltins: true} ),
	commonjs(),
	postcss({
		inject: qute.injectStyle,
		plugins: [
            quteCss(),
            cssnano()
        ]
	}),
	qute(),
    qute.decorators(),
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
		    devServerPort && devServer({
		    	port: devServerPort,
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
