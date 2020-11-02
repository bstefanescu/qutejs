# Component Messaging

`ViewModel` component instances can subscribe to a messaging channel to receive messages from other components. The method to be used to handle incoming messages must be decorated with the `@Channel` decorator.

A component can subscribe to a channel either directly calling the `listen(channelName)` method, either declaratively by using the `q:channel` attribute on the component element in the parent template. If the component subscribing to a channel doesn't define a message handler method (using the `@Channel` decorator) then an exception will be thrown.

This mechanism enables components to send events to any other component who defines a channel. Also, you can use this to send events between components inside different roots (in that case you need to use the same Application instance to initialize the roots).

You can see more examples on messaging in **[q:channel](#/attributes/q-channel)** and **[Message Bus](#/app/bus)** sections.

## Example

```jsq
import Qute from '@qutejs/runtime';

const { ViewModel, Template, Property, Channel, On, Required } = Qute;

<q:template name='ReceiverTemplate'>
    <div style='padding:8px; border: 1px solid green'>{{message}}</div>
</q:template>

<q:template name='SenderTemplate'>
    <div>
        <input type='text' q:ref='_input' placeholder='Write some message'>
        <button>Send</button>
    </div>
</q:template>

@Template(ReceiverTemplate)
class Receiver extends ViewModel {
    @Property message = '';

    @Channel
    handleMessage(msg, data) {
        this.message = 'Received: '+msg;
    }
}

@Template(SenderTemplate)
class Sender extends ViewModel {

    @Required @Property(String) target;
    _input = null;

    @On('click', 'button')
    handleMessage(msg, data) {
        this.postAsync(this.target, this._input.value);
    }
}

// the root component
<q:template export>
    <div>
        <Sender target='my-channel' />
        <hr>
        <Receiver q:channel='my-channel' />
    </div>
</q:template>
```