# Class Syntax

You can also use the ES6 class syntax to define components. Let's look at an example

```jsq
import Qute from '@qutejs/runtime';

<q:template name='root'>
<div>{{message}}</div>
</q:template>

class MyComponent extends Qute.ViewModel {
	init() {
		// let's define a reactive property
		return {
			message: 'I am a class!'
		}
	}

	connected() {
		// log when component is connected to the DOM
		console.log('Connected to', this.$el);
	}
}

// register the components
export default Qute('root', MyComponent);
```

A component class must extends the Qute.ViewModel. Apart this the class is identical to a component definition object - it may define lifecycle listeners, methods, reactive properties etc.

**Note** that It is not enough to extends `Qute.ViewModel` in order to register a component. This will only create the component definition. To link the component to a template and register it you **must** use the `Qute()` function.

If you want to use a custom render method (and not to use a template) then you need to define the render method in your class.

```jsq
import {document} from '@qutejs/window';
import Qute from '@qutejs/runtime';

class MyComponent extends Qute.ViewModel {
	init() {
		// let's define a reactive property
		return {
			message: 'I am a class!'
		}
	}

	render(rendering) {
		var div = document.createElement('DIV');
		div.appendChild(rendering.x(function(model) {return model.message}));
		return div;
	}

	connected() {
		// log when component is connected to the DOM
		console.log('Connected to', this.$el);
	}
}

// register the component
export default Qute('root', MyComponent);
```

**Note** that you still need to call `Qute()` to register the component.
