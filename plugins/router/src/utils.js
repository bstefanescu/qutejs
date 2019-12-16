
var VARS_RX = /\$\{([a-zA-Z_$][a-zA-Z_0-9$]*)\}/g;

function expandVars(text, vars) {
	return text.replace(VARS_RX, function(m, p1) {
		var val = vars[p1];
		return val === undefined ? m : String(val);
	})
}

function absPath(path) {
	return path.charCodeAt(0) !== 47 ? '/'+path : path;
}

export { absPath, expandVars };
