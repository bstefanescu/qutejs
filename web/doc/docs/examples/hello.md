# Hello World

Thw following component is just printing "Hello World!".

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

## Using component non-reactive properties

```jsq
<x-tag name='hello'>
	<div>
		<input type='text' value={hello} @change="event => hello = event.target.value" />
		<button @click='sayHello'>Say Hello</button>
	</div>
</x-tag>

export default Qute('hello', {
	init() {
		this.hello = "World";
	},
	sayHello() {
		window.alert('Hello '+this.hello+'!');
	}
});
```


## Using component reactive properties

```jsq
<x-tag name='hello'>
	<div>
		<input type='text' value={hello} @change="event => hello = event.target.value" />
		<div>Hello {{hello}}!</div>
	</div>
</x-tag>

export default Qute('hello', {
	init() {
		// define a reactive property
		return {
			hello: "World"
		}
	}
});
```

## Binding a form control to a reactive property through `q:model` directive

This example is using the **[form plugin](#/plugins/form)** to bind component properties to form controls using the `q:model` directive.

```jsq
<x-tag name='hello'>
	<div>
		<input type='text' name='hello' q:model='hello' />
		<div>Hello {{hello}}!</div>
	</div>
</x-tag>

export default Qute('hello', {
	init() {
		// define a reactive property
		return {
			hello: "World"
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
