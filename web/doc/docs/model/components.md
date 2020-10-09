# Qute Components

As we've seen in the **[Overview](#/overview)** section, components are objects that can be referenced inside a tmeplate through custom elements.

There are three tyopes of such objects in Qute:

1. Pure rendering functions
2. Templates which are compiled as rendering functions.
3. `ViewModel` components which provides a rendering function (usually a template) and a rendering context:
    - a data model: the comoponent itself (providing properties and methods to the template).
    - DOM event listeners: to be called from templates

## Pure Rendering Functions

These components are low level functions, they take a rendering context and should return a DOM element or fragment.

You may want to write a rendering function to create very simple a static DOM structures. If you need a data model or reactivity then it is recommended to use templates or `ViewModel`components.

The signature of the rendering function is: `DOMElement function(renderingContext, attrs, slots)`

**Arguments:**

* **renderingContext** - the rendering context. Use it to resolve attribute values or to register reactivity listeners.
* **attrs** - a map of attributes used on the component element
* **slots** - a map of named slots.

**Example:**

```jsq
import {document} from '@qutejs/window';

function MyElement(r, attrs, slots) {
    const span = document.createElement('SPAN');
	if (attrs.color) {
        span.style.color = r.eval(attrs.color);
    }
    if (slots.default) {
        slots.default.forEach(child => span.appendChild(child));
    } else {
        span.textContent = 'No content defined';
    }
    return span;
}

<q:template export>
    <MyElement color='green'>Hello!</MyElement>
</q:template>
```

## Template Components

Templates are compiled as rendering functions, which means a template is a component too. When using template components, you cannot specify a data model for the template. The template will have an implicit data model which contains the attributes passed to the element which are exposed in the `$attrs` property.

