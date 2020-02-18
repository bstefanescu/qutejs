# Qute Components

As we've seen in the **[Templates](#/templates)** section, **Qute** provides a **template language** to map views over object models. Of course, this is useless without a way to specify the model to render. This is what a **Component** does.

A Component defines a **data model** and some **behavior** that can be rendered as a **live** HTML element using a **template**. Why **live**? Because the HTML element remains bound to the component instance and will change anytime the component data model change.

In a component template, all the component properties and methods are visible as global variables.
The component instance itself can be accessed using the special `this` variable. Here is the list of all the **built-in global variables** exposed in a component template:

* `this` - the current component instance
* `JSON` - the global `JSON` object
* `console` - the global `console` object (useful for debugging)
* `window` - the global `window` object
* `Object` - the global `Object` object.
* `$` - the current Rendering instance.
* `_` - an alias to `this` (i.e. the current component instance).
* `$0`, `$1`, `$2`, `$3` etc. - are reserved and should not be used in the model (can be used to access current function arguments in inline event handlers).

There are two types of components:
1. **Functional Components**
2. **ViewModel Components**

Any component is defining a **name**. The **component name** can be used in any other component template as an element to render the component according to the given element attributes. We recommend you to use component names composed of multiple words separated by hyphens. Examples: `my-component`, `my-button` etc. This is for safety reasons, to avoid collisions with current and future HTML element names.

A component template may use other component elements. In that case we say the used component is the child of the component using it. So, components can be used, as DOM elements, in a **tree structure**. The root of a component tree is called the **root component**.

**Note** that only **ViewModel Components** can be used as roots. Functional components cannot be roots!

## Functional Components

These components cannot define any own properties nor life cycle hooks. Functional components are *model-less components* and don't take part to the [component life cycle](#/model/lifecycle). These, are mostly template wrappers - some sort of a macro that you can reuse in different contexts.

When using expressions inside functional components the `this` variable will point to the functional component instance. Here is a list of some useful properties exposed by a functional component instance:

* `$attrs` - the attributes specified on the component element.
* `$r` - the rendering context instance.
* `$el` - the DOM element rendered by the functional component.
* `emit` and `emitAsync` - provides a way to trigger DOM events on the functional component element


**Note:** As mentioned functional components doesn't take part to the life cycle but there is way to get **life cycle notifications from within a functional component**.  \
See the **[Life Cycle](#/model/lifecycle)** section for more details.

Functional components are light objects, you should use this type of components whenever you need to create **macro** like structures.

You don't need to declare anything to create a **functional component**. Any **template** not explicitly linked to a **ViewModel Component** can be used as a **Functional Component**.

Why **functional**? Because the component is practically a rendering function. There isn't any relation with **functional programming!**

Here is an example:

```jsq
<x-tag name='message'>
	<div>{{$attrs.msg}}</div>
</x-tag>

<x-tag name='root'>
	<message msg='Hello'/>
</x-tag>

export default Qute('root');
```

In the example above the `message` component is a **functional component** - it is just a wrapper over the compiled template.
The `root` is a **ViewModel** component since it is created using `Qute()` factory function.

