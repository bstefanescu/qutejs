const Mocha = require('mocha');

module.exports = function(files) {
	const mocha = new Mocha();
	for (var i=0,l=files.length; i<l; i++) {
		mocha.addFile(files[i]);
	}
	mocha.run(function (failures) {
		process.exit(failures); // 0 - when no failure
	});
}

