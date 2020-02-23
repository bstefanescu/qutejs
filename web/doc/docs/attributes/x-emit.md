# The x-emit attribute

```jsq

<x-tag name='fun-button'>
	<div>
		<a href='#' x-emit:action@click><slot/></a>
	</div>
</x-tag>

<x-tag name='my-button'>
	<a href='#' x-emit:click='$attrs.id'><slot/></a>
</x-tag>

<x-tag name='root'>
	<div>
	<fun-button @action='handleAction'>Fun Button - Click Me</fun-button>
	<my-button @click='handleAction' id='bla'>VM Button - Click Me</my-button>
	</div>
</x-tag>


Qute('my-button');

export default Qute('root', {
	handleAction(e) {
		console.log('Action Event', e, e.detail);
		console.log('Original Event', e.originalEvent)
			alert('Handling Action!');
	}
});
```

