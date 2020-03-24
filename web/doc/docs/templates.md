# Qute Templates

Qute Templates are written in a markup language derived from HTML and designed to render object models into **HTML views**. The markup language is named `JSQ`.

## JSQ Markup Language

`JSQ` supports any HTML construct. You can use empty HTML elements like `<br>` or `<hr>` without closing the tag. There are still some differences over HTML: elements that have content must always be closed. (like `<p>` or `<li>`).

Also, **custom elements** (i.e. component tags) **must always be closed** event if the element don't take any content.  \
**Example:** `<my-component title='My Component' />`


### Element Attributes

In HTML, attributes can take a string value or can take no value at all (like for example the `disabled` attribute). When specified, attribute values are surrounded by quotes or double quotes. `JSQ` supports any HTML like attribute.

#### Bounded Attributes

In `JSQ` you can also use **bounded attributes** which are attributes which values are assigned from a javascript expression. These attributes can change during the life on an element: any time the expression changes the attribute value will change too.

There are two ways to specify a **bounded attribute**:

1. Enclose the attribute value inside `{` `}` symbols instead of quotes or double quotes.  \
  **Example:** `<my-component title={theTitle} />`   \
  We will refer to this notation as the `jsx` like notation.
2. Either use `q:bind-attr-name` as the attribute name or use the short format `:attr-name` (i.e. prefix the attribute name with a `:` character). \
  **Example:** `<my-component :title='theTitle' />`  or `<my-component q:bind-title='theTitle' />` \

Both of these notations are equivalent.  \
You can use anyone you prefer or mix notations if you want.

**Examples:**

* `some-attr={{lastName: 'John', firstName: 'Doe'}}` vs. `:some-attr="{lastName: 'John', firstName: 'Doe'}"`
* `some-attr={"some string"}` vs. `:some-attr="'some string'"`
* `some-attr={"http://"+domain}` vs. `:some-attr="'http://'+domain"`

In the rest of the documentation we will use the `jsx` like notation.

#### Event Attributes

In HTML, you can declare listeners on elements using an on{event-name} attribute. In `JSQ` you should prefix the event name with a `@` character.

**Example:** `<button @click='handleClick'>Click me!</button>`

An event attribute can take as value a name which resolve to a function in the current context, or a simple javascript expression like a method call.

There is an alternative notation for an event attribute: `q:on{event-name}`

**Example:** `<button q:onclick='handleClick'>Click me!</button>`

See the **[Working with DOM Events](#/model/events)** section for more details.

#### Other Special attributes

Other special attribute notations are:
1. **`#newevent@srcevent`** - to define emit attributes. See **[q:emit](#/attributes/q-emit)** for more details.
2. **`?attrName`** - to toggle **flag** like attributes. See **[q:toggle](#/attributes/q-toggle)** for more details.

### Text Expressions (aka mustaches)

Any text node containing **mustache** expressions `{{ ... }}` will evaluate the javascript expression inside the  double braces and will render the output as text (escaping any special HMTL character)

If you want to insert unescaped HTML content then use the **[q:html](#/attributes/q-html)** attribute.

**Example:**

```jsq-norun
import Qute from '@qutejs/runtime';

<q:template name='root'>
<div>
  <div>Hello {{fullName}}!</div>
  <div>{{"Hello "+firstName}}!</div>
  <div>{{"Hello "+getFullName()}}!</div>
  <pre>{{JSON.stringify(this)}}</pre>
</div>
</q:template>

export default Qute('root', {
  init() {
    return {
      firstName: 'John',
      lastName: 'Doe'
    }
  },
  get fullName() {
    return this.firstName + ' ' + this.lastName;
  },
  getFullName() {
    return this.fullName;
  }
});
```

## Template Rendering

Templates by themselves are useless. Templates need to be processed in the context of a model to generate an HTML view for that model. The model properties are directly accessible in a template (either in bounded attribute values or in mustache expressions).

The model can be any javascript object, and is accessible as the `this` variable.

Here is the list of all the **built-in global variables** exposed in a template:

* `this` - the current component instance
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
<div :class="myClass">
	My Name is {{name}}.
</div>
```

or even

```xml
<div class={this.myClass}>
	My Name is {{this.name}}.
</div>
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

There are 2 methods to define a Qute template:

1. In a `.jsq` file. This is a `javascript` file that contains one or more `JSQ` templates. It should use a `.jsq` extension and the file mime-type is `text/jsq`.  \
The template definitions contained inside a `.jsq` file are compiled at build time into `javascript` functions and registered at runtime against the current `Qute` instance.   \
A Template is nested in a top-level `q:template` tag to isolate it from the surrounding javascript code.

2. Inlined in an HTML file. In that case the template is compiled at runtime and you must load the `qute-dev.js` library.  \
This method **should not be used in production environments**.  \
It is only provided to quickly design components without creating a **Qute project**.

### Declaring template style sheets

A `JSQ` file may declare style sheets that are used in templates by nesting the style sheet rules inside a top-level `q:style` tag.


See the **[JSQ File Format](#/advanced/jsq)** section for more information on `JSQ` files.
