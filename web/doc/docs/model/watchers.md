
# Property Watchers

A property watcher is a component method that is notified when a reactive property is about to update so you can perform some custom logic or even cancel the update.

To register a property watcher you need to define a method which will intercept the update and decorate it using the `@Watch(propertyName)` decorator.

The decorator takes one argument: the property name to watch. The decorated method takes two arguments: the new value and the old value: `watch(newValue, oldValue)`.

You can **cancel** the property update by returning `false` from the watcher function. Returning any other value will have no effect and the property update will be done (which will trigger a DOM update).

```jsq
import Qute from '@qutejs/runtime';

const {ViewModel, Template, Property, Watch} = Qute;

<q:template name='RootTemplate'>
<div>
	<button @click='counter1++'>Unlimited Counter: {{counter1}}</button>
	<button @click='counter2++'>Limited Counter: {{counter2}}</button>
</div>
</q:template>

@Template(RootTemplate)
class RootComponent extends ViewModel {
    @Property counter1 = 0;
    @Property counter2 = 0;

    @Watch('counter1')
    watchCounter1(newValue, oldValue) {
	// just log the update
	console.log('Updating counter1', oldValue, ' -> ', newValue);
    }

    @Watch('counter2')
    watchCounter2(newValue, oldValue) {
        // log the update
        console.log('Updating counter2', oldValue, ' -> ', newValue);
        // and cancel update if counter is greater than 2
        if (newValue > 2) {
            alert('Counter cannot be incremented further!');
            return false;
        }
    }
}

export default RootComponent;
```
