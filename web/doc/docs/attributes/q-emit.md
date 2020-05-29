# The `q:emit` attribute

This directive can be used to declaratively emit DOM events in response to received DOM events. It can be used to forward received events to upper components and optionally rewrite them into more meaningfull events.

The syntax of `q:emit` attribute is `q-emit-[new-event-name]-on[original-event-name]` where the `new-event-name` is optional (if not specified the new event will have the same name as the original event).

Let's say for example that you have a `remove-button` component which wraps a `button` and need to emit a 'remove' event whe the button is clicked. This can be simply done usiong a `q:emit` directive:

```xml
<q:template name='remove-button'>
	<button q:emit-remove-onclick>Remove</button>
</q:template>
```

This component will emit a custom event named 'remove' when the button is clicked. The **event detail** will point to the original click event.

You can change the event detail to store some meaningfull value like for example the id of the removed item. Example:

```xml
<q:template name='remove-button'>
	<button q:emit-remove-onclick={$attrs.id}>Remove</button>
</q:template>
<!-- then to you use the component you need to pass an id: -->
<remove-button id={item.id}>Remove</remove-button>
```

This button will trigger a 'remove' event with. the `detail` field set to the item id.

Sometimes you may want to preserve the original event name. For example you may want to create a custom form control that emits a 'change' events when some internal text input emit a change event. In that case you simply ommit the new event name from the `q:emit` attribute: `q-emit-onchange`.

Here is an working example, demontsrating the `q-emit` usage from both a fucntional component and a `ViewModel` component.

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

<q:template name='fun-button'>
	<a href='#' q:emit-action-onclick><slot/></a>
</q:template>

<q:template name='my-button'>
	<a href='#' q:emit-click={$attrs.id}><slot/></a>
</q:template>

<q:template name='root'>
	<div>
	<fun-button @action='handleAction'>Fun Button - Click Me</fun-button>
	<hr/>
	<my-button @click='handleAction' id='bla'>VM Button - Click Me</my-button>
	</div>
</q:template>


Qute('my-button');

export default Qute('root', {
	handleAction(e) {
		console.log('Action Event', e, e.detail);
		console.log('Original Event', e.originalEvent)
		window.alert('Handling Action!');
	}
});
```

## The `#new-event@source-event` notation.

There is an alternative notation you can use: `#new-event@source-event` as a shortcut to the `q:emit` attribute.

The following are equivalent:

1. `q:emit-action-onclick` with `#action@click`
2. `q:emit-click` with `#click`

