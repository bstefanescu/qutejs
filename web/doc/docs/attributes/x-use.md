# The x-use attribute

Using this directive you can run custom callbacks when an element is created. You can run both registered or lambda callbacks.

A creation callback is called after the target element is created, but before being connected to the DOM.

A callback is always called in the context of the containing component (`this` is pointing to the component instance), and take one argument: the **created element**.


## Registered Callbacks

Are usefull to implement **custom user directives**.

These directives can be used anywhere in the application templates by using the name of the registered directive.

Registered callbacks are taking an additional argument: the `x-use` attribute value as a javascript object or `true` if no value was specified.

To specify which directive should be called you need to specify the name in the attribute key as following: `x-use:directive-name`.

**Example:**

In this example we change the font color to green, for all `span` elements contained in the target `div` when it is created (and before being connected to the DOM).

```jsq
<x-tag name='root'>
	<div x-use:color-spans>Hello <span>world</span>!</div>
</x-tag>

Qute.registerDirective('color-spans', function(el, config) {
	console.log('element created:', el, 'container VM:', this, "Config: ", config);
	var spans = el.getElementsByTagName('span');
	for (var i=0,l=spans.length; i<l; i++) spans[i].style.color = 'green';
});

export default Qute('root');
```

In this example `config` will be `true` since no value was specified for the `x-use:color-spans` attribute.

Attribute values can be used to pass some configuration to the directive.

**Example:**

In this example we will change the color of the `span` elements using the color given through the directive value:

```jsq
<x-tag name='root'>
	<div x-use:color-spans='{color:"red"}'>Hello <span>world</span>!</div>
</x-tag>

Qute.registerDirective('color-spans', function(el, config) {
	console.log('element created:', el, 'container VM:', this, "Config: ", config);
	var color = (config && config.color) || 'green';
	var spans = el.getElementsByTagName('span');
	for (var i=0,l=spans.length; i<l; i++) spans[i].style.color = color;
});

export default Qute('root');
```

## Lambda Creation Callbacks

These callbacks are local functions that are not registered under a name as "custom directives". This type of callback is a one shoot function, it cannot be shared with other templates.

To call this kind of callback you should use `x-use` without having to specify a name after the colon character.

**Example:**

Fetching a DOM element instance from the parent component.

```jsq
<x-tag name='root'>
	<div>
	<input type='text' name='name' x-use='el => this.inputEl = el'><button @click='onClick'>Click me!</button>
	</div>
</x-tag>

export default Qute('root', {
	onClick() {
		alert('Input value is '+this.inputEl.value);
	}
});
```

Here we used an arrow function to store the input element instance as a component property.

Let's do more, we can initialize the input if empty:

```jsq
<x-tag name='root'>
	<div>
	<input type='text' name='name' x-use='onInputCreate' />
	<button @click='onClick'>Click me!</button>
	</div>
</x-tag>

export default Qute('root', {
	onInputCreate(el) {
		this.inputEl = el;
		if (!el.value) el.value = 'Hello!';
	},
	onClick() {
		alert('Input value is '+this.inputEl.value);
	}
});
```

## The `x-call` alias

`x-call` is an alias for `x-use`. It was introduced since in some situations it is much more meaningfull (especially when calling lambda callbacks). You can use it with both lambda callbacks and custom user directives.

**Example:**

Let's rewrite the last example using `x-call`:


```jsq
<x-tag name='root'>
	<div>
	<input type='text' name='name' x-call='onInputCreate'><button @click='onClick'>Click me!</button>
	</div>
</x-tag>

export default Qute('root', {
	onInputCreate(el) {
		this.inputEl = el;
		if (!el.value) el.value = 'Hello!';
	},
	onClick() {
		alert('Input value is '+this.inputEl.value);
	}
});
```

## Using `x-use` (or `x-call`) on component tags

When using this directive on component tags it will be called on the component root element.
You can use it on both `functional` or `ViewModel` components.

On functional components we can make some usefull hacks using the `x-use` directive. Remember that a functional component doesn't take part on the component life cycle.  \
Anyway, we can use `x-use` directive to make the functional component aware when the parent ViewModel component is connected or disconnected from the DOM.

### Functional Components and the Life Cycle

```jsq
<x-tag name='functional' import='handleFuncLoad'>
    <div x-call='handleFuncLoad'>I am a functional component</div>
</x-tag>

<x-tag name='root'>
    <functional />
</x-tag>

function _disconnected(vm) {
    console.log('Parent VM disconnected');
}
function _connected(vm) {
    console.log('Parent VM connected');
}
function handleFuncLoad(el) {
    var ctx = this;
    ctx.$parent.setup(function() {
        // called when parent vm connected register cleanup on disconnect
        _connected(ctx.$parent);
        ctx.$parent.cleanup(function() {
            _disconnected(ctx.$parent);
        });
    });
}

export default Qute('root');
```

In this example, we are retrieving the closest `ViewModel` containing the functional component (for this we use the $parent property of the functional component context) and we register a setup function that will be called when the component is connected. The setup function is registering cleanup function that will be called when the component is disconnected.

The `import` attribute of `x-tag` is required to access variables declared in the current file within the template.

