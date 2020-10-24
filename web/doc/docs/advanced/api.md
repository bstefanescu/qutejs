# Qute API

The main entry point when using Qute is the `Qute` global object. The object itself is a function that can be used to define components

## The `Qute()` Function

The `Qute(renderingFn, model)` function is used to define `ViewModel` components. It takes 2 arguments:

1. the **rendering function**.
   The rendering function can be either a compiled template, either a custom rendering function. If this argument is not provided then it is expected that the model will provide a `render` function, otherwise an exception will be thrown.
2. the **component model**
   This is an optional argument. Can be either a **plain object** or a **class**.  \
   See the **[Components](#/model/components)** section for more details.

The `Qute()` function **returns** a **ViewModel Constructor**.

## The `ViewModel` constructor (i.e. the Component Type)

This object is returned by the `Qute()` function explained above. We also name this object the **component type**.
The component type provides a set of chainable functions to further customize the **component**. Each chainable function is returning backl the component type.

The component type can be used as a constructor to create new component instances. Usually, you only instantiate the root component by hand. All the other components will be instantiated when needed by the component templates.

**Example:**

```javascript
const MyComponent = Qute(MyComponentTemplate, {
    // define here component methods, getters, lifecycle callbacks etc.
}).properties({
    // define here reactive properties
    title: 'Hello!'
}).watch('title', function(newValue, oldValue) {
    // define a listener on the title reactive property
	// do something when the title property changes ...
}).on('click', function(e) {
    // define event handlers
	// do something on click ...
}).channel(function(message, data) {
    // define a component messaging handler
	// do something when a message is posted to the component channel.
}).mixin(Mixin1, Mixin2, ...); // apply some mixins to the component model

new MyComponent().mount(); // instantiate and mount the root component
```

Here is the list of the chainable functions provided by the component type:

### `properties(factoryOrProperties)`

Define the reactive properties exposed by the component.

You can either pass a plain object of mapping property names to initial values, either you can pass a factory function, which will be called at component instaqntiation time to get the mapping of property names / initial values.

The factory function is usefull when using complex property values like array or objects, to avoid sharing these intial values between component isntances. By using a factory function, these intiial values will be created each time a component instance is created.

You can also define constraints on the reactive properties or special properties like `_Link` and `_List` properties. You can find more on this on the [Property Types page](#/model/proptypes).

### `watch(prop, watcher)`

Register a **property watcher**.

The `prop` argument is the property name to watch and the `watcher` is a function thgat will be called when the value of the watched property is changing.

The watcher signature is: `function(newValue, oldValue)`.

### `on(event[, selector], listener)`

Register an event handler on the component element. This function has a similar syntax as the `jQuery.on` method.

The `event` argument is the event name.  \
The `selector` is optional and can be used to filter the event target.  \
The `listener` function will be called when the event is fired. It takes one argument: the **event** object, and can return `false` to stop propagation and prevent the default browser action.

For more details see the **[Events](#/model/events)** section.

### `channel(handler)`

Register a communication channel handler for the component.

The `handler` has the signature: `function(message, data)`

The channel is not opened by registering the handler. To open a channel you must use a `q:channel` attribute on the component element toi give the channel a name, or, for root components use the `listen(channelName)` method.

For more details see the **[Message Bus](#/app/bus)** and the **[Components](#/model/components)** section.

### `mixin(mixin1, mixin2, ...)`

Add mixins to a component type.

**Example**

```jsq
import Qute from '@qutejs/runtime'

<q:template name='root'>
    <div>
        {{message}} <button @click={changeGreeting}>Change Greeting</button>
    </div>
</q:template>

export default Qute('root', {
   init() { return { message: 'Hello!' } }
}).mixin({
    changeGreeting() {
        this.message= 'Hi!';
    }
});
```

## The Component Instance API

A component instance is obtained by instantiating the component constructor. The constructor accepts two **optional** arguments:

1. A **Qute Application** instance.

2. An object of attributes, the same as the attributes you may use when instantiating the component through a template.

**Example:**

```javascript
var MyComponent = Qute('my-component', {
	// component model definition here
});
var myComponent1 = new MyComponent();
// or you can use a specific app instance and some initial attributes
var myComponent2 = new MyComponent(app, attrs);
```

### Component properties

#### `$el`

The root element of the component. This property is set after the component is rendered.

#### `$app`

The current **Qute Application** object.

#### `$tag`

The component (tag) name.

#### `$data`

The data object holding all reactive properties.

#### `$r`

The rendering context linked to this component.

This can be usefull when using **[custom attributes](#/attributes/q)** or **[q:call](#/attributes/q-call)**

#### '__QUTE_VM__'

An internal property, used to mark a ViewModel object.

### Component methods

#### `mount(elOrId, insertBefore)`

Mount the component in the element denoted by `elOrId`.

The `elOrId` is either a DOM element or an ID that can be used to find the element in the current document.

The component root element will be appended into the target element.  \
If `insertBefore` is true, then the component root element is inserted before the target element.

The `insertBefore` argument is optional and default to false.

#### `unmount()`

Unmount the component. This will disconnect all the children ViewModel components and will remove the root element from the DOM.

#### `listen(channelName)`

Subscribe to `channelName` channel and use the component channel listener to handle incoming messages.

This method is specially provided for **root components** and have the same efect as using the **[q:channel](#/attributes/q-channel)** attribute.

#### `setup(setupFn)`

Register a setup function that will run every time the component is connected to the DOM.

#### `cleanup(cleanupFn)`

Register a cleanup function that will run every time the component is disconnected from the DOM.

#### `update()`

Trigger an update of the component DOM tree. The update will be done at the next `UpdateQueue` tick.

You don't need to use this method directly if you are using only reactive properties.

#### `$parent()`

Get the parent component if any.

#### `$root()`

Get the root component.

#### `$set(key, value)`

Set an attribute, in the same way an attribute is set on a component element from a Qute template.

The attribute will be either set into a matching reactive property, either it will be added to the `$attrs` objecty (that contains undeclared attributes).

The attribute to property matching is converting the kebab-case name of the attribute to camelCase.

If the attribute is set to a reactive property then an update will be triggered.

#### `toHTML()`

Get the HTML representation of the component. Same as `$el.outerHTML`.

#### `emit(event, data)`

Emit a DOM CustomEvent.

* `event` is the event name
* `data` is an optional event data. If set it will be assigned to the `detail` property of the event.

#### `emitAsync(event, data, timeout)`

Emit a DOM event in next UI loop. The `timeout` argument is optional and defaults to 0.

#### `subscribe(topic, listenerFn)`

Create a communication channel by subscribing to the given topic.

#### `subscribeOnce(topic, event, listenerFn)`

Subscribe to the given topic for only one event. After the event will be received the listener will unsubscribe.

#### `post(topic, msg, data)`

Post a message to the given topic wih an optional data object.

#### `postAsync(topic, msg, data)`

Post a message to the given topic wih an optional data object.

The message is posted in a next UI loop.

#### `$on(type, selector, listener)`

Register a DOM event listener on the compoennt root element. This must be called only in `connected` life cycle hook. Calling `$on()` will automatically register a cleaning function that will remove the listener when component disconnects.

This has the same effect as `ComponentConstructor.on()`. The difference is that this method can be used to conditionally register event listeners.

#### `render(rendering)`

Render the component given a rendering instance. Returns the rendered DOM element.



## The `Qute` Facade

We saw `Qute()` is mainly used as a component factory. Bu the `Qute` function object also acts as a namespace for several global properties and methods.

### `Qute.closest(element)`

Find the closest Qute ViewModel Component containing the given DOM element.

### `Qute.runAfter(callback)`

Register a callback to be invoked after all the tasks in the update queue are run. If the queue is empty then the callback is immediately run.

Because the updates are run asynchronously you cannot know when the update job related to a reactive property change is done. Using this function you can be notified after the current update is done.

This is usefull when writing tests, to make assertions after the DOM changed in response to model change.

### `Qute.registerDirective([tagOrComponentType, ]name, fn)`

Register a custom attribute directive. The `tagOrComponentType` argument is optional, and should be used when the directive should only be enabled for the given tag.

See **[Custom Attributes](#/attributes/q)** for more details.

### `Qute.render(renderFn, dataModel)`

Manualy render a template function given its render fucntion and a **model** object.

The model can any object. You can thus use Qute templates to render anyhting, not only `ViewModel` objects.

Return a DOM element (the root of the rendered elements tree).

### `Qute.defineMethod(name, fn)`

Define a method on `ViewModel` and template component prototype. Can be used to extend the component API. See **[Internationalization Support](#/app/i18n)** for an example.

### `Qute.Application`

The **Qute Application** type.

### `Qute.ViewModel`

The **View Model** type. Should be extended by components declared through **[class syntax](#/model/class)**

### `Qute.Rendering`

The **Qute Rendering** type.

### `Qute.UpdateQueue`

The **Qute** update queue.

### `Qute.Rendering.converters`

A converter registry. To be used with  __[q:content-\*](#/attributes/q-markdown)__ attributes.


