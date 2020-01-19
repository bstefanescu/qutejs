import window from '@qutejs/window';
import ERR from './error.js';

function createProp(prop) {
	return {
		get() {
			return prop.value;
		},
		set(value) {
			prop.set(value);
		},
		enumerable: true
	};
}

function ModelProp(ctx, key, defValue) {
	this.ctx = ctx;
	this.key = key;
	this.value = defValue;
}
ModelProp.prototype = {
	set(value) {
		if (value !== this.value) {
			var old = this.value;
			this.value = value;
			//TODO postAsync?
			this.ctx.post('model:'+this.key, value, old);
			// fire change event only if context is defined
		}
	},
	get() {
		return this.value;
	},

	addChangeListener(fn) {
		this.ctx.subscribe('model:'+this.key, fn);
		return fn;
	},

	removeChangeListener(fn) {
		this.ctx.unsubscribe('model:'+this.key, fn);
	},

	link(target, name) {
		var self = this;
		Object.defineProperty(target, name, createProp(this));
		return this;
	},

	$bindVM(vm, key) {
		var self = this;
		vm.setup(function() {
			vm.subscribe('model:'+self.key, function(value, old) {
				var watcher = this.$el && this.$watch && this.$watch[key]; // if not connected whatchers are not enabled
				// avoid updating if watcher return false
				if (watcher && watcher.call(this, value, old) === false) return;
				this.update();
			});
		});
		return createProp(this);
	}
}


export default function Context(data) {
	this.topics = {};
	this.$data = {};
	data && this.putAll(data);
}

Context.prototype = {
	post(topic, msg, data) {
		var listeners = this.topics[topic];
		if (listeners) for (var i=0,l=listeners.length;i<l;i++) {
			if (listeners[i](msg, data) === false) {
				break; // stop if one of the listeners returns false
			}
		}
	},
	postAsync(topic, msg, data) {
		var self = this;
		window.setTimeout(function() { self.post(topic, msg, data); }, 0);
	},
	subscribe(topic, listenerFn) {
		var listeners = this.topics[topic];
		if (!listeners) {
			this.topics[topic] = listeners = [];
		}
		listeners.push(listenerFn);
		return this;
	},
	subscribeOnce(topic, event, listenerFn) {
		var self = this;
		var onceSubscription = function(msg, data) {
			if (msg === event) {
				listenerFn(msg, data);
				self.unsubscribe(topic, onceSubscription);
			}
		}
		this.subscribe(topic, onceSubscription);
		return onceSubscription;
	},
	unsubscribe(topic, listenerFn) {
		var listeners = this.topics[topic];
		if (listeners) {
			var i = listeners.indexOf(listenerFn);
			if (i > -1) {
				listeners.splice(i, 1);
			}
		}
	},

	data(key) {
		var prop = this.$data[key];
		if (!prop) {
			ERR(40, key);
		}
		return prop;
	},

	put(key, value) {
		var prop = new ModelProp(this, key, value);
		this.$data[key] = prop;
		return prop;
	},

	putAll(props) {
		var data = this.$data;
		for (var key in props) {
			data[key] = new ModelProp(this, key, props[key]);
		}
	},

	link(target, name, prop) {
		return this.data(prop).link(target, name);
	},

	view(VM) {
		return new VM(this);
	}
}
