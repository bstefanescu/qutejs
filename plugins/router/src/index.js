import Router from './router.js';

function QuteRouter(bindings) {
	Router.call(this, bindings);
}

var QuteRouterProto = Object.create(Router.prototype);
QuteRouterProto.install = function(quteApp) {
    if (quteApp.$app) quteApp = quteApp.$app; // accept Qute components too.
    this.app = quteApp;
	quteApp.router = this;
	quteApp.subscribe('route', function(msg, data) {
		// data can be 'true' to replace the current entry in history
		quteApp.router.navigate(msg, data);
	});
    return this;
}
QuteRouterProto.handlerFromString = function(path, to) {
	var i = path.indexOf(':');
	if (i < 0) return null;
	var key = path.substring(0, i);
	if (key === 'model') {
		var target = to.substring(i+1).trim();
		var i = target.indexOf('=');
		if (i === -1) throw new Error('Invalid message post target. Expecting "model:propKey=value" but got '+to);
		var propKey = target.substring(0, i).trim();
		var value = target.substring(0, i+1).trim();
		return function(path, params) {
			app.prop(expandVars(propKey, params)).set(JSON.parse(expandVars(value, params)));
		}
	} else if (key === 'post') {
		var target = to.substring(i+1).trim();
		var i = target.indexOf('/');
		if (i === -1) throw new Error('Invalid message post target. Expecting "post:channel/message-name" but got '+to);
		var msg = target.substring(i+1);
		var channel = target.substring(0,  i);
		var app = this.app;
		return function(path, params) {
			app.postAsync(expandVars(channel, params), expandVars(msg, params), params);
		}
	}
	return null;
};

QuteRouter.prototype = QuteRouterProto;

export default QuteRouter;
