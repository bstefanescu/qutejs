const fs = require('fs');

function Package(file) {
	this.file = file;
	this.data = null;
	this._snapshot = null;
	this.read();
}

function _updateDepVersion(deps, dep, version) {
	if (deps) {
		if (dep in deps) {
			deps[dep] = version;
			return true;
		}
	}
	return false;
}

function _removeDep(deps, dep) {
	if (deps) {
		if (dep in deps) {
			delete deps[dep];
			return true;
		}
	}
	return false;
}

function getRandomInt(max) {
  return Math.floor(Math.random() * Math.floor(max));
}

Package.prototype = {
	write(file) {
		fs.writeFileSync(file || this.file, JSON.stringify(this.data, null, 2), {encoding: 'utf8'});
	},
	read(file) {
		this.data = JSON.parse(fs.readFileSync(file || this.file, 'utf8'));
	},
	backup() {
		const bak = this.file+'-'+Date.now()+'-'+getRandomInt(1000)+'.bak';
		this.write(bak);
		return bak;
	},
	snapshot() {
		this._snapshot = JSON.parse(JSON.stringify(this.data));
		return this;
	},
	restore() {
		if (!this._snapshot) throw new Error('No snapshot previously created');
		this.data = this._snapshot;
		this._snapshot = null;
		return this;
	},
	updateVersion(version) {
		this.data.version = version;
	},
	updateDepVersion(name, version) {
		return _updateDepVersion(this.data.dependencies, name, version) ||
		_updateDepVersion(this.data.devDependencies, name, version) ||
		_updateDepVersion(this.data.peerDependencies, name, version) ||
		_updateDepVersion(this.data.bundledDependencies || this.data.bundleDependencies, name, version);
	},
	removeDep(name) {
		return _removeDep(this.data.dependencies, name) ||
		_removeDep(this.data.devDependencies, name) ||
		_removeDep(this.data.peerDependencies, name) ||
		_removeDep(this.data.bundledDependencies || this.data.bundleDependencies, name);
	}
}

module.exports = Package;
