const fs = require('fs');
const fspath = require('path');

const builtins = require('./builtins.js');
const { serial, splitCmdLineArgs } = require('./utils.js');

function TaskLoader(ws) {
	this.tasks = {};

	// load script tasks
	ws.config.scripts && this.loadScriptTasks(ws.file(ws.config.scripts));

	// load declared tasks (command tasks)
	ws.config.tasks && this.loadCommandTasks(ws.config.tasks);
}

TaskLoader.prototype = {
	getTaskRunner(name, args) {
		var task = builtins[name] || this.tasks[name];
		if (task) {
			return Runner(task, args);
		} else {
			// create a lazy runner (will resolve task at execution time)
			return LazyRunner(this.tasks, name, args);
		}
	},
	createMultiRunner(defs) {
		var runners = [];
		defs.forEach(args => {
			runners.push(this.createCommandRunner(args));
		});
		return MultiRunner(runners);
	},
	createCommandRunner(text) {
		var args = splitCmdLineArgs(text.trim());
		var cmd = args.shift();
		return this.getTaskRunner(cmd, args);
	},
	loadCommandTasks(tasks) {
		for (var key in tasks) {
			var val = tasks[key];
			if (Array.isArray(val)) {
				this.tasks[key] = this.createMultiRunner(val);
			} else {
				this.tasks[key] = this.createCommandRunner(val);
			}
		}
	},
	loadScriptTasks(scriptsDir) {
		if (fs.existsSync(scriptsDir)) {
			fs.readdirSync(scriptsDir).forEach(file => {
				if (file.endsWith('.js')) {
					var name = file.substring(0, file.length-3);
					this.tasks[name] = require(fspath.join(scriptsDir, file));
				}
			});
		}
	}
}

function MultiRunner(runners) {
	return function(ws, project) {
		return serial(runners)(ws, project);
	}
}

function Runner(fn, args) {
	return function(ws, project) {
		return fn(ws, project, args);
	}
}

// a lazy runner - cmd is resolved at execution time
// This is needed to avoid constraining the user to define dependencies tasks before the task
// depending on these ones.
function LazyRunner(tasks, cmd, args) {
	return function(ws, project) {
		var task = tasks[cmd];
		if (!task) throw new Error('No "'+cmd+'" task was found!');
		return task(ws, project, args);
	}
}


module.exports = TaskLoader;
