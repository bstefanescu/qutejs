# Hello World

The following examples demonstrates the usage of:

1. basic **templating** features.
2. **[event](#/model/events)** handling.
3. **[x-call](#/attributes/x-call)** directive.
4. **reactive** `ViewModel` properties.
5. **non reactive** `ViewModel` properties.
5. the `q:model` directive provided by **[form plugin](#/plugins/form)**.
5. **[internationalization](#/plugins/i18n)**.

The following component is just printing "Hello World!".

```jsq
<x-tag name='hello'>
	<div>Hello World!</div>
</x-tag>

export default Qute('hello');
```

## Using event listeners

The following compopnent is displaying a "Hello World!" alert when clicking a button.

```jsq
<x-tag name='hello'>
	<button @click='sayHello'>Say Hello</button>
</x-tag>

export default Qute('hello', {
	sayHello() {
		window.alert('Hello world!');
	}
});
```

## Using x-call to retrieve a DOM element instance

The following component is displaying a "Hello {name}!" where `{name}` is the value entered in a text input.


```jsq
<x-tag name='hello'>
	<div>
		<input type='text' value="World" x-call="element => this.inputElement = element" />
		<button @click='sayHello'>Say Hello</button>
	</div>
</x-tag>

export default Qute('hello', {
	sayHello() {
		window.alert('Hello '+this.inputElement.value+'!');
	}
});
```

## Using component reactive properties

Use a reactive property to store the user name to greet. When changing the user name, the greeting messages is automatically updated.

**Note** that the property is updated using the input on `change` event, so you need to press enter to trigger a `change` event.

```jsq
<x-tag name='hello'>
	<div>
		Enter an user name: <input type='text' value={name} @change='e => name = e.target.value' />
		<div>Hello {{name}}!</div>
	</div>
</x-tag>

export default Qute('hello', {
	init() {
		// define a reactive property
		return {
			name: "Foo"
		}
	}
});
```

## Using component non-reactive properties

Same as the previous example but we will use a non reactive property.

The initial property value will be correctly displayed, but when changed the displayed message is not updated. You can still update the DOM by explicitly calling the `ViewModel.update()` method.


```jsq
<x-tag name='hello'>
	<div>
		Enter an user name: <input type='text' value={name} @change='e => name = e.target.value' />
		<div>Hello {{name}}!</div>
		<button @click='e=>this.update()'>Manual Update</button>
	</div>
</x-tag>

export default Qute('hello', {
	init() {
		// define a none reactive property
		this.name = 'Foo';
	}
});
```

## Binding a form control to a reactive property through `q:model` directive

The same as the reactive property example, but we will use the `q:model` directive to bind a reactive property to an input value. The binding is bidirectional so we don't need anymore to explicitly handle the `change` event (this will be done under the hood).

```jsq
<x-tag name='hello'>
	<div>
		Enter an user name: <input type='text' q:model='name' />
		<div>Hello {{name}}!</div>
	</div>
</x-tag>

export default Qute('hello', {
	init() {
		// define a reactive property
		return {
			name: "Foo"
		}
	}
});
```


## Internationalziation

This example is using the **[i18n plugin](#/plugins/i18n)**.

```jsq
import '@qutejs/i18n';

<x-tag name='hello'>
	<div>
		<div>
			Choose Language:
			<select @change='changeLanguage'>
				<option value='en'>English</option>
				<option value='fr'>French</option>
			</select>
		</div>
		<div>{{t('hello')}}</div>
	</div>
</x-tag>

var i18n = new Qute.Intl({
    resources: {
        en: {
            hello: 'Hello World!'
        },
        fr: '/assets/messages-fr.json'
    }
});

var Hello = Qute('hello', {
	changeLanguage(event) {
		var lang = event.target.value;
		var self = this;
		i18n.load(lang).then(function(changed) {
			changed && self.refresh();
		});
	}
});

i18n.load('en').then(function() {
    // language loaded -> ready to use i18n
    // you can mount your application now
	new Hello().mount('app');
})
```
