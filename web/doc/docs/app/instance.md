# Application Instance

In **Qute** the presentation layer is made from the UI components you define using `ViewModel` or template components.

The application layer provides the business logic and a data model visible to all components in the presentation layer.

The application layer is structured arround a singleton object: the application instance. Thi object is passed as an argument to the root component constrcutor and then passed down to all components in the rendered tree. If no application instance is passed to the root component then an implicit one will be created.

The application instance is the backbone of a Qute application which provides a global **data model**, **services** and a **message bus** to be used by components making up the presentation layer.

## Customizing an Application

An application can be customized either by using the Qute class based API (using JavaScript classes and decorators), either by using the ES5 Qute API.

In the following example we define a custom application, an `UserManager` service and a root component and we wire all that objects together through the application data model.

### Using JavaScript classes and decorators

```javascript
import Qute from '@qutejs/runtime';

const { Application, View, Service, Provide, Inject } = Qute;


class UserManager extends Service {

    // publish the user property as an async data model property (can take Promise as a value)
    @Provide('Session/user') user;

    login() {
        // user will be set to a promise
        this.user = doLogin(); // return a Promise
    }

    logout() {
        this.user = null;
    }

    oLogin() {
        // login implementation => return a Promise which resolve to the user object
    }
}

// define a root component
@Template(RootTemplate)
class Root extends ViewModel {
    // link the data model property 'Session/user' to a reactive property
    @Inject('Session/user') user;

    // link the login service instance published as the 'Session' data model property to a reactive property
    @Inject('Session') session;

}

@View(Root) // define the application root component (i.e. the application view)
class MyApplication extends Application {

    // define an application property named 'Application/version'
    @Provide('Application/version') version = '1.0.0';

    // publish the SessionService instance as an application property named 'Session'
    @Provide('Session') session = new UserManager(this);
}

// mount the application root component
new MyApplication().mount();
```

### Using ES5 API

The same example as above but using the ES5 Qute API.

```javascript
import Qute from '@qutejs/runtime';

// define a service
function UserManager(app) {
    // define an user property and publish it as the 'Session/user' application property
    app.defineProp('Session/user').inject(this, 'user');
}
UserManager.prototype = {
    login() {
        // user will be set to a promise
        this.user = doLogin(); // return a Promise
    },
    logout() {
        this.user = null;
    },
    oLogin() {
        // login implementation => return a Promise which resolve to the user object
    }
}

// define a root component
const Root = Qute(RootTemplate, {
    init(app) {
        // we can use the special `Qute.Link` property to achieve the same as using @Inject
        // define the session an the user reactive properties (which are linked to the app data model properties)
        this.defineProp(Qute.Link, 'user', null, 'Session/user');
        this.defineProp(Qute.Link, 'session', null, 'Session');
    }
})

// create a new application
const myApp = new Qute.Application();
myApp.version = '1.0.0';
myApp.session = new UserManager(myApp);
// pulish version and session as data model properries
myApp.defineProp('Application/version', myApp.version);
myApp.defineProp('Session', myApp.session);

// instantiate the root using the myApp application
const root = new Root(myApp);
// mount the root component
root.mount();
```

Although using the ES5 Qute API you can do anything you do with Qute classes and decorators, using classes is much cleaner and easy to read than its ES5 counterpart.

In the rest of the documentation we will only use the class based API.

Here you can find a **[complete example](#/app/example)** on customizing an application.


## The Application Model

The application instance is providing:

1. A shared data model.
2. A set of user defined services that implements the application logic.
3. A message bus.

### The Data Model

When building applications you need a way to store application data and state outside the presentation layer, to share that data between UI components and to keep these components synchronized with the application data and state.

The application data is defined as an map of application properties. There are two type of application properties: regular properties and **asynchronous** properties.

In frameworks like **react** or **vue** this is achieved using state management systems like **redux**.

Go to **[Application Data Model](#/app/data)** section to learn more.

### The Application Logic

The application layer contains all the code you need to write to implement your application logic. This code can be grouped in services like **data fetching** (through ajax or not), **view state management** (e.g. show or hide a modal etc), **routing** (i.e. change views when navigating to other pages) etc.

The main goal of **Qute** is to let you focus on this part and not on the presentation layer
logic.

To be able to use the wiring provided by the `@Provide` decorator a service class must define an `app` property which points to the current application instance:

```javascript
class MyService {
    constructor(app) {
        this.app = app;
    }
}
```

For convenience, Qute is providing a base `Service` class which is defining the required constructor and `app` field. Just extend it to implement a service. If you need to pass arguments to your service via the constructor do not forget to propagate the `app` instance to the super class by calling `super(app)`:

```javascript
class MyService extends Qute.Service {
}
```

or using a custom constructor:

```javascript
class MyService extends Qute.Service {
    constructor(app, config) {
        super(app);
        this.config =config;
    }
}
```

To publish a service property as an application data model property you can use the `@Provide` decorator.
To inject a data model property as a service property use the `@Inject` decorator:

```javascript
class MyService extends Qute.Service {
    // publish the `user` field as the 'Session/user' data model property
    @Provide('Session/user') user;
    // inject the Configuration/loginUrl data model property in the `loginUrl` field
    @Inject('Configuration/loginUrl') loginUrl;
}
```

Go to **[Application Data Model](#/app/data)** section to learn more about these decorators.


### The Message Bus

The message bus is a built-in service provided by the application instance and can be used by any component to subscribe to any topics of interest.

It is also internally used to implement the synchronization between components and the application data.

For convenience, the `ViewModel` components are wrapping message bus methods like `subscribe`, `post` etc. and delegate the calls to the application instance.

For more information see the **[Message Bus](#/app/bus)** section.

## The Application API

### `Qute.Application(optionalData)`

The Context constructor. Creates a new context and fill it with properties of the `optionalData` argument if any was specified.

### `post(topic, message, data)`

Post a `message` to the given `topic`. The `data` argument is optional and can be used to pass additional data along with the message.

Throws an error if no such `topic` exists.

### `postAsync(topic, message, data)`

Post a `message` to the given `topic` using `window.setTimeout(... , 0)`. The `data` argument is optional and can be used to pass aditional data along with the message.

Throws an error if no such `topic` exists.

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
var app = new Qute.Application();
new Qute.Application.Prop(app, name, value);
```

### `prop(name)`

Get an application data property given its name.  \
Return the property object if exists otherwise throws an Error.

To check if a property exists you can use the `data` property of the application instance:

```javascript
var prop = app.data[propName];
if (!prop) {
	// property doesn't exist
}
```

### `view(VM)`

Create a component instance using the given `VM` constructor and use this application instance to instantiate the component.

Returns the component instance which was created.

This is equivalent to `new VM(app)` where app is the application instance.

Using this method you can write:

```javascript
var app = new Qute.Application();
// init app here
// ...
// define root component
var Root = Qute(RootTemplate);
// mount root component using the app instance
app.view(Root).mount('app');
```

instead of

```javascript
var app = new Qute.Application();
// init app here
// ...
// define root component
var Root = Qute(RootTemplate);
// mount root component using the app instance
new Root(app).mount('app');
```
