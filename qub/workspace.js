const { spawnSync } = require('child_process');
const fs = require('fs');
const fspath = require('path');

const ProjectBase = require('./project-base.js');
const Glob = require('./glob.js');
const TaskLoader = require('./task-loader.js');
const Resolver = require('./resolver.js');
const Project = require('./project.js');
const Builder = require('./builder.js');
const Tester = require('./tester.js');
const devServer = require('./dev-server.js');
const { expandVars, serial, splitCmdLineArgs, getProjectDeps } = require('./utils.js');

const GLOBAL_TASKS = new Set([
	"help",
	"cmds",
	"tasks",
	"projects",
	"watch",
	"start",
	"run",
	"install",
	"uninstall",
	"version",
	"link",
	"unlink"
]);

function pkgBuild(pkg) {
	return pkg.build;
}

function Workspace(root, pkg) {
	this.root = root || process.cwd();
	if (!pkg) pkg = require(fspath.join(this.root, 'package.json'));
	if (!pkg.private) throw new Error('The current directory is not a valid root project. It must specify "private: true" in package.json');
	const config = pkgBuild(pkg);
	if (!config) throw new Error('The current directory is not a valid root project. It must specify a "build" entry in package.json');
	this.pkg = pkg;
	this.config = config;
	this.builder = new Builder(this);
	this.tester = new Tester(this);
	this.taskLoader = new TaskLoader(this);

	this.scope = config.scope;

	if (config.globalTasks) {
		config.globalTasks.forEach(taskName => GLOBAL_TASKS.add(taskName));
	}

	var projects, projectMap = {}; // project names to Project objects
	if (config.projects) {
		projects = this.loadProjects(config.projects, projectMap);
	} else {
		throw new Error('Root projects must define a build.projects property in package.json');
	}

	// resolve and sort projects
	var resolver = new Resolver();
	projects.forEach(function(project) {
		// resolver project deps
		project.resolveProjectDeps(projectMap);
		resolver.add(project);
	});
	// resolved and sorted projects
	this.projects = resolver.resolved();
	this.projectMap = projectMap;
	//resolver.info();

	// resolve workspace level project dependencies
	// these are usually devDependencies used to test or build other projects in the workspace
	this.resolveProjectDeps(projectMap);

	let devServerConfig = null;
	if (config.devServer) {
		devServerConfig = config.devServer;
		if (!Array.isArray(devServerConfig)) {
			devServerConfig = [devServerConfig];
		}
	}
	this.devServerConfig = devServerConfig;
}

