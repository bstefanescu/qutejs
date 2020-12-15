import window from '@qutejs/window';

// emitter prototype
var Emitter = {
    /**
     * Emit an event now
     * @param {string} event
     * @param {object} data
     */
	emit: function(event, data) {
		this.$el.dispatchEvent(new window.CustomEvent(event, {bubbles: true, detail: data === undefined ? this : data }));
    },
    /**
     * Emit an event after a timeout
     * @param {string} event
     * @param {object} data
     * @param {number} timeout
     */
	emitAsync: function(event, data, timeout) {
		var self = this;
		window.setTimeout(function() { self.emit(event, data); }, timeout || 0);
	}
}
export default Emitter;