All attributes are passed to the **functional component** as fields in the `$attrs` object.
The `$attrs` object is the model used by **functional components**.  \
You can find more details in the **[Component Properties](#/model/properties)** section.

## ViewModel Components

These are the fully featured **Qute Commponents**. Use this type of components whenever you need **reactivity**, **lifecycle** events, **application instance** or the **message bus**.

A **ViewNodel Component** is defined by a **tag name**, a `ViewModel` and an *optional* **template**. Why optional? Because you can still write the rendering method by yourself. But in most cases this is useless.

To make it simpler, we will use the term **ViewModel** interchangeably with **ViewModel Component** or **Component**.

The main job of a `ViewModel` is to render pure data into a DOM tree. This is done through the `ViewModel.render` method. Writing rendering methods by hand is difficult and this is why templates are good for.  \
Templates are compiled as rendering functions. Instead of writing complex javascript routines - you simply write a template, compile it, then assign it as the `render` method of a `ViewModel` object.

### The DOM Element of a Component

A component renders as a DOM element.
This element is stored in the **`$el`** property of the component instance when the component is created. Later when the component is connected, the element is inserted into the page DOM tree.
When the component is disconnected it is removed from the page DOM tree.

The element of a component instance is tied to the component instance during its entire life (i.e. **the rendering is done only once** for a given component instance).

You can use the `$el` property of the component any time you need manipulating the DOM.

## Creating a ViewModel Component

A ViewModel is created using the `Qute()` function.

**`Qute(tagName, definitionOrClass)`**

* **tagName** - the tag name to use for the component. This argument is **required** even for root components (that are never used by tag name in templates).
* **definitionOrClass** - an object or a class defining the component. We will focus here on the definition objects. This argument is **optional**. If not specified the **tagName** argument is expected to be a template name and the ViewModel will wrap the template without defining any own data model.

For more information on how to use classes check the **[Class Syntax](#/model/class)** section.

### ViewModel Tag Name

The ViewModel tag name is required even for root components. The tag name is usually the name of a **Qute template** that defines how the component is rendered. If there is no template which name is the same as the component tag name then the component **must** define a **render** method.

The component instance will expose the tag name as a static property named `$tag`.  \
By **static property** we meant the property is defined on the instance's prototype and not on the instance itself.

### ViewModel Defintion Object

**Important Note:** When writing code examples through this document we will use for concision the ES6 syntax.

A ViewModel definition is a plain javascript object used to define the ViewModel data model, methods and lifecycle.

```javascript
{
	// initialization code and reactive properties definition
	init(app) {
		// do any initialization here
		this.aNonReactiveProperty = 'I am a non-reactive property';
		// then return the reactive properties if any
		return {
			firstName: 'John',
			lastName: 'Doe'
		}
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
	// you can define lifecycle event handlers
	created(element) {
		console.log('component was created');
	},
	connected() {
		console.log('component was connected');
	},
	// you can define lifecycle event handlers
	disconnected() {
		console.log('component was disconnected');
	},
	// you can define custom rendering
	render(rendering) {
		var span = document.createElement('SPAN');
		span.textContent(this.fullName);
		return span;
	}
}
```

As ViewModel definition object is optional and if defined may be an empty object, or may contain any of the declarations above.

The **only requirement** is that either the component is **attached to a template** (using the component tag name), either the component define a `render` method. When the component is attached to a template then the `render` method will point to the template itself.

### Initialization

The component initialization can be customized by defining an `init` method.
The `init` method takes as argument the current Qute application and may return an object defining the **reactive properties** if any.

For more on the application object see the **[Application Instance](#/app/instance)** section.

This method will be called only once in the component life-cycle, when the instance is created and before the attributes are bound to component properties.  \
You can use this method to initialize reactive or non-reactive **component properties**.

#### Reactive Properties
In order to define reactive properties you must return an object that maps property names to default values.

**Example**:

```javascript
init() {
	return {
		firstName: "John",
		lastName: "Doe",
		age: null
	}
}
```

This will define 3 reactive properties: `firstName`, `lastName` and `age` which will be initialized with the specified values.

See the **[Component Properties](#/model/properties)** section for more details.

#### Non-Reactive Properties

Any `ViewModel` property which is not declared as reactive will not trigger any DOM update when changed.

**Example**:

```javascript
init() {
	this.nonReactiveProp = 'I am a non-reactive property';
}
```

### Computed Properties

Computed properties can be defined using the ES6 getter syntax. As you usually transpile the ES6 code to a version supported by all browser, you should always use this syntax.  \
If you don't want for some reason to use the ES6 syntax then you need to define the computed properties using `Object.defineProperty` in the `init` method.

### Static Properties

You can also define random properties in the definition object that will be injected as **static** properties on the component (*static* because these properties will be injected on the component instance's prototype).

### The rendering function

If you specify a method named `render` it will be used as the rendering method (overwriting any attached template).  \
A render function is called once when the component is created and must return a DOM element or null. The rendering method will never be called again during the component life cycle.

The render function gets one argument: the rendering instance. We will not document the rendering API here, since it was not designed to be used by hand - but to be used by the template compiler to generate the `render` function.  \
However, here is an example of how a custom `render` function may look:

```javascript
    render(rendering) {
        var div = document.createElement('DIV');
        div.appendChild(rendering.x(function(model) {return model.fullName}));
        return div;
    }
```

This will create a DIV element and will append a reactive text which will take the value of the `ViewModel`'s **fullName** property.

### Life Cycle

There are three life cycle handlers that can be defined in a definition object:

#### `created(element)`

Called just after the component root element was created (i.e. component was rendered). The component is not yet connected to the DOM.

This handler is called only once in the component life-cycle, after the init method and after attributes are bound to properties.

The **element** argument is the DOM element created by the rendering function.  \
It is also available at any time as the **`$el`** property of the component instance.

#### `connected()`

Called just after the component is connected to the DOM (i.e. the component element is attached to the DOM).

This handler may be called several times in the component life-cycle, every time the component element is attached to the DOM. A component can be attached to the DOM or detached from the DOM multiple times. For example if the component is conditionally displayed by using the [if directive](#/directives/if), it will be detached / attached every time the `if` state changes.

This handler can be used to add event listeners, setup timers etc.

#### `disconnected()`

Called just after the component is disconnected from the DOM. It may be called several times in the component life-cycle.

This handler can be used to clean up resources setup by the `connected` handler.

### Methods

Any method specified in a definition object which is not a getter and neither none of `init`, `created`, `connected`, `disconnected` will become a **Component Method**.

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
<button @click='hello()'>Click Me</button>
```

## Interacting through DOM Events

Components can trigger and listen to DOM events. This is especially useful in communicating with a parent component or to simply listen to standard user actions like clicks, key press etc.

Components can also create new event types (as instances of the `CustomEvent` object) and fire these events on an element.

See the **[Working with DOM Events](#/model/events)** section for more details.

## The ViewModel constructor

The `Qute` function is creating a `ViewModel` constructor which can be used then to define further aspects of the component like event listeners, watchers, a communication channel and, of course, to instantiate the component.

The constructor takes two optional arguments:

1. A **Qute Application** object - see [Application Instance](#/app/instance)). If no one is provided an implicit application instance is created. Sharing an application instance between isolated component trees enable these components to communicate through the [Message Bus](#/app/bus).
2. An object of attributes, the same as the attributes you may use when instantiating the component through a template.

```javascript
var MyComponent = Qute('my-component', {
	init() { return { message: 'Hello!' } }
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
var MyComponent = Qute('my-component', {
   init() { return { message: 'Hello!' } }
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
var MyComponent = Qute('my-component', {
   init() { return { message: 'Hello!' } }
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
var MyComponent = Qute('my-component', {
   init() { return { message: 'Hello!' } }
}).channel(function(msg) {
	console.log('received a message', msg);
});
```

### Chaining registrations

You can chain all these methods to easily define listeners, watchers and a channel.

**Example**

```javascript
var MyComponent = Qute('my-component', {
   init() { return { message: 'Hello!' } }
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
var MyComponent = Qute('my-component', {
	init() { return { message: 'Hello!' } }
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
When the DOM is updated it will not be rendered again, but only impacted nodes are updated (like attributes or text nodes). The DOM sub-tree of a component is rendered only once at the component creation.

There are cases when you want to manually update the DOM sub-tree corresponding to a component. To do so, just use the component `update` method.

## Complete Example

```jsq
<x-tag name='my-component'>
  <button>{{buttonLabel}}</button>
</x-tag>

var MyComponent = Qute('my-component', {
	init() {
		this.message = 'Click me!';
		return { cnt: 0 }
	},
	get buttonLabel() {
		return this.message+' ('+ this.cnt+')';
	},
}).on('click', function() {
	console.log('component clicked!');
	this.cnt++;
	return false;
}).watch('cnt', function(newVal, oldVal) {
	console.log('counter changed', newVal, oldVal);
});

new MyComponent().mount('app');
```

