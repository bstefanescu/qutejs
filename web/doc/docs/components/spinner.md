# Qute Spinners

Currently, Qute provides 3 spinner implemetations: ring, ellipsis and 2 bouncing dots.
All the spinner implementations are accepting the following attributes:

+ `q:show` - to show / hide the spinner. This is the only reactive attribute usable on all the spinner implementations. It is similar to the [q:show](#/attributes/q-show) directive.
+ `center` - to center the spinner (the attribute is noit reactive).
+ `class` - to add custom classes (the attribute is not reactive).

```jsq
import Qute from '@qutejs/runtime';
import SpinnerRing from '@qutejs/spinner';
import SpinnerEllipsis from '@qutejs/spinner-ellipsis';
import Spinner2dots from '@qutejs/spinner-2dots';

<q:template export>
    <div style='margin-top: 20px'>
	    <SpinnerRing />
        <hr>
        <SpinnerEllipsis />
        <hr>
        <Spinner2dots />
	</div>
</q:template>
```

**Using a custom color and size:**

```jsq
import Qute from '@qutejs/runtime';
import SpinnerRing from '@qutejs/spinner';
import SpinnerEllipsis from '@qutejs/spinner-ellipsis';
import Spinner2dots from '@qutejs/spinner-2dots';

<q:template export>
    <div style='margin-top: 20px'>
	    <SpinnerRing color='green' size='32px' width='4pxp'/>
        <hr>
        <SpinnerEllipsis color='green' size='32px' width='4pxp'/>
        <hr>
        <Spinner2dots color='green' size='32px' width='4pxp'/>
	</div>
</q:template>
```
## Ring Spinner

This spinner is provided by the [@qutejs/spinner](https://www.npmjs.com/package/@qutejs/spinner) package.

The spinner is accepting the following additional attributes:

1. `size` - the spinner rectangle size, specified as a css size (i.e '32px')
2. `width` - the circle border width, specified as a css size (i.e '4px')
3. `color` - a css color for the animated ring. If not specified a built-in color animation is used.

## Ellipsis spinner

This spinner is provided by the [@qutejs/spinner-ellipsis](https://www.npmjs.com/package/@qutejs/spinner-ellipsis) package.

The ellipsis spinner is accepting the following additional attributes:

1. `size` - the dot size, specified as a css size (i.e '32px')
2. `color` - a css color for the animated dots. If not specified a built-in color animation is used.


## 2dots spinner

This spinner is provided by the [@qutejs/spinner-2dots](https://www.npmjs.com/package/@qutejs/spinner-2dots) package.

The 2dots spinner is accepting the following attributes:

1. `size` - the spinner rectangle size, specified as a css size (i.e '32px')
2. `color` - a css color for the animated dots. If not specified a built-in color animation is used.
3. `color1` - a css color for the first dot. If not specified the specified `color` or the default color animation is used.
4. `color2` - a css color for the second dot. If not specified the specified `color` or the default color animation is used.

```jsq
import Qute from '@qutejs/runtime';
import Spinner2dots from '@qutejs/spinner-2dots';

<q:template export>
    <div style='margin-top: 20px'>
	    <Spinner2dots type='2dots' size='32px' center/>
	</div>
</q:template>
```

## Implementing a custom spinner

See the [@qutejs/spinner-ellipsis](https://github.com/bstefanescu/qutejs/blob/master/components/spinner-ellipsis/src/index.js) as an example.

