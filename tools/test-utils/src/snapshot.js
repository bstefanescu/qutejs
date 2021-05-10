import { join, dirname } from 'path';
import fs from 'fs';
import assert from 'assert';

function getCallerFile() {
 	var orig = Error.prepareStackTrace;
 	Error.prepareStackTrace = function(_, stack){ return stack; };
 	var stack = new Error().stack;
	Error.prepareStackTrace = orig;
	// 0 is this function itself
	// 1 is the calling function: snapshot
	// 2 is the caller of the snapshot function
	return stack[2].getFileName();
};

/**
 * By default the snapshot dir is named 'snapshots' and is located in the same dir as the calling test file.
 * If you need to change the directory location then uyou can use the QUTEJS_TEST_SNAPSHOTS_DIR env variable to set it:
 *
 * process.env.QUTEJS_TEST_SNAPSHOTS_DIR = '/my/snapshots/dir';
 *
 * @param {*} id
 * @param {*} content
 * @param {*} ignoreSpaces
 */
export default function snapshot(id, content, ignoreSpaces) {
	if (ignoreSpaces) content = content.trim().replace(/>\s+/g, '>').replace(/\s+</g, '<');
	var snapshotsDir = process.env.QUTEJS_TEST_SNAPSHOTS_DIR || join(dirname(getCallerFile()), 'snapshots');
	var snapshotFile = join(snapshotsDir, id);
	if (!fs.existsSync(snapshotsDir)) fs.mkdirSync(snapshotsDir);
	if (!fs.existsSync(snapshotFile)) {
		fs.writeFileSync(snapshotFile, content);
		console.log('Creating snapshot:', snapshotFile);
	} else {
		var snapshotContent = fs.readFileSync(snapshotFile);
		assert.equal(content, String(snapshotContent));
	}
}
