import Qute from '@qutejs/runtime';
import Router from './router.js';

function QuteRouter(bindings, quteCtx) {
	Router.call(this, bindings);
	this.ctx = null;
	quteCtx && this.install(quteCtx);
}

var QuteRouterProto = Object.create(Router.prototype);
QuteRouterProto.handlerFromString = function(path, to) {
	if (to.substring(0, 5) === 'post:') {
		if (!this.ctx) throw new Error('Using "post:" protocol without a Qute context!');
		var target = to.substring(5);
		var i = target.indexOf('/');
		if (i === -1) throw new Error('Invalid message post target. Expecting "post:channel/message-name" but got '+to);
		var msg = target.substring(i+1);
		var channel = target.substring(0,  i);
		var ctx = this.ctx;
		return function(path, params) {
			ctx.postAsync(expandVars(channel, params), expandVars(msg, params), params);
		}
	}
	return null;
};
QuteRouterProto.install = function(ctx) {
	if (this.ctx) throw new Error('Qute Router already installed!');
	if (ctx.$ctx) ctx = ctx.$ctx; // accept Qute components too.
	this.ctx = ctx;
	ctx.router = this;
	ctx.subscribe('route', function(msg, data) {
		// data can be 'true' to replace the current entry in history
		ctx.router.navigate(msg, data);
	});
	return this;
};

QuteRouter.prototype = QuteRouterProto;

Qute.Router = QuteRouter;

export default QuteRouter;
