# The x-use attribute

The `x-use` directive lets you can create custom attribute directives.

A custom directive is a function that will be called when the target DOM element is created.

To register a custom directive you must use the `Qute.registerDirective` function. Then, to call the directive on an element you should use an attribute like `x-use:custom-directive-name` where _custom-directive-name_ is the name used to register the directive.

The `x-use` can take a value which type depends on the way the value is specified:

1. If the value is enclosed in braces { ... }, then Qute will expects a valid javascript expression and will be encoded as a function that can be used to evaluate the expression in the current context. This attribute syntax should be used when the directive need reactivity on the given value.  \
**Example:** `x-use:my-directive={this.getMessage()}`
2. If the value is enclosed in quotes or double quotes and contains an object or array representation then the object will be evaluated in the current context and returned as is.  \
**Example:** `x-use:my-directive='{key1: "some value", key2: this.someProperty}'`  \
The difference with the. expression value `{ ... }` is that the contained variables will be evaluted only once at rendering (reactivity is not supported). This syntax is good to pass some configuration object.
3. Otherwise (if the value is enclosed in quotes or double quotes) the value will be encoded as string literal.  \
**Example:** `x-use:my-directive="Some value"`

Specifying values can be usefull to configure the directive or to pass some initial value, or to create a reactive binding etc.


## The custom directive function

The function signature is: **`function(xattrs, value)`** where `xattrs` is an object providing the attributes and the event listeners to be injected on the element, and the `value` is the value passed to the directive or `undefined` if no value was passed.

The function is called before the target DOM is created, in the context of the current **Rendering Context** instance. The **Rendering Context** object is internal to Qute and its job is to render components and update the DOM when needed. You can use the **Rendering Context object** to register your own update listeners, to retrieve the current **model** (i.e. a `ViewModel` instance or a functional component object) etc.

The directive function should return another function to be called after the element is fully created. Thus the directive function acts as a factory of the function to be run after the element is created. If the factory fucntion returns nothing or a falsy object then nothing will be done after the element is created.

The function returned by the factory function takes a single argument: the created element instance, and is called in the context of the rendering instance.

The returned function signature is `function(el)` where el is the created element. The returned function will be executed in the context of the closest component instance (i.e. `this` will point to the closest component instance).

## Using `x-use` on component elements.

When you use the `x-use` attribute on a component tag, the custom directive will be executed on the root element rendered by the component.

## The Rendering Context object

Here are some usefull methods and properties of the **Rendering** object

### `vm`

A reference to the component being rendered in the context of this rendering instance.
This can be either a `ViewModel` component instance, either a functional component insance.

### `eval(xattr)`

Evaluate an `xattr` value. An `xattr` can hold literal values when the attribute refer to a constant value or a function used to resolve the value when the attribute is an expression.

**Example:**

```
function myDirectiveFactory(xattrs, valueExpr) {
	var config = this.eval(valueExpr); // evaluate the directive value if any
}
```

### `$push(lifeCycleHandler)`
Can be used to register a handler to be notified on connect / disconnect life cycle events on the current component

### `up(updateListener)`

Register an update listener. Each time the model of the current rendering context changes (e.g. some reactive property changed on the current `ViewModel` or the `ViewModel.update()` method was called) the DOM is updated by calling the registered listeners.

The update listener take as argument the current model and returns back the registered update listener.

### `closestVM()`

Get the closest `ViewModel` instance from this rendering context. If the component rendered by the rendering context is a functional component it will return the closest `ViewModel` component containing the current component.


## Reactivity in custom directives

When creating a custom directive you can register an update listener to be called whenever the containing component is updated (i.e. synzhronized with the DOM). This can be done using the `up()` method of the component rendering context. You can obtain the rendering context using: `this.$r`:

```javascript
function myDirectiveFactory(xattrs, valueExpr) {
	 // register an update listener
	this.up(function() {
		console.log("component updated!");
	});
	return function() {
		// some code to be called after the element is created
	}
}
```

## Custom directive scopes

Custom directive can be restricted to an element tag name. When registering the directive you can use an optional tag name to restrict the directive to that tag:

```javascript
Qute.registerDirective('select', 'value', selectValueDirective);
```

then, use the directive as this: `<select x-use:value={someExpr}>`

When trying to use this directive on another element like for example an `<input>` the directive will not be found and an error will be thrown.

If you register a global directive (i.e. not restricted to a tag name) named `value` then the directive will be available on all the elements but not on the `select` element which will use its own directive version.

## Examples

### A simple directive without configuration

In this example we change the font color to green, for all `span` elements contained in the target `div` when it is created.

```jsq
<x-tag name='root'>
	<div x-use:color-spans>Hello <span>world</span>!</div>
</x-tag>

Qute.registerDirective('color-spans', function(xattrs, valueExpr) {
	// this function is called just before the element creation.
	console.log('#color-spans init: ', this, '; Config: ', valueExpr);
	// return a function to be called after the element is created
	return function(el) {
		var spans = el.getElementsByTagName('span');
		for (var i=0,l=spans.length; i<l; i++) spans[i].style.color = 'green';
	}
});
export default Qute('root');
```

### A simple directive with configuration

Let's now modify the previous example and use a configuration object to be able to change the default color.

```jsq
<x-tag name='root'>
	<div x-use:color-spans='{color:"red"}'>Hello <span>world</span>!</div>
</x-tag>

Qute.registerDirective('color-spans', function(xattrs, valueExpr) {
	console.log('#color-spans init:', this, "Config: ", valueExpr);
	var color = valueExpr && valueExpr.color || 'green';
	return function(el) {
		var spans = el.getElementsByTagName('span');
		for (var i=0,l=spans.length; i<l; i++) spans[i].style.color = color;
	}
});

export default Qute('root');
```

**Note:** Here we used `valueExpr` as is (without evaluating it). This is because we expect the value to be an object and not an expression. But, you cannot know how the directive will be used by users. If someone is passing the value using an expression value like `x-use:color-spans={{color:"red"}}`, then the code will no more work.

To avoid this you must use:

```javascript
	var config = this.eval(valueExpr);
	var color = config && config.color || 'green';
```

instead of

```javascript
	var color = valueExpr && valueExpr.color || 'green';
```

and the code will work under any circumstances.


### Reactivity in custom directives

Let's now use a component reactive property to store the color to use. When the color is changed we re-run the `color-spans` directive to update to the new color

```jsq
<x-tag name='root'>
    <div color={color} x-use:color-spans='{color:"red"}'>
        Hello <span>world</span>!
        <br>
        Choose a color:
        <select @change='e => this.color=e.target.value'>
            <option value='green'>Green</option>
            <option value='blue'>Blue</option>
            <option value='red'>Red</option>
            <option value='cyan'>Cyan</option>
            <option value='magenta'>Magenta</option>
            <option value='yellow'>Yellow</option>
        </select>
    </div>
</x-tag>

Qute.registerDirective('color-spans', function(xattrs, config) {
    var rendering = this, color, colorProvider;
    if (xattrs.color) {
        colorProvider = xattrs.color;
        // delete the color attribute to avoid storing it as a DOM element attribute
        delete xattrs.color;
    }

    function updateColor(el) {
        var newColor = rendering.eval(colorProvider) || 'green';
        if (color !== newColor) { // only update if color changed
            color = newColor;
            var spans = el.getElementsByTagName('span');
            for (var i=0,l=spans.length; i<l; i++) spans[i].style.color = color;
        }
    }

    return function(el) {
        // register an update listener
        this.up(function() {
            updateColor(el);
        });
        updateColor(el);
    };
});

export default Qute('root', {
    init() {
        return {
            color: null
        }
    }
});
```

**Notes:**

1. The `color` attribute is used to pass a variable value for the color to use. If the color evaluate to falsy then the default color is used.  \
The attributes passed through the `xattrs` object must be evaluated with the rendering context `eval()` method. This will correctly handle literal values (i.e. constants) or variable values.

2. The `color` attribute is removed from the `xattrs` object. Otherwise it will be inserted as a HTML attribute on the target element.

