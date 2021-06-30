import fs from 'fs';
import path from 'path';
import prompts from 'prompts';
import Progress from 'progress';
import createProject from './project.js';
import getDependencies from './deps.js';

import { normalizeName, componentName, npmInstall } from './utils.js';


function installDeps(target, type) {
    var cmds = getDependencies(type);
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
        {title: 'Qute component', value:'component', description: 'Build a reusable component'},
        //TODO: not yet ready
        //{title: 'Qute client/server application', value:'sap', description: 'Build a client/server application'} // sap: single application page
      ]});
  }

  var response = await prompts(questions);
  //response = Object.assign(response, builtinVars);
  response.name = normalizeName(response.name); // kebab case form
  response.componentName = componentName(response.name);
  createProject(response.type, target, response);
  installDeps(target, response.type);
}

export default main;
