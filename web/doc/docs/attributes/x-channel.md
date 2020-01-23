# The x-channel attribute

This property can be used on components which defines a `channel`.
It takes as a value a channel name that should be opened by the target component.

When opening a channel on a component you can then send events to the component instance by using the `post` or `postAsync` methods of a ViewModel or of the [Application instance](#/app/instance).

Even if a component defines a channel listener function (this can be dione using `Qute.channel`) a channel to a component instance will be created only if `x-channel` is used on an instance of that component.

This mechanism enables components to send events to any other component who define a channel.
Also, you can use this to send events between components inside different roots (in that case you need to use the same **Application instance** to initialize the roots).

## Example

```jsq
<x-tag name='tbar'>
	<a href='#' data-message-type='info' data-message-content='hello!'>Send message</a>
</x-tag>

<x-tag name='content'>
	<div>{{message}}</div>
</x-tag>

<x-tag name='root'>
<div>
	<tbar />
	<content x-channel='messages' />
</div>
</x-tag>

Qute('tbar').on('click', 'a[data-message-type]', function(event, vm) {
	var msgType = this.getAttribute('data-message-type');
	var msg = this.getAttribute('data-message-content');
	vm.postAsync('messages', msgType, msg);
	return false;
});
Qute('content', {
	init() {
		return { message: '' }
	}
}).channel(function(event, data) {
	this.message = 'Received '+event+': '+data;
});
export default Qute('root');
```