const WorkspaceProto = {
	get name() {
		return this.pkg.name;
	},

	get version() {
		return this.pkg.version;
	},
	pkgBuild: pkgBuild,
	loadProjects(paths, map) {
		var projects = [], ws = this;
		paths = new Glob(paths).exclude('**/.*', '**/node_modules').match(ws.root);
		paths.forEach(function(path) {
			var pkgFile = fspath.join(path, 'package.json');
			if (fs.existsSync(pkgFile)) {
				var project = new Project(ws, path, require(pkgFile));
				projects.push(project);
				map[project.name] = project;
			}
		});
		return projects;
	},

	findProject(name) {
		var project = this.projectMap[name];
		if (!project && this.scope && !name.startsWith('@')) {
			project = this.projectMap[this.scope+'/'+name];
		}
		return project;
	},

	// async method def require node v7.6.0
	// async run(args)
	// project is the foirsta argument if any then follows the task then the task arguments
	run: async function(args, ctxProject) {
		var project, taskName;
		if (args.length > 0) {
			let first = args.shift();
			project = this.findProject(first);
			if (project) {
				taskName = args.shift();
			} else {
				taskName = first;
			}
		}
		if (!taskName) taskName = 'help';

		if (!project && ctxProject) {
			project = this.projectMap[ctxProject];
		}

		var promise;
		var task = this.taskLoader.getTaskRunner(taskName, args);
		if (!task) throw new Error('Task not found: '+taskName);
		if (GLOBAL_TASKS.has(taskName)) { // run in ws context
			return await task(this, project, args);
		} else if (project) {
			return await task(this, project, args);
		} else {
			return await this.runTaskInAllProjects(task, args);
		}
	},


	runTaskInAllProjects(taskFn, args) {
		return this.runTaskInProjects(taskFn, this.projects, args);
	},

	runTaskInProjects(taskFn, projects, args) {
		var tasks = projects.map(function(project) {
			return function() {
				return taskFn(project.ws, project, args);
			}
		});
		return serial(tasks)();
	},

	expandVars(cmdLine, vars) {
		if (!vars) return cmdLine;
		if (Array.isArray(cmdLine)) {
			return cmdLine.map(function(arg) {
				return expandVars(arg, vars);
			});
		} else {
			return expandVars(cmdLine, vars);
		}
	},

	exec(cmdLine, project, opts) {
		if (!cmdLine) return -1; // no arguments

		if (typeof cmdLine === 'string') {
			cmdLine = splitCmdLineArgs(cmdLine);
		}

		cmdLine = cmdLine.slice();
		var cmd = cmdLine.shift();

		var vars = project ? {project : project} : null;

		if (vars) {
			cmdLine = this.expandVars(cmdLine, vars);
		}

		opts = opts || {};
		//opts.stdio = ['pipe', 'inherit', 'inherit'];
		if (!opts.cwd) opts.cwd = project ? project.root : this.root;
		console.log('Running', '`'+cmd+(cmdLine.length>0?' '+cmdLine.join(' '):'')+'`', 'in ', (project && project.name));

		var r = spawnSync(cmd, cmdLine, opts);

		if (r.error) {
			var code = r.error.errno || r.error.code;
			if (code === 'ENOENT') {
				throw new Error('Command not found: '+cmd);
			} else {
				throw new Error('Failed to run command '+cmd+': '+code);
			}
		}
		return r.status;
	},
	glob() {
		var incl = [];
		var excl = [];
		for (var i=0,l=arguments.length; i<l; i++) {
			var arg = arguments[i];
			if (arg.startsWith('!')) {
				excl.push(arg.substring(1));
			} else {
				incl.push(arg);
			}
		}
		return new Glob(incl, excl);
	},

	startDevServer(project, name) {
		let defaultRoot = project ? project.root : this.root;
		let config, root;
		if (!name) {
			config = this.devServerConfig && this.devServerConfig[0];
			if (!config) {
				root = defaultRoot;
			}
		} else {
			config = this.devServerConfig && this.devServerConfig.find(cfg=>cfg.name === name);
			if (!config) {
				root = this.file(name);
				if (!fs.existsSync(root)) {
					throw new Error('No such dev server config: '+name);
				}
			}
		}

		if (!config) {
			config = {root: root, livereload: true, open: true};
		} else {
			let vars = {project: project};
			if (config.index) config.index = expandVars(config.index, vars);
			if (config.root) {
				config.root = expandVars(config.root, vars);
				if (!fspath.isAbsolute(config.root)) {
					config.root = this.file(config.root);
				}
			} else {
				config.root = defaultRoot;
			}
		}
		devServer.start(config);
	}

}

Workspace.prototype = Object.assign(WorkspaceProto, ProjectBase);

function findBuildContext(cwd, project) {
	let pkg;
	const pkgJson = fspath.join(cwd, 'package.json');
	if (fs.existsSync(pkgJson)) { // found a pakcage.json file
		pkg = require(pkgJson);
		if (pkg.private && pkgBuild(pkg)) {
			return {
				root: cwd,
				ws: pkg,
				project: project
			};
		}
	}
	const parentDir = fspath.dirname(cwd);
	if (parentDir && parentDir !== cwd) {
		return findBuildContext(parentDir, project || pkg);
	}
	return null;
}

Workspace.run = function(cwd, args) {
	const ctx = findBuildContext(cwd);
	if (!ctx) {
		return null;
	}
	return new Workspace(ctx.root, ctx.ws).run(args, ctx.project && ctx.project.name);
}


module.exports = Workspace;
