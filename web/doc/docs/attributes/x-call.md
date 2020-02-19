# The x-call attribute

Call a user function after the target DOM element was created (including its content).

The x-call attribute value must resolve to a function: you can either use a **method name** of the current ViewModel, either an inline **arrow function**.

**Usage:**
1. As an **arrow function**: `<input x-call="(el) => this.inputEl = el">`
2. As a **ViewModel method**: `<input x-call="onCreateControl">`

The `x-call` function value will be called in the context of the component containing the target DOM element (i.e. `this` will point to the closest component instance) and will take as argument the element instance.  \
When the closest component is a functional copmponent `this` will point to the functional component object (which is not a `ViewModel`).

## Using `x-call` on component tags

When using `x-call` on a `ViewModel` or functional component tag the `x-call` function will be executed on the root element of the component.

## Examples

### Fetch a DOM element instance from a `ViewModel` component

```jsq
<x-tag name='root'>
	<div>
	<input type='text' name='name' x-call='el => this.inputEl = el'><button @click='onClick'>Click me!</button>
	</div>
</x-tag>

export default Qute('root', {
	onClick() {
		alert('Input value is '+this.inputEl.value);
	}
});
```

Here we used an arrow function to store the input element instance as a component property.

### Initialize a DOM element at creation time

Let's do more, we can initialize the input if empty:

```jsq
<x-tag name='root'>
	<div>
	<input type='text' name='name' x-call='onInputCreate' />
	<button @click='onClick'>Click me!</button>
	</div>
</x-tag>

export default Qute('root', {
	onInputCreate(el) {
		this.inputEl = el;
		if (!el.value) el.value = 'Hello!';
	},
	onClick() {
		alert('Input value is '+this.inputEl.value);
	}
});
```

### Functional Components and the Life Cycle

A functional component doesn't take part on the component life cycle.  \
Anyway, we can use the `x-call` directive to register a handler for connect and disconnect life cycle events on the current rendering context.

```jsq
<x-tag name='functional' import='handleFuncLoad'>
    <div x-call='handleFuncLoad'>I am a functional component</div>
</x-tag>

<x-tag name='root'>
    <functional />
</x-tag>

// an object providing two event handlers to be notified
// when parent component is connected or disconnected
var ConnectionHandler = {
  connect() {
  	console.log('Parent VM connected');
  },
  disconnect() {
    console.log('Parent VM disconnected');
  }
}

function handleFuncLoad(el) {
  // register the connect / disconnect handlers
  this.$r.$push(ConnectionHandler);
}

export default Qute('root');
```

In this example, we are registering the connect / disconnect handlers using the current rendering context `$push` method.

The `import` attribute of `x-tag` is required to access variables declared in the current file within the template.

This technique can be used **on any DOM element**, not only on functional component elements.



