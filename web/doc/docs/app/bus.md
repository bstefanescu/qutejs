# Message Bus

No matter which application you build, components need a way to communicate with each other.

Most of the time you need to communicate from the parent to the children, and from the children to parent components. But there are scenarios where you want to be able to communicate transversaly between sibling components.

## Parent to Children Communication

This is the most used type of communication and is implicitly done by the tree structure of the components.
When building an application you have a root component which instantiate some children components and so one.

When instantiating a child component the parent is passing down some information as the component **attributes**.
This is the most basic form of communication.

```jsq
import Qute from '@qutejs/runtime';

<q:template name='child'>
	<div>{{$attrs.message}}</div>
</q:template>

<q:template name='root'>
	<child message={message}></child>
</q:template>


export default Qute('root', {
	init() {
		return {
			message: "Hello!"
		}
	}
});
```

You can see in this example how the parent component is passing a `message` to the child component.

## Child to Parent Communication

Another common type of sending messages is from a child component up to the parent.
A common use case is for example to inform the parent component that some action occured on a child component.
This type of communication can be done through DOM events that bubbles up to ancestor elements and can be intercepted by the parent component.

```jsq
import Qute from '@qutejs/runtime';

<q:template name='child'>
	<button>Remove Me!</button>
</q:template>

<q:template name='root'>
	<if value='hasButton'>
	<child @click='removeButton'/>
	<else/>
	Button was removed!
	</if>
</q:template>


export default Qute('root', {
	removeButton() {
		this.hasButton = false;
	},
	init() {
		return {
			hasButton: true
		}
	}
});
```

## Transversal Communication Between Components

