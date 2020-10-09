# Qute Templates

Qute Templates are written in a markup language derived from HTML and designed to render object models into **HTML views**. The markup language is named `JSQ`.

## JSQ Markup Language

`JSQ` supports any HTML construct. You can use empty HTML elements like `<br>` or `<hr>` without closing the tag. There are still some differences over HTML: elements that have content must always be closed. (like `<p>` or `<li>`).

Also, **custom elements** (i.e. component tags) **must always be closed** event if the element don't take any content.  \
**Example:** `<my-component title='My Component' />`


## Element Attributes

In HTML, attributes can take a string value or can take no value at all (like for example the `disabled` attribute). When specified, attribute values are surrounded by quotes or double quotes. `JSQ` supports any HTML like attribute.

### Bounded Attributes

In `JSQ` you can also use **bounded attributes** which are attributes which values are assigned from a `JavaScript` expression. These attributes can change during the life on an element: any time the expression changes the attribute value will change too.

There are two ways to specify a **bounded attribute**:

1. Enclose the attribute value inside `{` `}` symbols instead of quotes or double quotes.  \
  **Example:** `<my-component title={theTitle} />`   \
  We will refer to this notation as the `jsx` like notation.
2. Use the **[q:bind](#/attributes/q-bind)** attribute directive.
  **Example:** `<my-component q:bind-title='theTitle' />`

Both of these notations are equivalent. You can use anyone you prefer or mix notations if you want.

In the rest of the documentation we will use the `jsx` like notation.

### Event Attributes

In HTML, you can declare listeners on elements using an on{event-name} attribute. In `JSQ` you should prefix the event name with a `@` character.

**Example:** `<button @click='handleClick'>Click me!</button>`

An event attribute can take as value a name which resolve to a function in the current context, or a simple javascript expression like a method call.

There is an alternative notation for an event attribute: `q:on{event-name}`

**Example:** `<button q:onclick='handleClick'>Click me!</button>`

See the **[Working with DOM Events](#/model/events)** section for more details.

### Other Special attributes

Other special attribute notations are:
1. **`#newevent@srcevent`** - to define emit attributes. See **[q:emit](#/attributes/q-emit)** for more details.
2. **`?attrName`** - to toggle **flag** like attributes. See **[q:toggle](#/attributes/q-toggle)** for more details.

## Text Expressions (aka mustaches)

Any text node containing **mustache** expressions `{{ ... }}` will evaluate the javascript expression inside the  double braces and will render the output as text (escaping any special HMTL character)

If you want to insert unescaped HTML content then use the **[q:html](#/attributes/q-html)** attribute.

**Example:**

```jsq
import Qute from '@qutejs/runtime';

<q:template name='RootTemplate'>
<div>
  <div>Hello {{fullName}}!</div>
  <div>{{"Hello "+firstName}}!</div>
  <div>{{"Hello "+getFullName()}}!</div>
  <pre>{{JSON.stringify(this)}}</pre>
</div>
</q:template>

export default Qute(RootTemplate, {
  get fullName() {
    return this.firstName + ' ' + this.lastName;
  },
  getFullName() {
    return this.fullName;
  }
}).properties({
    firstName: 'John',
    lastName: 'Doe'
});
```

## Template Rendering

Templates need to be processed in the context of a model to generate an HTML view for that model. The model properties are directly accessible in a template (either in bounded attribute values or in mustache expressions).

The model can be any `JavaScript` object, and is accessible as the `this` variable.

Here is the list of all the **built-in global variables** exposed in a template:

* `this` - the current data model (usually the current component instance)
* `JSON` - the global `JSON` object
* `console` - the global `console` object (useful for debugging)
* `window` - the global `window` object
* `Object` - the global `Object` object.
* `$` - the current Rendering instance.
* `_` - an alias to `this` (i.e. the current component instance).
* `$0`, `$1`, `$2`, `$3` etc. - are reserved and should not be used in the model (can be used to access current function arguments in inline event handlers).

**Example:**
```xml
<div class={myClass}>
	My Name is {{name}}.
</div>
```

or

```xml
<div class={this.myClass}>
	My Name is {{this.name}}.
</div>
```

## Static content

If you just need to write a static HTML fragment that is not using any variable or directive you can do it by using the **[q:html](#/attributes/q-html)** directive:

```xml
<div q:html>
  <p>Some static HTML {{variable}}</p>
</div>
```

In the previous example the `{{variable}}` will not be expanded. The entire HTML content of the `div` tag will be injected using `innerHTML`.

## SVG and MathML support

Qute templates let's you use XML elements from any XML namespace like `SVG` or `MathML`.

This can be done by wrapping the XML fragment in a static content component using the **[q:html](#/attributes/q-html)** directive as shown below.

**Example:**

```xml
<button q:html>
<svg xmlns="http://www.w3.org/2000/svg" width="48" height="48" viewBox="0 0 48 48"><title>ic_crop_original_48px</title>
    <g fill='#333'>
        <path d="M38 6H10c-2.21 0-4 1.79-4 4v28c0 2.21 1.79 4 4 4h28c2.21 0 4-1.79 4-4V10c0-2.21-1.79-4-4-4zm0 32H10V10h28v28zM27.93 24.57l-5.5 7.08-3.93-4.72L13 34h22l-7.07-9.43z"></path>
    </g>
</svg>
</button>
```

**SVG** elements are also natively supported by `Qute` so you can write dynamic SVG elements and use variable expansion. Note that, you cannot use **custom component elements** in a SVG context.

This can be useful to create SVG images with dynamic properties.

**Example:**

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

// ---------- Templates
<q:template name='RootTemplate'>
<button class='btn-icon' @click={ev => window.alert("Hello!")}>
<svg xmlns="http://www.w3.org/2000/svg" width={size} height={size} viewBox="0 0 48 48"><title>ic_sentiment_satisfied_48px</title>
    <g fill={color}>
        <path d="M31 22c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm-14 0c1.66 0 3-1.34 3-3s-1.34-3-3-3-3 1.34-3 3 1.34 3 3 3zm6.98-18C12.94 4 4 12.96 4 24s8.94 20 19.98 20C35.04 44 44 35.04 44 24S35.04 4 23.98 4zM24 40c-8.84 0-16-7.16-16-16S15.16 8 24 8s16 7.16 16 16-7.16 16-16 16zm0-8c-2.95 0-5.5-1.62-6.89-4h-3.35c1.6 4.09 5.58 7 10.24 7s8.64-2.91 10.24-7h-3.35c-1.39 2.38-3.94 4-6.89 4z"></path>
    </g>
</svg>
</button>
</q:template>

// ------------ Styles
<q:style>
.btn-icon {
  background: transparent;
  padding: 0;
  border: none
}
</q:style>

// ----------- Javascript
export default Qute(RootTemplate).properties({
    size: 32,
    color: 'green'
});
```

## Directives

Apart the syntax differences from HTML, the `JSQ` language introduce some new tag and attribute names used to control the rendering and the reactive phase of the template. These are the **tag directives** and the **attribute directives** below:

#### Tag Directives

* **[If / Else directive](#/directives/if)**
* **[For directive](#/directives/for)**
* **[Slot directive](#/directives/slot)**
* **[Nested directive](#/directives/nested)**
* **[Tag directive](#/directives/tag)**
* **[View directive](#/directives/view)**

#### Attribute directives

* **[q:for](#/attributes/q-for)**
* **[q:show](#/attributes/q-show)**
* **[q:class](#/attributes/q-class)**
* **[q:style](#/attributes/q-style)**
* **[q:toggle](#/attributes/q-toggle)**
* **[q:attrs](#/attributes/q-attrs)**
* **[q:emit](#/attributes/q-emit)**
* **[q:async-emit](#/attributes/q-async-emit)**
* **[q:call](#/attributes/q-call)**
* **[q:channel](#/attributes/q-channel)**
* **[q:html](#/attributes/q-html)**
* **[q:markdown](#/attributes/q-markdown)**
* **[q:bind](#/attributes/q-bind)**
* **[q:on](#/attributes/q-on)**
* **[Custom Attributes](#/attributes/<q></q>)**

## Writing templates

Templates are defined in `.jsq` files. Each template must be enclosed in a `<q:template>` tag.

### `<q:template>`

The tag defining a template. A template must have a single root element.

**Attributes:**

+ `name` - the name attribute is defining the JavaScript identifier of the template rendering fucntion generated by the conmpiler.
+ `export` - if used without a value then the template function will be **default exported**, otherwise the template fucntion will be exported using the name from the attribute value.
+ `import` - an optional comma separated list of JavaScript identifiers to import from the local JavaScript context. The imported JavaScript entities will be available in template expressions.

Either the `name` or the `export` attribute must be specified.

**Example:**

```jsq
const message = 'Hello World!';
<q:template export import='message'>
    <div>{{message}}</div>
</q:template>
```

For more information on `.jsq` files see the **[JSQ File Format](#/model/jsq)** section.
