# Form directives

To ease working with HTML `forms`, Qute is providing several **[custom attribute directives](#/attributes/q)**.

These directives are not part of the default qute runtime package. The form directives are provided by the `@qutejs/form` plugin.

## The `q:model` attribute

The **model** attribute can be used to create a bidirectional binding between a form control value and a component property, so that each time the control value changes the bound property is updated and vice versa.

The property name to bind to the control value should be passed as the attribute value as a string literal:

```jsq-norun
import { qModel } from '@qutejs/form';

<input q:model="propName" />
```

Form directives are by default using the `q` prefix but you can change it as needed:

```jsq-norun
import { qModel as formModel } from '@qutejs/form';

<input q:model="propName" />
```

The **model** attribute can be used on any form control like input, textarea and select elements but also on components that defines custom form controls.


### Example

```jsq
import Qute from '@qutejs/runtime';
import { qModel } from '@qutejs/form';

const { ViewModel, Template, Property} = Qute;

<q:style>
div {
	padding: 10px
}
</q:style>
<q:template name='RootTemplate'>
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

@Template(RootTemplate)
class Root extends ViewModel {
    @Property name;
    @Property agree = false;
    @Property city = 'Paris';
    @Property gender = 'female';

	handleSubmit() {
		var json = JSON.stringify(this);
		alert(json);
		return false;
	}
}
export default Root;
```

## Custom Form Controls

To create a custom form control you must define a component which expose a `value` property and which fires a `change` event each time the value is changed through user interaction (i.e. programatic changes must not fire the event). Here is an example:

```jsq
import Qute from '@qutejs/runtime';
import { qModel } from '@qutejs/form';

const { ViewModel, Template, Property} = Qute;

<q:template name='MyControlTemplate'>
    <div>My Custom input: <input type='text' value={value} @change='_inputChanged'/></div>
</q:template>

<q:template name='RootTemplate'>
	<form @submit='handleSubmit'>
        <my-control q:model='message'></my-control>
        <input type='submit' value='Submit' />
	</form>
</q:template>

@Template(MyControlTemplate)
class MyControl extends ViewModel {
    @Property value;

    _inputChanged(event) {
        // do not use `this.value = event.target.value` to avoid updating the DOM
        // instead use this.$data to set the value property
        this.$data.value = event.target.value;
        this.emit('change', this); // emit a new custom event named change
        return false; // cancel the event
    }
}

@Template(RootTemplate)
class Root extends ViewModel {
    @Property message = 'Hello';

	handleSubmit() {
		var json = JSON.stringify(this);
		alert(json);
		return false;
	}
}
export default Root;
```

### Writing a custom form control using a **Template Component**

Using the technique above we can create complex form controls by using a `ViewModel` component. But what if we need to wrap an input using a simple template component to add some UI decorations? Template components are logic less components we cannot define a `value` property like above.

We can do this by forwarding the `q:model` directive to the wrapped input. To do so, we will use the `q:model` directive without any value on the form input. This will reuse the `q:model` value declared on the containing component.

Here is an example:

```jsq
import Qute from '@qutejs/runtime';
import { qModel } from '@qutejs/form';

const { ViewModel, Template, Property} = Qute;

<q:template name='MyControl'>
    <div>My Custom input: <input type='text' q:model /></div>
</q:template>

<q:template name='RootTemplate'>
	<form @submit='handleSubmit'>
        <my-control q:model='message'></my-control>
        <input type='submit' value='Submit' />
	</form>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    @Property message = 'Hello';

	handleSubmit() {
		var json = JSON.stringify(this);
		alert(json);
		return false;
	}
}
export default Root;
```

# Form validation (q:validate)

Form validation is implemented through the **`from:validate`** attribute directive.

The validation uses the [HTML5 constraint validation](https://developer.mozilla.org/en-US/docs/Web/Guide/HTML/HTML5/Constraint_validation) mechanism for validating user input.  \
When enabling valiation the default browser validation reporting is automatically turned off (by setting the form `novalidate` property to true). This way, you can use default validators (pattern, email, url, min, max etc.) provided by the browser and reporting validation messages using custom logic.  \
If the browser is not supporting HTML5 validation (e.g. IE9), a minimal implementation is automatically polyfilled, to support at least the basic validators like: required, pattern, email, url, number, min, max, minlength, maxlength.

## Form validation configuration

The form validation directive let's you set custom error messages and a custom reporting function if needed. This can be done through the `q:validate` value which can be a configuration object having the following keys:

* **onblur** - defaults to true. If true automatically report validation errors on blur events.
* **report** - A report function to use to display validation messages. If not set the default built-in mechanism is used.
* **messages** - Custom validation messages mapping. If not specified the built-in browser messages are used.

## Built-in reporting mechanism

The built-in reporting mechanism is injecting the validation message into an element designated as the holder of the validation message of a corresponding form control.

To designate an element as a validation message holder you must use the **`q:validation-message`** attribute directive. The directive value must point to the form control **element name** for which to show the validation message.

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

You can change the default validation reporting by setting a custom reporter. The custom reporter will be called each time a validation message update needs to be done for an element.

The reporter have the following signature: **`function(element, message)`**, where `element` is the input element being validated and the `message` is the validation message. Note that the message can be empty if a previously invalid element is valid again (in this case the reporter should remove the validation error).

## Custom Validation Messages

It is recommended to use your own validation messages in production. The default is to use built-in browser messages, but these are generic and differs between browsers.

To define a message mapping you should specify an object who's keys are the form element names and the value is an object of message types mapped to the actual messages.

**Example:**

Given this q:

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

Sometimes you may want to add some custom checking, which is not provided by built-in browser validators. Like for example to type twice a password and check that both passwords are equals.

In order to specify your own validator you must use the `q:validator` attribute directive at the form control level.

**Example:**

```xml
<form q:validate>
	<input type='password' name='pass1'>
	<input type='password' name='pass2' q:validator={checkPassword}>
</form>
```
where checkPassword is a function provided by the current component model, that get as the first argument the element to check and returns an error message in case of validation failure or a falsy value (an empty string, null or undefined) otherwise.

**Note** that messages returned by custom validators cannot be replaced using **custom validation messages**.

## Form Validation Example

Here is a complete example on form validation

```jsq
import Qute from '@qutejs/runtime';
import { qValidate, qValidator, qValidationMessage, qModel} from '@qutejs/form';

const { ViewModel, Template, Property} = Qute;

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
<q:template name='RootTemplate'>
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
		<label>Confirm Password:</label> <input type='password' name='rpass' q:validator={checkPassword} required />
		<span q:validation-message='rpass' class='error' />
		</div>
		<div class='row'>
		<button>Submit</button>
		</div>
	</form>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    config = {
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
    };

	checkPassword = function checkPassword(el) {
        return this.pass !== el.value ? 'Passwords does not match!' : '';
    }.bind(this);

    @Property user;
    @Property email;
    @Property pass;

	handleSubmit() {
		alert('Username: '+this.user+'\nE-mail: '+this.email+'\nPassword: '+this.pass);
		return false;
	}
}
export default Root;
```

