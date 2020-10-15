
function stopEvent(e) {
	e.preventDefault();
	e.stopPropagation();
}

// filter is a an array whoes first item is true or false. See compiler q:attrs encoding
function filterKeys(obj, filter) {
	var keys = Object.keys(obj);
	if (filter) {
		var incl = filter[0]; // true: include, false: exclude
		return keys.filter(function(key) {
			return (filter.indexOf(key, 1) > -1) === incl;
		});
	} else {
		return keys;
	}
}

export { stopEvent, filterKeys };
