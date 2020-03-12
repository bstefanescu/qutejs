# Using Existing Javascript Libraries

As Qute is working directly on the DOM you can easily use any plain javascript components or frameworks inside Qute Components. Here are some examples:

### Example 1: Wrapping [Bootstrap](https://getbootstrap.com/) Elements

```jsq
//playground directives
//@style https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css

<x-tag name='bs-button'>
	<button class={$attrs['bs-type']?'btn btn-'+$attrs['bs-type']:'btn'} x-attrs='!bs-type' x-emit:click><slot/></button>
</x-tag>

<x-tag name='my-component'>
	<bs-button bs-type='primary' @click='window.alert("Hello!")'>My Button</bs-button>
</x-tag>

export default Qute('my-component')
```

### Example 2: Using [jQuery](https://jquery.com/) with [selectivity](https://arendjr.github.io/selectivity/)

```jsq
//playground directives
//@script https://code.jquery.com/jquery-3.4.1.slim.min.js
//@script ../doc/files/selectivity-jquery.min.js
//@style ../doc/files/selectivity-jquery.min.css

<x-tag name='my-component'>
	<div></div>
</x-tag>

export default Qute('my-component', {
	created(el) {
		$(this.$el).selectivity({
	    	allowClear: true,
	    	items: ['Amsterdam', 'Antwerp', 'Athens', 'Barcelona', 'Berlin', 'Birmingham', 'Bradford', 'Bremen', 'Brussels', 'Bucharest', 'Budapest', 'Dublin', 'Paris', 'Prague', 'Lisbon', 'London',
	    	'New York', 'Tokyo'],
	    	placeholder: 'No city selected'
		});
	}
});
```
Of course, you can use reactive properties and/or watchers to update the state of external components.




