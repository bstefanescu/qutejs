import Qute from '@qutejs/runtime';

// render a functional template given its render function name and a model
Qute.render = function(renderFn, model) {
	return renderFn(new Rendering(null, model));
}
Qute.defineMethod = function(name, fn) {
	//define method on both ViewModel and Functional components prototype
	ViewModel.prototype[name] = fn;
    Rendering.FunComp.prototype[name] = fn;
}

Qute.registerDirective = registerDirective;

Qute.install = function(plugin) { return plugin.install(Qute); }

export function runAfter(cb) {
    return Qute.UpdateQueue.runAfter(cb);
}
