# Qute Components

As we've seen in the **[Overview](#/overview)** section, components are objects that can be referenced inside a template through custom elements.

There are three types of components:

1. Pure rendering functions
2. Templates which are compiled as rendering functions.
3. `ViewModel` components which provides a rendering function (usually a template) and a rendering context:
    - a data model: the component itself (providing properties and methods to the template).
    - DOM event listeners: to be called from templates

## Pure Rendering Functions

These components are low level functions, they take a rendering context and should return a DOM element or fragment.

You may want to write rendering function from scratch to create very simple or static DOM structures. If you need a data model or reactivity then it is recommended to use templates or `ViewModel`components.

The signature of the rendering function is: `DOMElement function(renderingContext, attrs, slots)`

**Arguments:**

* **renderingContext** - the rendering context. Use it to resolve attribute values or to register reactivity listeners.
* **attrs** - a map of attributes used on the component element
* **slots** - a map of named slots.

**Example:**

```jsq
import window from '@qutejs/window';

function MyElement(rendering, attrs, slots) {
    const span = window.document.createElement('SPAN');
	if (attrs.color) {
        span.style.color = rendering.eval(attrs.color);
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

**Note:** As mentioned template components don't take part to the life cycle but there is way to get **life cycle notifications from within a template component**.  \
See the **[Life Cycle](#/model/lifecycle)** section for more details.

## `ViewModel` Components

`ViewModel` components are fully featured components, providing:

+ a data model containing reactive or regular properties
+ methods accessible from the template
+ life cycle hooks
+ DOM event handling
+ property watchers
+ mixin support
+ messaging through channels
+ access to the application instance

The **root component** that is mounted in a page **must** be a `ViewModel` component.

Also, a `ViewModel` component **must** define a `render` method which is the rendering function used to render the component. This method can be either a pure rendering function, either a template function.

To make it simpler, we will use the term **ViewModel** interchangeably with **ViewModel Component**.

To create a `ViewModel` component you need to declare a class extending `Qute.ViewModel`. A `ViewModel` class can use  **[decorators](https://github.com/tc39/proposal-decorators)** and **[class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields)**. The Qute compiler will generate ES6 compatible code for all of these non standard features.

Let's rewrite the example above using a `ViewModel` component. We will make some changes on the previous example to add additonal behavior: we will use a button instead of a span and  will display a message when clicked:

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

<q:template name='MyComponentTemplate'>
    <button style={'color:'+color} @click='sayHello'><slot/></button>
</q:template>

@Template(MyComponentTemplate)
class MyComponent extends ViewModel {
    @Property color = 'blue';

    sayHello() {
        window.alert('Hello!');
    }
}

<q:template export>
    <MyComponent color='green'>Hello!</MyComponent>
</q:template>
```

You can see the usage of the `@Template` and `@Property` decorators as well of class fields.

