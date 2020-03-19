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
<q:style>
div {
	padding: 10px
}
</q:style>
<q:template name='root'>
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
</q:template>

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

# Form validation (q:validate)

Form validation is implemented through the **`q:validate`** attribute directive.

The validation uses the [HTML5 constraint validation](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation) mechanism for validating user input.
When enabling valiation the default browser validation reporting is automatically turned off (by setting the form `novalidate` property to true). This way, you can use default validators (pattern, email, url, min, max etc.) provided by the browser and reporting validation messages using custom logic.  \
If the browser is not supporting HTML5 validation (e.g. IE9), a minimal implementation is automatically polyfilled, to support at least the basic validators like: required, pattern, email, url, number, min, max, minlength, maxlength.

## Form validation configuration

The form validation directive let's you set custom error messages and a custom reporting function if needed. This can be done through the `q:validate` value which can be a configuration object having the following keys:

* **onblur** - defaults to true. If true automatically report validation errors on blur events.
* **report** - A report function to use to display validation messages. If not set the default built-in mechanism is used.
* **messages** - Custom validation messages mapping. If not specified the built-in browser messages are used.

## Built-in reporting mechanism

The built-in reporting mechanism is injecting the validation message into an element designated as the holder of the validation message of a corresponding for control.

To designate a element as a validation message holder you must use the **`q:validation-message`** attribute directive. The directive value must point to the form control **element name** for which to show the validation message.

The holder element is by default hidden, and will be shown only when validation is failing on the corresponding form control element.

**Example:**

```xml
<form q:validate>
	<input type='email' name='user_email' />
	<span q:validation-message='user_email' class='error'/>
</form>
```

This code will use the span element as the validation message holder for the `user_email` input element. Here we assigned to it an `error` class to be able to control the message appareance (like for example to set a red font color).

Also, an **`invalid`** class is added to the control element each time the validation fails for that element. When the validation passes the **`invalid`** class is removed. So you can use this class to change the appearance of the failing input.

You can change the defualt validation reporting by setting a custom reporter. The custom reporter will be called each time a validation message update needs to be done for an element.

The reporter have the following signature: **`function(element, message)`**, where `element` is the input element being validated and the `message` is the validation message. Note that the message can be empty if a previously invalid element is valid again (in this case the reporter should remove the validation error).

## Custom Validation Messages

It is recommended to use your own validation messages in production. The default is to use built-in browser messages, but these are generic and different between browsers.

To define a message mapping you should specify an object who's keys are the form element names and the value is an object of message types mapped to the actual messages.

**Example:**

Given this form:

```xml
<form q:validate={config}>
	<input type='text' name='user_name' required pattern='[A-Za-z_0-9]+' />
	<input type='email' name='user_email' required />
</form>
```

you can use the following message mapping:

```javascript
var config = {
	messages: {
		user_name: {
			required: 'User name is required.',
			pattern: 'User name must contains only alphanumerical characters or underscores. '
		},
		user_email: {
			required: 'User email is required.',
			type: 'Please type an email address.',
		}
	}
}
```

These are the possible keys you may use as validation message types:

* **required** - specify the message to be used when the `require` check fails.
* **type** - specify the message to be used when the element `type` check fails (like email, url, number etc.).
* **pattern** - specify the message to be used when the `pattern` check fails.
* **min** - specify the message to be used when the `min` check fails.
* **max** - specify the message to be used when the `max` check fails.
* **minlength** - specify the message to be used when the `minlength` check fails.
* **maxlength** - specify the message to be used when the `maxlength` check fails.
* **step** - specify the message to be used when the `step` check fails.
* **error** - fallback message to be used if no specific validation type was specified.

You can use a single message mapping using the **`error`** key if you don't want to use specific messages for each type of validation error.

For example you can re-write the `user_email` error messages above like this:

```javascript
user_email: {
	error: 'Please type an email address.'
}
```

This will display the `error` message no matter which validation check failed.

As a shortcut, you can write:

```javascript
user_email: 'Please type an email address.'
```
It is equivalent to `user_email: {error: 'Please type an email address.'}`


## Custom Validators

Sometimes you may want to add some custom checking, that is not provided by built-in browser validators. Like for example to type twice a password and check that both passwords are equals.

In order to specify your own validator you must use the `q:validate` attribute directive at the form control level.

**Example:**

```xml
<form q:validate>
	<input type='password' name='pass1'>
	<input type='password' name='pass2' q:validate={checkPassword}>
</form>
```
where checkPassword is a function provided by the current component model, that get as the first argument the element to check and returns an error message in case of validation failure or a falsy value (an empty string, null or undefined) otherwise.

**Note** that messages returned by custom validators cannot be replaced using **custom validation messages**.

## Form Validation Example

Here is a complete example on form validation

```jsq
<q:style>
.row {
	margin: 8px 0;
	display: flex;
}
.error {
	color: red;
	margin-left: 10px
}
input.invalid {
    outline: 0;
    border: none;
    box-shadow: 0 0 1px 1px rgba(255, 0, 0, 0.3);
}
label {
	min-width: 10em;
	font-weight: 500;
}
button {
	padding: 4px;
	font-weight: 500;
}
</q:style>
<q:template name='root'>
	<form q:validate={config} @submit='handleSubmit'>
		<div class='row'>
		<label>Username:</label> <input type='text' q:model='user' name='username' pattern='[A-Za-z0-9_]+' required/>
		<span q:validation-message='username' class='error' />
		</div>
		<div class='row'>
		<label>E-Mail:</label> <input type='text' q:model='email' name='email' required />
		<span q:validation-message='email' class='error' />
		</div>
		<div class='row'>
		<label>Password:</label> <input type='password' q:model='pass' name='pass' minlength='4' required />
		<span q:validation-message='pass' class='error' />
		</div>
		<div class='row'>
		<label>Confirm Password:</label> <input type='password' name='rpass' q:validate={checkPassword} required />
		<span q:validation-message='rpass' class='error' />
		</div>
		<div class='row'>
		<button>Submit</button>
		</div>
	</form>
</q:template>
export default Qute('root', {
	init() {
		this.config = {
			messages: {
				username: {
					required: 'Username is required.',
					error: 'Username must contains only alphanumeric or underscore characters.'
				},
				email: 'Please type an email address.',
				pass: {
					required: 'Password is required.',
					error: 'Password must contains at least 4 chatacters.'
				}
			}
		}

		this.checkPassword = function(el) {
			return this.pass !== el.value ? 'Passwords does not match!' : '';
		}.bind(this);

		return {
			user: null,
			email: null,
			pass: null,
		}
	},
	handleSubmit() {
		alert('Username: '+this.user+'\nE-mail: '+this.email+'\nPassword: '+this.pass);
		return false;
	}
});
```

