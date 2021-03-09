# Hello World

The following examples demonstrates the usage of:

1. basic **templating** features.
2. **[event](#/model/events)** handling.
3. **[q:ref](#/attributes/q-ref)** directive.
4. **reactive** `ViewModel` properties.
5. **non reactive** `ViewModel` properties.
5. the `q:model` directive provided by **[form plugin](#/plugins/form)**.
5. **[internationalization](#/plugins/i18n)**.

The following component is just printing "Hello World!".

```jsq
<q:template export>
	<div>Hello World!</div>
</q:template>
```

## Using event listeners

The following compopnent is displaying a "Hello World!" alert when clicking a button.

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='HelloTemplate'>
	<button @click='sayHello'>Say Hello</button>
</q:template>

@Template(HelloTemplate)
class Hello extends ViewModel {
	sayHello() {
		window.alert('Hello world!');
	}
}
export default Hello;
```

## Using `q:ref` to retrieve a DOM element instance

The following component is displaying a "Hello {name}!" where `{name}` is the value entered in a text input.


```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='HelloTemplate'>
	<div>
		<input type='text' value="World" q:ref="_input" />
		<button @click='sayHello'>Say Hello</button>
	</div>
</q:template>

@Template(HelloTemplate)
class Hello extends ViewModel {
	sayHello() {
		window.alert('Hello '+this._input.value+'!');
	}
}
export default Hello;
```

## Using component reactive properties

Use a reactive property to store the user name to greet. When changing the user name, the greeting messages is automatically updated.

**Note** that the property is updated using the input on `change` event, so you need to press enter to trigger a `change` event.

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

<q:template name='HelloTemplate'>
	<div>
		Enter an user name: <input type='text' value={name} @change='e => name = e.target.value' />
		<div>Hello {{name}}!</div>
	</div>
</q:template>

@Template(HelloTemplate)
class Hello extends ViewModel {
    @Property name = 'Foo';
}
export default Hello;
```

## Using component non-reactive properties

Same as the previous example but we will use a non reactive property.

The initial property value will be correctly displayed, but when changed the displayed message is not updated. You can still update the DOM by explicitly calling the `ViewModel.update()` method.


```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='HelloTemplate'>
	<div>
		Enter an user name: <input type='text' value={name} @change='e => name = e.target.value' />
		<div>Hello {{name}}!</div>
		<button @click='e=>this.update()'>Manual Update</button>
	</div>
</q:template>

@Template(HelloTemplate)
class Hello extends ViewModel {
    name = 'Foo';
}
export default Hello;
```

## Binding a form control to a reactive property through `q:model` directive

The same as the reactive property example, but we will use the `q:model` directive to bind a reactive property to an input value. The binding is bidirectional so we don't need anymore to explicitly handle the `change` event (this will be done under the hood).

```jsq
import Qute from '@qutejs/runtime';
import { qModel } from '@qutejs/form';
const { ViewModel, Template, Property } = Qute;

<q:template name='HelloTemplate'>
	<div>
		Enter an user name: <input type='text' q:model='name' />
		<div>Hello {{name}}!</div>
	</div>
</q:template>

@Template(HelloTemplate)
class Hello extends ViewModel {
    @Property name = 'Foo';
}
export default Hello;
```

**Note** that we need to import the `form` plugin since the `q:model` directive is defined there.

## Internationalziation

This example is using the **[i18n plugin](#/plugins/i18n)**.

```jsq
import Qute from '@qutejs/runtime';
import QuteIntl from '@qutejs/i18n';
const { ViewModel, Template } = Qute;

<q:template name='HelloTemplate'>
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
</q:template>

var i18n = new QuteIntl({
    resources: {
        en: {
            hello: 'Hello World!'
        },
        fr: '/assets/messages-fr.json'
    }
});

@Template(HelloTemplate)
class Hello extends ViewModel {
	changeLanguage(event) {
		var lang = event.target.value;
		var self = this;
		i18n.load(lang).then(function(changed) {
			changed && self.refresh();
		});
	}
}

i18n.load('en').then(function() {
    // language loaded -> ready to use i18n
    // you can mount your application now
	new Hello().mount('app');
});
```
