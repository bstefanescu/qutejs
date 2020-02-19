import window from '@qutejs/window';
import ERR from './error.js';

// emitter prototype
var Emitter = {
	emit: function(event, data) {
		if (!this.$el) ERR(35);
		this.$el.dispatchEvent(new window.CustomEvent(event, {bubbles: true, detail: data === undefined ? this : data }));
	},
	emitAsync: function(event, data, timeout) {
		var self = this;
		window.setTimeout(function() { self.emit(event, data); }, timeout || 0);
	}
}
export default Emitter;
