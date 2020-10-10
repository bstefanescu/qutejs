# `JSQ` File Format


`JSQ` files are javascript files with some additional syntax to inline Qute template definitions in the global scope of the file. These files are usefull to define **single components** or to define **template libraries** containing one or more templates.

## Single Component Files

The structure of a single component file is:

```
[import statements]

[styles]

[templates]

[javascript]
```

### Import Section

In the import section you can import any dependency you want, including `.jsq` templates, `.css` files or javascript modules.

**Example:**

```javascript
import window from '@qutejs/window';
import MyComponent from './my-component.jsq';
import './my-styles.css';
```

### Style Sheets section

Here you can specify **style sheets** used by the component. Style sheets can be specified by enclosing the style sheet rules in a `q:style` tag. The `q:style` tag must be used only the in the root context of the file.

If you want more control over style sheets (like using postcss plugins) you should import the css file (e.g. `import './my.css'`) so you can setup a postcss pipeline in your build.

### Templates Section

This section contains the template definitions. Each template must be enclosed in a `q:template` element.
A `q:template` element is only valid if used in the top level context of the file (it should not be nested in javascript blocks)

Template **must define a single root element**. This means, inside a `q:template` declaration you can have only one direct child element.

The `q:template` element accept the following attributes:

+ **name** - optional - the JavaScript identifier to use for the template function in the global scope of the JavaScript module.
+ **export** - optional - If no value is specified then a `default export` is done on the template function, otherwise the value will be used as the **name** argument and the template function will be exported.
+ **import** - optional - a comma or space separated list of names to import from the file context in the template context. This can be usefull when using `template components`. You can see an example in the **Template Library Files** section below.

### JavaScript Section

In this section you usually define a `ViewModel` component using the templates defined above.

#### Example

```jsq-norun
<q:style>
	.my-menu {
		list-style-type: none;
		margin: 0;
		padding: 0;
	}
</q:style>

<q:template name='MyMenuItem'>
	<li>
		<a q:attrs><slot/></a>
	</li>
</q:template>
<q:template name='MyMenu'>
	<ul class='my-menu'>
		<for value='item in $attrs.items'>
			<my-menu-item href={item.href}>{{item.text}}</my-menu-item>
		</for>
	</ul>
</q:template>

export default Qute(MyMenu);
```

The `ViewModel` compomnent is exported to be used by other components.

Single Component Files are great to quickly design components, but for better readability it is recommended to use different files for style sheets, templates and JavaScript code: You should put style sheets in a `.css` file, templates in a `.jsq` file and the `ViewModel` component in a JavaScript file which imports the other files.


## Template Library Files

Another usage for `.jsq` files is to only store templates.

You can store many independent templates in a common `.jsq` file and export the public templates using named exports (i.e. using `export='TemplateName'` attribute) or you can store related templates and only export a single template using a default export (i.e. using the `export` attribute without a value).

You can still use a JavaScript section if your templates needs to import some functions or variables from the JavaScript context.

### Example using named exports:

```jsq-norun
<q:template export='MyLink'>
	<a class='my-link' q:attrs><slot/></a>
</q:template>

<q:template export='MyButton'>
	<a class='my-button' q:attrs><slot/></a>
</q:template>
```

### Example using a default export:

```jsq-norun
<q:template name='MyMenuItem'>
	<li>
		<a q:attrs><slot/></a>
	</li>
</q:template>

<q:template export>
	<ul class='my-menu'>
		<for value='item in $attrs.items'>
			<my-menu-item href={item.href}>{{item.text}}</my-menu-item>
		</for>
	</ul>
</q:template>
```

### Importing external variables in a template

In the following example we define a onclick handler in the `JSQ` file context and we import it in the template so we can use it in the template context.

```jsq
<q:template name='MyButton' import='onButtonClick'>
	<a class='my-button' q:attrs @click='onButtonClick(this, $1)'><slot/></a>
</q:template>

// use the template above in a root VM
<q:template export>
    <my-button href='#'>Click me!</my-button>
</q:template>

function onButtonClick(context, event) {
	console.log('On Click!', context, event);
    alert('Hello!');
}
```

## Transpiling

There are two special constructs in a `JSQ` file that are transpiled to javascript:

const __QUTE_DEFAULT_EXPORT__ = function($){return $.c(MyButton,{"href":"#"},[$.t("Click me!")],0);};

1. `q:template` - this construct will be tranbspiled into something like `const TemplateName = function($){return  ... }, true);`
2. `q:style` - this construct will be transpiled to a javascript code that will inject the style rules into a `<style>` tag inside the page `<head>`.

You can see the transpilation output for any playable example in the Qute documentation by clicking the `Javascript` tab in the **[Qute Playground](/playground/index.html)**.



