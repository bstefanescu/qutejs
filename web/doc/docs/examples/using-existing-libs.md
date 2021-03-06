# Using Existing Javascript Libraries

As Qute is working directly on the DOM you can easily use any plain javascript components or frameworks inside Qute Components. Here are some examples:

### Example 1: Wrapping [Bootstrap](https://getbootstrap.com/) Elements

```jsq
import "https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css";

<q:template name='BsButton'>
	<button class={$attrs['bs-type']?'btn btn-'+$attrs['bs-type']:'btn'} q:attrs='!bs-type' q:emit-click><slot/></button>
</q:template>

<q:template export>
	<bs-button bs-type='primary' @click='window.alert("Hello!")'>My Button</bs-button>
</q:template>
```

### Example 2: Using [jQuery](https://jquery.com/) with [selectivity](https://arendjr.github.io/selectivity/)

```jsq
import "../doc/files/selectivity-jquery.min.css";

import Qute from '@qutejs/runtime';
import "https://code.jquery.com/jquery-3.4.1.slim.min.js";
import "../doc/files/selectivity-jquery.min.js";

const { ViewModel, Template } = Qute;

<q:template name='MyComponentTemplate'>
	<div></div>
</q:template>

@Template(MyComponentTemplate)
class MyComponent extends ViewModel {
	created(el) {
		$(this.$el).selectivity({
	    	allowClear: true,
	    	items: ['Amsterdam', 'Antwerp', 'Athens', 'Barcelona', 'Berlin', 'Birmingham', 'Bradford', 'Bremen', 'Brussels', 'Bucharest', 'Budapest', 'Dublin', 'Paris', 'Prague', 'Lisbon', 'London',
	    	'New York', 'Tokyo'],
	    	placeholder: 'No city selected'
		});
	}
}
export default MyComponent;
```
Of course, you can use reactive properties and/or watchers to update the state of external components.





