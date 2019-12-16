# The x-toggle attribute

You can use this directive to conditionally add or remove `flag` like attributes on HTML elements. The attribute takes as a value a map of attribute names to conditional expressions.

**Syntax:** `x-toggle="{attrName: booleanExpression}"`

```jsq

<x-tag name='root'>
	<div>
		<button @click='e => this.disabledButton = "left"' x-toggle='{disabled: disabledButton === "left"}'>Enable right button</button>
		<button @click='e => this.disabledButton = "right"' x-toggle='{disabled: disabledButton === "right"}'>Enable left button</button>
	</div>
</x-tag>

export default Qute('root', {
	init() {
		return {
			disabledButton: 'right'
		};
	}
});
```

**Note** that there is another method to conditionally add an attribute: when using regular attribute bindings, if the attribute value is evaluated to `null` or `undefined` then the attribute will not be added to the element.
Anyway, one may want to use boolean values to control flag like attributes, this is why the `x-toggle` was added.

## Using x-toggle on components

When using `x-toggle` attribute on components it will modify the attributes on the component root element. This works for both **functional** and **ViewModel** components.

```jsq
<x-tag name='button1'>
	<button><slot/></button>
</x-tag>
<x-tag name='button2'>
	<button><slot/></button>
</x-tag>

<x-tag name='root'>
	<div>
		<button @click='disableButton1 = true'>Click to disable button 1</button>
		<button @click='disableButton2 = true'>Click to disable button 2</button>
		<hr/>
		<button1 x-toggle='{disabled: disableButton1}'>Button 1</button1>
		<button2 x-toggle='{disabled: disableButton2}'>Button 2</button2>
	</div>
</x-tag>

Qute('button1');

export default Qute('root', {
	init() {
		return {
			disableButton1: false,
			disableButton2: false
		};
	}
});
```
