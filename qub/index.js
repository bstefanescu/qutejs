const process = require('process');
const Workspace = require('./workspace.js');


function now() { // timestamp in ms
	const hrTime = process.hrtime();
	return hrTime[0] * 1000 + hrTime[1] / 1000000;
}

const start = now();
const promise = Workspace.run(process.cwd(), process.argv.slice(2));

if (!promise) {
	console.log('No qub workspace found!');
	process.exit(1);
}

promise.then(
	function() {
		console.log('Build took '+((now()-start)/1000).toFixed(3)+' seconds');
	},
	function(err) {
		console.log('Build failed.', err);
		process.exit(1);
	}
);

