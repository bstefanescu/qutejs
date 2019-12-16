# The x-attrs attribute

This attribute can be used to pass attributes specified on the parent component down to a nested element.
It is very usefull to implement components that acts more as wrappers over an HTML element.

Let's see an example of an input allows you to specify an additional label that will be rendered on the left of the input using [bootstrap](https://getbootstrap.com/) grid system.

```jsq
<x-tag name='my-input'>
<div class='row'>
	<div class='col-md-4'><label><slot/></label></div>
	<div class='col-md-8'><input x-attrs/></div>
</div>
</x-tag>

<x-tag name='root'>
<my-input name='theName' type='text' class='form-control'>Your name:</my-input>
</x-tag>

export default Qute('root');
```

The root component will render as

```xml
<div class='row'>
	<div class='col-md-4'><label>Your name:</label></div>
	<div class='col-md-8'><input name='theName' type='text' class='form-control'/></div>
</div>
```

You can see how `x-attrs` was used to inject all the attributes passed to the components into the nested `input` element.

**Note** The event listeners passed to the component will not be injected by the `x-attrs` attribute. If you need this you must use the [x-listeners](#/attributes/x-listeners) attribute.

## Filtering attributes to inject

In some cases yopu may want to inject certain attributes to certain nested elements or just to avoid injecting some attributes. You can specify which attributes must be injected by using a space (or comma) separated list of attribute names as the value of the `x-attrs`. You can also exclude a list of attribute names by prefixing the list with a `!` character.

Example:

```jsq
<x-tag name='my-input'>
<div class='row' x-attrs='class'>
	<div class='col-md-4'><label><slot/></label></div>
	<div class='col-md-8'><input x-attrs='!class'/></div>
</div>
</x-tag>

<x-tag name='root'>
<my-input name='theName' type='text' class='my-row'>Your name:</my-input>
</x-tag>

export default Qute('root');
```

This component is injecting parts of the `x-attrs` attributes in different places in the nesting content.

The `root` component will render as:

```xml
<div class='my-row'>
	<div class='col-md-4'><label>Your name:</label></div>
	<div class='col-md-8'><input name='theName' type='text'/></div>
</div>
```


## Using x-attrs on nested components

You can also use `x-attrs` on any nested component (on both VM or functional components).

Example:

```jsq
<x-tag name='my-link'>
<a x-class="{btn: $attrs.type === 'button'}" x-attrs>{{linkText}}</a>
</x-tag>

<x-tag name='my-button'>
<my-link type='button' x-attrs />
</x-tag>

<x-tag name='root'>
<my-button title='Click me' link-text='My Button' />
</x-tag>

Qute('my-link', {
  init() {
    return {
      linkText: "Placeholder"
    }
  }
})
export default Qute('root');

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
