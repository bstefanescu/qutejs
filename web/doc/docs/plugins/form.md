# Form directives

To ease working with HTML `forms`, Qute is providing several **[custom attribute directives](#/attributes/q)**.

These directive are not part of the default qute runtime package. The form directives are provided by the `@qutejs/form` plugin.

## The `model` attribute

The model attribute can be used to bind a form control value to a component property or a variable expression.

Binding to a **component property** will create a **bidirectional binding** between the control value and the property value: any time the compoennt is updating the property value, the control value will be changed too, and any time control value is updated through some user interaction, the component property will be updated too.

Binding to an **expression** will create a **unidirectional binding**: the control value is updated when the component is udpated and the expression changes, but not the inverse. Anyway you can still update the component when the control changes by registering ane explicit `change` event listener on the control.

To create a bidirectional binding you need to use a string literal as the `model` value - representing the property name tpo bind to: `<input q:model="propName">`

To create an expression binding, just use the `{ ... }` attribute value notation: `<input q:model={someExpr}>`

The `model` attribute can be used on the following elements: `INPUT`, `TEXTAREA`, `SELECT` and elements having a `radio` custom attribute.

Given a property `title` on the current component the following control bindings are equivalent and bidirectionals:

```xml
<input type='text' q:model='title' />
```

and

```xml
<input type='text' q:model={title} @change='e => title = e.target.value' />
```

### Example

```jsq
<x-style>
div {
	padding: 10px
}
</x-style>
<x-tag name='root'>
	<form @submit='handleSubmit'>
		<div>
		<label>Name:</label> <input type='text' placeholder='Type something' name='name' q:model='name' />
		</div>
		<div>
		<input type='checkbox' name='agree' q:model='agree' /> I agree to the terms and conditions
		</div>
		<div>
		<label>City:</label> <select name='city' q:model='city'>
			<option>London</option>
			<option>Paris</option>
			<option>New York</option>
		</select>
		</div>
		<div>
			<label><input type='radio' name='gender' value='male' q:model='gender' />Male</label>
			<br />
			<label><input type='radio' name='gender' value='female' q:model='gender' />Female</label>
		</div>
		<div>
		<input type='submit' value='Submit' />
		</div>
	</form>
</x-tag>

export default Qute('root', {
	init() {
		return {
			name: null,
			agree: false,
			city: 'Paris',
			gender: null
		}
	},
	handleSubmit() {
		var json = JSON.stringify(this);
		alert(json);
		return false;
	}
});
```

## The `radio` attribute

This attribute can be used on `DIV` and `FIELDSET` elements, and is usefull to manage a group of radio inputs as a single control.

The `radio` attribute value is the radio `input` name to use. The `radio` should be used in conjunction with the `model` attribute.

```jsq

```

## The `validate` attribute


