
function splitList(text) {
	if (!text) return undefined;
	text = text.trim();
	if (!text) return undefined;
	var rx = text.indexOf(',') > -1 ? /\s*,\s*/ : /\s+/;
	return makeSymbols(text.split(rx));
}

function makeSymbols(keys) {
	return keys.reduce(function(acc, value) {
		acc[value] = true;
		return acc;
	}, {});
}

function ERR(msg) {
	throw new Error(msg);
}

export { ERR, splitList, makeSymbols };


