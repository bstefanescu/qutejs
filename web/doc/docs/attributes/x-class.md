# The x-class attribute

To specify classes for elements you can use the regular HTML **class** attribute. Example:

```xml
<li class="active item">
```

If you need to use dyamic computed classes (and reactivity) you can just bind an expression to the **class** attribute:

```xml
<li class = { (isActive?'active ':'')+'item' } >
```

While this is working when dealing with more classes it become diffcult to write and read such expressions.
The **x-class** attribute was introduced to ease managing dynamic classes.

The **x-class** attribute is a special attribute that takes as value expressions that evaluates to an object or an array defining how classes should be injected.

## The x-class object notation

```xml
<li x-class="{ active: isActive, item: true }">
```

When using this syntax the class names are the keys and the values indicates either the class should be added (a true value) either it should be removed (a false value).

This notation is reactive: when the model changes the element class is automatically updated

## The x-class array notation

```xml
<li x-class="[ {active: isActive}, 'item' ]">
```

When using this syntax the array items should be either strings or objects. If a string then is represent a static class name that will be added to the element. If an object then it should follow the rules of **x-class object notation** and can be used to inject dynamic classes.

You can also use expressions to generate the array string items like:

```xml
<li x-class="[ isActive && 'active', 'item' ]">
```

**But** in this case the **active** class **will not be reactive**!
It will be correctly injected on first rendering (if `isActive` is true) but if `isActive` property changes to false then the class will not be removed - it will be just ignored because it evaluates to a falsy value.

This is because the x-class attribute is updating the existing `className` element property. When it updates the `className`it will not completly rewrite its value, but it will instead patch the `className` value by adding or removing classes as needed.


## Using x-class and class altogether

What happens if we use `x-class` and `class` altogether?

1. If the `class` attribute is set to a list of static classes then it will be used to initialize the element className.
   The `x-class` will patch this initial className every time a rendering is done:

   ```xml
   <li class='item' x-class='{active: isActive}'>
   ```

2. If the `class` attribute is bound to an expression, then the order of the `x-class` and `class` attributes matters. The first one will be processed first.

Because of this when using both `x-class` and `class` on the same element it is **recommended** to use the `class` attribute only to set static class names.


## Using x-class on components

When using `x-class` attribute on components it will modify the classes on the component root element. This works for both **functional** and **ViewModel** components.

**Note** that the `x-class` attribute will be evaluated in the outside context of the target component.

Example:

```jsq
<x-tag name='test-class'>
	<div><slot/></div>
</x-tag>

<x-tag name='root'>
	<test-class x-class='{active: selected}'>Hello!</test-class>
</x-tag>


export default Qute('root', {
    selected: true
});

Qute('test-class'); // remove this line to use test-class as a functional component
```

