# Qute API

The main entry point when using Qute is the `Qute` global object. The object itself is a function that can be used to define components

## The `Qute()` Function

The `Qute(name, definition)` function is used to define components. It takes 2 arguments:

1. the **component name**
   This is a required argument. The component name must be specified using the **[kebab-case](https://en.wiktionary.org/wiki/kebab_case)**.  \
   The name can be then used as an element name in templates to render the component.  \
   If a template using the component name was registered then the component will use this template as its **rendering function**.
2. the **component definition**
   This is an optional argument. Can be either a **plain object**, a **class** or a **rendering function**.  \
   See the **[Components](#/components)** section for more details.

The `Qute()` function **returns** a **Component Constructor**.

## The `Qute` Facade

Also, the `Qute` object acts as a namespace for several global properties and methods.

### `Qute.closest(element)`

Find the closest Qute ViewModel Component containing the given DOM element.

### `Qute.runAfter(callback)`

Register a callback to be invoked after all the tasks in the update queue are run. If the queue is empty then the callback is immediately run.

Because the updates are run asynchronously you cannot know when the update job related to a reactive property change is done. Using this function you can be notified after the current update is done.

This is usefull when writing tests, to make assertions after the DOM changed in response to model change.

### `Qute.css(cssRules)`

Inject a `CSS` fragment into a `<style>` element in the page `<head>`.

If a `<style id='--qute-inline-styles'>` already exists in the page then it will be used to host the injected CSS rules, otherwise a new style element will be created. This enable to choose where in the page to position the inlined CSS rules.

Usefull to define CSS rules directly in component files.

### `Qute.register(tag, templateFn, isCompiled)`

Register a template function given its (tag) name.

The `isCompiled` argument must be `true` if the template function was compiled from a Qute template.

You can use this function to register hand written rendering functions. (in that case omit the `isCompiled` arguemnt and use a value of `false`).

### `Qute.registerDirective([tag, ]name, fn)`

Register a custom attribute directive. The `tag` argument is optional, and should be used when the directive should only be enabled for the given tag.

See **[Custom Attributes](#/attributes/q)** for more details.

### `Qute.template(tag)`

Get a registered template function given a tag name.

### `Qute.vm(tag)`

Get a registered `ViewModel` constructor given a tag name.

### `Qute.vmOrTemplate(tag)`

Get a registered template function or `ViewModel` constructor given a tag name.

### `Qute.snapshotRegistry()`

Create a snapshot of the template and ViewModel registry. Return the snapshot.

### `Qute.restoreRegistry(snapshot)`

Restore the registry to the given snapshot (generated using `snapshotRegistry`).

Using `snapshotRegistry` / `restoreRegistry` can be usefull to restore an initial clean state after deploying somme additional templates.

This is used by the **Qute playground**.

### `Qute.render(xtagName, model)`

Manualy render a template function given its (tag) name nad a `model` object.

The model can any object. You can thus use Qute templates to render anyhting, not only `ViewModel` objects.

### `Qute.defineMethod(name, fn)`

Define a method on `ViewModel` and functional component prototype. Can be used to extend the component API. See **[Internationalization Support](#/app/i18n)** for an example.

### `Qute.import(urlOrName, onLoad, onError)`

Import a javascript library in the current page. The library is located using the specified `urlOrName` which is either the URL (or a path) to the javascript resource, either the npm package name (in this case https://unpkg.com will be used to fetch the resource).

The `onLoad` callback will be invoked after the javascript code is loaded.  \
The `onError` callback will be invoked if any error occurs.

The `urlOrName` parameter **can be also an array of locations**. In that case each location is converted to an URL if it is not already an URL, then each library will be loaded after the previous one was completely loaded.

For example if you want to load a library located at 'libs/x.js' that depends on 'libs/y.js' you should use:

```javascript
Qute.import(['libs/y.js', 'libs/x.js'], function() { ... }, function() { ... });
```

The `onLoad` function will be called after the complete chain of library was loaded.

### `Qute.importAll(urlOrNames, onLoad, onError)`

The same as `Qute.import` but can load multiple javascript libraries in parallel.

### `Qute.addImports(importMap)`

Configure the package locations to be used for lazy component loading.

The `importMap` should map a component name to a remote javascript resource. Example:

```javascript
Qute.addImports({
	'popup': '@qute/popup',
	'my-component': ['libs/my-component-dependency.js', 'libs/my-component.js']
})
```

The location of a lazy loaded component can be either a string on an array of string locations. If an array then all the locations are loaded one after the other (as done by `Qute.import`).
A resource location is either an URL or path to the javascript resource, either the npm package name containing the component (in this case the resource is loaded through https://unpkg.com).

### `Qute.setImporterOptions(opts)`

Configure some aspects of the lazy component loading. The `opts` argument can specify the following properties:

* `resolve(location)` - an optional function to resolve a string location to an URL. If `null` is returned the resource will be ignored. If `false` is returned then the default resolver is used.
* `renderError(rendering, error)` - an optional function to return a DOM element to be displayed in case of an error. The error object contains an url field which points to the javascript resource that failed loading
* `renderPending(rendering)` - an optional function to return a DOM element to be displayed while a lazy component is loading.

### `Qute.addAliases(aliasMap)`

Define a component alias. Example:

```javascript
Qute.addALiases({
	'app-button': 'my-app-button'
})
```

where `my-app-button` is the real name of the component.

### `Qute.App`

The **Qute Application** type.

### `Qute.ViewModel`

The **View Model** type. Should be extended by components declared through **[class syntax](#/model/class)**

### `Qute.Rendering`

The **Qute Rendering** type.

### `Qute.UpdateQueue`

The **Qute** update queue.

### `Qute.converters`

A converter registry. To be used with  __[q:content-\*](#/attributes/q-markdown)__ attributes.

## The Component Constructor API

Components are defined using the `Qute()` function. `Qute()` returns a **Component Constructor**.
The returned constructor can be used to instantiate the component, but it also provides several methods usefull to further configure the component: `watch`, `on`, `channel` and `mixin`.

**Example:**

```javascript
var MyComponent = Qute('my-component', {
	// component model definition here
}).on('click', function(e) {
	// do something on click
}).watch('title', function(newValue, oldValue) {
	// do something when the title property changes.
}).channel(function(message, data) {
	// do something when a message is posted to the component channel.
}).mixin(Mixin1, Mixin2, ...);
```

#### `watch(prop, watcher)`

Register a **property watcher**.

The `prop` argument is the property name to watch and the `watcher` is a function thgat will be called when the value of the watched property is changing.

The watcher signature is: `function(newValue, oldValue)`.

#### `on(event[, selector], listener)`

Register an event handler on the component element. This function has a similar syntax as the `jQuery.on` method.

The `event` argument is the event name.  \
The `selector` is optional and can be used to filter the event target.  \
The `listener` function will be called when the event is fired. It takes one argument: the **event** object, and can return `false` to stop propagation and prevent the default browser action.

For more details see the **[Events](#/model/events)** section.

#### `channel(handler)`

Register a communication channel handler for the component.

The `handler` has the signature: `function(message, data)`

The channel is not opened by registering the handler. To open a channel you must use a `q:channel` attribute on the component element toi give the channel a name, or, for root components use the `listen(channelName)` method.

For more details see the **[Message Bus](#/app/bus)** and the **[Components](#/components)** section.

#### `mixin(mixin1, mixin2, ...)`

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

#### `getList(listPropertyName, keyField)`

Get a list update helper for the given reactive list property and the given key field. The key field is the field in the list items that are used as keys. If nopt specified or if the special `'.'` value is specified as the key field that String(item) will be used to get the key (this works with primitive types).

The `ListHelper` can be used to facilitate reactive list manipuilation and update.

See the **[List Helper](#/advanced/list)** section for more details.

