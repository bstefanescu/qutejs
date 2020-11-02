# The `q:channel` attribute

This property can be used on components which defines a `channel`.
It takes as a value a channel name that should be opened by the target component.

When opening a channel on a component you can then send events to the component instance by using the `post` or `postAsync` methods of a ViewModel or of the [Application instance](#/app/instance).

Even if a component defines a channel listener function (this can be done using the `@Channel` decorator) a channel to a component instance will be created only if `q:channel` is used on an instance of that component.

This mechanism enables components to send events to any other component who define a channel.
Also, you can use this to send events between components inside different roots (in that case you need to use the same **Application instance** to initialize the roots).

## Example

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property, Channel, On } = Qute;

<q:template name='PageHeaderTemplate'>
	<a href='#' data-message-type='info' data-message-content='hello!'>Send message</a>
</q:template>

<q:template name='PageContentTemplate'>
	<div>{{message}}</div>
</q:template>

<q:template export>
<div>
	<page-header />
	<page-content q:channel='messages' />
</div>
</q:template>

@Template(PageHeaderTemplate)
class PageHeader extends ViewModel {
    @On('click', 'a[data-message-type]')
    handleClick(event) {
        var msgType = event.target.getAttribute('data-message-type');
        var msg = event.target.getAttribute('data-message-content');
        this.postAsync('messages', msgType, msg);
        return false;
    }
}

@Template(PageContentTemplate)
class PageContent extends ViewModel {
    @Property message = '';

    @Channel
    onMessage(message, data) {
        this.message = 'Received '+message+': '+data;
    }
}
```