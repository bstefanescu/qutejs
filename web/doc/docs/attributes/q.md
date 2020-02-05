# Custom attribute directives

**Qute** let's you define custom attributes (aka attribute directives) on any HTML element. A custom attribute can be used to run some logic when element is created like storing some custom properties, registering listeners or modyfing the element content. Custom attributes can hook into the **Qute reactivity model** to update the element each time is needed.

To **register a custom directive** you must use the `Qute.registerDirective` function. Then, to **use the directive** on an element you should use the attribute prefixed with `q:` like  **`q:custom-directive-name`** where _custom-directive-name_ is the name used to register the directive.

When registering a custom attribute you can specify a target element name (like `ul`, `input` etc.) to restrict the directive to the given element. If no target element is specified then the attribute will be available on any HTML element.

## Custom attribute alternative notation

Custom attributes can also be specified by prefixing the attribute name with a `#` character:

`<input #model='someProp'>` is equivalent to `<input q:model='someProp'>`.


## Custom attribute values

Like any attribute, a custom attribute can take a value. The compielr encode the value dependeing on the how the value is specified. There are 3 types of values:

1. Reactive expression values
2. Object like values
3. String literals


### Reactive Expression values

If the value is enclosed in braces { ... }, then Qute will expects a valid javascript expression and will be encoded as a function that can be used to evaluate the expression in the current context.

This attribute syntax should be used when the directive need reactivity on the given value.

**Example:** `q:my-directive={this.getMessage()}`

### Object like values

If the value is enclosed in quotes or double quotes and contains an object or array representation then the object will be evaluated in the current context and returned as is.

**Example:** `q:my-directive='{key1: "some value", key2: this.someProperty}'`

The difference with the. expression value `{ ... }` is that the contained variables will be evaluted only once at rendering (reactivity is not supported). This syntax is good to pass some configuration object.

### String literal values

Otherwise (if the value is enclosed in quotes or double quotes) the value will be encoded as string literal.

**Example:** `q:my-directive="Some value"`


## The custom directive function

The function signature is: **`function(xattrs, value)`** where `xattrs` is an object providing the attributes and the event listeners to be injected on the element, and the `value` is the value passed to the directive or `undefined` if no value was passed.

The function is called before the target DOM is created, in the context of the current **Rendering Context** instance. The **Rendering Context** object is internal to Qute and its job is to render components and update the DOM when needed. You can use the **Rendering Context object** to register your own update listeners, to retrieve the current **model** (i.e. a `ViewModel` instance or a functional component object) etc.

The directive function should return another function to be called after the element is fully created. Thus the directive function acts as a factory of the function to be run after the element is created. If the factory fucntion returns nothing or a falsy object then nothing will be done after the element is created.

The function returned by the factory function takes a single argument: the created element instance, and is called in the context of the rendering instance.

The returned function signature is `function(el)` where el is the created element. The returned function will be executed in the context of the closest component instance (i.e. `this` will point to the closest component instance).

## Using custom attributes on component tags.

When you use a custom attribute on a component tag, the custom attribute directive will be executed on the root element rendered by the component.

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

## Custom attribute scopes

A custom attribute can be restricted to an element tag name. When registering the attribute directive you can use an optional tag name to restrict the directive to that tag:

```javascript
Qute.registerDirective('select', 'value', selectValueDirective);
```

then, use the directive as this: `<select q:value={someExpr}>`

When trying to use this directive on another element like for example an `<input>` the directive will not be found and an error will be thrown.

If you register a global directive (i.e. not restricted to a tag name) named `value` then the directive will be available on all the elements but not on the `select` element which will use its own directive version.

## Examples

### A simple directive without configuration

In this example we change the font color to green, for all `span` elements contained in the target `div` when it is created.

```jsq
<x-tag name='root'>
	<div q:color-spans>Hello <span>world</span>!</div>
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

Let's now modify the previous example and use a value to specify a color.

```jsq
<x-tag name='root'>
	<div q:color-spans='red'>Hello <span>world</span>!</div>
</x-tag>

Qute.registerDirective('color-spans', function(xattrs, valueExpr) {
	console.log('#color-spans init:', this, "Config: ", valueExpr);
	var color = valueExpr || 'green';
	return function(el) {
		var spans = el.getElementsByTagName('span');
		for (var i=0,l=spans.length; i<l; i++) spans[i].style.color = color;
	}
});

export default Qute('root');
```

**Note:** Here we used `valueExpr` as is (without evaluating it). This is because we expect the value to be a string literal and not an expression. But, you cannot know how the directive will be used by users. If someone is passing the value using an expression value like `q:color-spans={colorValue}`, then the previous code will no more work.

To avoid this you must use the rendering `eval` method:

```javascript
	var color = this.eval(valueExpr) || 'green';
```

instead of

```javascript
	var color = valueExpr || 'green';
```

and the code will work under any circumstances.


### Reactivity in custom directives

Let's now use a component reactive property to store the color to use. When the color is changed we re-run the `color-spans` directive to re-run the directice using the new color:

```jsq
<x-tag name='root'>
    <div color={color} q:color-spans={color}>
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

Qute.registerDirective('color-spans', function(xattrs, colorExpr) {
    var rendering = this, color;

    function updateColor(el) {
        var newColor = rendering.eval(colorExpr) || 'green';
        if (color !== newColor) { // only update if color changed
            color = newColor;
            var spans = el.getElementsByTagName('span');
            for (var i=0,l=spans.length; i<l; i++) spans[i].style.color = color;
        }
    }

    return function(el) {
        // register an update listener
        rendering.up(function() {
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

1. The custom attribute value is used to pass a variable value for the color to use. If the color evaluate to falsy then the default color is used.  \
The Custom attribute value must be evaluated using the rendering contetxt `eval()` method.  \
You can evaluate any attribute passed to the element using `this.eval(xattrs["some-attr"])`.

2. If you need to use mulptiple attributes for your directive then you may want to delete the extra attribute from the `xattrs` object to avoid writing the attribute on the DOM element.

For example you may want to modify the previous directive to set the color of the children elements selected using a given element selector:

`<div q:color-kids='span' color={color}>`

In this case you want to retrieve the color from the `xattrs[color]` expression but then you want to remove the color attribute otherwise it will be inserted into the DOM element as an HTML attribute:

```javascript
Qute.registerDirective('color-kids', function(xattrs, selectorExpr) {
    var rendering = this, color, colorExpr = 'green';
    var selector = rendering.eval(selectorExpr) || 'span';

    if (xattrs.color) {
        colorExpr = xattrs.color;
        delete xattrs.color;
    }

    function updateColor(el) {
        var newColor = rendering.eval(colorExpr) || 'green';
        if (color !== newColor) { // only update if color changed
            color = newColor;
            var spans = el.querySelectorAll(selector);
            for (var i=0,l=spans.length; i<l; i++) spans[i].style.color = color;
        }
    }

    return function(el) {
        // register an update listener
        rendering.up(function() {
            updateColor(el);
        });
        updateColor(el);
    };
});
```

To use the directive you can write: `<div q:color-kids='span' color={color}>`
