# Getting Started: Hello World!

Here is a simple example which illustrate the main features of the Qute component model:

```jsq
import Qute from '@qutejs/runtime';
import window from '@qutejs/window';

const { ViewModel, Template, Property } = Qute;

<q:style>
  .username { color: green; }
</q:style>

// the component template
<q:template name='MyComponentTemplate'>
  <div q:class='{authenticated:user}'>
    <if value={!user}>
        <p>Enter a username and click on the login button:</p>
        <div><input type='text' q:ref='input'>
        <button @click='handleLogin'>Login</button>
        </div>
    <else />
      Hello <span class='username'>{{user}}</span>.
      <button @click='handleLogout'>Logout</button>
    </if>
  </div>
</q:template>

// define a ViewModel component
@Template(MyComponentTemplate)
class MyComponent extends ViewModel {

    @Property user = null;

    input = null;

    handleLogin() {
        const value = this.input.value.trim();
        if (value) {
            this.user = value;
        } else {
            window.alert('Enter a user name!');
        }
    }

    handleLogout() {
        this.user = null;
    }
}

new MyComponent().mount('app');
```

Let's examine the example above.

## JSQ Files

The above file contains both javascript code and two Qute directives (i.e. `<q:style>` and `<q:template>`) to define style rules and templates. This is not a regular JavaScript file but a '.jsq' file, which enables you to write component code, styles and templates in the same file. The file should be compiled with the Qute compiler to transpile it to JavaScript code.

This is very usefull to quickly design components or to write components using the **[Qute Playground](/playground/index.html)**.

When writing production code we recommend to use separate files for styles, templates and javascript code. In that case you shpuld use `import` statements to include styles and templates. The above example can be re-written as follows:

### `my-component.css`

The file containing the component styles is a regular css file (or postcss if using postcss plugins at build time)

```css
.username { color: green; }
```

### `my-component.jsq` (or `my-component.qute`)

The file containing the template is a `.jsq` but without any additional JavaScript code. To `default export` the template function use the **export** attribute instead of the name attribute (which defines a local variable pointing to the template function):

```jsq-norun
<q:template export>
  <div q:class='{authenticated:user}'>
    <if value={!user}>
        <p>Enter a username and click on the login button:</p>
        <div><input type='text' q:ref='input'>
        <button @click='handleLogin'>Login</button>
        </div>
    <else />
      Hello <span class='username'>{{user}}</span>.
      <button @click='handleLogout'>Logout</button>
    </if>
  </div>
</q:template>
```

### `my-component.js`

The component JavaScript code will be placed in a regular JavaScript file which will i,port the other 2 files:

```javascript
import Qute from '@qutejs/runtime';
import MyComponentTemplate from './my-component.jsq';
import './my-component.css';

const { ViewModel, Template, Property } = Qute;

@Template(MyComponentTemplate)
class MyComponent extends ViewModel {

    input = null;
    @Property(String) user = null;

    handleLogin() {
        const value = this.input.value.trim();
        if (value) {
            this.user = value;
        } else {
            alert('Enter a user name!');
        }
    }

    handleLogout() {
        this.user = null;
    }
}

export default MyComponent;
```

### `index.js`

This is the main entry for our application, where we will instantiate the component and mount it in the current web page:

```javascript
import MyComponent from './my-component.js';

new MyComponent().mount('app'); // mount it in an element having the ID 'app'
```

## Qute Directives

The template above contains some tags that are not part of HTML: `<if> ... <else/> ... </if>`. These are **Qute directives** which you can use to control the template behavior at runtime. Qute provides directives that covers the most usual needs when creating templates like:

+ conditional blocks: **[if / else if / else](#/directives/if)**
+ for each loops: **[for](#/directives/for)**, **[q:for](#/attributes/q-for)**
+ nested content: **[slot](#/directives/slot)**, **[nested](#/directives/nested)**
+ dynamic reference to other components or tags: **[tag](#/directives/tag)**, **[view](#/directives/view)**
+ styles, class and attributes manipulation and other usefull directives.

These directives are either tag like directioves either attribute like attribute like directives (as for example the above **q:ref** attribute).

In our example we used the `if` tag directive and the **[q:ref](#/attributes/q-ref)** attribute directive.

The **q:ref** directive is initializing the specified component property to the DOm element of the tag contining the `q:ref` attribute.

## Content and Attribute Expressions

You notice the usage of `{!user}` and `{{user}}` to evaluate JavaScript expressions.

+ **double curly braces (aka mustaches)** can be used to surround JavaScript expressions which output will be appended as text inside the HTML.
+ **simple curly braces** can be used to surround JavaScript expressions which output will be assigned to an element attribute.

## Component Properties

A component can define two type of properties: **reactive** and **regular** properties.
In our example we defined a reactive property: `user` and a regular property: `input`.

### Regular Properties

These are regular properties defined on the component object.
You can use **[public class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields)** to define regular properties, or you can simply define them in the `constructor` using `this.myField = 'some value';` statements.

### Reactive Properties

These are special properties managed by the component. The property values are stored inside a regular property named `$data`.

Each time a reactive property value changes, the component DOM is updated to reflect the changes.

These properties can be initialized using attributes on the component element in templates. The attribute names will be converted from kebab case to camel case to check if any reactive property matches. If a corresponding reactive property is found then it will be intiialized using the attribute value.

You can define reactive properties through **[public class fields](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes/Public_class_fields)** decorated with the `@Property` decorator, or directly in the `constructor` using statements like `this.defineProp(String, 'myStringProp', 'default value')`:

```javascript
@Template(MyComponentTemplate)
class MyComponent extends ViewModel{
    @Property(String) myStringProp = 'default value';
}
```

You can find more informations on properties in the **[Component Properties](#/model/properties)** section.

## Component Lifecycle Handlers

Qute provides several life cycle handlers like `created`, `ready`, `connected`, `disconnected`.

You can find more information on this in **[Component Life Cycle ](#/model/lifecycle)** section.

## DOM Event Handling

In the above example we registerd two click event handlers: `handleLogin` and `handleLogout` using the `@click` directive.

For more about DOM events and DOM event handlers go to the **[Working with DOM Events](#/model/events)** section.

## The Component Instance

`ViewModel` component instances can be used as an element in templates - using the case sentsitive JavaScript identifier name or the kebab case component name as discussed in the **[Overview](#/overview)** section.

You only need to instantiate **root components**. Any other components will be automatically instantiated by other components when rendered if they are referenced from the template.

Usually in an application the root component is instantiated in the application main entry file an then the component instance is mounted into the current page in some DOM element.

To mount the component you just call the `mount(targetElement[, insertBefore])` method. If no target element is specified the component element will be appended to the `document.body` element, otherwise it will be either appended as a child of the targetb element if insertBefore is false, either before that element if insertBefore is true.

The targetElement can be passed either as a DOM element, either as an ID of a DOM element.

## Using Browser Globals: The `@qutejs/window` dependency

In the example above we used `window.alert()` and we imported the `window` object from the `@qutejs/window` package.
Although you can directly use `window` in your code without any import, the recommended way is to get the `window` instance from the `@qutejs/window` package.

When building your application, the window import will be treated as a browser global (an external dependency) - so nothing will be imported and the generated bundle will use the browser `window` object.  \
But when running tests the `@qutejs/window` will resolve to the **[jsdom](https://www.npmjs.com/package/jsdom)** `window` object.

**Example** importing the window instance: `import window from '@qutejs/window'`
