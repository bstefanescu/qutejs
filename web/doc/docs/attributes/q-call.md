# The `q:call` attribute

Call a user function after the target DOM element was created (including its content).

The q:call attribute value must resolve to a function: you can either use a **method name** of the current ViewModel, either an inline **arrow function**.

**Usage:**
1. As an **arrow function**: `<input q:call="(el) => this.inputEl = el">`
2. As a **ViewModel method**: `<input q:call="onCreateControl">`

The `q:call` function value will be called in the context of the component containing the target DOM element (i.e. `this` will point to the closest component instance) and will take as argument the element instance.  \
When the closest component is a template copmponent `this` will point to the template component object (which is not a `ViewModel`).

## Using `q:call` on component tags

When using `q:call` on a `ViewModel` or template component tag the `q:call` function will be executed on the root element of the component.

## Examples

### Fetch a DOM element instance from a `ViewModel` component

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
	<div>
	<input type='text' name='name' q:call='el => this._input = el'><button @click='onClick'>Click me!</button>
	</div>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    _input = null;
    onClick() {
		window.alert('Input value is '+this._input.value);
	}
}
export default Root;
```

Here we used an arrow function to store the input element instance as a component property.

**Note** that `Qute` provides a simpler method to fetch a reference to a DOM element: the **[q:ref](#/attributes/q-ref)** attribute.

### Initialize a DOM element at creation time

Let's do more, we can initialize the input if empty:

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
	<div>
	<input type='text' name='name' q:call='onInputCreate' />
	<button @click='onClick'>Click me!</button>
	</div>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    _input = null;

	onInputCreate(el) {
		this._input = el;
		if (!el.value) el.value = 'Hello!';
	}
    onClick() {
		window.alert('Input value is '+this._input.value);
	}
}
export default Root;
```

### Template Components and the Life Cycle

A template component doesn't take part on the component life cycle.  \
Anyway, we can use the `q:call` directive to register a handler for connect and disconnect life cycle events on the current rendering context.

```jsq
<q:template name='TemplateComp' import='handleTemplateLoad'>
    <div q:call='handleTemplateLoad'>I am a template component</div>
</q:template>

<q:template export>
    <TemplateComp />
</q:template>

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

function handleTemplateLoad(el) {
  // register the connect / disconnect handlers
  this.$r.$push(ConnectionHandler);
}
```

In this example, we are registering the connect / disconnect handlers using the current rendering context `$push` method.

The `import` attribute of `q:template` is required to access variables declared in the current file within the template.

This technique can be used **on any DOM element**, not only on template component elements.