The only change from the template component example is that now we explicitly define a reactive `color` property, and we no more use the `$attrs` object to get the color since reactive properties are automatically bound to attributes which match the property name (as explained in the [Overview](#/overview) section).

As we've seen, template components provide a very basic data model `{ $attrs: ... }` which epxose the attributes used on the component element. When using a `ViewModel` component the data model will be the component instance itself. So, any method, regular or reactive property defined by the component will be part of the data model, and so, will be exposed to the template. The `this` built-in variable will point to the component instance.


### `ViewModel` decorators

Here is the list of all the built-in decorators you can use on a `ViewModel` class:

#### `@Template(TemplateFunction)`

This is a class decorator which binds a template to a `ViewModel`.

#### `@Mixin(Mixin1, Mixin2, ...)`

A class decorator which applies **[mixins](https://javascript.info/mixins)** to the class prototype.

See the **[Mixins](#/model/mixins)** section for more details.

#### `@Watch(propertyName)`

A method decorator which install a watcher on a reactive property given its name. A property watcher is called before the reactive property is updated and can cancel the update.

See the **[Property Watchers](#/model/watchers)** section for more details.

#### `@On(event[, selector])`

A method decorator which install a DOM event handler given and event name and an optional element selector. The event handler is installed when component is connected to the DOM and automatically uninstalled when it is disconnected.

See the **[Working with DOM Events](#/model/events)** section for more details.

#### `@Property([PropertyType])`

A class field decorator used to define reactive properties. Accepts an optional property type object.

See the **[Component Properties](#/model/properties)** section for more details.

#### `@Required`

Can be used to mark a reactive property as required.

See the **[Component Properties](#/model/properties)** section for more details.

#### `@Link(dataModelKey)`

A class field decorator used to define a `ViewModel` reactive property linked to an **Application Data Model** property given the application property key.

See the **[Component Properties](#/model/properties)** section for more details.

### ViewModel Properties

A `ViewModel` component can define two types of properties: **reactive properties** and **regular properties**.

See the **[Component Properties](#/model/properties)** section for more details.

#### Reactive Properties

A reactive property will trigger a DOM update each time the property value changes. Reactive properties can be set through component's element attributes.

Reactive properties can be defined using class fields decorated using the `@Property` decorator.

#### Regular properties

Regular properties will not affect the DOM when udpated. You can either define them using class fields, either directly in the class constructor using `this.prop = value;` expressions.

**Note** You can define properties that are not enumerable by using a name which starts with an underscore character. This is true for both regular and reactive properties.

#### Computed Properties

Computed properties can be defined using the getter syntax.

**Example:**

```javascript
@Template(MyTemplate)
class MyComponent extends ViewModel {
    @Property reactiveProperty = 'default value';
    @Property _nonEnumerableReactiveProp = new Date();
    regularProperty = 123;
    _nonEnumerableProp = true;

    constructor(...args) {
        super(...args);
        this.someProp = null; // define a regular property inside the constructor
    }

    get computedProperty() {
        return this.reactiveProperty + '!';
    }
}
```

See the **[Component Properties](#/model/properties)** section for more details.

### `ViewModel` DOM element

The element created by rendering the component is stored in the **`$el`** property. Later when the component is connected, the element is inserted into the page DOM.  \
When the component is disconnected it is removed from the page DOM.

The element of a component instance is tied to the component instance during its entire life (i.e. **the rendering is done only once** for a given component instance).

You can use the `$el` property of the component at any time after the component `created()` life cycle method was called.

### `ViewModel` `$attrs` property

The **`$attrs`** property we saw on the template components is defined  on `ViewModel` components too, but will contains only the **unknown** attributes (the ones that were not mapped to reactive properties).

Check the  **[Component Properties](#/model/properties)** section for more details on properties and attributes mapping.

### The `render(renderingContext)` method

If you specify a method named `render` it will be used as the rendering function (overwriting any attached template).  \
The `render` method is called once when the component is created and must return a DOM element or null. The rendering method will never be called again during the component life cycle.

The render method gets one argument: the rendering context. We will not document the rendering API here.  \
However, here is an example of how a custom `render` method may look:

```javascript
    render(rendering) {
        var div = document.createElement('DIV');
        div.appendChild(rendering.x(function(model) {return this.fullName}));
        return div;
    }
```

This will create a DIV element and will append a reactive text which will take the value of the `ViewModel`'s **fullName** property.

Usually, you will want to use templates to define the rendering of a `ViewModel`. To this, just use the `@Template` annotation to bind the template fucntion to the `VieModel`'s render method.

The following code

```javascript
@Template(MyTemplate)
class MyComponent extends ViewModel {

}
```

is equivalent to:

```javascript
class MyComponent extends ViewModel {

}
MyComponent.prototype.render = MyTemplate;
```

### The `ViewModel` constructor

The `ViewModel` constructor signature is `constructor(app)` where **app** is an optional application instance to use. If the  application instance is not specified an implicit instance will be created by the `super` constructor.

**Note** that you **must** always pass down the `app` argument to the `super` constructor!

**Example:**

```javascript
class MyComponent extends ViewModel {
    constructor(app) {
        super(app);
        // do your initialization here
    }
}
```

A more generic way to pass constructor arguments down to the `super` constructor is to use the **[rest parameter syntax](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Functions/rest_parameters)**:

```javascript
class MyComponent extends ViewModel {
    constructor(...args) {
        super(...args);
        // do your initialization here
    }
}
```

### The `ViewModel` Life Cycle

There are four life cycle methods you can be define on a `ViewModel` component:

#### `created(element)`

Called just after the component root element was created (i.e. component was rendered) . The component is not yet connected to the DOM.

This handler is called only once in the component life-cycle, after the init method and before element attributes are injected into component properties.

The **element** argument is the DOM element created by the rendering function.  \
It is also available at any time as the **`$el`** property of the component instance.

#### `ready(element)`

Called after the component root element is created and after the component properties are initialized from element attributes and all declarative listeners are registered. The component is ready to be connected to the DOM.

As for the `created` handler the `ready` handler is called only once in the component life cycle.

#### `connected()`

Called just after the component is connected to the DOM.

This handler may be called several times in the component life-cycle, every time the component element is attached to the DOM. A component can be attached to the DOM or detached from the DOM multiple times. For example if the component is conditionally displayed by using the [if directive](#/directives/if), it will be connected / disconnected every time the `if` state changes.

This handler can be used to add event listeners, setup timers etc.

#### `disconnected()`

Called just after the component is disconnected from the DOM. It may be called several times in the component life-cycle.

This handler can be used to clean up resources setup by the `connected` handler.

### Mounting `ViewModel` Components

A **Root Component** can be attached to the DOM by **mounting** it.
When mounting a component all the components referred by the template will be recursively instantiated and mounted too.

When a child component is mounted through the template of a parent component, it will be initialized with the attributes specified in the template on the component tag. These attributes will be bound to [component properties](#/model/properties).

**Root components** must be **instantiated** and **mounted** manually. When manually instantiating a component you can still specify the **attributes** to be bound on properties (as the component was instantiated through a component tag). This can be done by passing a **second argument to the ViewModel constructor**, which is mapping attribute names to attribute values.

To mount a component instance you need to use the **`mount(elOrId, insertBefore)`** method.

Both arguments are optional.

1. **elOrId** - The first argument is either a DOM element or an DOM element ID which specify the target element where to insert the component
2. **insertBefore** - The second argument is a boolean which if true the component will be inserted before the target element. If false (i.e. the default) the component element will be appended to the target element.

If no argument is provided then the component element will be appended to the current document body.

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

<q:template name='MyComponentTemplate'>
    <div>{{message}}</div>
</q:template>

@Template(MyComponentTemplate)
class MyComponent extends ViewModel {
    @Property message = 'Hello!';
}
var myComp = new MyComponent();
myComp.mount('app');
```

To unmount a root component you should call the `unmount` method:

```javascript
myComp.unmount();
```

This will disconnect the root component (and all its descendants components) from the DOM and then it removes the root component element from the DOM.

### Inter-Component Communication

There are three ways components can communicate with each other:

1. **Parent to Children Communication**

2. **Child to Parent Communication**

3. **Transversal Communication**

For more details see the [Message Bus](#/app/bus) and the [Application Instance](#/app/instance) sections.

### Interacting with DOM Events

Components can trigger and listen to DOM events. This is especially useful in communicating with a parent component or to simply listen to standard user actions like clicks, key press etc.

Components can also create new event types (as instances of the `CustomEvent` object) and fire these events on the component element.

See the **[Working with DOM Events](#/model/events)** section for more details.

### Updating the DOM

The DOM sub-tree corresponding to a component is automatically updated whenever a reactive property changes.
When the DOM is updated it will not be rendered again, but only the impacted nodes are updated. The DOM sub-tree of a component is rendered only once at the component creation.

There are cases when you want to manually update the DOM sub-tree corresponding to a component. To do so, just call the component `update()` method.

## Complete Example

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property, On, Watch } = Qute;

<q:template name='MyComponentTemplate'>
  <button>{{buttonLabel}}</button>
</q:template>

@Template(MyComponentTemplate)
class MyComponent extends ViewModel {
    @Property cnt = 0;
    message = 'Click me!';

	get buttonLabel() {
		return this.message+' ('+ this.cnt+')';
	}

    @On('click')
    onClick(event) {
        console.log('component clicked!', event);
        this.cnt++;
        return false;
    }

    @Watch('cnt')
    counterChange(newVal, oldVal) {
        console.log('counter changed', newVal, oldVal);
    }
}

new MyComponent().mount('app');
```
