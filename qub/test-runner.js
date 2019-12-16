/*
 * The child process that actualy run the tests
 * argv[2] - points to the test runner implementation script
 * the stdin contains the files to tests one file path per line.
 */
const process = require('process');

function fail(err) {
	if (process.send) {
		process.send({ error: err.stack || String(err) });
	}
	process.exit(-1); // indicate an error
}

const script = process.argv[2];
if (!script) {
	fail("Usage: node [-r path/to/test-setup.js] test-runner.js path/to/tester-impl-script.js");
}

let runTests;
try {
	runTests = require(script);
} catch(e) {
	fail(e);
}

new Promise(function(resolve, reject) {
	let result = '';
	const stdin = process.stdin;
	if (stdin.isTTY) {
		resolve(result);
		return;
	}
	stdin.setEncoding('utf8');
	stdin.on('readable', () => {
		let chunk;
		while ((chunk = stdin.read())) {
			result += chunk;
		}
	});
	stdin.on('end', () => {
		resolve(result);
	});
}).then(function(input) {
	runTests(input.trim().split(/\s*\n\s*/));
}).catch(function(err) {
	fail(err);
});
