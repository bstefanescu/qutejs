# The q:style attribute

To specify classes for elements you can use the regular HTML **style** attribute. Example:

```xml
<a style="text-decoration: none">A link</a>
```

You can also bind the style attribute to some javascript expression in order to generate dynamic styles:

```xml
<a style = { 'text-decoration: '+(hasUnderline?'underline':'none') }>A link</a>
```

The `q:style` attribute was introduces to ease dynamic styles binding. It takes as a value a javascript expression than is evaluated to either an object or an array.


## The `q:style` object notation

When using the object notation all style properties must use the camel cae (and not the kebab case as in CSS).

```xml
<a q:style="{textDecoration: hasUnderline?'underline':'none', fontSize: '110%'}">A link</a>
```

## The `q:style` array notation

The array notation enables to merge multiple style objects:

```xml
<a q:style="[{textDecoration: 'underline'}, {fontSize: '110%'}]">A link</a>
```

## Using `q:style` and style altogether

When using the q:style and style altogether, the q:style will override the values defined by style.
As with **[q:class](#/attributes/q-class)**, when using both `q:style` and `style` on an element, it is **recommended** to use the `style` attribute only to set static class names.

```xml
<a q:style="{textDecoration: hasUnderline?'underline':'none'}" style="font-size: 110%">A link</a>
```

## Using `q:style` on components

When using `q:style` attribute on components it will modify the style on the component root element. This works for both **functional** and **ViewModel** components.

**Note** that the `q:style` attribute will be evaluated in the outside context of the target component.

Example:

```jsq
import Qute from '@qutejs/runtime';

<q:template name='test-style'>
	<div><slot/></div>
</q:template>

<q:template name='root'>
	<test-style q:style="{textAlign: align}">Hello!</test-style>
</q:template>


export default Qute('root', {
    align: 'center'
});

Qute('test-style'); // remove this line to use test-style as a functional component
```

