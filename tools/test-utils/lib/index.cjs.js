'use strict';

Object.defineProperty(exports, '__esModule', { value: true });

function _interopDefault (ex) { return (ex && (typeof ex === 'object') && 'default' in ex) ? ex['default'] : ex; }

var path = require('path');
var fs = _interopDefault(require('fs'));
var assert = _interopDefault(require('assert'));

function getCallerFile() {
 	var orig = Error.prepareStackTrace;
 	Error.prepareStackTrace = function(_, stack){ return stack; };
 	var stack = new Error().stack;
	Error.prepareStackTrace = orig;
	// 0 is this function itself
	// 1 is the calling function: snapshot
	// 2 is the caller of the snapshot function
	return stack[2].getFileName();
}
function snapshot(id, content, ignoreSpaces) {
	if (ignoreSpaces) content = content.trim().replace(/>\s+/g, '>').replace(/\s+</g, '<');
	var snapshotsDir = path.join(path.dirname(getCallerFile()), 'snapshots');
	var snapshotFile = path.join(snapshotsDir, id);
	if (!fs.existsSync(snapshotsDir)) fs.mkdirSync(snapshotsDir);
	if (!fs.existsSync(snapshotFile)) {
		fs.writeFileSync(snapshotFile, content);
		console.log('Creating snapshot:', snapshotFile);
	} else {
		var snapshotContent = fs.readFileSync(snapshotFile);
		assert.equal(content, String(snapshotContent));
	}
}

exports.snapshot = snapshot;
//# sourceMappingURL=index.cjs.js.map
