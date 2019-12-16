# Component Life Cycle

A Qute Component provides 4 life cycle events that can be used events that can be used to setup and cleanup components.

1. **INIT** - the component is initialized. The `init(ctx)` method is called.
2. **CREATED** - the component root element was created. The `created(element)` method is called.
3. **CONNECTED** - the component root element was attached to the DOM. The `connected()` method is called.
4. **DISCONNECTED** - the component element root was detached from the DOM. The `disconnected` method is called.


<div style='text-align:center'>

![Qute Life Cycle](docs/qute-life-cycle.png)

</div>


#### `init(ctx)`

Called just after the component is instantiated. Should be used to initialize the component and to declare reactive properties.

Reactive properties are declared by returning an object that maps property keys to default values. Any other component property which is not declared in the returned object will not be reactive.

The current [component context](#/model/context) is passed as an argument to the `init` callback.

#### `created(element)`

Called just after the component root element was created (i.e. component was rendered). The component is not yet connected to the DOM.

This handler is called only once in the component life cycle, after the init method and after attributes are bound to properties.

The **element** argument is the DOM element created by the rendering function.  \
It is also available at any time as the **`$el`** property of the component instance.

#### `connected()`

Called just after the component is connected to the DOM (i.e. the component element is attached to the DOM).

This handler may be called several times in the component life cycle, every time the component element is attached to the DOM. A component can be attached to the DOM or detached from the DOM mulitple times. For example if the component is conditionaly displayed by using the [if directive](#/directives/if), it will be detached / attached every time the `if` state changes.

This handler can be used to add event listeners, setup timers etc.

#### `disconnected()`

Called just after the component is disconnected from the DOM. It may be called several times in the component life cycle.

This handler can be used to cleanup resources setup by the `connected` handler.

## Functional Components and the Life Cycle

Functional components doesn't take part to the component life cycle, these components are just rendering functions.  \
However, there is a way to be notified at the functional component level when the component containing it is connected.
For this, we need to use the special event `@create` which can be used on any element and is fired when the element is created.

Here is an example:

```jsq
<x-tag name='functional' import='handleFuncLoad'>
  <div @create='handleFuncLoad'>I am a functional component</div>
</x-tag>

<x-tag name='root'>
  <functional />
</x-tag>

function _disconnected(vm) {
  console.log('Parent VM disconnected');
}
function _connected(vm) {
  console.log('Parent VM connected');
}
function handleFuncLoad(ctx) {
	ctx.$parent.setup(function() {
      // called when parent vm connected
      // register cleanup on disconnect
      _connected(ctx.$parent);
      ctx.$parent.cleanup(function() {
        _disconnected(ctx.$parent);
      });
    });
}

export default Qute('root');
```

In this example, we are retrieving the closest `ViewModel` containing the functional component (for this we use the $parent property of the functional component context) and we register a setup function that will be called when the component is connected. The setup function is registering cleanup function that will be called when the component is disconnected.

The `import` attribute of `x-tag` is required to access variables declared in the current file within the template.

