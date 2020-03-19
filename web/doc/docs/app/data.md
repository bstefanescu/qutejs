# Application Data Model

When building applications you need a way to store application data and state outside the presentation layer, to share that data between UI components and to keep these components synchronized with the application data and state.

In frameworks like **react** or **vue** this is achieved using state management systems like **redux**.

Qute is providing a built-in solution to achieve this through the **application data model**.

Anyway, you can still integrate a state management system like **redux** with Qute. See the `$bindVM` function at the bottom of this page.


## Application Data Properties

A data object or an application state is defined as an application data property.
Data properties are stored inside the `data` property of the application instance.

To define an application property you can use the `defineProp(name, initialValue)` method of the application instance.

When defining a property you must use a unique property name at the application level. It is recommended to use qualified names like `PropertyGroup/subgroup/localName` names when you want to group related  properties.

The `defineProp` will create a new property inside application instance `data` property and will return the property.  \
The property object provides two methods: `get()` and `set(value)` to get and respectively set the property value.

You can also register a listener on the property to be notified when the property value changes:

```jsq
var app = new Qute.App();
var prop = app.defineProp("Session/user", null);
prop.addChangeListener(function(newValue, oldValue) {
	alert('user object changed: '+JSON.stringify(newValue));
})
prop.set({name: 'foo', email: 'foo@bar.com'});
```

To get an existing property object you can use the `prop(name)` method.

Another useful method is the property `link(target, name)` method which will create a **mirror property** on another object. Any modification on the mirror property will be reflected on the source application property.  \
In this way, you can link application properties to a service instance, to simplify accessing the application property:

```jsq
function SessionManager(app) {
	// this will create an application property named 'Session/user'
	// and then will create a local mirror property named 'user'.
	app.defineProp("Session/user", null).link(this, 'user');
	this.login = function(user) {
		this.user = user;
	}
	this.logout = function() {
		this.user = null;
	}
}
var app = new Qute.App();
var sm = new SessionManager(app);
app.prop('Session/user').addChangeListener(function(newValue, oldValue) {
	alert('user object changed: '+JSON.stringify(newValue));
})
sm.login({name: 'foo', email:'foo@bar.com'});
```

## Asynchronous Properties

When you need to set a property as a result of an asynchronous operation, like an ajax call, then you can use an **asynchronous property**.

Asynchronous properties are defined using the `defineAsyncProp(name, value)` application method.

Defining an asynchronous property will automatically define two additional regular properties: a **pending** and a n **error** one.  \
For example, calling: `app.defineAsyncProp('Session/user')` will define:

1. An async property named 'Session/user'
2. A regular property named 'Session/user/pending'
3. A regular property named 'Session/user/error'

An asynchonous property can be set to a **[Promise (or thenable)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** object or to a regular value.
If the value is not a promise or a thenable object then it is converted to a resolved promise (as using `Promise.resolve(value)`).  \
If the value is a promise that is not yet resolved then the **pending** property will be set to `true` and will be set back to `false` when the promise is fulfilled or rejected.  \
If the promise is rejected then the **error** property is set to the rejection value (usually an `Error` object).

This is considerably helping to implement asynchronous actions in UI components, where the **pending** property can be used to display a progress indicator.

## Binding a Reactive Component Property to an Application Property.

To bind a reactive component property to an application property you should use the application property as the initial value of the reactive property.  \
Application properties which are bound to component properties will trigger a component update each time the property changes.


### Example - Binding an async property to a ViewModel Component

```jsq
<q:template name='root'>
	<if value='user'>
		<div style='display:inline-block'>Hello {{user}}!</div>
		<button @click='session.logout()'>Logout</button>
	<else/>
		<spinner size='8px' inline q:show='loginPending' />
		<button @click='session.login("Foo")' q:toggle-disabled={loginPending}>Login</button>
	</if>
</q:template>

var Root = Qute('root', {
	init(app) {
		this.session = app.session;
		return {
			user: app.prop('Session/user'), // bind the async user property
			loginPending: app.prop('Session/user/pending') // bind the user/pending property
		}
	}
});

function SessionManager(app) {
	// this will create an application property named 'Session/user'
	// and then will create a local mirror property named 'user'.
	app.defineAsyncProp("Session/user", null).link(this, 'user');
	this.login = function(user) {
		// simulate an async login action
		this.user = new Promise((resolve, reject) => {
			window.setTimeout(() => { resolve(user) }, 1000);
		});
	}
	this.logout = function() {
		this.user = null;
	}
}

var app = new Qute.App();
app.session = new SessionManager(app);
new Root(app).mount('app');
```

## Application properties vs. Component properties

We've seen we can define properties either at component level, either are application level.
**When should one use application properties?**

**The answer is:** if the property is part of the application logic, then use an application property.

You can also use application properties if you need to **share the property between multiple components which are not necessarily visible for each other**. When a parent component need to share a property with its children then you can pass the property as an attribute to the children components, and you don't need an application property.  \
There are cases when you need to pass many properties as attributes around. If these properties are not internal to the component logic, then you could define them as application properties to minimize the attributes you pass around.


## Application Data Property API

An application data property object provides the following methods and fields:

### `value`

This field is used to store the data property value. You should never use it directly. Use instead `set()` or `get()` methods.

### `set(value)`

Set the property value. If the new value differs from the old one then all property change listeners will be notified about the change.

### `get()`

Get the vale of the property.

### `addChangeListener(listener)`

Add a change listener. Returns back the given listener function.

The listener function signature is: `function(newValue, oldValue)`.

**Note:** Change Listeners are implemented using the application message bus. Each time a property is changed a message is posted to the `model:propertyName` topic.

### `removeChangeListener(listener)`

Remove an already registered change listener. The `listener` argument must be the same function which was used at registration time.

### `link(target, name)`

Link the property to an object property.

* `target` is the target object
* `name` is the property name on the object

The property created on the target object will be synchronized with the source application property.
The linked property will act as a proxy to the application property.

## `$bindVM(vm, key)`

This is a private method used to bind the application property to a component reactive property.
It should never be used directly.

You can use it as an example if you need to integrate a state manager like **redux** into Qute.
In that case, to map a state property to a reactive component property you need to create an object that provide a `$bindVM` function that is responsible to create the reactive property.  \
Then to create the binding you need to assign the object providing `$bindVM` as the initial value of a reactive property.

