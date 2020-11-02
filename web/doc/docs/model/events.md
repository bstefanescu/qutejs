# Working with DOM Events


## Registering DOM Event listeners

Registering a DOM event listener can be done either **declaratively** by using *event attributes*, either **programmatically** by using the `@On(event, selector)` decorator or the event API exposed by the `ViewModel`.

Listeners registered using any of these methods are **automatically removed** when the component is disconnected.

A listener function only takes one argument, the **event object**, and will always be called in the **context of the component who registered** the listener (i.e. `this` will point to the component `ViewModel` instance).

The listener may return `false` to stop event propagation and prevent any default handling; any other return value is ignored.  \
Thus, returning `false` will have the same effect as calling:

```javascript
event.stopPropagation();
event.preventDefault();
```

### Declarative Event Listener Registration

You can register a DOM event listener directly in the template by using a special attribute starting with the **@** character and followed by the event name to listen: `@event-name='listener'`. You can also use the long form of the event attribute: `q:on{event-name}`.

#### Example

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
  <button @click='handleClick'>Click me</button>
</q:template>

@Template(RootTemplate)
class RootComponent extends ViewModel {
	handleClick(event, target) {
		console.log('Handling event: ', this, event);
        window.alert('Handling event: '+event);
	}
}
export default RootComponent;
```

You can also use an inlined arrow function as the event handler:

```jsq
import Qute from '@qutejs/runtime';

<q:template export>
  <button @click = ' event => { window.alert("Handling event: "+event); } '>Click me</button>
</q:template>

```


### Event Listener Registration Using the `@On` Decorator

When you want to listen to many elements it is better to register the listener on a parent DOM element so that it catches all the events from children elements of interest.

You can declare an event listener by deocrating the event handler method with the `@On(event[, selector])` decorator. You can pass two arguments to the decorator:

1. **event** - required - the event name
2. **selector** - optional - a CSS selector to only retain events triggered by the selected elements.


```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

const { ViewModel, Template, Property, On } = Qute;

<q:template name='RootTemplate'>
<div>
  <input type='text' name='text' value={text} />
  <button>Click me</button>
</div>
</q:template>

@Template(RootTemplate)
class RootComponent extends ViewModel {
    @Property text = "some text";

    @On('click', 'button')
    onButtonClicked(event) {
        console.log("Handling click event: ", this, event);
        window.alert('Button clicked!');
    }

    @On('change', 'input')
    onInputChanged(event) {
        console.log("Handling change event: ", this, event);
        window.alert('Input changed!');
    }
}
export default RootComponent;
```

#### Conditionally Registering an Event Listener

In the examples above the listeners are registered when the component is connected to the DOM. But what if you want to conditionally register a listener?

In this case you can use the `$on(event[, selector], listener)` method on the **ViewModel** instance to register a listener.
When using this registration method it is recommended to do the registration when the component is connected to the DOM. The listener will be automatically unregistered when the component is disconnected.

```jsq
import Qute from '@qutejs/runtime';

const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
  <button>Click me</button>
</q:template>

@Template(RootTemplate)
class RootComponent extends ViewModel {
	@Property logClicks = true;

	connected() {
		if (this.logClicks) this.$on('click', function(event) {
			console.log("Handling event: ", this, event);
            window.alert('Handling click event!');
		});
	}
}
export default RootComponent;
```


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
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

const { ViewModel, Template } = Qute;

<q:template name='MyButtonTemplate'>
	<button @click='handleClick'><slot/></button>
</q:template>

<q:template name='RootTemplate'>
	<my-button @action='performAction'>Click me!</my-button>
</q:template>

@Template(MyButtonTemplate)
class MyButton extends ViewModel {
	handleClick(event) {
		this.emitAsync('action');
		return false;
	}
}

@Template(RootTemplate)
class RootComponent extends ViewModel {
	performAction(event) {
		window.alert('The button was clicked');
	}
}

export default RootComponent;
```

### Firing events from template components.

Template components are also exposing the `emit` and `emitAsync` methods. In that case the event will be dispatched at the template component root element.

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

const { ViewModel, Template } = Qute;

<q:template name='MyButton'>
	<button @click={event => emitAsync("action")}><slot/></button>
</q:template>

<q:template name='RootTemplate'>
	<my-button @action='performAction'>Click me!</my-button>
</q:template>

@Template(RootTemplate)
class RootComponent extends ViewModel {
	performAction(event) {
		window.alert('The button was clicked');
	}
}

export default RootComponent;
```

## Forwarding events.

You can forward (and optionally rewrite) existing events using the **[q:emit](#/attributes/q-emit)** attribute directive. This is especially usefull to forward events from a component context to the parent context. The event is fired from the root element of the current component.

The `q:emit` directive can be specified as a regular XML attribute: `q:emit-{newEvent}-on{sourceEvent}` or using its short notation: `#{newEvent}@{sourceEvent}`

**Examples:**

1. `<a href='#' q:emit-action-onclick>Click me</a>` - will fire an 'action' event on the current component when a click event is issued (the click event propagation will be stopped).
2. `<a href='#' #action@click>Click me</a>` - the same as before but using the short notation.
3. `<a href='#' q:emit-click>Click me</a>` - will fire a click event on the current component when the click event is issued.
4. `<a href='#' #click>Click me</a>` - the same as before but using the short notation.

**Note** that emitted events are fired in the context of the root element of the current component.

You can also use the **[q:async-emit](#/attributes/q-async-emit)** directive to emit events asynchronously.

## Example

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

<q:template name='MyAction'>
	<a href='#' q:emit-action-onclick='$attrs.id'><slot/></a>
</q:template>

<q:template export>
	<div>
	<my-action @action={e => window.alert("Action: "+e.detail)} id='action-id'>Click Me</my-action>
	</div>
</q:template>
```


