import window from '@qutejs/window';
import ERR from './error.js';


var UpdateQueue = {
	maxNestedLoops: 50,
	queue: [],
	after: null, // routines to run after the queue is processed
	push: function(op) {
		if (!this.queue.length) { // schedule
			var self = this;
			window.setTimeout(function() {
				self.run();
			}, 0);
		}
		this.queue.push(op);
	},
	// Add a callback to be invoked after the current queue run. If the queue is empty then the callback is immediately run
	// As queue tasks may push tasks into the queue, pushing a regular task in the queue after an update does not guarantee
	// the task will be run at the end.
	// This is usefull to test (to make assertion after all the uopdates where done)
	// Usually this method is called after an update
	runAfter: function(runAfterCb) {
		if (!this.queue.length) {
			runAfterCb();
		} else {
			if (!this.after) this.after = [runAfterCb];
			else this.after.push(runAfterCb);
		}
	},
	run: function() {
		var queue = this.queue;
		var cnt = queue.length;
		var max = cnt+this.maxNestedLoops; // allowed iteration to avoid infintite loops
		while (queue.length > 0) {
			queue[0]();
			// remove from queue after execution
			queue.shift();
			if (++cnt > max) ERR("Possible infinite loop detected");
		}

		// run the 'after' routines if any
		if (this.after) {
			var after = this.after;
			for (var i=0,l=after.length; i<l; i++) {
				after[i]();
			}
			this.after = null; // clear the after array
		}
	}

}

export default UpdateQueue;
