var CAMEL_TO_KEBAB_RX = /([\$A-Za-z0-9])([A-Z])/g;

function camelToKebab(value) {
	return value.replace(CAMEL_TO_KEBAB_RX, '$1-$2').toLowerCase();
}

function capitalizeFirst(value) {
	return value[0].toUpperCase()+value.substring(1);
}

function kebabToCamel(value) {
	var i = value.indexOf('-');
	if (i == -1) return value;
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

/**
 * MyComponent <=> c:my-component <=> my-compnent
 * Component <=> c:component
 * myComponent <=> my:component
 * mySecondComponent <=> my:second-component
 * @param {string} name
 */
function kebabToCompName(name) {
    var ns, localName = name, i = name.indexOf(':');
    if (i > -1) {
        ns = name.substring(0, i);
        localName = name.substring(i+1);
    }
    var localName = kebabToCamel(localName);
    if (localName === name) {
        return name;
    } else {
        localName = capitalizeFirst(localName);
        // 'c:' ns is removed since it is the defualt for components
        return ns && ns !== 'c' ? ns+localName : localName;
    }
}

function closestVM(el) {
	while (el && !(el.__qute__ && el.__qute__.__QUTE_VM__)) {
		el = el.parentNode;
	}
	return el && el.__qute__;
}

function closestComp(el) {
	while (el && !el.__qute__) {
		el = el.parentNode;
	}
	return el && el.__qute__;
}

// find the closest list item rendering context
function closestListItem(el) {
	while (el && !el.__qute_ctx__) {
		el = el.parentNode;
	}
	return el && el.__qute_ctx__;
}

const PRINT_RX = /%s/g;
function print(text) {
	var i = 1, args = arguments;
	return text.replace(PRINT_RX, function(match, p1) {
		return args[i++];
	});
}

function ERR() {
	throw new Error(print.apply(null, Array.prototype.slice.call(arguments)))
}

export {
    capitalizeFirst, kebabToCamel, camelToKebab, kebabToCompName,
    closestVM, closestComp, closestListItem,
    print, ERR
 };

