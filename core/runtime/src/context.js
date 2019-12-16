import window from '@qutejs/window';
import ERR from './error.js';

export default function Context(data) {
	if (data) Object.assign(this, data);
	this.$topics = {lifecycle:[]}; // lifecycle is a bultin topic
}

Context.prototype = {
	post: function(topic, msg, data) {
		var listeners = this.$topics[topic];
		if (!listeners) ERR(38, topic);
		for (var i=0,l=listeners.length;i<l;i++) {
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
		var listeners = this.$topics[topic];
		if (!listeners) {
			this.$topics[topic] = listeners = [];
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
		var listeners = this.$topics[topic];
		if (listeners) {
			var i = listeners.indexOf(listenerFn);
			if (i > -1) {
				listeners.splice(i, 1);
			}
		}
	},
	freeze: function() {
		Object.freeze(this);
	}
}
