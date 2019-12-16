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
}
function snapshot(id, content, ignoreSpaces) {
	if (ignoreSpaces) content = content.trim().replace(/>\s+/g, '>').replace(/\s+</g, '<');
	var snapshotsDir = join(dirname(getCallerFile()), 'snapshots');
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

export { snapshot };
//# sourceMappingURL=index.esm.js.map
