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

This section of the file contains the template definitions. Each template must be enclosed in a `q:template` element.
An `q:template` element is only valid if used in the top level context of the file (it should not be nested in javascript blocks)

Template **must define a single root element**. This means, inside a `q:template` declaration you can have only one  direct child element.

The `q:template` element accept the following attributes:

1. **name** - required - the template name. Must be specified in the kebab notation. Example: `my-component`.
You must not use existing html element names as template names. To avoid conflicts, it is **recommended** to use component names containing a hyphen.
2. **import** - optional - a comma or space separated list of names to import from the file context in the template context. This can be usefull when using `functional components`. You can see an example in the **Template Library Files** section below.

Also in a `templates section` you can specify **style sheets** to be injected in the HTML page where the component will be used. Style sheets can be specified by enclosing the style sheet rules in a `q:style` tag. The `q:style` tag must be used only the in the root context of the file.

#### Example

```xml

<q:template name='my-menu-item'>
	<li>
		<a q:attrs><slot/></a>
	</li>
</q:template>
<q:template name='my-menu'>
	<ul class='my-menu'>
		<for value='item in $attrs.items'>
			<my-menu-item href={item.href}>{{item.text}}</my-menu-item>
		</for>
	</ul>
</q:template>

<q:style>
	.my-menu {
		list-style-type: none;
		margin: 0;
		padding: 0;
	}
</q:style>
```

In our example we defined two templates: `my-menu` and `my-menu-item`. But only `my-menu` is intended to be exported to the outside world. The `my-menu-item` template is private to that component.
Anyway, Qute does not offer (yet) the possibility to declare **private** templates.

It means, that both of these templates will be regsitered as global templates, ands will be visible from other components. This is why you should use hyphen separated names for your templates - to better describe a template and avoid name clash with other templates defined by external components.


#### Style Sheets

In the previous example, styles are inlined in the file using a `<q:style>...</q:style>` element. If you want more control over style sheets (like using postcss plugins) you should import the css file (e.g. `import my.css`) so you can setup a postcss pipeline in your build.

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

```jsq-norun
import Qute from '@qutejs/runtime';

<q:template name='my-link'>
	<a class='my-link' q:attrs><slot/></a>
</q:template>

<q:template name='my-button'>
	<a class='my-button' q:attrs><slot/></a>
</q:template>
```

When creating functional components it may be usefull to be able to use external javascript functions inside the template. This can be done using the `q:template` `import` attribute.

### Importing external variables in a template

In the following example we define a onclick handler in the `JSQ` file context and we import it in the template so we can use it in the template context.

```jsq-norun
import Qute from '@qutejs/runtime';

<q:template name='my-link'>
	<a class='my-link' q:attrs><slot/></a>
</q:template>

<q:template name='my-button' import='onButtonClick'>
	<a class='my-button' q:attrs @click='onButtonClick(this, $1)'><slot/></a>
</q:template>

function onButtonClick(context, event) {
	console.log('On Click!', context, event);
}
```

## Transpiling

As we saw, there are two special constructs in a `JSQ` file that are transpiled to javascript:

1. `q:template` - this construct will be tranbspiled into something like `Qute.registerTemplate("template-name", function($){return  ... }, true);`
2. `q:style` - this construct will be transpiled to a javascript code that will inject the style rules into a `<style>` tag inside the page `<head>`.

Because `q:template` is generating code depending on `Qute` you must always **`import Qute from "@qutejs/runtime"`** at the top of the `JSQ` file.

The `Qute.registerTemplate` function is registering the template in a global template registry.

You can see the transpilation output for any playable example in the Qute documentation by clicking the `Javascript` tab in the **[Qute Playground](/playground/index.html)**.



