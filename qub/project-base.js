const fs = require('fs');
const fspath = require('path');
const rimraf = require('rimraf');
const mkdirp = require('mkdirp');

const npm = require('./npm.js');
const Package = require('./pkg.js');
const { getProjectDeps } = require('./utils.js');

/**
 * Common API for both projects and workspace (which is the root project)
 * A project (or root project) must define the properties:
 * pkg, root and requires
 */
const ProjectBase = {
	file() {
		return fspath.join.apply(null, [this.root].concat(Array.from(arguments)));
	},
	relFile(file) {
		return fspath.relative(this.root, file);
	},
	linkRequiredProject(project) {
		const target = this.file('node_modules', project.name);
		//console.log('make link', target);
		if (!fs.existsSync(target)) {
			mkdirp.sync(fspath.dirname(target));
			fs.symlinkSync(project.root, target);
		}
	},
	link(args) {
		this.requires && this.requires.forEach(project => this.linkRequiredProject(project));
	},
	unlink(args) {
		this.requires && this.requires.forEach(project => {
			const target = this.file('node_modules', project.name);
			if (fs.existsSync(target)) {
				fs.unlinkSync(target);
			}
		});
	},
	install() {
		console.log('Installing', this.pkg.name);
		if (this.requires && this.requires.length > 0) {
			const pkg = new Package(this.file('package.json')).snapshot();
			let removed = false;
			this.requires.forEach(project => {
				if (pkg.removeDep(project.name)) removed = true;
			});
			if (removed) {
				const bak = pkg.backup();
				pkg.write();
				try {
					npm.install(this.root);
					return;
				} finally {
					pkg.restore().write();
					fs.unlinkSync(bak);
					this.link();
				}
			}
		}
		npm.install(this.root);
	},
	uninstall() {
		rimraf.sync(this.file('node_modules'));
	},
	updateVersion(version, inclRequires) {
		if (!version) return;
		var cversion = this.pkg.version.split('.');
		var major = parseInt(cversion[0])||0;
		var minor = parseInt(cversion[1])||0;
		var patch = parseInt(cversion[2])||0;
		if (version === 'major') {
			version = (major+1)+'.0.0';
		} else if (version === 'minor') {
			version = major+'.'+(minor+1)+'.0';
		} else if (version === 'patch') {
			version = major+'.'+minor+'.'+(patch+1);
		}
		this.pkg.version = version;
		const pkg = new Package(this.file('package.json'));
		pkg.updateVersion(version);
		inclRequires && this.requires && this.requires.forEach(project => pkg.updateDepVersion(project.name, version));
		pkg.write();
	},
	resolveProjectDeps(projects) {
		return (this.requires = getProjectDeps(projects, this.pkg));
	}
}

module.exports = ProjectBase;

