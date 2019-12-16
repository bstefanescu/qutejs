const fspath = require('path');
const chokidar = require('chokidar');

const npm = require('./npm.js');
const ProjectBase = require('./project-base.js');
const Glob = require('./glob.js');
const {kebabToCamel, kebabToPascal, camelToKebab, debounced} = require('./utils.js');

function collectAllRequires(project, result) {
	if (result.has(project)) return;
	result.add(project);
	if (project.requires && project.requires.length) {
		const requires = project.requires;
		for (let i=0,l=requires.length;i<l;i++) {
			collectAllRequires(requires[i], result);
		}
	}
}

function Project(ws, path, pkg) {
	this.ws = ws;
	this.root = path; // absolute path
	this.rpath = path.substring(ws.root.length+1);
	if (!pkg) pkg = require(fspath.join(path, 'package.json'));
	this.pkg = pkg;
	const config = ws.pkgBuild(pkg) || {};
	this.sources = config.sources || ws.config.sources;
	if (config.tests) {
		this.tests = config.tests;
	} else {
		this.tests = ws.config.test && ws.config.test.files;
	}
	this.requires = null;
	this.config = config;
	this.watcher = null;
}

const ProjectProto = {
	build(args) {
		return this.ws.builder.build(this.ws, this, args);
	},

	publish(args) {
		if (this.pkg.private) {
			console.log('Skiping private project', this.name);
		} else {
			const dryRun = args.indexOf('--dry-run') > -1;
			console.log(`Publishing${dryRun?' [dry run]':''}`, this.name);
			npm.publish(this.root, args);
		}
	},

	test(args) {
		return this.ws.tester.test(this.ws, this, args);
	},

	exec(cmdLine, opts) {
		return this.ws.exec(cmdLine, this, opts);
	},

	get name() {
		return this.pkg.name;
	},

	get version() {
		return this.pkg.version;
	},

	/* similar projects are usually grouped in directories
	 * This getter returns the name of the parent directory (i.e. the project group name)
	 */
	get group() {
		return fspath.basename(fspath.dirname(this.root));
	},

	get kebabCaseName() {
		var name = this.name;
		if (this.name.startsWith('@')) {
			name = this.name.replace('/', '-').substring(1);
		}
		return camelToKebab(name);
	},

	get camelCaseName() {
		var name = this.name;
		if (this.name.startsWith('@')) {
			name = this.name.replace('/', '-').substring(1);
		}

		return kebabToCamel(name);
	},

	get pascalCaseName() {
		var name = this.name;
		if (this.name.startsWith('@')) {
			name = this.name.replace('/', '-').substring(1);
		}

		return kebabToPascal(name);
	},

	get runtimeDeps() {
		return this.pkg.dependencies ? Object.keys(this.pkg.dependencies) : [];
	},

	get bundledDeps() {
		const deps = this.pkg.bundledDependencies || this.pkg.bundleDependencies;
		return deps ? Object.keys(deps) : [];
	},

	get devDeps() {
		return this.pkg.devDependencies ? Object.keys(this.pkg.devDependencies) : [];
	},

	get peerDeps() {
		return this.pkg.peerDependencies ? Object.keys(this.pkg.peerDependencies) : [];
	},

	// recursively resolve all projects I depends on
	get allRequires() {
		const result = new Set();
		if (this.requires && this.requires.length) {
			const requires = this.requires;
			for (var i=0,l=requires.length; i<l; i++) {
				collectAllRequires(requires[i], result);
			}
		}
		return result;
	},

	get allSources() {
		var result = this.resolveSources();
		this.allRequires.forEach(project => {
			result = result.concat(project.resolveSources());
		});
		return result;
	},

	resolveSources() {
		if (this.sources) {
			return new Glob.create(this.sources).matchFiles(this.root);
		}
		return [];
	},

	watch(target) {
		if (this.watcher) throw new Error('Watcher already initialized for project '+this.name);
		if (!target) {
			target = this.sources;
		}
		if (!target) throw new Error('watch used on project '+this.name+', but project sources are not defined!');
		const files = Glob.create(target).match(this.root); //. match both files and dirs
		this.watcher = chokidar.watch(files, {
        	cwd: this.root,
        	ignoreInitial: true
		});
		console.log('Watching project', this.name);
		return this;
	},
	changed(cb) { // automatically starts watching oin sources if not already watching
		if (!this.watcher) {
			this.watch();
		}
		cb = debounced(500, cb);
        this.watcher.on('add', (path, stats) => {
            cb(this, 'add', path, stats);
        });
        this.watcher.on('change', (path, stats) => {
            cb(this, 'change', path, stats);
        });
        this.watcher.on('unlink', (path) => {
            cb(this, 'unlink', path);
        });
        return this;
	}

}

Project.prototype = Object.assign(ProjectProto, ProjectBase);

module.exports = Project;
