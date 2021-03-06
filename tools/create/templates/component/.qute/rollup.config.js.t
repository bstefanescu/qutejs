import qute from '@qutejs/rollup-plugin-qute'
import commonjs from '@rollup/plugin-commonjs'
import nodeResolve from '@rollup/plugin-node-resolve'
import buble from '@rollup/plugin-buble'
import {uglify} from 'rollup-plugin-uglify'
import postcss from 'rollup-plugin-postcss'
import devServer from 'rollup-plugin-koa-devserver'
import cssnano from 'cssnano'
import quteCss from 'postcss-qute'
import multi from '@rollup/plugin-multi-entry'

import pkg from '../package.json'

const DEFAULT_DEV_SERVER_PORT = 8090;
const devMode = process.env.NODE_ENV === 'development';
const testMode = process.env.NODE_ENV === 'test';

let deps;
if (pkg.dependencies) {
    deps = Object.keys(pkg.dependencies);
} else {
   deps = ['@qutejs/window'];
}

// use DEV_SERVER_PORT = 0 to disable the DevServer
let devServerPort = parseInt(process.env.DEV_SERVER_PORT);
if (isNaN(devServerPort)) {
    devServerPort = DEFAULT_DEV_SERVER_PORT;
} else if (!devServerPort) { // if port is 0 we disable the dev server
    devServerPort = void(0);
}

let plugins = [
	nodeResolve( {preferBuiltins: true} ),
	commonjs({
        include: ['**/node_modules/**', 'node_modules/**']
    }),
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
let config;

if (devMode) { // dev mode
	config = {
		input: './src/index.js',
		output: {
	        name: componentName,
	        file: './.qute/build/'+moduleName+'-dev.js',
	        format: 'iife',
	        globals: {'@qutejs/window': 'window'},
	        sourcemap: true
		},
	    external: ['@qutejs/window'],
    	plugins: [
	    	...plugins,
		    devServerPort && devServer({
		    	port: devServerPort,
		    	root: '.qute',
		    	open: '/index.html',
		    	livereload: {
		    		watch: '.qute'
		    	}
		    })
	    ]
	};
} else if (testMode) {
	config = {
		input: './test/**/*-test.js?(q)',
		output: {
	        file: './.qute/build/test-bundle.js',
	        format: 'cjs',
	        sourcemap: true
        },
	    external: id => {
            return !id.startsWith('./')
                && !id.startsWith('../')
                && !id.startsWith('/')
        },
    	plugins: [multi(), ...plugins]
	}
} else { // build for production
	config = [{
		input: './src/index.js',
		output: {
	        file: './dist/index.cjs.js',
	        format: 'cjs',
            exports: "auto",
	        sourcemap: true
		},
	    external: deps,
    	plugins
	},
	{
		input: './src/index.js',
		output: {
	        file: './dist/index.esm.js',
	        format: 'esm',
	        sourcemap: true
		},
	    external: deps,
    	plugins
	},
	{
		input: './src/index.web.js',
		output: {
	        name: componentName,
	        file: './dist/'+moduleName+'.js',
	        format: 'iife',
	        globals: {'@qutejs/window': 'window', '@qutejs/runtime': 'Qute'},
	        sourcemap: true
		},
	    external: deps,
    	plugins
	},
	{
		input: './src/index.web.js',
		output: {
	        name: componentName,
	        file: './dist/'+moduleName+'.min.js',
	        format: 'iife',
	        globals: {'@qutejs/window': 'window', '@qutejs/runtime': 'Qute'},
	        sourcemap: true
		},
	    external: deps,
    	plugins: [
	    	...plugins,
	    	uglify()
	    ]
	}];
}

export default config;
