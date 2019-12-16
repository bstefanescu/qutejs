var CAMEL_TO_KEBAB_RX = /([\$A-Za-z0-9])([A-Z])/g;

function camelToKebab(value) {
	return value.replace(CAMEL_TO_KEBAB_RX, '$1-$2').toLowerCase();
}

function capitalizeFirst(value) {
	return value[0].toUpperCase()+value.substring(1);
}

function kebabToCamel(value) {
	var i = value.indexOf('-');
	if (i == -1) { return value; }
	var out = value.substring(0, i);
	var s = i+1;
	i = value.indexOf('-', s);
	while (i > -1) {
		out += capitalizeFirst(value.substring(s, i));
		s = i+1;
		i = value.indexOf('-', s);
	}
	if (s < value.length) {
		out += capitalizeFirst(value.substring(s));
	}
	return out;
}

export { camelToKebab, capitalizeFirst, kebabToCamel };
//# sourceMappingURL=index.esm.js.map
