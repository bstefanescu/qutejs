
# Property Watchers

Sometimes you want to be notified when a reactive property is about to change. This can be done using a **property watcher**.

You can register property watchers when you define your component using the `Qute.watch(propName, watcher)` method. This method can be chained so you can easily declare watchers on multiple properties.

The `propName` argument is the name of the reactive property you want to watch and the `watcher` argument is a function with the signature `function (newValue, oldValue) { ... }`

The `newValue` argument is the new value being assigned to the property, and the `oldValue` is the existing property value. You can **cancel** the property update by returning `false` from the watcher function. Returning any other value will be ignored and the property update will be done (which will trigger a DOM update).

The watcher function is called in the context of the component instance (i.e. `this` points to the component instance).

```jsq
<q:template name='root'>
<div>
	<button @click='counter1++'>Unlimited Counter: {{counter1}}</button>
	<button @click='counter2++'>Limited Counter: {{counter2}}</button>
</div>
</q:template>

export default Qute('root', {
	init() {
		return {
			counter1: 0,
			counter2: 0
		}
	}
}).watch('counter1', function(newValue, oldValue) {
	// just log the update
	console.log('Updating counter1', oldValue, ' -> ', newValue);
}).watch('counter2', function(newValue, oldValue) {
	// log the update
	console.log('Updating counter2', oldValue, ' -> ', newValue);
	// cancel update if counter is greater than 2
	if (newValue > 2) {
		alert('Counter cannot be incremented further!');
		return false;
	}
});
```