# View Directive

The view directive is a dynamic component. The component tag is specified as the **is** attribute. The **is** attribute expects javascript expressions and not literals. This directive is usefull to implement dynamic content components like tabs etc.

The **view** directive is similar to the **tag** directive but has some important differences:

1. The **view** directive only works with Qute components (it doesn't works with HTML tags).
2. The **view** directive is reactive. If the **is** expression changes then the view is refreshed to display the new component.

The view component supports the following attributes:

1. **is** - *required*. A javascript expression (evaluated in the current context) which resolves to a component tag name.
2. **x-change** - *optional*. As for the **if** directive the `x-change` attribute may be used to install a listener which 	will be notified when the view component changes.
	The listener will be called in the context of the ViewModel containing the **view** directive (the `this` variable will point to the container component instance) and the current rendering component instance will be passed as the first argument.

   The first time the **view** directive is rendered the listener will not be notified.

3. **x-nocache** - *optional*. Turn the cache off.
	By default the view directive is caching the rendered components. If you are switching a component off and  back on again, then the second time the component is displayed it will not be rendered again (it will only be updated so that model modifications are reflected on the component DOM tree).

All the other attributes or nested content will be passed down to the actual rendering component - as if you were directly invoking the component.

If the **is** attribute is evaluated to a **falsy** value then no component will be rendered. If another component was rendered before it will be removed.


## Example

Here is a simple tabs panel implementation:

```jsq
<x-tag name='tab1'>
  <div>
  	<p>Hello {{$attrs.user}}!</p>
  	<p>This is tab 1.</p>
  	<div><slot/></div>
  </div>
</x-tag>

<x-tag name='tab2'>
  <div>
  	<p>Hello {{$attrs.user}}!</p>
  	<p>This is tab 2.</p>
  	<div><slot/></div>
  </div>
</x-tag>

<x-tag name='my-tabs'>
  <div>
	<ul class='tabs'>
	  <li><a href='#tab1' @click='activeTab="tab1"'>Tab 1</a></li>
	  <li><a href='#tab2' @click='activeTab="tab2"'>Tab 2</a></li>
	</ul>

	<view is='activeTab' user={user}>Some common content</view>
  </div>
</x-tag>

export default Qute('my-tabs', {
	init: function() {
		return {
			user: 'Foo',
			activeTab: null // no tab selected by default
		}
	}
});
```


