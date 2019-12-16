# The x-style attribute

To specify classes for elements you can use the regular HTML **style** attribute. Example:

```xml
<a style="text-decoration: none">A link</a>
```

You can also bind the style attribute to some javascript expression in order to generate dynamic styles:

```xml
<a style = { 'text-decoration: '+(hasUnderline?'underline':'none') }>A link</a>
```

The `x-style` attribute was introduces to ease dynamic styles binding. It takes as a value a javascript expression than is evaluated to either an object or an array.


## The x-style object notation

When using the object notation all style properties must use the camel cae (and not the kebab case as in CSS).

```xml
<a x-style="{textDecoration: hasUnderline?'underline':'none', fontSize: '110%'}">A link</a>
```

## The x-style array notation

The array notation enables to merge multiple style objects:

```xml
<a x-style="[{textDecoration: 'underline'}, {fontSize: '110%'}]">A link</a>
```

## Using x-style and style altogether

When using the x-style and style altogether, the x-style will override the values defined by style.
As with **[x-class](#/attributes/x-class)**, when using both `x-style` and `style` on an element, it is **recommended** to use the `style` attribute only to set static class names.

```xml
<a x-style="{textDecoration: hasUnderline?'underline':'none'}" style="font-size: 110%">A link</a>
```

## Using x-style on components

When using `x-style` attribute on components it will modify the style on the component root element. This works for both **functional** and **ViewModel** components.

**Note** that the `x-style` attribute will be evaluated in the outside context of the target component.

Example:

```jsq
<x-tag name='test-style'>
	<div><slot/></div>
</x-tag>

<x-tag name='root'>
	<test-style x-style="{textAlign: align}">Hello!</test-style>
</x-tag>


export default Qute('root', {
    align: 'center'
});

Qute('test-style'); // remove this line to use test-style as a functional component
```