Another way of communication is to send messages between components, no matter where in the tree are these components located.
This can be done by using the **message bus** provided by the [application instance](#/app/instance).

Let's take the example of a dropdown menu:

```jsq
import Qute from '@qutejs/runtime';

<q:template name='alert'>
	<div style='display:none;position:fixed; left:40%; top:40%; border: 1px solid red; padding: 10px'>
	<div><slot/></div>
	<button @click='hideAlert'>Close</button>
	</div>
</q:template>

<q:template name='root'>
<div>
	<alert q:channel='hello'>Hello!</alert>
	<button @click='showAlert'>Show Alert!</button>
</div>
</q:template>

Qute('alert', {
	hideAlert() {
		this.postAsync('hello', 'hide');
	}
}).channel(function(message, data) {
	if (message === 'show') {
		this.$el.style.display='';
	} else if (message === 'hide') {
		this.$el.style.display='none';
	}
});

export default Qute('root', {
	showAlert() {
		this.postAsync('hello', 'show');
	}
});
```

In the previous example, the `alert` component is declaring a communication channel by calling the `channel(channelListener)` method. The channel is only declared.

In order to create the channel you need to give the channel a name. This is done in the template by using the `q:channel` attribute on the `alert` component. This will create a communication channel to the `alert` component instance that will use the defined channel listener to respond to messages.

If you create an `alert` component instance without using the `q:channel` attribute the channel will never be created on that instance (even if the channel listener was defined).

Briefly, defining a channel function provides a messaging end-point. In order to open a channel to an instance end-point you need to use the `q:channel` attribute to assign the channel a name.

Of course, the example above can be implemented using a mix of the first two communication methods (parent to child and child to panel) and by keeping the alert state in a reactive property.
But there are situations when using a state property and up and down communication is to complex or not justified.

### Application properties

Another way to share information between components which are not visible for each other is through **application properties**. Application properties are also using channels internally.

See the **[Application Data Model](#/app/data)** section for an example.

## Providing Services through the Message Bus

More, you can use this communication mechanism to provide shared services to all components in the application.
This is because the message bus is provided to components via the [application instance](#/app/instance) which is shared between all components.

Let's see an example:

```jsq
import Qute from '@qutejs/runtime';

<q:template name='child1'>
<div>
	<button @click='askSeconds'>Ask Seconds!</button>
</div>
</q:template>

<q:template name='child2'>
<div>
	<button @click='askMinutes'>Ask Minutes!</button>
</div>
</q:template>

<q:template name='root'>
<div>
	<child1 />
	<child2 />
</div>
</q:template>

Qute('child1', {
	askSeconds() {
		this.postAsync('time-channel', 'seconds');
	}
});

Qute('child2', {
	askMinutes() {
		this.postAsync('time-channel', 'minutes');
	}
});

var app = new Qute.App();
app.subscribe('time-channel', function(message) {
	var date = new Date();
	if (message === 'seconds') {
		alert('Seconds: '+date.getSeconds());
	} else if (message === 'minutes') {
		alert('Minutes: '+date.getMinutes());
	}
});

var Root = Qute('root');
new Root(app).mount('app');

```

The `post` and `postAsync` methods accept a third argument which can be a random object attached to the request.
Let's rewrite the previous example to pass a callback to retrieve the information from the service:


```jsq
import Qute from '@qutejs/runtime';

<q:template name='child1'>
<div>
	<button @click='askSeconds'>Ask Seconds! {{seconds}}</button>
</div>
</q:template>

<q:template name='child2'>
<div>
	<button @click='askMinutes'>Ask Minutes! {{minutes}}</button>
</div>
</q:template>

<q:template name='root'>
<div>
	<child1 />
	<child2 />
</div>
</q:template>

Qute('child1', {
	init() {
		return {seconds: ''};
	},
	askSeconds() {
		var self = this;
		this.postAsync('time-channel', 'seconds', function(seconds) {
			self.seconds = seconds;
		});
	}
});

Qute('child2', {
	init() {
		return {minutes: ''};
	},
	askMinutes() {
		var self = this;
		this.postAsync('time-channel', 'minutes', function(minutes) {
			self.minutes = minutes;
		});
	}
});

var app = new Qute.App();
app.subscribe('time-channel', function(message, cb) {
	var date = new Date();
	if (message === 'seconds') {
		cb(date.getSeconds());
	} else if (message === 'minutes') {
		cb(date.getMinutes());
	}
});

var Root = Qute('root');
new Root(app).mount('app');

```

You can also find an [example of implementing routing](#/plugins/routing) through the message bus


## Communicating Between Components Having Different Roots

Even more, we can use the message bus to communicate between components from two distinct Qute component trees running in the same web page. This way, we can use **Qute** to create components that integrate nicely into existing web pages.

When installing a root component we can use the same application instance used by the other roots in the page. This way we can share the same message bus to communicate between components, no matter where components were mounted in the page.

### Example

```jsq
import {document} from '@qutejs/window';
import Qute from '@qutejs/runtime';

<q:template name='child1'>
<div>I am child1 from root1</div>
</q:template>

<q:template name='root1'>
<div style='border: 1px solid green; padding: 10px;'>
    <h3>Root1</h3>
	<child1 q:channel='child1-channel' />
</div>
</q:template>

<q:template name='root2'>
<div style='border: 1px solid green; padding: 10px;'>
	<h3>Root2</h3>
	<button @click='sendMessage'>Change child1 color</button>
</div>
</q:template>

Qute('child1').channel(function(message, data) {
	if (message === 'color') this.$el.style.color = data;
});
var Root1 = Qute('root1');
var Root2 = Qute('root2', {
	init() {
		this.colorIndex = 0;
		this.colors = ['green', 'blue', 'yellow', 'red', 'cyan', 'magenta', 'brown', 'black'];
	},
	sendMessage() {
		var color = this.colors[this.colorIndex++];
		if (this.colorIndex > this.colors.length) this.colorIndex = 0;
		this.postAsync('child1-channel', 'color', color);
	}
});

// create insertion points
var div = document.createElement('DIV');
div.id = 'app1';
document.body.appendChild(div);
div = document.createElement('DIV');
div.id = 'app2';
document.body.appendChild(div);

// create the shared application instance
var app = new Qute.App();
// mount roots
new Root1(app).mount('app1');
new Root2(app).mount('app2');
```

