const process = require('process');
const fs = require('fs');
const rimraf = require('rimraf');
const Glob = require('./glob.js');
const npm = require('./npm.js');
const devServer = require('./dev-server.js');
const {splitCmdLineArgs, serial} = require('./utils.js');

/*
 * builtin tasks cannot be overwritten by the user
 */
module.exports = {
	// workspace related (i.e. global) tasks
	help(ws, project, args) {
		console.log("Qute Builder v0.9.0");
		console.log("Usage: qub task [project] [ ... task_args]");
	},
	cmds(ws, project, args) {
		/*
		var tasks = Object.keys(ws.tasks).filter(function(key) {
			return key !== '*';
		}).join(' ');
		*/
		console.log("Commands: TODO");
	},
	tasks(ws, project, args) {
		var tasks = Object.keys(ws.tasks).filter(function(key) {
			return key !== '*';
		}).join(' ');
		console.log("Tasks:", tasks);
	},
	projects(ws, project, args) {
		ws.projects.forEach(function(project) {
			console.log('  ', project.name, ' -> ', project.rpath);
		});
	},
	watch(ws, project, args) {
		if (!project) throw new Error('You must specify a project when using the watch task!');
		rootProject = project;
		function rebuild(project, event, path, stats) {
			console.log('Project', project.name, 'changed. Rebuilding.');
			if(project !== rootProject) {
				Promise.resolve(project.build(args)).then(rootProject.build(args));
			} else {
				project.build(args);
			}
		}
		project.changed(rebuild);
		project.allRequires.forEach(project => project.changed(rebuild));
	},
	start(ws, project, args) {
		ws.startDevServer(project, args && args[0]);
	},
	// run a list of tasks form command line
	run(ws, project, args) {
		return ws.taskLoader.createMultiRunner(args)(ws, project);
	},
	// these 3 tasks are workspace related since they need to update node_modules on workspace too
	install(ws, project, args) {
		if (project) {
			project.install();
		} else {
			ws.install();
			ws.projects.forEach(project => project.install());
		}
	},
	uninstall(ws, project, args) {
		if (project) {
			project.uninstall();
		} else {
			ws.uninstall();
			ws.projects.forEach(project => project.uninstall());
		}
	},
	// update versions
	version(ws, project, args) {
		if (!args || !args.length) {
			console.log(ws.version);
			process.exit(0);
		}
		var version = args[0];
		var inclRequires = true; // TODO use args[1]
		if (!version) throw new Error('no version specified!');
		if (project) {
			project.updateVersion(version, inclRequires);
		} else {
			ws.updateVersion(version, inclRequires);
			ws.projects.forEach(project => project.updateVersion(version, inclRequires));
		}
	},
	link(ws, project, args) {
		if (project) {
			project.link(args);
		} else {
			ws.link(args);
			ws.projects.forEach(project => project.link(args));
		}
	},
	unlink(ws, project, args) {
		if (project) {
			project.unlink(args);
		} else {
			ws.unlink(args);
			ws.projects.forEach(project => project.unlink(args));
		}
	},
	// project related tasks

	// remove files using glob support. Only fiels are removed. Directories are skiped.
	// If a directory is matched tit will be ignored.
	rm(ws, project, args) {
		let recursive = false;
		const glob = new Glob();
		args.forEach(arg => {
			if (arg.startsWith('-')) {
				if (arg === '-r') recursive = true;
			} else {
				glob.include(arg);
			}
		});
		glob.match(project.root).forEach(file => {
			if(fs.lstatSync(file).isDirectory()) {
				// TODO impl recursive dir removal?
				/*
				// ignore for now.
				fs.rmdirSync(file, {
					recursive: true
				});
				*/
				console.log('not removing directory:', file);
			} else {
				//console.log('rm file:', file);
				fs.unlinkSync(file);
			}
		});
	},


	build(ws, project, args) {
		return project.build(args);
	},
	test(ws, project, args) {
		return project.test(args);
	},
	publish(ws, project, args) {
		return project.publish(args);
	},
	shell(ws, project, args) {
		var status = ws.exec(args, project, {stdio: 'inherit', cwd: project.root});
		if (status) {
			throw new Error('Process '+args+' exited with code '+status);
		}
		return status;
	}
}