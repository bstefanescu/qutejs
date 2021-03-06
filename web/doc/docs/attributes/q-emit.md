# The `q:emit` attribute

This directive can be used to declaratively emit DOM events in response to received DOM events. It can be used to forward received events to upper components and optionally rewrite them into more meaningfull events.

The syntax of `q:emit` attribute is `q-emit-[new-event-name]-on[original-event-name]` or `q-emit-[event-name]`. In the first form the the original event is `forwarded` as a new custom event event having the gigen name. In the later form the original event is `forwarded` as a custom event having the same event name than the original one.

Let's say you have a `remove-button` component which wraps a `button` and need to emit a 'remove' event when the button is clicked. This can be simply done usiong a `q:emit` directive:

```xml
<q:template name='RemoveButton'>
	<button q:emit-remove-onclick>Remove</button>
</q:template>
```

This component will emit a custom event named 'remove' when the button is clicked. The **event detail** will point to the context component in which the event was emited. The event will also contains two special properties: `$originalEvent` and `$originalTarget` which will point to the source event and respectively the source event target.

You can change the event detail to store some meaningfull value like for example the id of the removed item. Example:

```xml
<q:template name='RemoveButton'>
	<button q:emit-remove-onclick={$attrs.id}>Remove</button>
</q:template>
<!-- then to you use the component you need to pass an id: -->
<remove-button id={item.id}>Remove</remove-button>
```

This button will trigger a 'remove' event with. the `detail` field set to the item id.

Sometimes you may want to preserve the original event name. For example you may want to create a custom form control that emits a 'change' events when some internal text input emit a change event. In that case you simply specify the original event name without the `on` prefix: `q-emit-change`.

Here is an working example, demontsrating the `q-emit` usage from both a regular element and a `ViewModel` component.

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='TemplateButton'>
	<a href='#' q:emit-action-onclick><slot/></a>
</q:template>

<q:template name='MyButtonTemplate'>
	<a href='#'><slot/></a>
</q:template>

<q:template name='RootTemplate'>
	<div>
	<template-button @action='handleAction'>Fun Button - Click Me</template-button>
	<hr/>
	<my-button @action='handleAction' q:emit-action-onclick={msg}>VM Button - Click Me</my-button>
	</div>
</q:template>


var MyButton = Qute(MyButtonTemplate); // create a empty ViewModel

@Template(RootTemplate)
class Root extends ViewModel {
    msg = 'hello';
    handleAction(e) {
		console.log('Action Event', e, e.detail);
		console.log('Original Event', e.$originalEvent)
		window.alert('Handling Action!');
	}
}
export default Root;
```

## Using a function to generate the detail from the source event

You can also use a function to generate the detail set to the new event. Let's say we want to forward a custom event to a new custom event and reuse the detail from the source event in the ew evennt. We ca do this by using an arrow function that takes as the first argument the source event:

```xml
<my-button @action='handleAction' q:emit-action-onclick={sourceEvent => { return {value: 'new-detail', source: sourceEvent.detail}}>VM Button - Click Me</my-button>
```

## The `#new-event@source-event` notation.

There is an alternative notation you can use: `#new-event@source-event` as a shortcut to the `q:emit` attribute.

The following are equivalent:

1. `q:emit-action-onclick` with `#action@click`
2. `q:emit-click` with `#click`

