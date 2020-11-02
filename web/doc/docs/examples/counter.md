# Implementing a Custom Form Control

The following examples demonstrates the usage of:

1. the `q:model` and `q:validate` directive from the **[form plugin](#/plugins/form)**.
2. triggering and handling **[DOM events](#/model/events)**.
3. **[q:toggle](#/attributes/q-toggle)** (i.e. ?attr) attribute directive.

In this example we will implement a custom form control to increment / decrement numeric values.

Let's start with a simple counter:

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

// ------------------------------------------ Templates

<q:template name='CounterTemplate'>
	<div>
		<button @click='value--'>-</button>
		{{value}}
		<button @click='value++'>+</button>
	</div>
</q:template>

<q:template export>
	<my-counter value='2' />
</q:template>

// ------------------------------------------ Javascript

@Template(CounterTemplate)
class MyCounter extends ViewModel {
    @Property value = 0;
}
```

To transform the counter component into a usable form control we need to use a hidden input to store the counter value and to add some more features, like a step, a range of legal values and to trigger a `change` event when the counter value changes.

Let's update the component as follows:

- add a `name` property and use it as the name of the hidden input.
- update the hidden input value when the counter value changes.
- add a `step` property to use it when incrementing / decrementing the coutner value (defaults to 1).
- add `min` and `max` properties to define a range of legal values.
- disable / enable buttons when incrementing / decrementing is no more possible (as specified by the range).
- trigger a `change` event omn the hidden input when the counter value changes.

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

// ------------------------------------------ Templates

<q:template name='CounterTemplate'>
	<div>
		<input type='hidden' name={name} value={value} q:call='el => this.input=el'>
		<button @click='decr' ?disabled='!canDecrement'>-</button>
		{{value}}
		<button @click='incr' ?disabled='!canIncrement'>+</button>
	</div>
</q:template>

<q:template export>
	<my-counter value='2' step='2' min='0' max='8' @change='e=>console.log("counter changed", e.detail)'/>
</q:template>

// ------------------------------------------ Javascript

@Template(CounterTemplate)
class MyCounter extends ViewModel {
    @Property name;
    @Property value = 0;
    @Property step = 1;
    @Property min = Number.MIN_VALUE;
    @Property max = Number.MAX_VALUE;

	get canIncrement() {
		return this.value < this.max;
	}

	get canDecrement() {
		return this.value > this.min;
	}

	decr() {
		var value = this.value - this.step;
		if (value >= this.min) {
			this.value = value;
			this._fireChangeEvent(value);
		}
		return false;
	}

	incr() {
		var value = this.value + this.step;
		if (value <= this.max) {
			this.value = value;
			this._fireChangeEvent(value);
		}
		return false;
	}

	_fireChangeEvent(value) {
		var input = this.input;
		// run after the UI is updated (so that the wrapped input is updated too)
		Qute.runAfter(function() {
			input.dispatchEvent(new window.CustomEvent('change', {bubbles:true, detail: value}));
		});
	}
}
```

## Validation

What about validation? Hidden `input` elements doesn't take part of the HTML5 validation mechanism (which is also used by the **[Qute form plugin](#/plugins/form)**).

Anyway, custom controls are usually providing already validated values. In our example if a `min` or `max` value is specified the control will not let the user decrement / increment the value outside the defined range. So the value will always be valid.

There is one case, though, when the received value may be invalid - at initialization time. The counter control may be called with a value already outside the required range. For example: `<counter value='10' min='0' max='8'>`.

Also, if we want to use a `required` constraint on the counter we cannot do it using the hidden input.

To fix all these issues, we need to use an invisible number input instead of a input of type hidden.

Replacing `<input type='hidden' name={name} value={value}>` by `<input type='number' name={name} value={value} min={min} max={max} style='display:none'>` will solve our problem.

Another way to wrap an input is to dynamically insert a input element at component creation (instead of defining it in the template). This can be done for example in the `created` life cycle method:

```javascript
@Template(CounterTemplate)
class MyCounter extends ViewModel {
	...
	created(el) {
		var input = document.createElement('INPUT');
		// set input properties
		this.input = input;
	}
	...
}
```

## Binding control value to a model property

The [Qute form plugin](#/plugins/form) provides a way to bind a custom form control value to a component property. This can be done by registering your custom for component:

```javascript
import { registerControl } from '@qutejs/form';
registerControl("counter");
```
Then you can use the `q:model` directive to bind the control value to a reactive property of the container component:

```xml
<my-counter q:model='counterValue' />
```

## The Counter Custom Form Control

Here is the final code for the counter component:

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
import FormPlugin from '@qutejs/form';
const { ViewModel, Template, Property } = Qute;

// ------------------------------------------ Templates

<q:template name='CounterTemplate'>
	<div style='display:inline-block'>
		<input type='number' name={name} value={value} min={min} max={max} style='display:none' ?required={required} q:call='el => this._input = el'/>
		<button @click='decr' ?disabled='!canDecrement'>-</button>
		{{value}}
		<button @click='incr' ?disabled='!canIncrement'>+</button>
	</div>
</q:template>

// ------------------------------------------ Javascript

Qute.install(FormPlugin);

@Template(CounterTemplate)
class MyCounter extends ViewModel {
    _input;

    @Property name;
    @Property required = false;
    @Property value = 0;
    @Property step = 1;
    @Property min = Number.MIN_VALUE;
    @Property max = Number.MAX_VALUE;

	get canIncrement() {
		return this.value < this.max;
	}

	get canDecrement() {
		return this.value > this.min;
	}

	decr() {
		var value = this.value - this.step;
		if (value >= this.min) {
			this.value = value;
			this._fireChangeEvent(value);
		}
		return false;
	}

	incr() {
		var value = this.value + this.step;
		if (value <= this.max) {
			this.value = value;
			this._fireChangeEvent(value);
		}
		return false;
	}

	_fireChangeEvent(value) {
		var input = this._input;
		// run after the UI is updated (so that the wrapped input is updated too)
		Qute.runAfter(function() {
			input.dispatchEvent(new window.CustomEvent('change', {bubbles:true, detail:value}));
		});
	}
}
FormPlugin.registerControl(MyCounter);

// ------------------------------------------ Testing

<q:template name='RootTemplate'>
	<form q:validate @submit='handleSubmit'>
		<p>
		The counter was initialized using a value outside the legal range, so the form will not be validated (try submiting).
		<br/>
		Change to a valid value to remove the validation error.
		</p>

		<my-counter style='display:inline-block' name='counter' q:model='counter' step='2' min='0' max='8' required />

		<span q:validation-message='counter' style='color:red' />

		<div style='margin-top:10px'>
		<button>Submit</button>
		</div>
	</form>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    @Property counter = -4;

	handleSubmit(e) {
		alert('Counter is ' + this.counter);
		return false;
	}
}
export default Root;
```


