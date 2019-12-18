import fs from 'fs';
import path from 'path';
import prompts from 'prompts';
import Progress from 'progress';
import mkdirp from 'mkdirp';
import { spawnSync } from 'child_process';

// fs.mkdirSync recursive is not supported on earlier node versions
function mkdirSync(dir) {
  mkdirp.sync(dir);
}

var VAR_RX = /%%\s*([a-zA-Z_$][0-9a-zA-Z_$]*)\s*%%/g;
function evalTemplate(content, vars) {
  return content.replace(VAR_RX, function(m, p1) {
    return p1 in vars ? vars[p1] : m;
  });
}

function copyFile(src, dst, vars) {
  var file = dst, content = fs.readFileSync(src, "utf8");
  if (dst.endsWith('.t')) {
    file = dst.substring(0, dst.length-2);
    content = evalTemplate(content, vars);
  }
  fs.writeFileSync(file, content);
}

// copy content of src dir into another dir (create if missing) by transforming the given transformer
function copyTree(src, dst, vars) {
  var src = path.normalize(src);
  var dst = path.normalize(dst);
  if (!fs.existsSync(dst)) {
    fs.mkdirSync(dst);
  }

  fs.readdirSync(src).forEach(file => {
    _copyTree(path.join(src, file), path.join(dst, file), vars);
  });

}
function _copyTree(src, dst, vars) {
    var stats = fs.lstatSync(src);
    if (stats.isDirectory()) {
      mkdirSync(dst);
      fs.readdirSync(src).forEach(file => {
        _copyTree(path.join(src, file), path.join(dst, file), vars);
      });
    } else if (stats.isFile()) {
        copyFile(src, dst, vars);
    } // ignore symbolic links
}

function createProject(type, target, vars) {
  copyTree(path.normalize(path.join(__dirname, '../templates/common')), target, vars);
  copyTree(path.normalize(path.join(__dirname, '../templates/'+type)), target, vars);
}

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
	return capitalizeFirst(kebabToCamel(value));
}

function npmInstall(cwd, depType, dep) {
    var args = ['install', depType, dep];
    return spawnSync("npm", args, {
        cwd: cwd,
        //stdio: 'inherit',
    });
}

/*

This utility will walk you through creating a package.json file.
It only covers the most common items, and tries to guess sensible defaults.

See `npm help json` for definitive documentation on these fields
and exactly what they do.

Use `npm install <pkg>` afterwards to install a package and
save it as a dependency in the package.json file.

Press ^C at any time to quit.
package name: (jsprompt)
version: (1.0.0)
description:
entry point: (index.js)
test command:
git repository:
keywords:
author:
license: (ISC)
About to write to /Users/bogdan/tmp/jsprompt/package.json:

{
  "name": "jsprompt",
  "version": "1.0.0",
  "description": "",
  "main": "index.js",
  "scripts": {
    "test": "echo \"Error: no test specified\" && exit 1"
  },
  "author": "",
  "license": "ISC"
}


Is this OK? (yes)
*/


function installDeps(target) {
      var cmds = [
      ['-D', 'rollup'],
      ['-D', 'rollup-plugin-commonjs'],
      ['-D', 'rollup-plugin-node-resolve'],
      ['-D', 'rollup-plugin-buble'],
      ['-D', 'rollup-plugin-uglify'],
      ['-D', 'rollup-plugin-postcss'],
      ['-D', 'rollup-plugin-serve'],
      ['-D', 'rollup-plugin-livereload'],
      // test deps
      ['-D', 'mocha'],
      ['-D', '@babel/core'],
      ['-D', '@babel/register'],
      ['-D', '@babel/preset-env'],
      ['-D', 'source-map-support'],
      ['-P', '@qutejs/window'],
      ['-P', '@qutejs/runtime'],
      ['-D', '@qutejs/dev'],
      ['-D', '@qutejs/rollup-plugin-qute'],
      ['-D', '@qutejs/register'],
      //['-D', '@qutejs/test-utils']
    ];
    var progress = new Progress('Installing dependencies [:bar] :percent > :token', {
      total: cmds.length+1,
      //width: cmds.length
    });
    cmds.forEach(function(args) {
      progress.tick({token: args[1]});
      npmInstall(target, args[0], args[1]);
    });
    progress.tick({token: 'done'});
}

async function main(target, type) {
  target = target ? path.resolve(target) : process.cwd();
  if (fs.existsSync(path.join(target, 'package.json'))) {
  	console.log("You already have a package.json file. This tool should be used to create new Qute projects");
  	process.exit(1);
  }

  var questions = [
    {type: 'text', name: 'name', message: "package name", initial: path.basename(target)},
    {type: 'text', name: 'version', message: 'version', initial:'1.0.0'},
    {type: 'text', name: 'description', message: 'description'},
    {type: 'text', name: 'author', message: 'author'},
    {type: 'text', name: 'license', message: 'license', initial: 'MIT'}
  ];
  if (!type) {
    questions.unshift({
      type: 'select', name: 'type',
      message: 'Which kind of project do you want to create?',
      choices: [
        {title: 'Qute application', value:'app', description: 'Build a web application'},
        {title: 'Qute component', value:'component', description: 'Build a reusable component'}
      ]});
  }

  var response = await prompts(questions);
  //response = Object.assign(response, builtinVars);
  response.name = normalizeName(response.name); // kebab case form
  response.componentName = componentName(response.name);
  createProject(response.type, target, response);
  installDeps(target);
}

export default main;
//# sourceMappingURL=index.esm.js.map
