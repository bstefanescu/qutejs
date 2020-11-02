# The `q:attrs` attribute

This attribute can be used to pass attributes specified on the parent component down to a nested element.
It is very usefull to implement components that acts more as wrappers over an HTML element.

Let's see an example of an input allows you to specify an additional label that will be rendered on the left of the input using [bootstrap](https://getbootstrap.com/) grid system.

```jsq
<q:template name='MyInput'>
<div class='row'>
	<div class='col-md-4'><label><slot/></label></div>
	<div class='col-md-8'><input q:attrs/></div>
</div>
</q:template>

<q:template export>
<my-input name='theName' type='text' class='form-control' placeholder='Type your name'>Your name:</my-input>
</q:template>
```

The root component will render as

```xml
<div class='row'>
	<div class='col-md-4'><label>Your name:</label></div>
	<div class='col-md-8'><input name='theName' type='text' class='form-control'/></div>
</div>
```

You can see how `q:attrs` was used to inject all the attributes passed to the components into the nested `input` element.

**Note** The event listeners passed to the component will not be injected by the `q:attrs` attribute. If you need to emit events from a component you should use the [q:emit](#/attributes/q-emit) attribute.

## Filtering attributes to inject

In some cases yopu may want to inject certain attributes to certain nested elements or just to avoid injecting some attributes. You can specify which attributes must be injected by using a space (or comma) separated list of attribute names as the value of the `q:attrs`. You can also exclude a list of attribute names by prefixing the list with a `!` character.

Example:

```jsq
<q:template name='MyInput'>
<div class='row' q:attrs='class'>
	<div class='col-md-4'><label><slot/></label></div>
	<div class='col-md-8'><input q:attrs='!class'/></div>
</div>
</q:template>

<q:template export>
<my-input name='theName' type='text' class='my-row'>Your name:</my-input>
</q:template>
```

This component is injecting parts of the `q:attrs` attributes in different places in the nesting content.

The `root` component will render as:

```xml
<div class='my-row'>
	<div class='col-md-4'><label>Your name:</label></div>
	<div class='col-md-8'><input name='theName' type='text'/></div>
</div>
```


## Using q:attrs on nested components

You can also use `q:attrs` on any nested component (on both VM or template components).

Example:

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='MyLinkTemplate'>
    <a href='#' q:class="{btn: $attrs.type === 'button'}" q:attrs>{{linkText}}</a>
</q:template>

<q:template name='MyButton'>
    <my-link type='button' q:attrs />
</q:template>

<q:template export>
    <my-button title='Click me' link-text='My Button' />
</q:template>

@Template(MyLinkTemplate)
class MyLink extends ViewModel {
    @Property linkText = "Placeholder"
}
```

The `root` component will render as:

```xml
<a class="btn" type="button" title="Click me">My Button</a>
```

You can see that `link-text` attribute is injected as the linkText property since it is defined as a reactive property
by the `my-link` component.

If you don't define a `linkText` property then the root component will render as:

```xml
<a class="btn" type="button" title="Click me" link-text="My Button">undefined</a>
```
