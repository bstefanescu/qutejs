# Spinner Component

This is a simple functional component that display a spinner.

The spinner component supports only one reactive attrinbute: the `q:show` attribute.

## Attributes

The component attributes **are not reactive**. The only attribute directive supported by this component is the [q:show](#/attributes/q-show) directive

### color

The spinner color. Defaults to #333.

### size

The spinner bullet size. Defaults to 18px.

### inline

If true `display:inline-block` will be added to the spinner element style.

### style

custom style to be added to the spinner element.

### class

custom class names to be added to the spinner element.

### q:show

This is the only directive supported by this component.

## Example

```jsq
<q:template name='root'>
    <div style='margin-top: 20px'>
	    <spinner color='green' size='16px' />
	</div>
</q:template>

export default Qute('root');
```
