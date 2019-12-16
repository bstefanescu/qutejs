const {spawn} = require('child_process');

function ChildPromise(process) {
	this.process = process;
	this.promise = new Promise(function(resolve, reject) {
		process
			.on('error', function(e) {
				reject(new Error(e))
			})
			.on('close', function(code) {
				resolve(code);
			})
			.on('message', function(msg) {
				if (msg && msg.error) {
					reject(new Error('The child process threw:\n'+msg.error));
				}
			});
	});

}
ChildPromise.prototype = {
	// you must used stdio[0] === 'pipe' in order to be able to write to the child stdin
	setInput(text) {
		this.process.stdin.write(text);
		this.process.stdin.end();
		return this;
	},
	then: function(onFulfilled, onRejected) {
		return this.promise.then(onFulfilled, onRejected);
	},
	catch: function(onRejected) {
		return this.promise.catch(onRejected);
	}
}

// wrap spawn child process as a promise
module.exports = function(command, args, options) {
	return new ChildPromise(spawn(command, args, options));
}
