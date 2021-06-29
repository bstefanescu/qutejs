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

Another useful method is the `inject(target, name)` method which will create a **mirror property** on another object. Any modification on the mirror property will be reflected on the source application property. This is the method used internally by the `@Inject` decorator.


### The `@DataModel(key)` decorator.

This is a field decorator that will publish the field as a Data Model property given a key.

The decorator can be used either on a custom application class, either on a Qute service class (i.e. extending Qute.Service or exposing an `app` field).

When applied on a service field, the decorator is equivalent on calling the following code in the servcie constructor: `this.app.createProp(key, fieldValue).inject(this, fieldName)`.

### The `@Inject(key)` decorator.

This is a field decorator that will link the data model property identified by the key argument to the target field.
The field will behave like a proxy to the data model property. When the decorated field is set the data model property will change accordingly, and vice versa, when the data model property is set the decorated field will change accordingly.

The decorator can be used on both Qute service and ViewModel component classes.

When used on a `ViewModel` component class, the field will be reactive: when the linked data model property changes the component DOM will be udpated too.

## Binding a Reactive Component Property to an Application Property.

To bind a reactive component property to an application property you should use the application property as the initial value of the reactive property.  \
Application properties which are bound to component properties will trigger a component update each time the property changes.

You can link an application data model property to a component property either using a property of type `Link`, either using the `Inject` decorator.

```javascript
import Qute} from '@qutejs/runtime';
const {ViewModel, Template, Inject} = Qute;

class MyComponent extends ViewModel {
    @Inject('MyApplicationProperty') myReactiveProperty;
}
```

**Note** that `@Inject('MyApplicationProperty') myReactiveProperty;` is equivalent with `@Property(Qute.Link, 'MyApplicationProperty') myReactiveProperty;`. Both statements are creating reactive data model links.


## Example

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
import qSpinner from '@qutejs/spinner';

const {ViewModel, Template, Inject, Service, DataModel, View, Application} = Qute;

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
    @Inject('Session/user') user;
    @Inject('Session/user/pending') loginPending;
    @Inject('Session') session;
}

class SessionManager extends Service {
    @DataModel('Session/user') user; // publish the user as an async application property
    @DataModel('Session/user/pending') pending = false;
    @DataModel('Session/user/error') error;

    login(user) {
        // simulate login
        this.pending = true;
        window.setTimeout(() => {
            this.user = user;
            this.pending = false;
        }, 1000);
    }

	logout() {
		this.user = null;
		this.pending = false;
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
You can also use application properties if you need to **share the property or some state between multiple components**. When a parent component need to share a property with its children then you can pass the property as an attribute to the children components, and you don't need an application property.  \
There are cases when you need to pass many properties as attributes around. If these properties are not internal to the component logic, then you could define them as application properties to minimize the attributes you pass around.

Keep in mind that using application properties in components will tie your component to the application. So it will be difficult to reuse your component outside the application (since it needs the application context). To use the component in another application you need to recreate the required application properties.  \
If you plan to create a component reusable in any context do not use application properties in your componnent.


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

### `inject(target, name)`

Link the property to an object property.

* `target` is the target object
* `name` is the property name on the object

The property created on the target object will be synchronized with the source application property.
The linked property will act as a proxy to the application property.
