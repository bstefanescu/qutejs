# The x-listeners attribute

In the same way as [x-attrs](#/attributes/x-attrs) injects the attributes used on a component in a nested element, the **x-listeners** attribute can be used to inject all event listeners declared on the component in a nested element

Example:

Given the following component

```
<x-tag name='my-button'>
	<li><a class='item-button' x-listeners><slot/></a></li>
</x-tag>
```

By instantiating it, every specified event listeners will be bound to the nested `a` element:

```
<my-button @click='handleClick'>Submit</my-button>
```

In that case the `click` event listener will be registered on the nested `a` element.

You can of course use both `x-listeners` and `x-attrs` to redirect both event listeners and attributes on the nested `a` element:

```
<x-tag name='my-button'>
	<li><a class='item-button' x-listeners x-attrs><slot/></a></li>
</x-tag>
```

