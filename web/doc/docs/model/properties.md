# `ViewModel` Component Properties

All the properties defined on the `ViewModel` component instance and on its prototype chain are making up the component properties, which are exposed to the component template.  \
However, there is a special kind of properties which are tracked, so that, when such a property value changes the DOM sub-tree attached to the component is updated to reflect these changes. We will refer to this kind of properties as **reactive properties**.

Reactive properties must be defined explicitly.

## Reactive Properties

To define **reactive properties** you need to use the `Qute.properties()` to pass an object with property key / default value pairs or a factory function which is returning the properties object

**Example**

```javascript
Qute(MyComponentTemplate).properties({
    firstName: 'Foo',
    lastName: 'Bar',
    age: 80,
    title: null
});
```

This will define 4 **reactive properties**, initialized with the declared default values.

When using objects or arrays as default values you must either use a **[property type](#/model/proptypes)** to define the property either to use pass a factory function to the `properties()` method.

**Example:**

```javascript
Qute(MyComponentTemplate).properties(() => ({
    name: 'Foo',
    items: [1, 2, 3]
}));
```
If you don't use a factory function the array default value (e.g. [1,2,3] in our example) will be shared between all component instances, and modifying it in an instance will have impact on all instances.

### How reactive properties are implemented?

Reactive properties are not stored directly on the `ViewModel` instance, but as properties of the `ViewModel.$data` property. These properties are created using `Object.defineProperty` by defining a custom setter and getter.
The setter is intercepting the property change and triggers an asynchronous DOM update if needed. Multiple property changes occurred in the same event loop execution are collected and all updates will run in a later event loop execution.

Changing properties inside `ViewModel.$data` will change the corresponding reactive property value but will not trigger any update.

You can intercept reactive property changes (and cancel the DOM update if needed) through watchers.  \
Check the **[Property Watchers](#/model/watchers)** section for more details.

## Regular Properties

Regular `ViewModel` properties will not trigger any DOM update when changed. Just use regular object properties when you don't need **reactivity**. Also, note that regular properties **are not mappable from template attributes**!

To define a regular property you can use the `init()` method whoch is called just after components instance was created an the reactive property were initialized.

**Example**

```javascript
Qute(MyComponentTemplate, {
	init() {
		this.someProperty = 'Some regular property';
	}
});
```

## Template attributes mapping

Element attributes are expected to be in [kebab-case](https://en.wikipedia.org/wiki/Letter_case#Special_case_styles).

When a component is instantiated, due to a component tag being used in a template, the element attributes will be used to initialize the **component reactive properties**.

Remember that only **reactive properties** can be initialized through attributes. Any attribute that doesn't match a **reactive property** is injected into the **"catch all"** `ViewModel.$attrs` property.

The `$attrs` name is used for consistency with the **template components** `$attrs` property.

If an attribute [camel case](https://en.wikipedia.org/wiki/Camel_case) name matches a reactive property name then it is used to initialize the reactive property otherwise it will be added to the **"catch all"** `$attrs` property.


### Example

```jsq
import Qute from '@qutejs/runtime';

<q:template name='MyComponentTemplate'>
	<div>
	<div>reactiveProp value: {{reactiveProp}}</div>
	<for value='key in $attrs'>
		<div>Undeclared attribute: {{key}} = {{$attrs[key]}}</div>
	</for>
	</div>
</q:template>

<q:template name='RootTemplate'>
	<my-component reactive-prop='reactive prop value'
		title='the title'
		some-attribute='some value'
		another-attribute='another value'
		name='the name' />
</q:template>

const MyComponent = Qute(MyComponentTemplate, {
	init() {
		this.name = 'the name';
	}
}).properties({
    reactiveProp: null,
    title: null
});

export default Qute(RootTemplate);
```

You can see how the kebab case attribute named `reactive-prop` was used to initialize the `reactiveProp` reactive property. You can also use `reactiveProp` as the name of the attribute, it works too, but you recommend using kebab case notation instead since HTML attributes are not case-sensitive, but property names are case-sensitive.

Also, you can see that all other attributes than `reactive-prop` and `title` (which were declared as reactive properties) are added to the **"catch all"** `$attrs` object. This is also the case of the `name` attribute. Even if we defined a regular `name` property on the component - it will still go in the `$attrs` object since the `name` property is not reactive, and thus, it is not mappable from attributes.


## Required properties

You can specify a list of properties that should be always defined and set to a non null value through the template. We will refer to such poroperties as **required properties**.

To specify the list of required properties use the `Qute.require(prop1, prop2, ...)` function.

The following example will throw an error, since the `name` attribute is not set:


```jsq
import Qute from '@qutejs/runtime';

<q:template name='MyElementTemplate'>
    <div>Required prop: {{name}}</div>
</q:template>

<q:template name='RootTemplate'>
    <my-element />
</q:template>

const MyElement = Qute(MyElementTemplate).properties({
    name: null
}).require('name');

export default Qute(RootTemplate);
```

To fix it just specify a name attribute on the `my-element` component:

```xml
<my-element name="somme value"'>
```
