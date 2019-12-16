# Spinner Component

This is a simple functional component that display a spinner.

## Attributes

There are 2 attributes accepted by this component: `color` and `size`.  \
These attributes are not reactive.

### color

The spinner color. Defaults to #333.

### size

The spinner bullet size. Defaults to 18px.

## Example

```jsq
<x-tag name='root'>
    <div style='margin-top: 20px'>
	    <spinner color='green' size='16px' />
	</div>
</x-tag>

export default Qute('root');
```
