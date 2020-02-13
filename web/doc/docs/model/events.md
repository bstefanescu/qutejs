# Working with DOM Events


## Registering DOM Event listeners

Registering a DOM event listener can be done either **declaratively** by using *event attributes*, either **programmatically** by using the event API exposed by the Qute ViewModel.

Listeners registered using any of these methods are **automatically removed** when the component is disconnected.

A listener function only takes one argument, the **event object**, and will always be called in the **context of the component who registered** the listener (i.e. `this` will point to the component `ViewModel` instance).

The listener may return `false` to stop event propagation and prevent any default handling, any other return value is ignored.  \
Thus, returning `false` will have the same effect as calling:

```javascript
event.stopPropagation();
event.preventDefault();
```

### Declarative Event Listener Registration

You can register a DOM event listener directly in the template by using a special attribute starting with the **@** character and followed by the event name to listen: `@event-name='listener'`.

#### Example

```jsq
<x-tag name='root'>
  <button @click='handleClick'>Click me</button>
</x-tag>

export default Qute('root', {
	handleClick(event, target) {
		console.log('Handling event: ', this, event);
	}
})
```

You can also use simple expressions instead of passing a listener method name:

```jsq
<x-tag name='root'>
  <button @click='console.log("Handling event: ", this, $1)'>Click me</button>
</x-tag>

export default Qute('root');
```

In that case the event object is accessible as a variable named `$1`.

An alternative way to write inline expressions is to use an arrow functions:

```jsq
<x-tag name='root'>
  <button @click='event => console.log("Handling event: ", this, event)'>Click me</button>
</x-tag>

export default Qute('root');
```


### Event Listener Registration through API

When you want to listen to many elements it is better to register the listener on a parent DOM element so that it catches all the events from children elements of interest.
The component factory **API** provides you an easy way to do it.

You can declare a listener when defining the component **ViewModel** by using the `on(event[, selector], listener)` method like in the example below:

```jsq
<x-tag name='root'>
  <button>Click me</button>
</x-tag>

export default Qute('root').on('click', function(event) {
	console.log("Handling event: ", this, event);
});
```

This will register a **click** listener on the component root element (in this case on the **button** element).
The listener will be automatically registered when the component is connected to the DOM and will be removed when component disconnects from the DOM.

The `on` method used above can be chained to easily register multiple listeners:

```jsq
<x-tag name='root'>
<div>
  <input type='text' name='text' value={text} />
  <button>Click me</button>
</div>
</x-tag>

export default Qute('root', {
	init() {
		return { text: "some text" }
	}
}).on('click', 'button', function(event) {
	console.log("Handling click event: ", this, event);
}).on('change', 'input', function(event) {
	console.log("Handling input event: ", this, event);
});

```

In the examples above the listeners are declared at component factory level. The listeners will be registered anytime an instance of the component is connected to the DOM. But what if you want to conditionally register a listener?

#### Conditionally Registering an Event Listener

You can also use the `$on` method on the **ViewModel** instance to register a listener. This method has the same signature as the one provided by the component constructor.

When using this registration method it is recommended to do the registration when the component is connected to the DOM.

```jsq
<x-tag name='root'>
  <button log-clicks>Click me</button>
</x-tag>

export default Qute('root', {
	logClicks: true,
	connected: function() {
		if (this.logClicks) this.$on('click', function(event) {
			console.log("Handling event: ", this, event);
		});
	}
});
```

Listeners registered like this will be automatically removed when the component is disconnected, so you don't need to worry about the cleanup.


## Firing Events

Firing [DOM Custom Events](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent) can be done using the `emit` and `emitAsync` methods of a component instance.

### **`emit(event, data)`**

Fire a custom DOM event. The event is fired by calling [dispatchEvent](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent) on the component root element.

* `event` - the event name
* `data`  - an optional data object accessible as the `Event.detail` field. Defaults to the ViewModel instance who emitted the event.

### **`emitAsync(event, data, timeout)`**

Fire a custom DOM event asynchronously. The event is fired by calling [dispatchEvent](https://developer.mozilla.org/en-US/docs/Web/API/EventTarget/dispatchEvent) on the component root element.

* `event` - the event name
* `data`  - an optional data object accessible as the `Event.detail` field. Defaults to the ViewModel instance who emitted the event.
* timeout - an optional timeout in milliseconds. Defaults to 0.

Emitting an event from a `ViewModel` instance is firing the event at the component root element.

### Example

```jsq
<x-tag name='my-button'>
	<button @click='handleClick'><slot/></button>
</x-tag>

<x-tag name='root'>
	<my-button @action='performAction'>Click me!</my-button>
</x-tag>

Qute('my-button', {
	handleClick(event) {
		this.emitAsync('action');
		return false;
	}
});

export default Qute('root', {
	performAction(event) {
		alert('The button was clicked');
	}
});
```

### Firing events from functional components.

Functional components are also exposing `emit` and `emitAsync`. In that case the event will be dispatched at the functional component root element.

```jsq
<x-tag name='my-button'>
	<button @click='emitAsync("action")'><slot/></button>
</x-tag>

<x-tag name='root'>
	<my-button @action='performAction'>Click me!</my-button>
</x-tag>

export default Qute('root', {
	performAction(event) {
		alert('The button was clicked');
	}
});
```

