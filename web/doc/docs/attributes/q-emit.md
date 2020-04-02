# The `q:emit` attribute

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

<q:template name='fun-button'>
	<div>
		<a href='#' q:emit-action-onclick><slot/></a>
	</div>
</q:template>

<q:template name='my-button'>
	<a href='#' q:emit-click='$attrs.id'><slot/></a>
</q:template>

<q:template name='root'>
	<div>
	<fun-button @action='handleAction'>Fun Button - Click Me</fun-button>
	<my-button @click='handleAction' id='bla'>VM Button - Click Me</my-button>
	</div>
</q:template>


Qute('my-button');

export default Qute('root', {
	handleAction(e) {
		console.log('Action Event', e, e.detail);
		console.log('Original Event', e.originalEvent)
		window.alert('Handling Action!');
	}
});
```

