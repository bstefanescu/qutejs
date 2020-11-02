# `ViewModel` Component Properties

All the properties defined on the `ViewModel` component instance and on its prototype chain are making up the component properties, which are exposed to the component template.  \
However, there is a special kind of properties which are tracked, so that, when such a property value changes the DOM sub-tree attached to the component is updated to reflect these changes. We will refer to this kind of properties as **reactive properties**.

Reactive properties must be defined explicitly.

## Reactive Properties

To define **reactive properties** you can use the `@Property(PropertyType)` decorator on a class field.

**Example**

```javascript
class MyComponent extends ViewModel {
    @Property firstName = 'Foo';
    @Property lastName = 'Bar';
    @Property age = 50;
    @Property(String) title = null;
}
```

This will define 4 **reactive properties**, initialized with the declared default values.

The Qute compiler will inject the property definitions in the constructor before any existing statements.

In the above example ypu can see the property we defined a type fo the `title` property (i.e. the String type). When initializing properties with primitive values (String, Number or Boolean) the type is automatically inferred from the default value. But when no default value is given, or the property kis initialized using a `null` value then you may specify the type of the property as an argument to `@Property` decorator.

Property types are optional. Here is a list of the built-in property types:

+ String
+ Number
+ Boolean
+ Date
+ Array
+ Object
+ Function
+ List
+ Link

You can also register your own property types.

Check the **[Property Types](#/model/proptypes)** section to learn more on property types.

### How reactive properties are implemented?

Reactive properties are not stored directly on the `ViewModel` instance, but as properties of the `ViewModel.$data` property. These properties are created using `Object.defineProperty` by defining a custom setter and getter.
The setter is intercepting the property change and triggers an asynchronous DOM update if needed. Multiple property changes occurred in the same event loop execution are collected and all updates will run in a later event loop execution.

Changing properties inside `ViewModel.$data` will change the corresponding reactive property value but will not trigger any update.

You can intercept reactive property updates (and cancel the update if needed) through watchers.  \
Check the **[Property Watchers](#/model/watchers)** section for more details.

## Regular Properties

Regular `ViewModel` properties are regular object properties defined on the component instance wither using class fields, either directly in class `constructor`. Changing regular properties will not trigger DOM updates. You should use regular properties when you don't need **reactivity**. Also, note that regular properties **are not mappable from element attributes**!

**Example**

```javascript
class MyComponent extends ViewModel {
    firstName = 'Foo';

    constructor(app) {
        super(app);
        this.lastName = 'Bar';
    }
}
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
const { ViewModel, Template, Property } = Qute;

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

@Template(MyComponentTemplate)
class MyComponent extends ViewModel {
    @Property reactiveProp;
    @Property(String) title;
    name = 'the name';
}
```

You can see how the kebab case attribute named `reactive-prop` was used to initialize the `reactiveProp` reactive property. You can also use `reactiveProp` as the name of the attribute, it works too, but we recommend to use kebab case notation instead since HTML attributes are not case-sensitive.

Also, you can see that attributes not matching a reactive property are added to the **"catch all"** `$attrs` object. This is also the case of the `name` attribute. Even if we defined a regular `name` property on the component - it will still go in the `$attrs` object since the `name` property is not reactive, and thus, it is not mappable from attributes.


## Required properties

Reactive properties can be defined as **required** by using the `@Required` decorator along with the `@Property` decorator ron the class field.

A required property must always be set using an element attribute to a non null value otherwise an exception will be thrown.

The following example will throw an error, since the `name` attribute is not set:


```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property, Required } = Qute;

<q:template name='MyElementTemplate'>
    <div>Required prop: {{name}}</div>
</q:template>

<q:template export>
    <my-element />
</q:template>

@Template(MyElementTemplate)
class MyElement extends ViewModel {
    @Required @Property name;
}
```

To fix it just specify a name attribute on the `my-element` component:

```xml
<my-element name="somme value"'>
```

## Non enumerable properties

Reactive and regular properties which name is starting with a `_` charcater are not enumerable.

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property, Required } = Qute;

<q:template name='MyElementTemplate'>
    <div>Enumerable properties: {{JSON.stringify(this)}}</div>
</q:template>

<q:template export>
    <my-element name='the name' />
</q:template>

@Template(MyElementTemplate)
class MyElement extends ViewModel {
    @Required @Property name;
    @Property _type = null;
    _input = null;
}
```