# Manually Update DOM

This example demonstrates the usage of:

1. [life cycle](#/model/lifecycle) methods: `connected` and `disconnected`
2. `ViewModel.update()` method to synchronize component model changes with its DOM element.

There are cases when you don't want to use reactive properties to trigger DOM updates. You can update a component element at any time by calling the `update()` method.

The following component is regularly updating the DOM to display the current time:

```jsq
<x-tag name='time'>
	<div>{{now()}}</div>
</x-tag>

export default Qute('time', {
	now() {
		return new Date().toTimeString();
	},
	connected() {
		var self = this;
		this.timer = window.setInterval(function() {
			self.update();
		}, 500)
	},
	disconnected() {
		if (this.timer) {
			window.clearInterval(this.timer);
			this.timer = null;
		}
	}
});

```
