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

import fs from 'fs';
import path from 'path';
import prompts from 'prompts';
import Progress from 'progress';
import createProject from './project.js';

import { normalizeName, componentName, npmInstall } from './utils.js';


function installDeps(target) {
      var cmds = [
      ['-D', 'rollup'],
      ['-D', 'rollup-plugin-commonjs'],
      ['-D', 'rollup-plugin-node-resolve'],
      ['-D', 'rollup-plugin-buble'],
      ['-D', 'rollup-plugin-uglify'],
      ['-D', 'rollup-plugin-postcss'],
      ['-D', 'postcss-qute'],
      ['-D', 'cssnano'],
      ['-D', 'rollup-plugin-koa-devserver'],
      // test deps
      ['-D', 'mocha'],
      ['-D', '@babel/core'],
      ['-D', '@babel/register'],
      ['-D', '@babel/preset-env'],
      ['-D', 'source-map-support'],
      ['-P', '@qutejs/window'],
      ['-P', '@qutejs/runtime'],
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
