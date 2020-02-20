var PRINT_RX = /%s/g;
function print(text) {
	var i = 1, args = arguments;
	return text.replace(PRINT_RX, function(match, p1) {
		return args[i++];
	});
}

export default function ERR() {
	throw new Error(print.apply(null, Array.prototype.slice.call(arguments)))
}
