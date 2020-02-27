# Manually Update DOM

There are cases when you don't want to use reactive properties to trigger DOM updates. You can update a component element at any time by calling the `update()` method.

Keep in mind that this is only updating the component element. It will not recursively update nested context like nested components, `if` related context, `x-for` related context onr `view` related context. To update the entire DOM tree under a component you must use the `refresh()` method.

The following component is displaying the current time and is regularly updating the DOM to display the current time:

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
