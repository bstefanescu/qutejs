# Component Life Cycle

A Qute Component provides 4 life cycle events that can be used events that can be used to set up and clean up components.

1. **CREATED** - the component root element was created. The `created(element)` method is called.
2. **READY** - the component root element was created, attributes injected and listeners registered. The `ready(element)` method is called.
3. **CONNECTED** - the component root element was attached to the DOM. The `connected()` method is called.
4. **DISCONNECTED** - the component element root was detached from the DOM. The `disconnected` method is called.


<div style='text-align:center'>

![Qute Life Cycle](docs/qute-life-cycle.png)

</div>



### `created(element)`

Called just after the component root element was created (i.e. component was rendered). The component is not yet connected to the DOM.

This handler is called only once in the component life cycle, before the element attributes are injected into component properties and before listeners are registered.

The **element** argument is the DOM element created by the rendering function.  \
It is also available at any time as the **`$el`** property of the component instance.

### `ready(element)`

Called after the xomponent root element is created (after the `created` hook is called) and after the component properties are injected from element attributes and all declarative listeners are registered. The component is ready to be used (to be connected to the DOM).

The **element** argument is the DOM element created by the rendering function.

### `connected()`

Called just after the component is connected to the DOM (i.e. the component element is attached to the DOM).

This handler may be called several times in the component life cycle, every time the component element is attached to the DOM. A component can be attached to the DOM or detached from the DOM multiple times. For example if the component is conditionally displayed by using the [if directive](#/directives/if), it will be detached / attached every time the `if` state changes.

This handler can be used to add event listeners, setup timers etc.

### `disconnected()`

Called just after the component is disconnected from the DOM. It may be called several times in the component life cycle.

This handler can be used to clean-up resources setup by the `connected` handler.

## Template Components and the Life Cycle

Template components doesn't take part to the component life cycle, these components are just rendering functions.  \
However, there is a way to be notified at the template component level when the parent ViewModel component is connected to the DOM.

See the **[q:call](#/attributes/q-call)** page for an example.
