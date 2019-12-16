# `JSQ` File Format


`JSQ` files are javascript files with some extra syntax to inline template definitions in the global scope of the file. These files are usefull to define **single components** or to define **template libraries** - a set of templates (i.e. functional components).

## Single Component Files

The structure of a single component file is:

```
[import statements]

[templates]

[components]

[export root-component]
```

### Import Section

In the import section you **must** import the **Qute instance**, otherwise the `JSQ` transpilation will generate invalid javascript code.

Apart the Qute instance you can import other components, template libraries, CSS code, or any other javascript dependency you need.

**Example:**

```javascript
import Qute from '@qutejs/runtime';
import MyComponent from './my-component.jsq';
import './another-component.jsq';
import './component-library.jsq';
```

### Templates Section

This section of the file contains the template definitions. Each template must be enclosed in a `x-tag` element.
An `x-tag` element is only valid if used in the top level context of the file (it should not be nested in javascript blocks)

Template **must define a single root element**. This means, inside a `x-tag` declaration you can have only one  direct child element.

The `x-tag` element accept the following attributes:

1. **name** - required - the template name. Must be specified in the kebab notation. Example: `my-component`.
You must not use existing html element names as template names. To avoid conflicts, it is **recommended** to use component names containing a hyphen.
2. **import** - optional - a comma or space separated list of names to import from the file context in the template context. This can be usefull when using `functional components`. You can see an example in the **Template Library Files** section below.

Also in a `templates section` you can specify **style sheets** to be injected in the HTML page where the component will be used. Style sheets can be specified by enclosing the style sheet rules in a `x-style` tag. The `x-style` tag must be used only the in the root context of the file.

#### Example

```xml

<x-tag name='my-menu-item'>
	<li>
		<a x-attrs><slot/></a>
	</li>
</x-tag>
<x-tag name='my-menu'>
	<ul class='my-menu'>
		<for value='item in $attrs.items'>
			<my-menu-item href={item.href}>{{item.text}}</my-menu-item>
		</for>
	</ul>
</x-tag>

<x-style>
	.my-menu {
		list-style-type: none;
		margin: 0;
		padding: 0;
	}
</x-style>
```

In our example we defined two templates: `my-menu` and `my-menu-item`. But only `my-menu` is intended to be exported to the outside world. The `my-menu-item` template is private to that component.
Anyway, Qute does not offer (yet) the possibility to declare **private** templates.

It means, that both of these templates will be regsitered as global templates, ands will be visible from other components. This is why you should use hyphen separated names for your templates - to better describe a template and avoid name clash with other templates defined by external components.


#### Style Sheets

In the previous example, style sheets are injected as is. If you want more control over style sheets you should use a `CSS` plugin for your build tool (e.g. `rollup`) to import `CSS` content from an external file and register it using `Qute.css(cssContent)` call.

**Example**

```javascript
import Qute from '@qutejs/runtime';
import myCss from './stylesheet.css';

Qute.css(myCss); // this will inject the css into the HTML page using the component
```

### Components Section

In the components section you define Qute components - using standard javascript syntax (or using classes if you prefer as explained in **[Class Syntax](#/model/class)** section)

A component will usually use a template as its rendering function. To link a component with a template you just have to use the same name for the component. (as the name you used for the template).  \
The template linking acts as an **enhancement** of the template (i.e. the functional component) to a `ViewModel` component.

Check the **[Components Section](#/components)** for more details on defining components.

Here is an example of defining a component for the `my-menu` template above.

```javascript
var MyMenu = Qute('my-menu');
```

This will create a component (with no properties) linked to the `my-menu` template. The `Qute()` function returns a component constructor (and not a component instance!). If needed you can instantiate it by hand - e.g. `new MyMenu()` - but, apart fot the **root component**, this is rarely needed since a component is autoamtically insantiated when a template refering to the component is rendered.

### Export Section

Usually a single component file will export the component constructor so that it can be used as a root component if needed:

```javascript
export default MyMenu;
```

For the sake of brevity we will contract the component definition and the export:

```javascript
export default Qute('my-menu');
```

## Template Library Files

The other usage of a `JSQ` file is to define one or more related `functional components`.
In that case we don't need any component definition nor export statement.

### Example

```xml
import Qute from '@qutejs/runtime';

<x-tag name='my-link'>
	<a class='my-link' x-attrs><slot/></a>
</x-tag>

<x-tag name='my-button'>
	<a class='my-button' x-attrs><slot/></a>
</x-tag>
```

When creating functional components it may be usefull to be able to use external javascript functions inside the template. This can be done using the `x-tag` `import` attribute.

### Importing external variables in a template

In the following example we define a onclick handler in the `JSQ` file context and we import it in the template so we can use it in the template context.

```xml
import Qute from '@qutejs/runtime';

<x-tag name='my-link'>
	<a class='my-link' x-attrs><slot/></a>
</x-tag>

<x-tag name='my-button' import='onButtonClick'>
	<a class='my-button' x-attrs @click='onButtonClick(this, $1)'><slot/></a>
</x-tag>

function onButtonClick(context, event) {
	console.log('On Click!', context, event);
}
```

## Transpiling

As we saw, there are two special constructs in a `JSQ` file that are transpiled to javascript:

1. `x-tag` - this construct will be tranbspiled into something like `Qute.register("x-tag-name", function($){return  ... }, true);`
2. `x-style` - this construct will be transpiled into something like `Qute.css("x-style-content");`

This is why you mmust always **import Qute** at the top of the `JSQ` file.

The `Qute.register` is registering the template in a global template registry.

The `Qute.css` is registering the style rules so that it will be inserted in the head of the HTML page using the component.

You can see the transpilation output for any playable example in the Qute documentation by clicking the `Javascript` tab in the **[Qute Playground](playground/index.html)**.



