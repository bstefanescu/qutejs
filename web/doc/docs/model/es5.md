#  ES5 Components API

Qute is providing an ES5 compatible API to define `ViewModel` components. Using this API you can do anything yout do using classes and decorators but using ES5 JavaScript.

Because in ES5 there are no classes the ViewModel will be defined as a plain object (containing methods and getters) and also a special method `init(app)` to replace the class constructor.

To define a `ViewModel` component uyou should use the `Qute(Template, Model)` function whcih takes 2 arguments:

1. **Template** - a template reference (or a rendering function)
2. **Model** - the `ViewModel` defiitio as a plain object (which may contains getters too).

Reactive and regular properties can be defined inside the special `init(app)` method which will be called just after instantiating the component.

To define a reactive property you should use the `defineProp(Type, key[, value, argument]);` `ViewModel` method.

## Example

```jsq
import QUte from '@qutejs/runtime';

<q:template name='MyComponentTemplate'>
    <div>
    <div>reactiveProp value: {{reactiveProp}}</div>
    <div>title value: {{title}}</div>
    <for value='key in $attrs'>
        <div>Undeclared attribute: {{key}} = {{$attrs[key]}}</div>
    </for>
    </div>
</q:template>

<q:template export>
    <my-component reactive-prop='reactive prop value'
        title='the title'
        some-attribute='some value'
        another-attribute='another value'
        name='the name' />
</q:template>

const MyComponent = Qute(MyComponentTemplate, {
    init(app) {
        this.defineProp(null, 'reactiveProp'); // no property type defined
        this.defineProp(String, 'title'); // a typed reactive property
        this.name = 'the name'; // a regular property
    }
})
```

The `Qute()` function returns a `ViewModel` constructor object. The constructor object is providing a `chainable` API that can be used to reproduce the functionality provided by class and method decorators.

## Registering Event Handlers

To register an event listener as you can do using the `@On` decorator you can use the `on(event, selector, listener)` method:

```javascript
Quute(MyTemplate, {
    init() {
        // define properties here
    }
}).on('click', function(event) {
    console.log('handling click', evet);
});
```

## Registering Property Watchers

To register a property watcher you can use the `watch(propName, watcher)` method:

```javascript
Quute(MyTemplate, {
    init() {
        this.defineProp(String, 'title');
    }
}).watch('title', function(newValue, oldValue) {
    console.log('title about to change', newValue, oldValue);
});
```

## Registering Mixins

To register mixins use the `mixin(Mixin1, Mixin2, ...)` method:

```javascript
Quute(MyTemplate, {
    init() {
        // definne props here
    }
}).mixinn({
    hello() {
        widnow.alert('hello');
    }
}).on('click', function(event) {
    this.hello();
});
```

## Chainning Methods

You can chain all these method to configure a `ViewModel` component:

```javascript
var MyComponent = Qute(MyComponentTemplate, {
    init() {
        this.message = 'Hello!';
    }
}).on('click', function() {
	console.log('component clicked', this.message);
	return false;
}).watch('message', function() {
	console.log('message changed');
});
```
