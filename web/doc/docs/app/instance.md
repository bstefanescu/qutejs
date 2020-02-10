# Application Instance

When designing an application using the MVVM pattern you separate your code in two parts:
a business logic and a presentation logic.

In **Qute** the presentation layer is made from the UI components you define using Qute ViewModel or functional components.

The application model entry point is the `Qute.App` object that you need to create and share between all UI components of the application. here you can define the business logic and the data model of the application. The application data you define can then be easily bound to any UI component.

For generic components like popups, modals etc. you don't need an application model. The component properties are enough to keep the state of a component. In that case you don't even need to create a `Qute.App` object. This kind of components will inherit the current application instance when used in a component tree.

To bind an application instance to a component tree you need to pass the instance to the root component. If you don't pass an application instance to the root component, an empty instance will be automatically created and used by the root component.

```jsq
<x-tag name='my-root'>
	<div>Hello World!</div>
</x-tag>

var app = new Qute.App();
// create the root component constructor using 'my-root' as a template
var MyRoot = Qute('my-root');
// mount the root component in the element which ID is 'app'
new MyRoot(app).mount('app');
```

This example will simply render *Hello World!* in the page. No need for that to create an application instance. The same can be done by ommiting to pass the `app` instanxce to the root component:

```jsq
<x-tag name='my-root'>
	<div>Hello World!</div>
</x-tag>

// create the root component constructor using 'my-root' as a template
var MyRoot = Qute('my-root');
// mount the root component in the element which ID is 'app'
new MyRoot().mount('app');
```

In both cases the root component, and any component rendered as part of the component tree, will have an `$app` property that will point to the application instance passed to the root component (or to the implicit isntance created when not explictly passing one).

Thus, the application instance will be shared between all the components in the tree. Components will usually use the application instance to bind properties to application data properties or to use services provided by the application.

The application instance is also passed for convenience to the `init(app)` method of a `ViewModel` component.  \
The `init` method is used to declare the reactive properties of a component. You may want to bind here some component property to an application data property. You can see a complete example demonstrating application data binding in **[Application Data Model](#/app/data)** section.

Most of the UI components will never have to explicitly use the application instance.

## The Application Model

The application instance is providing:
1. A message bus
2. A data model - usually defined by application services.
3. A set of user defined services that implements the application logic.

### The Message Bus

The message bus is a built-in service provided by the application instance and can be used by any component to subscribe to any topics of interest.

It is also internally used to implement the synxchronization between components and the application data.

For convenience, the `ViewModel` components are wraping message bus methods like `subscribe`, `post` etc. and delegate the calls to the application instance.

For more information see the **[Message Bus](#/app/bus)** section.

### The Data Model

When building applications you need a way to store application data and state outside the presentation layer, to share that data between UI components and to keep these components synchronized with the application data and state.

The application data is defined as a map of application properties. There are two tyope of apoplication properties: regular properties and **asynchronous** properties.

In frameworks like **react** or **vue** this is achieved using state management systems like **redux**.

Qute is providing a built-in solution to achieve this through the **application data model**.

To learn more about go to the **[Application Data Model](#/app/data)** section.


### The Application Logic

The application logic layer contains all of the code you need to write to implement your application logic. This code can be grouped in services like **data fetching** (through ajax or not), **view state management** (e.g. show or hide a modal etc), **routing** (i.e. change views when navigating to other pages) etc.

The main goal of **Qute** is to let you focus on this part and not on the presentation layer
logic.

### Example

**You can find here an [example of using application data and services](#/app/example)**


## The Application API

### `Qute.App(optionalData)`

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

### `defineProp(name, value)`

Define an application data property

* **name** is the property name.
* **value** is the initial value if any.

The method return the property object.

You can also define an application property using the constructor:

```javascript
var app = new Qute.App();
new Qute.App.Prop(app, name, value);
```

### `defineAsyncProp(name, value)`

Define an async. data property.

* **name** is the property name.
* **value** is the initial value if any. If set, the initial value must be a resolved value not a
promise.

You can also define an async application property using the constructor:

```javascript
var app = new Qute.App();
new Qute.App.AsyncProp(app, name, value);
```

### `prop(name)`

Get an application data property given its name.  \
Return the property object if exists otherwise throws an Error.

To check if a property exists you can use the `data` property of the application instance:

```javascript
var prop = app.data[propName];
if (!prop) {
	// property doesn't exists
}
```

### `view(VM)`

Create a component instance using the given `VM` constructor and use this application instance to instantiate the component.

Return back the component instance which was created.

This is equivalent to `new VM(app)` where app is the application instance.

Using this method you can write:

```javascript
var app = new Qute.App();
// init app here
// ...
// define root component
var Root = Qute('root');
// mount root component using the app instance
app.view(Root).mount('app');
```

instead of

```javascript
var app = new Qute.App();
// init app here
// ...
// define root component
var Root = Qute('root');
// mount root component using the app instance
new Root(app).mount('app');
```

### `i18n()`

Translate the given message using the installed i18n. If no i18n support was installed return the message as is and print a warning on the `console.log`.

Go to **[i18n section](#/app/i18n)** for more details.
