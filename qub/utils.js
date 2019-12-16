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

function kebabToPascal(value) {
	return capitalizeFirst(kebabToCamel(value));
}

function expandVars(text, vars) {
	if (!text) return text;
	return text.replace(/\$\{((?:[a-zA-Z_$][a-zA-Z_$0-9.]*)(?:\.(?:[a-zA-Z_$][a-zA-Z_$0-9.]*))*)\}/g, function(match, p) {
		var keys = p.split('.');
		var obj = vars;
		for (var i=0,l=keys.length; i<l; i++) {
			var key = keys[i];
			obj = obj[key];
			if (obj == null) break;
		}
		return obj == null ? match : String(obj);
	});
}

// return an async function that is executing the given task one after the other (event if tasks are async).
// The next task is executed only after the previous one completes.
function serial(tasks, resolveRunner) {
	if (arguments.length > 1) {
		tasks = Array.prototype.slice.call(arguments);
	}
	return async function() {
		for (var i=0, l=tasks.length; i<l; i++) {
			var runner = resolveRunner ? resolveRunner(tasks[i]) : tasks[i];
			// await transform the right value in a promise if needed,
			// block the exectuon until promise is fulfilled or rejected
			// and return the fulfilled promise value or throw the rejected value
			await runner.apply(null, arguments);
		}
	}
}

function splitCmdLineArgs(cmdline) {
	var args = cmdline.match(/(".*(?<!\\)")|('.*(?<!\\)')|\S+/g)
	for (var i=0,l=args.length;i<l;i++) {
		var arg = args[i];
		var c = arg.charCodeAt(0);
		if (c === 34 || c === 39) {
		  args[i] = arg.substring(1, arg.length-1);
		}
	}
	return args;
}

function debounced(delay, fn) {
  let timerId;
  return function () {
  	var args = Array.prototype.slice.call(arguments);
    if (timerId) {
      clearTimeout(timerId);
    }
    timerId = setTimeout(() => {
      	fn.apply(fn, args);
      timerId = null;
    }, delay);
  }
}

function collectProjectDeps(projects, deps, result) {
	deps && Object.keys(deps).forEach(function(key) {
		var projectDep = projects[key];
		if (projectDep) {
			result.add(projectDep);
		}
	});
}

function getProjectDeps(projects, pkg) {
	var result = new Set();
	collectProjectDeps(projects, pkg.dependencies, result);
	collectProjectDeps(projects, pkg.devDependencies, result);
	collectProjectDeps(projects, pkg.peerDependencies, result);
	collectProjectDeps(projects, pkg.bundledDependencies || pkg.bundleDependencies, result);
	if (result.size > 0) {
		return Array.from(result);
	}
	return null;
}


module.exports = {
	expandVars, kebabToCamel, kebabToPascal, camelToKebab, serial, splitCmdLineArgs, debounced, getProjectDeps
}
