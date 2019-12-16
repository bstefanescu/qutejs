const Workspace = require('./qub/workspace.js');
const Glob = require('./qub/glob.js');
const fs = require('fs');
const fspath= require('path');
const process = require('process');

// color codes
const COLORS = {
	ESC: "\x1b",
	Reset: "[0m",
	Bright: "[1m",
	Dim: "[2m",
	Underscore: "[4m",
	Blink: "[5m",
	Reverse: "[7m",
	Hidden: "[8m",

	FgBlack: "[30m",
	FgRed: "[31m",
	FgGreen: "[32m",
	FgYellow: "[33m",
	FgBlue: "[34m",
	FgMagenta: "[35m",
	FgCyan: "[36m",
	FgWhite: "[37m",

	BgBlack: "[40m",
	BgRed: "[41m",
	BgGreen: "[42m",
	BgYellow: "[43m",
	BgBlue: "[44m",
	BgMagenta: "[45m",
	BgCyan: "[46m",
	BgWhite: "[47m",
}

function FormatText() {
	this.format = '';
}
FormatText.prototype = {
	color(code) {
		this.format += "\x1b"+code;
		return this;
	},
	bright() {
		return this.color("[1m");
	},
	black() {
		return this.color("[30m");
	},
	red() {
		return this.color("[31m");
	},
	green() {
		return this.color("[32m");
	},
	yellow() {
		return this.color("[33m");
	},
	blue() {
		return this.color("[34m");
	},
	magenta() {
		return this.color("[35m");
	},
	cyan() {
		return this.color("[36m");
	},
	white() {
		return this.color("[37m");
	},

	text(text) {
		const format = this.format;
		this.format = '';
		return format ? format+text+"\x1b[0m" : text;
	}
}



function replaceQuteJs(content) {
	let n = 0;
	let result = content.replace(/("@qute\/[a-z-]+")|('@qute\/[a-z-]+')/g, (m, p1, p2) => {
		var ar = (p1 || p2).split('/');
		ar[0]+='js';
		n++;
		return ar.join('/');
	});
	return n > 0 ? result : null; // null indicates that no replacement was done
}

function updateFile(path, rewriteFn) {
	let content = fs.readFileSync(path, 'utf8');
	content = rewriteFn(content);
	if (content != null) {
		fs.writeFileSync(path, content, 'utf8');
		return true;
	}
	return false;
}

var ws = new Workspace();
var glob = ws.glob(
	'package.json',
	'src/**/*.js',
	'src/**/*.jsq',
	'test/**/*.js',
	'test/**/*.jsq',
	'!**/node_modules'
	);

const fmt = new FormatText();



function processProject(project) {
	console.log(fmt.bright().green().text('\nProcessing project: '+project.name));
	const files = glob.matchFiles(project.path);
	//console.log(files.join('\n'));
	files.forEach(file => {
		if (updateFile(file, replaceQuteJs)) {
			console.log(fmt.bright().magenta().text('Updated'), project.relFile(file));
		} else {
			console.log(fmt.yellow().text('Skiping'), project.relFile(file));
		}
	});
}

console.log(fmt.bright().green().text('\nProcessing build files'));
ws.glob('**/*.js').matchFiles(ws.file('build')).forEach(file => {
	if (updateFile(file, replaceQuteJs)) {
		console.log(fmt.bright().magenta().text('Updated'), ws.relFile(file));
	} else {
		console.log(fmt.yellow().text('Skiping'), ws.relFile(file));
	}
});

ws.projects.forEach(project => processProject(project));

//console.log('Matching files', Glob.create(['**/*.js', '**/*.jsq', '!**/node_modules', '!old', '!qub', '!dist']).matchFiles(process.cwd()).join('\n'));

