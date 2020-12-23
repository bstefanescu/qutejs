# Custom attribute directives

**Qute** let's you define custom attributes (aka attribute directives) on any HTML or component element. A custom attribute can be used to run some logic when the element is created like storing some custom properties, registering listeners or modyfing the element content. Custom attributes can hook into the **Qute reactivity model** to update the element each time is needed.

Custom attributes are functions that can be used through their kebab case name in the same way as components. A custom attribute **must use a namespace prefix**. See the **The Component's Element Name** section in the **[Overview](#/overview)** page for more details about the conversion from a javascript identifier to a kebab case name.

**Example:**

The following function
```
function qMyAttribute(attrs, value, compOrEl) {
    console.log('element created');
}
```

can be used as `q:my-attribute` on any element in templates.


## Custom attribute values

Like any attribute, a custom attribute can take a value. The compiler encode the value depending on how the value is specified. There are 3 types of values:

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

The difference with the. expression value `{ ... }` is that the contained variables will be evaluted only once at rendering (reactivity is not supported). This syntax is fine to pass some configuration object.

### String literal values

Otherwise (if the value is enclosed in quotes or double quotes) the value will be encoded as string literal.

**Example:** `q:my-directive="Some value"`


## The custom directive function

The function signature is: **`function(attrs, value, element, component)`** where

* `attrs` is an object providing the attributes and the event listeners to be injected on the element, and the
* `value` is the value passed to the directive or `null` if the directive has no value.
* `element` is the target element if the directive is used on an HTML elementotherwise it is `null`.
* `component` is the target component instance if the directive is used on a component element otherwise it is `null`.

**Note** that `element` and `component` arguments are mutually exclusive. Only one will be defined depending on whether the directive is used on an HTML element or a component element.

When the directive is used on an HTML element, the directive function is called just after the element creation (before setting up attributes, listeners or adding children to the element).  \
When the directive is used on a component element, the directive function is called just before the element is created. This is usefull since directives may want to inject some properties to the component, and this should be done before the element is rendered.  \
In both cases the directive is called in the context of the current **Rendering Context** instance.

The directive function **may return another function** to be called after the element is fully configured (attributes are setup, children added, listener registered) and before being atatached to the DOM. If no function is returned then nothing will be done after the element is created.

The returned function signature is `function(el)` where `el` is the created element. The returned function will be executed in the context of the current **Rendering Context** instance.

The **Rendering Context** object is internal to Qute and its job is to render components and update the DOM when needed. You can use the **Rendering Context object** to register your own update listeners, to retrieve the current **model** (i.e. a `ViewModel` instance or a template component object) etc.


## The Attribute's Namespace

As specified, you must use a namespace for your custom attributes. It is recommended to use a specific namespace that identifies your product (or library) and avoid using `q:` as namespace, since it is used for the **Qute** built-in attributes.

## The Rendering Context object

Here are some usefull methods and properties of the **Rendering** object

### `vm`

A reference to the component being rendered in the context of this rendering instance.
This can be either a `ViewModel` component instance, either a template component insance.

### `eval(xattr)`

Evaluate an `xattr` value. An `xattr` can hold literal values when the attribute refer to a constant value or a function used to resolve the value when the attribute is an expression.

**Example:**

```javascript
function myDirectiveFactory(attrs, valueExpr) {
	var config = this.eval(valueExpr); // evaluate the directive value if any
}
```

### `$push(lifeCycleHandler)`
Can be used to register a handler to be notified on connect / disconnect life cycle events on the current component

### `up(updateListener)`

Register an update listener. Each time the model of the current rendering context changes (e.g. some reactive property changed on the current `ViewModel` or the `ViewModel.update()` method was called) the DOM is updated by calling the registered listeners.

The update listener take as argument the current model and returns back the registered update listener.

### `closestVM()`

Get the closest `ViewModel` instance from this rendering context. If the component rendered by the rendering context is a template component it will return the closest `ViewModel` component containing the current component.


## Reactivity in custom directives

When creating a custom directive you can register an update listener to be called whenever the containing component is updated (i.e. synzhronized with the DOM). This can be done using the `up()` method of the component rendering context. You can obtain the rendering context using: `this.$r`:

```javascript
function myDirectiveFactory(attrs, valueExpr) {
	 // register an update listener
	this.up(function() {
		console.log("component updated!");
	});
	return function() {
		// some code to be called after the element is created
	}
}
```

## Examples

### A simple directive without configuration

In this example we change the font color to green, for all `span` elements contained in the target `div` when it is created.

```jsq
import Qute from '@qutejs/runtime';

function qColorSpans(attrs, valueExpr) {
    // this function is called just before the element creation.
    console.log('#color-spans init: ', this, '; Config: ', valueExpr);
    // return a function to be called after the element is created
    return function(el) {
        var spans = el.getElementsByTagName('span');
        for (var i=0,l=spans.length; i<l; i++) spans[i].style.color = 'green';
    }
}

<q:template export>
    <div q:color-spans>Hello <span>world</span>!</div>
</q:template>
```

### A simple directive with configuration

Let's now modify the previous example and use a value to specify a color.

```jsq
import Qute from '@qutejs/runtime';

function qColorSpans(attrs, valueExpr) {
	console.log('#color-spans init:', this, "Config: ", valueExpr);
	var color = valueExpr || 'green';
	return function(el) {
		var spans = el.getElementsByTagName('span');
		for (var i=0,l=spans.length; i<l; i++) spans[i].style.color = color;
	}
}

<q:template export>
	<div q:color-spans='red'>Hello <span>world</span>!</div>
</q:template>
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
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

function qColorSpans(attrs, colorExpr) {
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
}

<q:template name='RootTemplate'>
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
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    @Property color;
}
export default Root;
```

**Notes:**

1. The custom attribute value is used to pass a variable value for the color to use. If the color evaluate to falsy then the default color is used.  \
The Custom attribute value must be evaluated using the rendering contetxt `eval()` method.  \
You can evaluate any attribute passed to the element using `this.eval(attrs["some-attr"])`.

2. If you need to use mulptiple attributes for your directive then you may want to delete the extra attribute from the `attrs` object to avoid writing the attribute on the DOM element.

For example you may want to modify the previous directive to set the color of the children elements selected using a given element selector:

`<div q:color-kids='span' color={color}>`

In this case you want to retrieve the color from the `attrs[color]` expression but then you want to remove the color attribute otherwise it will be inserted into the DOM element as an HTML attribute:

```javascript
function qColorKids(attrs, selectorExpr) {
    var rendering = this, color, colorExpr = 'green';
    var selector = rendering.eval(selectorExpr) || 'span';

    if (attrs.color) {
        colorExpr = attrs.color;
        delete attrs.color;
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
}
```

To use the directive you can write: `<div q:color-kids='span' color={color}>`
