const process = require('process');
const readFile = require('fs').readFile;
const fsPath = require('path');
const parseUrl = require('url').parse;
const createServer = require('http').createServer;
const createHttpsServer = require('https').createServer;
const mime = require('mime');
const opener = require('opener');
const livereload = require('livereload');



function notFound(resp, path) {
 	resp.writeHead(404)
 	resp.end('404 Not Found' +
    	'\n\n' + path +
    	'\n\n(qub-dev-server)', 'utf-8');
}

function found(resp, file, mimeType, encoding, content, userHeaders) {
		const headers = { 'Content-Type': mimeType };
		if (userHeaders) headers = Object.assign({}, userHeaders, headers);
		resp.writeHead(200, headers);
		resp.end(content, encoding);
}

function error(code, resp, path, e) {
	resp.writeHead(500);
 	resp.end('500 Internal Server Error' +
    	'\n\n' + path +
    	'\n\n(qub-dev-server)', 'utf-8');
}


function green (text) {
  return '\u001b[1m\u001b[32m' + text + '\u001b[39m\u001b[22m'
}

function Server() {
	this.host = null;
	this.port = null;
	this.url = null;
	this.root = null;
	this.index = null;
	this.headers = null;
	this.webServer = null;
	this.liveServer = null;
	this.verbose = false;

	this._liveReloadScript = function() {
		return "\n<script type='application/javascript' src='http://"+(this.host|"127.0.0.1")+":"+(this.liveReloadPort|"35729")+"/livereload.js?snipver=1'></script>\n";
	}

	this._injectReloadScript = function(content) {
		var m = /<\s*\/\s*body(\s+[^>]*)?>/i.exec(content);
		if (m) {
			var i = m.index;
			return content.substring(0, i)+this._liveReloadScript()+content.substring(i);
		}
		return content;
	}

	this._ready = function(openIndex) {
		// web server started
		console.log('-----------------------------------------------------------------------------------------------------');
		console.log(' ', green('Qub DevServer'));
		console.log(' ', 'Serving ', green(this.url), '->', this.root);
		console.log(' ', '[',
			'Index:', green(fsPath.relative(this.root, this.index)),
			',',
			'Live Reload:', green(this.liveServer?'ON':'OFF'),
			']');
		console.log('-----------------------------------------------------------------------------------------------------');
		if (openIndex) this.open();
	}

	this.serveFile = function(resp, reqPath, file) {
		var self = this;
		var mimeType = mime.getType(file);
		var encoding = mimeType && mimeType.startsWith('text/') ? 'utf8' : 'binary';
		readFile(file, encoding, function(err, data) {
			if (err) {
				if (err.code === 'ENOENT') {
					notFound(resp, reqPath);
				} else {
                  console.error('Failed to serve', reqPath, 'resolved to', file, '; error is', err);
				  error(500, resp, reqPath, err);
				}
			} else {
				if (self.liveServer && self.index === file) {
					data = self._injectReloadScript(data);
				}
				found(resp, file, mimeType, encoding, data, self.headers);
			}
		});
	}

	this.start = function(opts) {
		if (this.server) {
			throw new Error('Server already started!');
		}
		if (!opts) opts = {};

		const self = this;
		const port = opts.port || 8089;
		const host = opts.host || '127.0.0.1';
		const listener = function(req, resp) {
			if (opts.listener && opts.listener.call(self, req, resp)) return;
			self.onRequest(req, resp);
		}

		this.verbose = !!opts.verbose;
		this.host = host;
		this.port = port;
		this.url = (opts.https ? "https://" : "http://") + host + ':' + port;
		this.root = fsPath.resolve(opts.root);
		this.index = fsPath.resolve(this.root, opts.index || 'index.html');
		this.headers = opts.headers;
		this.webServer = opts.https ? createHttpsServer(opts.https, listener) : createServer(listener);

		if (opts.livereload) {
			var liveServer = livereload.createServer();
			liveServer.watch(this.root);
			this.liveServer = liveServer;
		}

		this.webServer.listen(port, host, function() {
			self._ready(opts.open);
		});
	}

	this.stop = function() {
		if (this.webServer) {
			this.webServer.close();
			this.webServer = null;
		}
		if (this.liveServer) {
			this.liveServer.close();
			this.liveServer = null;
		}
	}

	this.onRequest = function(req, resp) {
		const reqPath = parseUrl(req.url).pathname; // remove leading /
		// remove leading slash
		var rpath = reqPath.charCodeAt(0) === 47 ? reqPath.substring(1) : reqPath;
		var file = rpath ? fsPath.resolve(this.root, rpath) : this.index;
		try {
                  if (!file.startsWith(this.root)) { // outside the web root
                    notFound(resp, reqPath);
                  } else {
                    this.serveFile(resp, reqPath, file);
                  }
		  if (this.verbose) console.log('DevServer:', req.method, reqPath, '->', file, this.index);
		} catch (err) {
			console.error('Request failed on ', reqPath, '. Error:', err);
			error(500, resp, reqPath);
		}
	}

	this.open = function(path) {
		if (this.url) {
			opener(fsPath.join(this.url, path || fsPath.relative(this.root, path || this.index)));
		}
		return this;
	}

	this.close = function() {
		if (this.server) {
			this.server.close();
			this.server = null;
		}
		return this;
	}

}

function closeServerOnTermination (server) {
	['SIGINT', 'SIGTERM'].forEach((signal) => {
		process.on(signal, () => {
    		server.close();
    		process.exit();
    	})
	})
}
const server = new Server();
closeServerOnTermination(server);

module.exports = server;

