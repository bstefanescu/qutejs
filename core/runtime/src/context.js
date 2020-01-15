import window from '@qutejs/window';
import ERR from './error.js';
import {Model} from './model.js';

export default function Context(data) {
	if (data) Object.assign(this, data);
	this.topics = {};
	this.models = {};
}

Context.prototype = {

	post: function(topic, msg, data) {
		var listeners = this.topics[topic];
		if (listeners) for (var i=0,l=listeners.length;i<l;i++) {
			if (listeners[i](msg, data) === false) {
				break; // stop if one of the listeners returns false
			}
		}
	},
	postAsync: function(topic, msg, data) {
		var self = this;
		window.setTimeout(function() { self.post(topic, msg, data); }, 0);
	},
	subscribe: function(topic, listenerFn) {
		var listeners = this.topics[topic];
		if (!listeners) {
			this.topics[topic] = listeners = [];
		}
		listeners.push(listenerFn);
		return this;
	},
	subscribeOnce: function(topic, event, listenerFn) {
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
	unsubscribe: function(topic, listenerFn) {
		var listeners = this.topics[topic];
		if (listeners) {
			var i = listeners.indexOf(listenerFn);
			if (i > -1) {
				listeners.splice(i, 1);
			}
		}
	},

	addModel: function(key, ModelTypeOrData) {
		var model;
		if (ModelTypeOrData.prototype instanceof Model) {
			model = new ModelTypeOrData(key, this);
		} else {
			var ModelType = Model(ModelTypeOrData);
			model = new ModelType(key, this);
		}
		return (this.models[key] = model);
	},

	addModels: function(data) {
		for (var key in data) {
			this.addModel(key, data[key]);
		}
		return this;
	},

	model: function(key) {
		return this.models[key];
	},

	prop: function(key) {
		var prop;
		var i = key.lastIndexOf('/');
		if (i > -1) {
			var model = this.models[key.substring(0,i)];
			if (model) {
				prop = model.$[key.substring(i+1)];
			}
		}
		if (!prop) {
			ERR(40, key)
		}
		return prop;
	}

}
