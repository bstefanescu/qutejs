# Qute API

The main entry point when using Qute is the `Qute` global object. The object itself is a function that can be used to define components using a ES5 compatible API. Also the Qute object serves as a namespace for all the other Qute entities.

## The Qute namespace

Here is a list of all the methods and objects exposed by the `Qute` global object:

+ `ViewModel` - the base class for `ViewModel` components
+ `Application` - the base class for user defined applications.
+ `Service` - the base class for user defined services.
+ `Rendering` - the rendering constructor. Used internally to render components.
+ `UpdateQueue` - the object instance managing reactive component DOM updates.
+ `Template` - a class decorator. Can only be used on `ViewModel` derived classes.
+ `Mixin` - a class decorator. Can be used on any class.
+ `View` - a class decorator. Can only be used on `Qute.Application` derived classes.
+ `On` - a class method decorator. Can only be used inside ViewModel dervied classes.
+ `Watch` - a class method decorator. Can only be used inside ViewModel derived classes.
+ `Property` - a class field decorator. Can only be used inside ViewModel derived classes.
+ `Required` - a class field decorator. Can only be used inside ViewModel derived classes.
+ `Inject` - a class field decorator. Can only be used inside ViewModel derived classes or inside classes having a `app` field which points to the current Qute Application (like Qute.Service derived classes).
+ `DataModel` - a class field decorator. To be used on Qute.Service or Qute.Application derived classes.
+ `List` - a reactive list wrapping an array to be used with **[q:for](#/attributes/q-for)** directive.
+ `render(template, model)` - render a template given a model.
+ `runAfter(callback)` - run a function after all queued updates are performed.
+ `defineMethod(name, method)` - enrich the `ViewModel` and template components prototype with new methods.

To find more about `ViewModel` decorators go to the **[Components](#/model/components)** section

### `Qute.runAfter(callback)`

Register a callback to be invoked after all the tasks in the update queue are run. If the queue is empty then the callback is immediately run.

Because the updates are run asynchronously you cannot know when the update job related to a reactive property change is done. Using this function you can be notified after the current update is done.

This is usefull when writing tests, to make assertions after the DOM changed in response to model change.

### `Qute.get(element)`

Get the component instance corresponding to the given DOM element if any. If the given element is not the root of a component subtree then returns `undefined`.

### `Qute.render(renderFn, dataModel)`

Manualy render a template function given its render fucntion and a **model** object.

The model can any object. You can thus use Qute templates to render anyhting, not only `ViewModel` objects.

Return a DOM element (the root of the rendered elements tree).

### `Qute.defineMethod(name, fn)`

Define a method on `ViewModel` and template component prototype. Can be used to extend the component API. See **[Internationalization Support](#/app/i18n)** for an example.


## The ES5 Component API

### The `Qute()` Function

The `Qute(renderingFn, model)` function is used to define `ViewModel` components. It takes 2 arguments:

1. the **rendering function**.
   The rendering function can be either a compiled template, either a custom rendering function. If this argument is not provided then it is expected that the model will provide a `render` function, otherwise an exception will be thrown.
2. the **component model**
   This is an optional argument. Can be either a **plain object** or a **class**.  \
   See the **[Components](#/model/components)** section for more details.

The `Qute()` function **returns** a **ViewModel Constructor**.

### The `ViewModel` constructor (i.e. the Component Type)

The object returned by the `Qute()` function is a `ViewModel` costructor.
The constructor provides a set of chainable functions to further customize the **component**. Each chainable function is returning back the constructor.

The costructor can be used to create new component instances. You only need to instantiate the root component by hand. All the other components will be instantiated when needed by the component templates.

**Example:**

```javascript
const MyComponent = Qute(MyComponentTemplate, {
    // define here component methods, getters, lifecycle callbacks etc.
}).watch('title', function(newValue, oldValue) {
    // define a listener on the title reactive property
	// do something when the title property changes ...
}).on('click', function(e) {
    // define event handlers
	// do something on click ...
}).mixin(Mixin1, Mixin2, ...); // apply some mixins to the component model

new MyComponent().mount(); // instantiate and mount the root component
```

For more information go to the **[ES5 Component API](#/model/es5)**.


## The `ViewModel` Component Instance API

The constructor of a `ViewModel` component accepts a **optional** appliation instance as argument.

**Example:**

```javascript

// define a ViewModel component as a class
@Template(MyComponentTemplate)
class MyComponent extends ViewModel {

}
// or define it using the ES5 API:
var MyComponent = Qute(MyComponentTemplate, {
	// component model definition here
});

// istantiate the component
var myComponent = new MyComponent();
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
