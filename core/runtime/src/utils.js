
import { kebabToCamel } from '@qutejs/commons';

function stopEvent(e) {
	e.preventDefault();
	e.stopPropagation();
}

function chainFnAfter(fn, prevFn) {
	return prevFn ? function(arg) {
		prevFn(arg);
		return fn(arg);
	} : fn;
}

function closestVM(el) {
	while (el && !(el.__qute__ && el.__qute__.__VM__)) {
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

// filter is a an array whoes first item is true or false. See compiler x-attrs encoding
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

export { stopEvent, chainFnAfter, closestVM, closestComp, closestListItem, filterKeys, kebabToCamel };
