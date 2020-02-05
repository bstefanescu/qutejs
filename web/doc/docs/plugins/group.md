# Actions Group

The actions group plugin is providing a custom attribute directive to easily transform `UL` items into a group of actions. A single item can be selected at one time.

The directives can be used to implement button groups in a toolbar or a tabs bar.

These directive are not part of the qute runtime package. The directives are provided by the `@qutejs/group` plugin.


## The `model` attribute

The `model` attribute is implemented in a similar way with the **[form input model attribute](#/plugins/form)**.

The model attribute is restricted to `UL` and `OL` elements, and provide a way to bind a reactive value as the **value of the group**. Any children `LI` elements defining a `data-value` attribute will take part to the grouping. The `LI` element which `data-value` is matching the group value will be selected (i.e. active). Each time the gropup value changes the corresponding `LI` element is selected.

You can specify two types of `model` values:

1. **Expression Value:** - set using the `{ ... }` attribute value notation: `q:model={expr}`
2. **A Reactive Property Name** - set using a quoted string literal (the property name): `q:model="propName"`

When using **expression values**, the group value will be updated when the current component is updated and the expression changed. In that case, the relation between the expression and the group value is **unidirectional**: the group value changes when the expression changes but the current component will not be aware if the group value was changed by an user action.
In order to notify the component about group value changes you need to register a `change` event listener on the `ul` element.

When using **reactive property names**, the relation is **bidirectional**: the group value is updated when the component property changes and the component is updated when the group value changes because of an user action.

## Selecting a `LI` element.
When clicking on a `LI` (or on a child button or link) which is not the currentl;y selected item (or a child button or link) is clicked it will
When a `LI` element is selected it will get the `active` class and the group will trigger a custom `change` event having the selected value stored in the event `detail` property.

## The item `value` attribute

The value attribute can be used on `LI` elements, and it will simply store the given value on the `LI` element instance.

## Example: Using a reactive property name as value

Let's implement a tabs bar using the **actions group** custom attributes.

```jsq
<x-style>
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
</x-style>

<x-tag name='placeholder'><div>Click on a link</div></x-tag>
<x-tag name='view1'><div>View 1 content</div></x-tag>
<x-tag name='view2'><div>View 2 content</div></x-tag>
<x-tag name='view3'><div>View 3 content</div></x-tag>
<x-tag name='root'>
	<div>
		<ul class='group' q:model='currentView'>
			<li q:value='view1'><a href='#'>View 1</a></li>
			<li q:value='view2'><a href='#'>View 2</a></li>
			<li q:value='view3'><a href='#'>View 3</a></li>
		</ul>
		<view is='currentView'></view>
		<hr>
		<button @click="e => currentView = 'placeholder'">Reset</button>
	</div>
</x-tag>

export default Qute('root', {
	init() {
		return {
			currentView: 'placeholder'
		}
	}
});
```

## Example: Using an expression as value

We will rewrite the previous example by using an expression binding and an explicit change listener to update back the component.

```jsq
<x-style>
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
</x-style>

<x-tag name='placeholder'><div>Click on a link</div></x-tag>
<x-tag name='view1'><div>View 1 content</div></x-tag>
<x-tag name='view2'><div>View 2 content</div></x-tag>
<x-tag name='view3'><div>View 3 content</div></x-tag>
<x-tag name='root'>
	<div>
		<ul class='group' q:model={currentView} @change='e => currentView = e.detail'>
			<li q:value='view1'><a href='#'>View 1</a></li>
			<li q:value='view2'><a href='#'>View 2</a></li>
			<li q:value='view3'><a href='#'>View 3</a></li>
		</ul>
		<view is='currentView'></view>
		<hr>
		<button @click="e => currentView = 'placeholder'">Reset</button>
	</div>
</x-tag>

export default Qute('root', {
	init() {
		return {
			currentView: 'placeholder'
		}
	}
});
```

**Note:** Only one line was changed to achieve the same thing using an expression binding and an explicit change listener:

```xml
<ul class='group' q:model={currentView} @change='e => currentView = e.detail'>
```
