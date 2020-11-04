# Actions Group

The actions group plugin is providing custom attribute directives to easily transform `UL` items into a group of actions. A single item can be selected at one time.

The directives can be used to implement button groups in a toolbar or a tabs bar.

These directives are not part of the default qute runtime package. The group directives are provided by the `@qutejs/group` plugin.

Before using the group directives you need to install the plugin using the `install()` method. Example:

```javascript
import Qute from '@qutejs/runtime';
import groupPlugin from '@qutejs/group';

groupPlugin.install();
```

## The `model` attribute

The `model` attribute is implemented in a similar way with the **[form input model attribute](#/plugins/form)**.

The model attribute is restricted to `UL` and `OL` elements, and provide a way to bind a reactive value as the **value of the group**. Any children `LI` elements defining a `data-value` attribute will take part to the grouping. The `LI` element which `data-value` is matching the group value will be selected (i.e. the `active` class is added ti the `LI` element). Each time the gropup value changes the corresponding `LI` element is selected.

You can specify two types of `model` values:

1. **Expression Value:** - set using the `{ ... }` attribute value notation: `q:model={expr}`
2. **A Reactive Property Name** - set using a quoted string literal (the property name): `q:model="propName"`

When using **expression values**, the group value will be updated when the current component is updated and the expression changed. In that case, the relation between the expression and the group value is **unidirectional**: the group value changes when the expression changes but the current component will not be aware if the group value was changed by an user action.
In order to notify the component about group value changes you need to register a `change` event listener on the `ul` element.

When using **reactive property names**, the relation is **bidirectional**: the group value is updated when the component property changes and the component is updated when the group value changes because of an user action.

## Selecting a `LI` element.

When a `LI` element is selected it will get the `active` class and the group will trigger a custom `change` event having the selected value stored in the event `detail` property.

## The item `value` attribute

The value attribute can be used on `LI` elements, and it will simply store the given value on the `LI` element instance.

## Example: Using a reactive property name as value

Let's implement a tabs bar using the **actions group** custom attributes.

```jsq
import Qute from '@qutejs/runtime';
import groupPlugin from '@qutejs/group';

const { ViewModel, Template, Property} = Qute;

<q:style>
ul.group {
    margin: 0 0 10px -4px; padding: 0; list-style-type: none;
}
ul.group > li {
    display: inline-block;
    padding: 4px;
    margin-right: 4px;
    border-bottom: 1px solid transparent;
}
ul.group > li.active {
    border-bottom: 1px solid green;
}
ul.group a, ul.group a:hover, ul.group a:active {
    text-decoration: none;
}
</q:style>

<q:template name='ViewPlaceholder'>
    <div>Click on a link</div>
</q:template>
<q:template name='ViewOne'>
    <div>View 1 content</div>
</q:template>
<q:template name='ViewTwo'>
    <div>View 2 content</div>
</q:template>
<q:template name='ViewThree'>
    <div>View 3 content</div>
</q:template>
<q:template name='RootTemplate'>
	<div>
		<ul class='group' q:model='currentViewName'>
			<li q:value='view1'><a href='#'>View 1</a></li>
			<li q:value='view2'><a href='#'>View 2</a></li>
			<li q:value='view3'><a href='#'>View 3</a></li>
		</ul>
		<view is={currentView}></view>
		<hr>
		<button @click="removeCurrentView">Reset</button>
	</div>
</q:template>

// register the group directive
groupPlugin.install();

@Template(RootTemplate)
class Root extends ViewModel {
    views = {
        placeholder: ViewPlaceholder,
        view1: ViewOne,
        view2: ViewTwo,
        view3: ViewThree
    };

	@Property currentViewName = 'placeholder';

    removeCurrentView() {
        this.currentViewName = 'placeholder';
    }

    get currentView() {
        return this.views[this.currentViewName];
    }
}
export default Root;
```

**Note** that we installed the group directive using `groupPlugin.install()`

## Example: Using an expression as value

We will rewrite the previous example by using an expression binding and an explicit change listener to update back the component.

```jsq
import Qute from '@qutejs/runtime';
import groupPlugin from '@qutejs/group';

const { ViewModel, Template, Property} = Qute;

<q:style>
ul.group {
    margin: 0 0 10px -4px; padding: 0; list-style-type: none;
}
ul.group > li {
    display: inline-block;
    padding: 4px;
    margin-right: 4px;
    border-bottom: 1px solid transparent;
}
ul.group > li.active {
    border-bottom: 1px solid green;
}
ul.group a, ul.group a:hover, ul.group a:active {
    text-decoration: none;
}
</q:style>

<q:template name='ViewPlaceholder'>
    <div>Click on a link</div>
</q:template>
<q:template name='ViewOne'>
    <div>View 1 content</div>
</q:template>
<q:template name='ViewTwo'>
    <div>View 2 content</div>
</q:template>
<q:template name='ViewThree'>
    <div>View 3 content</div>
</q:template>
<q:template name='RootTemplate'>
	<div>
		<ul class='group' q:model={currentViewName} @change='e => currentViewName = e.detail'>
			<li q:value='view1'><a href='#'>View 1</a></li>
			<li q:value='view2'><a href='#'>View 2</a></li>
			<li q:value='view3'><a href='#'>View 3</a></li>
		</ul>
		<view is='currentView'></view>
		<hr>
		<button @click="removeCurrentView">Reset</button>
	</div>
</q:template>

// register the group directive
groupPlugin.install();


@Template(RootTemplate)
class Root extends ViewModel {
    views = {
        placeholder: ViewPlaceholder,
        view1: ViewOne,
        view2: ViewTwo,
        view3: ViewThree
    }

    @Property currentViewName = 'placeholder';

    removeCurrentView() {
        this.currentViewName = 'placeholder';
    }

    get currentView() {
        return this.views[this.currentViewName];
    }

}
export default Root;
```

**Note:** Only one line was changed to achieve the same thing using an expression binding and an explicit change listener:

```xml
<ul class='group' q:model={currentViewName} @change='e => currentViewName = e.detail'>
```
