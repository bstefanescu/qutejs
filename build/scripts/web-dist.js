/**
Generate sym l;inks to web libs in web/dist
*/

const fs = require('fs');
const path = require('path');
const rimraf = require('rimraf');

module.exports = function(ws, project, args) {
	if (project.pkg.browser || project.pkg.unpkg) {
		var files = fs.readdirSync(project.file('lib'));
		files && files.forEach(file => {
			if (file.indexOf('.cjs.') > -1 || file.indexOf('.esm.') > -1) return;
			if (file.endsWith('.js') || file.endsWith('.js.map')) {
				var i = file.indexOf('.');
				var target = file.substring(0, i)+'-'+project.version+file.substring(i);
				//console.log('Linking:', project.file(file), ws.file('dist', target));
				fs.symlinkSync(project.file('lib', file), ws.file('web', 'dist', target));
			}
		});
	}
}