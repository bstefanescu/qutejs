# Application Data Model

When building applications you need a way to store application data and state outside the presentation layer, to share that data between UI components and to keep these components synchronized with the application data and state.

In frameworks like **react** or **vue** this is achieved using state management systems like **redux**.

Qute is providing a built-in solution to achieve this through the **application data model**.

Anyway, you can still integrate a state management system like **redux** with Qute.


## Data Model Properties

Data Model properties are stored inside the `data` property of the application instance.

To define an application property you can use the `defineProp(name, initialValue)` method of the application instance, or the `@DataModel` decorator on the application class or any Qute service class.

When defining a property you must use a unique property name at the application level. It is recommended to use qualified names like `PropertyGroup/subgroup/localName` names when you want to group related  properties.

The `defineProp` will create a new property inside application instance `data` property and will return the property.  \
The property object provides two methods: `get()` and `set(value)` to get and respectively set the property value.

You can also register a listener on the property to be notified when the property value changes:

```jsq
import Qute from '@qutejs/runtime';

var app = new Qute.Application();
var prop = app.defineProp("Session/user", null);
prop.addChangeListener(function(newValue, oldValue) {
	alert('user object changed: '+JSON.stringify(newValue));
})
prop.set({name: 'foo', email: 'foo@bar.com'});
```

To get an existing property object you can use the `prop(name)` method.

Another useful method is the property `link(target, name)` method which will create a **mirror property** on another object. Any modification on the mirror property will be reflected on the source application property. This is the method used internally by the `@Link` decorator.

### Aynchronous properties

There is a special type of property named **asynchronous property**. This kind of property let's you define properties that are set as a result of an asynchronous operation, like an ajax call.

Asynchronous properties are defined using the `defineAsyncProp(name, value)` application method or using the `@AsyncDataModel` decorator.

Defining an asynchronous property will automatically define two additional regular properties: a **pending** and a n **error** one.  \
For example, calling: `app.defineAsyncProp('Session/user')` will define:

1. An async property named 'Session/user'
2. A regular property named 'Session/user/pending'
3. A regular property named 'Session/user/error'

When setting an asynchronous property you should use a **[Promise (or thenable)](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Promise)** object. You can also use a regular value, in that case the value will be converted to a resolved promise (i.e. `Promise.resolve(value)`).

If you set to an asynchronous property a promise that is not yet resolved then the **pending** property will be automatically set to `true` and will be set back to `false` when the promise is fulfilled or rejected.  \
If the promise is rejected then the **error** property is set to the rejection value (usually an `Error` object).

This is considerably helping to implement asynchronous actions in UI components, where the **pending** property can be used to display a progress indicator.

Using the  `@DataModel`, `@AsyncDataModel` and `@Link` decorators you can wire services and components toghether through the application data model.

### The `@DataModel(key)` decorator.

This is a field decorator that will publish the field as a Data Model property given a key.

The decorator can be used either on a custom application class, either on a Qute service class (i.e. extending Qute.Service or exposing an `app` field).

When applied on a service field, the decorator is equivalent on calling the following code in the servcie constructor: `this.app.createProp(key, fieldValue).link(this, fieldName)`.

### The `@AsyncDataModel(key)` decorator.

This is a field decorator that will publish the field as a Data Model asynchrnous property given a key.

The decorator can be used either on a custom application class, either on a Qute service class (i.e. extending Qute.Service or exposing an `app` field).

When applied on a service field, the decorator is equivalent on calling the following code in the servcie constructor: `this.app.createAsyncProp(key, fieldValue).link(this, fieldName)`.

### The `@Link(key)` decorator.

This is a field decorator that will link the data model property identified by the key argument to the target field.
The field will behave like a proxy to the data model property. When the decorated field is set the data model property will change accordingly, and vice versa, when the data model property is set the decorated field will change accordingly.

The decorator can be used on both Qute service and ViewModel component classes.

When used on a `ViewModel` component class, the field will be reactive: when the linked data model property changes the component DOM will be udpated too.

## Binding a Reactive Component Property to an Application Property.

To bind a reactive component property to an application property you should use the application property as the initial value of the reactive property.  \
Application properties which are bound to component properties will trigger a component update each time the property changes.

You can link an application data model property to a component property either using a property of type `Link`, either using the `Link` decorator.

```javascript
import Qute} from '@qutejs/runtime';
const {ViewModel, Template, Link} = Qute;

class MyComponent extends ViewModel {
    @Link('MyApplicationProperty') myReactiveProperty;
}
```

**Note** that `@Link('MyApplicationProperty') myReactiveProperty;` is equivalent with `@Property(Link, 'MyApplicationProperty') myReactiveProperty;`. Both statements are creating reactive data model links.


## Example

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
import qSpinner from '@qutejs/spinner';

const {ViewModel, Template, Link, Service, AsyncDataModel, DataModel, View, Application} = Qute;

<q:template name='RootTemplate'>
	<if value='user'>
		<div style='display:inline-block'>Hello {{user}}!</div>
		<button @click='session.logout()'>Logout</button>
	<else/>
		<q:spinner size='8px' inline q:show='loginPending' />
		<button @click='session.login("Foo")' q:toggle-disabled={loginPending}>Login</button>
	</if>
</q:template>

@Template(RootTemplate)
class RootComponent extends ViewModel {
    @Link('Session/user') user;
    @Link('Session/user/pending') loginPending;
    @Link('Session') session;
}

class SessionManager extends Service {
    @AsyncDataModel('Session/user') user; // publish the user as an async application property

	login(user) {
		// simulate an async login action
		this.user = new Promise((resolve, reject) => {
			window.setTimeout(() => { resolve(user) }, 1000);
		});
	}

	logout() {
		this.user = null;
	}
}

@View(RootComponent) // bind the application to the root component
class MyApp extends Application {
    @DataModel('Session') // publish the session manager inn the application data model as the property 'Session'
    session = new SessionManager(this);
}

new MyApp().mount('app');
```

## Application properties vs. Component properties

We've seen we can define properties either at component level, either are application level.

**When should one use application properties?**

**The answer is:** if the property is part of the application logic, or it reflects an application state that should be accessible from any component then use an application property.  \
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