We saw in the **[Templates](#/model/templates)** section that a template has access to a set of built-in variables including a `this` object. In our case `this` will be the implicit data model which is:

```javascript
{
    $attrs: {}, // the attributes used on the component element,
    $el, // the rendered element - only available after rendering is done (can be used in event handlers)
    `emit()`, // trigger a DOM event
    `emitAsync()` // async. trigger a DOM eventelement
}
```

Apart the built-in variables, the template has direct access to the properties in the current data model. So, if the component gets a `color` attribute you can access it either as `this.$attrs.color`, either directly as `$attrs.color`.

Here is the same example as above but rewritten using a template component:

```jsq
<q:template name='MyComponent'>
    <span style={$attrs.color?'color:'+$attrs.color:null}><slot/></span>
</q:template>

<q:template export>
    <MyComponent color='green'>Hello!</MyComponent>
</q:template>
```

The difference with the pure rendering function example is that now the color is reactive. This means if the `color` attribute is assigned to a property which will later change, then the span color will change too.  \
You can also implement reactivity for the pure rendering function but this is not the scope of this documentation.

Template components are very usefull to create macros like components which wraps simple HTML fragments. These components are lighter than `ViewModel` components, but also, template components offer less features:

+ use a data model inferred from the element attributes (accessible through `$attrs`).
+ cannot define own properties.
+ cannot participate to life cycle events.
+ cannot define own event handlers or methods.

**Note:** As mentioned template components don't take part to the life cycle but there is way to get **life cycle notifications from within a functional component**.  \
See the **[Life Cycle](#/model/lifecycle)** section for more details.

## `ViewModel` Components

`ViewModel` components are fully featured components, providing:

+ a data model containing reactive or regular properties
+ methods accessible from template
+ life cycle hooks
+ DOM event handling
+ property watchers
+ mixin support
+ messaging through channels
+ access to the application instance

The **root component** that is mounted in a page **must** be a `ViewModel` component.

Also, a `ViewModel` component **must** define a `render` method which is the rendering function used to render the component. This method can be either a pure rendering function, either a template function.

To make it simpler, we will use the term **ViewModel** interchangeably with **ViewModel Component**.

To create a `ViewModel` component you should use the `Qute(Template, Model)` function.

Let's rewrite the example above using a `ViewModel` component. We will make some changes on the previous example to add additonal behavior: we will use a button instead of a span and  will display a message when clicked:

```jsq
<q:template name='MyComponentTemplate'>
    <button style={'color:'+color} @click='sayHello'><slot/></button>
</q:template>

const MyComponent = Qute(MyComponentTemplate, {
    sayHello() {
        window.alert('Hello!');
    }
}).properties({
    color: 'blue'
});

<q:template export>
    <MyComponent color='green'>Hello!</MyComponent>
</q:template>
```

The only change from the template component example is that now we explicitly define a reactive `color` property, and we no more use the `$attrs` object to get the color since reactive properties are automatically bound to attributes which match the property name (as explained in the [Overview](#/overview) section).

As we've seen, template components provide a very basic data model `{ $attrs: ... }` which epxose the attributes used on the component element. When using a `ViewModel` component the data model will be the component instance itself. So, any method, regular or reactive property defined by the component will be part of the data model, and so, will be exposed to the template. The `this` built-in variable will point to the component instance.

### Creating a `ViewModel` component

A `ViewModel` component is created using the `Qute(Template, Model)` function.

**Arguments:**

+ **Template** - an optional template or pure rendering function
+ **Model** - an optional object used to define the component prototype. The model can be either a **class** extending `Qute.ViewModel`, either a **plain object**.

Both `Template` and `Model`arguments are optional, but **at least one** must be defined. If the `Template` argument is defined then the component will use it as the render method, otherwise the `Model` object must define a `render()` method.

Any properties, getters or methods defined by the **Model** will be added to the component prototyoe. Here is an example of a `Model` object:

```javascript
{
	// initialization code
	init(app) {
		// do any initialization here
		this.aNonReactiveProperty = 'I am a non-reactive property';
	},
	// you can define computed properties
	get fullName() {
		return this.firstName +' '+this.lastName;
	},
	// you can define methods
	sayHello() {
		console.log('Hello!');
	},
	// you can define static properties
	aStaticProperty: 'I am a static property',
	// you can define lifecycle event handlers:
	created(element) {
		console.log('component was created');
    },
	ready(element) {
		console.log('the component element was created and properties / listeners initialized');
    },
	connected() {
		console.log('component was connected');
	},
	disconnected() {
		console.log('component was disconnected');
	},
	// you can define a pure rendering function if not using a template
	render(rendering) {
		var span = document.createElement('SPAN');
		span.textContent(this.fullName);
		return span;
	}
}
```

To define the **Model** using a JavaScript class see the **[Class Syntax](#/model/class)** section.

### `ViewModel` DOM element

The element created by rendering the component is stored in the **`$el`** property. Later when the component is connected, the element is inserted into the page DOM.  \
When the component is disconnected it is removed from the page DOM.

The element of a component instance is tied to the component instance during its entire life (i.e. **the rendering is done only once** for a given component instance).

You can use the `$el` property of the component at any time after the component `created()` life cycle method was called.

### `ViewModel` `$attrs` property

The **`$attrs`** property we saw on the template components is defined  on `ViewModel` components too, but will contains only the **unknown** attributes (the ones that were not mapped to reactive properties).

Check the  **[Component Properties](#/model/properties)** section for more details on properties and attributes mapping.

### `ViewModel` Initialization

The component initialization can be customized by defining an `init` method.
The `init` method takes as argument the current Qute application.

For more on the application object see the **[Application Instance](#/app/instance)** section.

This method will be called only once in the component life-cycle, just aftert the instance is created and all the declared reactive properties are defined.  \
You can use this method to initialize any non-reactive **component properties**.

### Reactive Properties
To define reactive properties you must call the `properties()` method on the component constructor returned by the `Qute()` function:

**Example**:

```javascript
Qute(SomeTemplate).properties({
    firstName: "John",
    lastName: "Doe",
    age: null
});
```

This will define 3 reactive properties: `firstName`, `lastName` and `age` which will be initialized with the specified values.

See the **[Component Properties](#/model/properties)** section for more details.

### Regular (non-reactive) Properties

Any `ViewModel` property which is not declared as reactive will not trigger any DOM update when changed.

Non reactive properties can be defined inside the `init()` method.

**Example**:

```javascript
init() {
	this.nonReactiveProp = 'I am a non-reactive property';
}
```

### Computed Properties

Computed properties can be defined using the ES6 getter syntax.
If you don't want for some reason to use the ES6 syntax then you need to define the computed properties using `Object.defineProperty` in the `init` method.

### Static Properties

You can also define random properties in the definition object that will be injected as **static** properties on the component (*static* because these properties will be injected on the component prototype).

### The `render(renderingContext)` method

If you specify a method named `render` it will be used as the rendering function (overwriting any attached template).  \
The `render` method is called once when the component is created and must return a DOM element or null. The rendering method will never be called again during the component life cycle.

The render function gets one argument: the rendering context. We will not document the rendering API here.  \
However, here is an example of how a custom `render` method may look:

```javascript
    render(rendering) {
        var div = document.createElement('DIV');
        div.appendChild(rendering.x(function(model) {return this.fullName}));
        return div;
    }
```

This will create a DIV element and will append a reactive text which will take the value of the `ViewModel`'s **fullName** property.

### `ViewModel` Life Cycle

There are five life cycle handlers that can be defined in a definition object:

#### `init(app)`

The `init` method we discussed above. Called just after the component is instantiated and reactive properties (if any) are defined.

#### `created(element)`

Called just after the component root element was created (i.e. component was rendered). The component is not yet connected to the DOM.

This handler is called only once in the component life-cycle, after the init method and before element attributes are injected into component properties.

The **element** argument is the DOM element created by the rendering function.  \
It is also available at any time as the **`$el`** property of the component instance.

#### `ready(element)`

Called after the component root element is created and after the component properties are initialized from element attributes and all declarative listeners are registered. The component is ready to be connected to the DOM.

As for the `created` handler the `ready` handler is called only once in the component life cycle.

#### `connected()`

Called just after the component is connected to the DOM (i.e. the component element is attached to the DOM).

This handler may be called several times in the component life-cycle, every time the component element is attached to the DOM. A component can be attached to the DOM or detached from the DOM multiple times. For example if the component is conditionally displayed by using the [if directive](#/directives/if), it will be detached / attached every time the `if` state changes.

This handler can be used to add event listeners, setup timers etc.

#### `disconnected()`

Called just after the component is disconnected from the DOM. It may be called several times in the component life-cycle.

This handler can be used to clean up resources setup by the `connected` handler.

### Methods

Any method specified in a definition object which is not a getter and neither none of `init`, `created`, `ready`, `connected`, `disconnected` will become a **Component Method**.

Component methods are injected at the ViewModel's prototype level, and can be used from templates.

**Example**

```javascript
{
	hello() {
		console.log('Hello!');
	}
}
```

Then, you can use it from the component template:

```xml
<button @click='hello'>Click Me</button>
```

or

```xml
<button @click='e => hello()'>Click Me</button>
```

### Interacting through DOM Events

Components can trigger and listen to DOM events. This is especially useful in communicating with a parent component or to simply listen to standard user actions like clicks, key press etc.

Components can also create new event types (as instances of the `CustomEvent` object) and fire these events on the component element.

See the **[Working with DOM Events](#/model/events)** section for more details.

## The `ViewModel` constructor

The `Qute` function is creating a `ViewModel` constructor which can be used then to define further aspects of the component like event listeners, watchers, a communication channel and, of course, to instantiate the component.

The constructor takes two optional arguments:

1. A **Qute Application** instance - see [Application Instance](#/app/instance)). If no one is provided an implicit application instance is created. Sharing an application instance between isolated component trees enable these components to communicate through the [Message Bus](#/app/bus).
2. An object defining the attributes, the same as the attributes you may use when instantiating the component through a template.

```javascript
var MyComponent = Qute(MyComponentTemplate).properties({
    message: 'Hello!'
});
var componentInstance = new MyComponent();
```

### Registering DOM Event Listeners

You can easily register event listeners on the component element using the constructor `on` method:

**`on(event[, selector], listener)`**

Event listeners declared like this will be registered when component is connected to the DOM and automatically removed when component is disconnected from the DOM.

See the **[Working with DOM Events](#/model/events)** section for more details.

**Example**

```javascript
var MyComponent = Qute(MyComponentTemplate).properties({
    message: 'Hello!'
}).on('click', function() {
	console.log('component clicked', this.message);
	return false;
});
```

### Registering Watchers

A watcher is a function that will be called each time a reactive property value changes. The watcher can cancel the DOM update if needed.

You can easily register watchers using the constructor `watch` method.

**`watch(propName, watcher)`**

**Example**

```javascript
var MyComponent = Qute(MyComponentTemplate).properties({
    message: 'Hello!'
}).watch('message', function() {
	console.log('message changed');
});
```

See the **[Watchers](/#model/watchers)** section for more details.

### Registering a Channel

Channels can be used to implement inter-component communication.

To register a component channel you can use the constructor `channel` method.

See the **[Message Bus](#/app/bus)** section for more details.

**Example**

```javascript
var MyComponent = Qute(MyComponentTemplate).properties({
    message: 'Hello!'
}).channel(function(msg) {
	console.log('received a message', msg);
});
```

### Adding Mixins

You can group common methods in shareable objects and then add the methods as `mixins` to a component.

**Example**

```jsq
import Qute from '@qutejs/runtime'

<q:template name='RootTemplate'>
    <div>
        {{message}} <button @click={changeGreeting}>Change Greeting</button>
    </div>
</q:template>

export default Qute(RootTemplate).properties({
    message: 'Hello!'
}).mixin({
    changeGreeting() {
        this.message= 'Hi!';
    }
});
```

**Note** that you can pass any number of mixins: `Component.mixin(Mixin1, Mixin2, Mixin3, ...)`

### Chaining registrations

You can chain all these methods to easily define listeners, watchers and a channel.

**Example**

```javascript
var MyComponent = Qute(MyComponentTemplate).properties({
    message: 'Hello!'
}).on('click', function() {
	console.log('component clicked', this.message);
	return false;
}).watch('message', function() {
	console.log('message changed');
}).channel(function(msg) {
	console.log('received a message', msg);
});
```

## Mounting ViewModel Components

A **Root Component** can be attached to the DOM by **mounting** it.
When mounting a component all the components referred by the template will be recursively instantiated and mounted too.

When a child component is mounted through the template of a parent component, it will be initialized with the attributes specified in the template on the component tag. These attributes will be bound to [component properties](#/model/properties). Child components are automatically instantiated and mounted when the parent component is mounted.

**Root components** must be **instantiated** and **mounted** manually. When manually instantiating a component you can still specify the **attributes** to be bound on properties (as the component was instantiated through a component tag). This can be done by passing a **second argument to the ViewModel constructor**, which is mapping attribute names to attribute values.

To mount a component instance you need to use the **`mount(elOrId, insertBefore)`** function.

Both arguments are optional.

1. **elOrId** - The first argument is either a DOM element or an DOM element ID which specify the target element where to insert the component
2. **insertBefore** - The second argument is a boolean which if true the component will be inserted before the target element. If false (i.e. the default) the component element will be appended to the target element.

If no argument is provided then the component element will be appended to the current document body.

```javascript
var MyComponent = Qute(MyComponentTemplate).properties({
    message: 'Hello!'
});

var myComp = new MyComponent(null, {message: 'Hello World!'});
myComp.mount('app');
```

In the previous example the `myComp` is instantiated in the same way as if it was called from a template using:

```xml
<my-component message='Hello World!' />
```

To unmount a root component you should call the `unmount` method:

```javascript
myComp.unmount();
```

This will disconnect the root component (and all its descendants components) from the DOM and then it removes the root component element from the DOM.

## Inter-Component Communication

There are three ways components can communicate with each other:

1. **Parent to Children Communication**

2. **Child to Parent Communication**

3. **Transversal Communication**

For more details see the [Message Bus](#/app/bus) and the [Application Instance](#/app/instance) sections.

## Updating the DOM

The DOM sub-tree corresponding to a component is automatically updated whenever a reactive property changes.
When the DOM is updated it will not be rendered again, but only the impacted nodes are updated. The DOM sub-tree of a component is rendered only once at the component creation.

There are cases when you want to manually update the DOM sub-tree corresponding to a component. To do so, just use the component `update` method.

## Complete Example

```jsq
import Qute from '@qutejs/runtime';

<q:template name='MyComponentTemplate'>
  <button>{{buttonLabel}}</button>
</q:template>

var MyComponent = Qute(MyComponentTemplate, {
	init() {
		this.message = 'Click me!';
	},
	get buttonLabel() {
		return this.message+' ('+ this.cnt+')';
	},
}).properties({
    cnt: 0
}).on('click', function() {
	console.log('component clicked!');
	this.cnt++;
	return false;
}).watch('cnt', function(newVal, oldVal) {
	console.log('counter changed', newVal, oldVal);
});

new MyComponent().mount('app');
```

