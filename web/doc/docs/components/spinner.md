# Spinner Component

The spinner component provides a customizable spinner component that can be repalced by specific  loaders or progress indicators. The default implementation provides a circualr progress indicator similar to the one defined by the [material design](https://material.io/components/progress-indicators/#circular-progress-indicators) design guidance. The spinner is implemented using pure CSS, so it is working on all browsers including IE10.

Usage: `<q:spinner [attributes] />`

Spinners can be redefined using spinner plugins. You can register any typer of spinner: gif, font icon, css or svg based spinners. Then use it by specifying the spinner type.

Example: `<q:spinner type='ellipsis'>`

Each type of spinner can provide its own attributes. There are the attributes shared by all spinner implementations:

1. `type` - the spinner type, Default to 'default' which is the bult-in spoinner implementation.
2. `style` - a `style` attribute to be injected into the spinner root element.
3. `class` - a `class` attribute to be appended to the  spinner classes if any.
4. `center` - spinners are inlined by default. Using `center` will force a `display: block` style
attribute and will center the spinner horizontally.
5. `q:show` or `show` - This is the only reactive attribute usable on all the spinner implementations. It is similar to the [q:show](#/attributes/q-show) directive.

The default spinner implementation is also accepting the following attributes:

1. `size` - the spinner rectangle size, specified as a css size (i.e '32px')
2. `width` - the circle border width, specified as a css size (i.e '4px')
3. `color` - a css color for the animated ring. If not specified a built-in color animation is used.


```jsq
import Qute from '@qutejs/runtime';
import qSpinner from '@qutejs/spinner';

<q:template name='RootTemplate'>
    <div style='margin-top: 20px'>
	    <q:spinner/> Loading ...
	</div>
</q:template>

export default Qute(RootTemplate);
```

**Using a custom color and size:**

```jsq
import Qute from '@qutejs/runtime';
import qSpinner from '@qutejs/spinner';

<q:template name='RootTemplate'>
    <div style='margin-top: 20px'>
	    <q:spinner color='green' size='32px' width='4pxp'/>
	</div>
</q:template>

export default Qute(RootTemplate);
```

## Ellipsis spinner

This spinner is provided by the [@qutejs/spinner-ellipsis](https://www.npmjs.com/package/@qutejs/spinner-ellipsis) package.

The ellipsis spinner is accepting the following attributes:

1. `size` - the dot size, specified as a css size (i.e '32px')
2. `color` - a css color for the animated dots. If not specified a built-in color animation is used.


```jsq
import Qute from '@qutejs/runtime';
import qSpinner from '@qutejs/spinner';

<q:template name='RootTemplate'>
    <div style='margin-top: 20px'>
	    <q:spinner type='ellipsis' size='32px' center/>
	</div>
</q:template>

export default Qute(RootTemplate);
```


## 2dots spinner

This spinner is provided by the [@qutejs/spinner-2dots](https://www.npmjs.com/package/@qutejs/spinner-2dots) package.

The 2dots spinner is accepting the following attributes:

1. `size` - the spinner rectangle size, specified as a css size (i.e '32px')
2. `color` - a css color for the animated dots. If not specified a built-in color animation is used.
3. `color1` - a css color for the first dot. If not specified the specified `color` or the default color animation is used.
4. `color2` - a css color for the second dot. If not specified the specified `color` or the default color animation is used.

```jsq
import Qute from '@qutejs/runtime';
import qSpinner from '@qutejs/spinner';

<q:template name='RootTemplate'>
    <div style='margin-top: 20px'>
	    <q:spinner type='2dots' size='32px' center/>
	</div>
</q:template>

export default Qute(RootTemplate);
```


## Spinner API


### Changing the default spinner


```javascript
import Spinner from '@qutejs/spinner-ellipsis';

Spinner.setDefault('ellipsis');

// now using <spinner /> without a type attribute will load the ellipsis spinner
```

### Registering a custom spinner element

You can register a custom element name to point to a spinner type with a predefined configuration.

```javascript
import Spinner from '@qutejs/spinner-ellipsis';

Spinner.register('loading-page', {
	type: 'ellipsis',
	size: '32px'
});

// now using <loading-page /> will display the pre-configured spinner.
```

## Implementing a custom spinner

See the [@qutejs/spinner-ellipsis](https://www.npmjs.com/package/@qutejs/spinner-ellipsis) as an example.

