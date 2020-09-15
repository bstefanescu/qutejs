# The `q:class` attribute

To specify classes for elements you can use the regular HTML **class** attribute. Example:

```xml
<li class="active item">
```

If you need to use dyamic computed classes (and reactivity) you can just bind an expression to the **class** attribute:

```xml
<li class = { (isActive?'active ':'')+'item' } >
```

While this is working when dealing with more classes it become diffcult to write and read such expressions.
The **q:class** attribute was introduced to ease managing dynamic classes. It takes a value that evaluates special to an object or an array defining how classes should be injected.

## The `q:class` object notation

```xml
<li q:class="{ active: isActive, item: true }">
```

**Note** that you can also use parentheses to enclose the `q:class` value. The following notation is equivalent to the previous one:

```xml
<li q:class={{ active: isActive, item: true }}>
```

When using this syntax the class names are the keys and the values indicates either the class should be added (a true value) either it should be removed (a false value).

This notation is reactive: when the model changes the element class is automatically updated

## The `q:class` array notation

```xml
<li q:class="[ {active: isActive}, 'item' ]">
```

When using this syntax the array items should be either strings or objects. If a string then is represent a static class name that will be added to the element. If an object then it should follow the rules of **q:class object notation** and can be used to inject dynamic classes.

You can also use expressions to generate the array string items like:

```xml
<li q:class="[ isActive && 'active', 'item' ]">
```

**But** in this case the **active** class **will not be reactive**!
It will be correctly injected on first rendering (if `isActive` is true) but if `isActive` property changes to false then the class will not be removed - it will be just ignored because it evaluates to a falsy value.

This is because the q:class attribute is updating the existing `className` element property. When it updates the `className`it will not completly rewrite its value, but it will instead patch the `className` value by adding or removing classes as needed.


## Using `q:class` and class altogether

What happens if we use `q:class` and `class` altogether?

1. If the `class` attribute is set to a list of static classes then it will be used to initialize the element className.
   The `q:class` will patch this initial className every time a rendering is done:

   ```xml
   <li class='item' q:class='{active: isActive}'>
   ```

2. If the `class` attribute is bound to an expression, then the order of the `q:class` and `class` attributes matters. The first one will be processed first.

Because of this when using both `q:class` and `class` on the same element it is **recommended** to use the `class` attribute only to set static class names.


## Using `q:class` on components

When using `q:class` attribute on components it will modify the classes on the component root element. This works for both **functional** and **ViewModel** components.

**Note** that the `q:class` attribute will be evaluated in the outside context of the target component.

Example:

```jsq
import Qute from '@qutejs/runtime';

<q:template name='TestClass'>
	<div><slot/></div>
</q:template>

<q:template name='RootTemplate'>
	<test-class q:class='{active: selected}'>Hello!</test-class>
</q:template>


export default Qute(RootTemplate, {
    selected: true
});
```

## Example: Conditionaly adding or removing a class

Here is a simple example on how to use the `q:class` object notation to conditionally add or remove a class.

```jsq
//@style https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css

import Qute from '@qutejs/runtime';

<q:template name='RootTemplate'>
<ul class="nav nav-pills" @click='e => page = e.target.getAttribute("data-key")'>
  <li class="nav-item">
    <a class="nav-link" q:class='{active: page=="home"}' href="#" data-key='home'>Home</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" q:class='{active: page=="settings"}' href="#" data-key='settings'>Settings</a>
  </li>
  <li class="nav-item">
    <a class="nav-link" q:class='{active: page=="files"}' href="#" data-key='files'>Files</a>
  </li>
</ul>
</q:template>

export default Qute(RootTemplate, {
	init() {
		return { page: 'home' }
	}
})
```
