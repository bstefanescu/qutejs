import ERR from './error.js';

function defProp(prop) {
	return {
		get: function() {
			return prop.value;
		},
		set: function(value) {
			prop.set(value);
		},
		enumerable: true
	}
}

function ModelProp(model, name, defValue) {
	this.model = model;
	this.name = name;
	this.value = defValue;
	this.channel = 'model:'+model.name+'/'+name;
}
ModelProp.prototype = {
	set(value) {
		if (value !== this.value) {
			var old = this.value;
			this.value = value;
			//TODO postAsync?
			var ctx = this.model.ctx;
			ctx && ctx.post(this.channel, value, old);
			// fire change event only if context is defined
		}
	},
	get() {
		return this.value;
	},
	bind(vm, key) {
		var self = this;
		vm.setup(function() {
			vm.subscribe(self.channel, function(value, old) {
				var watcher = this.$el && this.$watch && this.$watch[key]; // if not connected whatchers are not enabled
				// avoid updating if watcher return false
				if (watcher && watcher.call(this, value, old) === false) return;
				this.update();
			});
		});
		return defProp(this);
	}
}

function Model(def) {
	if (!def.init) ERR(41);

	function ModelImpl(name, ctx) {
		this.ctx = ctx;
		this.name = name;

		var data = this.init(ctx);
		var props = {};

		if (data) for (var key in data) {
			var prop = new ModelProp(this, key, data[key]);
			Object.defineProperty(this, key, defProp(prop));
			props[key] = prop;
		}
		Object.defineProperty(this, '$', {
			value: props
		});
	}

	var ModelProto = Object.create(Model.prototype, {
		constructor: {value: Model},
		get: {value: function(key) {return this.$[key]}}
	});

	Object.assign(ModelProto, def);

	ModelImpl.prototype = ModelProto;
	return ModelImpl;
}

Model.Prop = ModelProp;

export {Model, ModelProp};
