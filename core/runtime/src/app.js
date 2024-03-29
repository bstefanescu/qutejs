import window from '@qutejs/window';
import {ERR} from '@qutejs/commons';

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

var PropProto = {
	set(value) {
		if (value !== this.value) {
			var old = this.value;
			this.value = value;
			this.app.post('model:'+this.key, value, old);
		}
	},
	get() {
		return this.value;
	},

	addChangeListener(fn) {
		this.app.subscribe('model:'+this.key, fn);
		return fn;
	},

	removeChangeListener(fn) {
		this.app.unsubscribe('model:'+this.key, fn);
	},

	inject(target, name) {
		Object.defineProperty(target, name, createProp(this));
		return this;
	},

	bindVM(vm, key) {
		vm.$data[key] = this.value; // set the initial value
		vm.setup(() => {
			this.app.subscribe('model:'+this.key, function(value, old) {
				var watcher = vm.$el && vm['$watch_'+key]; // if not connected whatchers are not enabled
				// avoid updating if watcher return false
				if (watcher && watcher.call(vm, value, old) === false) return;
				vm.update();
			});
		});
		return createProp(this);
    }
}

function Prop(app, key, defValue) {
	this.app = app;
	this.key = key;
	this.value = defValue;
	app.data[key] = this;
}
Prop.prototype = PropProto;

export default function Application(data) {
	this.topics = {};
	this.data = {};
	this.env = {};
	this.components = {}; // components lookup by id
	data && this.putAll(data);
}

Application.prototype = {
    __QUTE_APP__: true,
    // API for custom apps
    mount(elOrId, insertBefore) {
        if (!this.VM) {
            ERR('Cannot install application: only custom applications linked to a root ViewModel can be installed');
        }
        this.root = new (this.VM)(this);
        this.beforeMount && this.beforeMount();
        this.root.mount(elOrId, insertBefore);
        this.ready && this.ready();
        return this.root;
    },
    unmount() {
        if (!this.root) ERR('Cannot uninstall application: not installed');
        this.beforeUmount && this.beforeMount();
        this.root.umount();
        this.root = null;
        this.unmounted && this.unmounted();
	},
	// register / unregister components
	unpublish(key) {
		delete this.components[key];
	},
	lookup(key) {
		return this.components[key];
	},
	publish(key, value) {
		if (key in this.components) console.warning('A component was already registered as "', key, '"');
		this.components[key] = value;
	},
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

	prop(key) {
		var prop = this.data[key];
		if (!prop) {
			ERR("No model property named '%s' was found!", key);
		}
		return prop;
    },
    defineProp(key, value) {
		return new Prop(this, key, value);
    },

	defineProps(props) {
		var data = this.data;
		for (var key in props) {
			data[key] = new Prop(this, key, props[key]);
		}
	},

	view(VM) {
		return new VM(this);
    }
}

Application.Prop = Prop;
