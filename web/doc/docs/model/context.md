# Qute Context

The context object is an object shared between all components in a Qute Component tree.  \
The main goal of this object is to provide a way of communication between components through a [Message Bus](#/model/bus), but it can be also used to share random data like configuration or singleton services between components in a Qute Component tree.

The context can also be shared between different component trees, enabling components from one tree to communicate with components in another tree.

A context is automatically created when a root component is instantiated. You can also explicitly assign an existing context to a component tree by passing a context object as the first argument to the component root constructor. To create a context object use the `Qute.Context` constructor.  \
In this way you can share contexts between multiple component trees.

The context used when creating the root component can be accessed by any component as the component instance field named `$ctx`.

**Examples**

The following 2 ways of sharing a context are equivalent:

```javascript
var ctx = new Qute.Context({
	ajax: new MyAjaxService()
});
var root1 = new MyRootComponent1(ctx);
var root2 = new MyRootComponent2(ctx);

root1.mount('app1');
root2.mount('app2');

```

```javascript
var root1 = new MyRootComponent1();
var ctx = root1.$ctx;
ctx.ajax = new MyAjaxService();
var root2 = new MyRootComponent2(ctx);

root1.mount('app1');
root2.mount('app2');

```

In these examples we shared a singleton ajax service on all components part of the two component trees.

Here is an **example of a dummy ajax service** provided through the context:

```jsq
<x-tag name='my-button'>
	<button @click='fetchData'>Click me!</button>
</x-tag>

var MyButton = Qute('my-button', {
	fetchData() {
		this.$ctx.ajax('GET', 'someURL', function(data) {
			console.log('GOT data', data);
		});
	}
})

var ctx = new Qute.Context({
	ajax: function(method, url, cb) { // a dummy ajax service
		console.log('ajax request: ', method, url);
		cb({message: 'Hello'});
	}
});

new MyButton(ctx).mount('app');
```


## The Context API

### `Qute.Context(optionalData)`

The Context constructor. Creates a new context and fill it with properties of the `optionalData` argument if any was specified.

### `post(topic, message, data)`

Post a `message` to the given `topic`. The `data` argument is optional and can be used to pass aditional data along with the message.

Throws an error if no usch `topic` exists.

### `postAsync(topic, message, data)`

Post a `message` to the given `topic` using `window.setTimeout(... , 0)`. The `data` argument is optional and can be used to pass aditional data along with the message.

Throws an error if no usch `topic` exists.

### `subscribe(topic, listenerFn)`

Subscribe a listener to a `topic`. The `listenerFn(message, data)` function will be called each time a message is posted to that topic, with the `message` as the first argument and the optional `data` as the second argument.

You can subscribe as many listeners you want to the same topic. The listeners will be called in the same order the listeners subscribed. If one of the listeners return `false` then the message processing will be canceled and the rest of the listeners will no more be invoked.

### `unsubscribe(topic, listenerFn)`

Unsubscribe a listener from a topic.

### `subscribeOnce(topic, message, listenerFn)`

This can be used to subscribe a listener on a `topic` for a specific `message`. When the message is received the listener will be removed.

### `freeze()`

Freeze the context. A shortcut to `Object.freeze(ctx)`
