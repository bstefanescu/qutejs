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

const { ViewModel, Template, Property } = Qute;

<q:template name='ChildComponent'>
	<div>{{$attrs.message}}</div>
</q:template>

<q:template name='RootTemplate'>
	<child-component message={message}></child-component>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    @Property message = 'Hello!';
}
export default Root;
```

You can see in this example how the parent component is passing a `message` to the child component.

## Child to Parent Communication

Another common type of sending messages is from a child component up to the parent.
A common use case is for example to inform the parent component that some action occured on a child component.
This type of communication can be done through DOM events that bubbles up to ancestor elements and can be intercepted by the parent component.

```jsq
import Qute from '@qutejs/runtime';

const { ViewModel, Template, Property } = Qute;

<q:template name='ChildComponent'>
	<button>Remove Me!</button>
</q:template>

<q:template name='RootTemplate'>
	<if value='hasButton'>
	<child-component @click='removeButton'/>
	<else/>
	Button was removed!
	</if>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    @Property hasButton = true;

	removeButton() {
		this.hasButton = false;
	}
}
export default Root;
```

## Transversal Communication Between Components

Another way of communication is to send messages between components, no matter where in the tree are these components located.
This can be done by using the **message bus** provided by the [application instance](#/app/instance).

Let's take the example of a dropdown menu:

```jsq
import Qute from '@qutejs/runtime';

const { ViewModel, Template } = Qute;

<q:template name='AlertBoxTemplate'>
	<div style='display:none;position:fixed; left:40%; top:40%; border: 1px solid red; padding: 10px'>
	<div><slot/></div>
	<button @click='hideAlert'>Close</button>
	</div>
</q:template>

<q:template name='RootTemplate'>
<div>
	<alert-box>Hello!</alert-box>
	<button @click='showAlert'>Show Alert!</button>
</div>
</q:template>

@Template(AlertBoxTemplate)
class AlertBox extends ViewModel {
	hideAlert() {
		this.postAsync('hello', 'hide');
	}

	connected() {
		this._subscription = this.$app.subscribe('hello', (message, data) => {
			if (message === 'show') {
				this.$el.style.display='';
			} else if (message === 'hide') {
				this.$el.style.display='none';
			}
		});
	}

	disconnected() {
		this.$app.unsubscribe('hello', this._subscription);
	}
}

@Template(RootTemplate)
class Root extends ViewModel {
	showAlert() {
		this.postAsync('hello', 'show');
	}
}
export default Root;
```

In the previous example, the `alert` component is subscribing to a topic named `hello` when the component is connected to the DOM and unsubscribe when the component is disconnected. You can thus send message from other components to the `hello` topic to communicate with the `alert` component. To send a message you can use one of the `post` or `postAsync` methods.

However you will rarely want to use this technique. The messaging bus is especially usefull to communicate with application services global services like a routing service. The messaging bus is also used internally to implement reactive application properties, which we will describe below. Using application properties is the reccomended way to communicate between components which doesn't have a parent / child relationship.

### Application properties

Another way to share information between components which are not visible for each other is through **application properties**. Application properties are also using channels internally.

See the **[Application Data Model](#/app/data)** section for an example.

## Providing Services through the Message Bus

More, you can use this communication mechanism to provide shared services to all components in the application.
This is because the message bus is provided to components via the [application instance](#/app/instance) which is shared between all components.

```jsq
import Qute from '@qutejs/runtime';

const { ViewModel, Template, Property } = Qute;

<q:template name='ChildOneTemplate'>
<div>
	<button @click='fetchDate'>Print date</button> {{date}}
</div>
</q:template>

<q:template name='RootTemplate'>
<div>
	<child-one />
</div>
</q:template>

@Template(ChildOneTemplate)
class ChildOne extends ViewModel {
    @Property(Date) date;

	fetchDate() {
		this.postAsync('time-channel', 'date', date => {
            this.date = date;
        });
	}
}

var app = new Qute.Application();
app.subscribe('time-channel', function(message, cb) {
	if (message === 'date') {
        cb(new Date());
    }
});

var Root = Qute(RootTemplate);
new Root(app).mount('app');
```

The `post` and `postAsync` methods accept a third argument which can be a random object attached to the request. In the example above we passed a callback to get the information we needed.

You can also find an [example of implementing routing](#/plugins/routing) through the message bus


## Communicating Between Components Having Different Roots

Even more, we can use the message bus to communicate between components from two distinct Qute component trees running in the same web page.

When installing a root component you can share the application instance with another root component. Thus, you will also share the message bus.

### Example

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

const { ViewModel, Template } = Qute;
const document = window.document;

<q:template name='ChildOneTemplate'>
<div>I am child1 from root1</div>
</q:template>

<q:template name='FirstRootTemplate'>
<div style='border: 1px solid green; padding: 10px;'>
    <h3>Root1</h3>
	<child-one />
</div>
</q:template>

<q:template name='SecondRootTemplate'>
<div style='border: 1px solid green; padding: 10px;'>
	<h3>Root2</h3>
	<button @click='sendMessage'>Change child1 color</button>
</div>
</q:template>

@Template(ChildOneTemplate)
class ChildOne extends ViewModel {
	connected() {
		this._subscribtion = this.$app.subscribe('child1-channel', (message, data) => {
			if (message === 'color') this.$el.style.color = data;
		});
	}
	disconnected() {
		this.$app.unsubscribe('child1-channel', this._subscribtion);
	}
}

// we use Qute() to wraqp the template to create a empoty ViewModel
const Root1 = Qute(FirstRootTemplate);

@Template(SecondRootTemplate)
class Root2 extends ViewModel {
    colorIndex = 0;
    colors = ['green', 'blue', 'yellow', 'red', 'cyan', 'magenta', 'brown', 'black'];

	sendMessage() {
		var color = this.colors[this.colorIndex++];
		if (this.colorIndex > this.colors.length) this.colorIndex = 0;
		this.postAsync('child1-channel', 'color', color);
	}
}

// create insertion points
var div = document.createElement('DIV');
div.id = 'app1';
document.body.appendChild(div);
div = document.createElement('DIV');
div.id = 'app2';
document.body.appendChild(div);

// create the shared application instance
var app = new Qute.Application();
// mount roots
new Root1(app).mount('app1');
new Root2(app).mount('app2');
```
