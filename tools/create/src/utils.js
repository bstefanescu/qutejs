import { spawnSync } from 'child_process';

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

function normalizeName(value) {
	return camelToKebab(value.trim().replace(/\s+/g, '-'));
}

function componentName(value) {
	if (value.startsWith('@')) { // a scoped package
		value = value.substring(1).replace(/\//g, '-');
	}
	return capitalizeFirst(kebabToCamel(value));
}

function npmInstall(cwd, depType, dep) {
    var args = ['install', depType, dep];
    return spawnSync("npm", args, {
        cwd: cwd,
        //stdio: 'inherit',
    });
}

// for dev. only - as a fallback for install to be able install local qute packages
function npmLink(cwd, dep) {
    var args = ['link', dep];
    return spawnSync("npm", args, {
        cwd: cwd,
        //stdio: 'inherit',
    });
}

 export {
 	componentName, normalizeName, npmInstall, npmLink
 }
