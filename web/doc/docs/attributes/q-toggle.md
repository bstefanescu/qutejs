# The q:toggle attribute

You can use this directive to conditionally add or remove `flag` like attributes on HTML elements. The attribute to be toggled must be prefixed with `q:toggle` and takes as value an expression. If the value evaluates to a truthy value then the attribute is added otherwise it is removed

**Syntax:** `q:toggle-attrName={booleanExpression}`

## The `?attr` alias

You can use the shorter prefix `?` if you prefer a more compact notation:

**Syntax:** `?attrName={booleanExpression}`

Both of these notations are equivalent.

## Example

```jsq

<q:template name='root'>
	<div>
		<button @click='e => disableButton1 = true'>Click to disable button 1</button>
		<button @click='e => disableButton2 = true'>Click to disable button 2</button>
		<hr/>
		<button q:toggle-disabled={disableButton1}>Button 1</button>
		<button ?disabled={disableButton2}>Button 2</button>
	</div>
</q:template>

export default Qute('root', {
	init() {
		return {
			disableButton1: false,
			disableButton2: false
		};
	}
});
```

## Using q:toggle on components

When using `q:toggle` attribute on components it will modify the attributes on the component root element. This works for both **functional** and **ViewModel** components.

```jsq
<q:template name='button1'>
	<button><slot/></button>
</q:template>
<q:template name='button2'>
	<button><slot/></button>
</q:template>

<q:template name='root'>
	<div>
		<button @click='e => disableButton1 = true'>Click to disable button 1</button>
		<button @click='e => disableButton2 = true'>Click to disable button 2</button>
		<hr/>
		<button1 q:toggle-disabled={disableButton1}>Button 1</button1>
		<button2 ?disabled={disableButton2}>Button 2</button2>
	</div>
</q:template>

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
