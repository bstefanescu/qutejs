
function ERR() {
	ERR.resolve.apply(null, arguments);
}

ERR.resolve = function() {
	throw new Error('Qute Error: '+Array.prototype.slice.call(arguments));
}

export default ERR;
