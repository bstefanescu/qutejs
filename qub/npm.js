const { spawnSync } = require('child_process');

module.exports = {
	install: function(cwd, dep, depType) {
		var args = ['install'];
		if (dep) {
			args.push(dep);
			if (depType) {
				args.push('--save-'+depType);
			}
		}
		var r = spawnSync("npm", args, {
			cwd: cwd,
			stdio: 'inherit',
		});
		if (r.status != null && r.status !== 0) {
			throw new Error(dep ? 'Installing dependency "'+dep+'"" failed in: '+cwd : 'npm install failed in: '+cwd);
		}
	},
	publish(cwd, taskArgs) {
		var args = ['publish'];
		if (taskArgs) args = args.concat(taskArgs);
		var r = spawnSync("npm", args, {
			cwd: cwd,
			stdio: 'inherit',
		});
		if (r.status != null && r.status !== 0) {
			throw new Error('Publishing failed in: '+cwd);
		}
	},
	init: function(cwd, arg, force) {
		var args = ['init'];
		force && args.push('-y');
		arg && args.push(arg);
		var r = spawnSync("npm", args, {
			cwd: cwd,
			stdio: 'inherit',
		});
		if (r.status != null && r.status !== 0) {
			throw new Error('npm init failed!');
		}
	}
}

