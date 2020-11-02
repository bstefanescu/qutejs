# The `q:ref` attribute

The `q:ref` attribute can be used to retrieve the actual DOM element or component reference from a ViewModel template.  \
The attribute take as value the property name in the current component model to be used to store the reference. This property doesn't need to be a reactive property. In fact, it is not recommended to use reactive properties to store a reference.

When the `q:ref` attribute is used on a DOM element then a reference to the element instance will be stored. If the `q:ref` attribute is used on a `ViewModel` component or on a template component then a reference to the component itself will be stored (you can always use the `$el` property of the component to get the root element of the component).

## Example: Get a DOM element reference

In this example we will inject the span element instance in the current view model as a regular property named `spanElement`.

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
	<div>
		<button @click='increment'>Increment</button>
		&nbsp; Value: <span q:ref='spanElement'>0</span>
	</div>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
	increment() {
		var value = parseInt(this.spanElement.textContent);
		this.spanElement.textContent = value+1;
	}
}
export default Root;
```

## Using `q:ref` on components.

As mentioned when using `q:ref` on a component, a reference to the component itself is stored.

Let's rewrite the example as above but using a `ViewModel` component to wrap the `span`.

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='MySpanTemplate'>
	<span><slot/></span>
</q:template>
<q:template name='RootTemplate'>
	<div>
		<button @click='increment'>Increment</button>
		&nbsp; Value: <my-span q:ref='mySpan'>0</my-span>
	</div>
</q:template>

const MySpan = Qute(MySpanTemplate); // wrap the template in a ViewModel component5

@Template(RootTemplate)
class Root extends ViewModel {
    increment() {
		var value = parseInt(this.mySpan.$el.textContent);
		this.mySpan.$el.textContent = value+1;
	}
}
export default Root;
```

**Note** that we used the `$el` property of the component to get the reference to the component root element.

Let's rewrite the example above by encapsulating the increment logic in the `my-span` component.


```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='MySpanTemplate'>
	<span><slot/></span>
</q:template>
<q:template name='RootTemplate'>
	<div>
		<button @click='increment'>Increment</button>
		&nbsp; Value: <my-span q:ref='mySpan'>0</my-span>
	</div>
</q:template>

@Template(MySpanTemplate)
class MySpan extends ViewModel {
	increment() {
		var value = parseInt(this.$el.textContent);
		this.$el.textContent = value+1;
	}
}

@Template(RootTemplate)
class Root extends ViewModel {
	increment() {
		this.mySpan.increment();
	}
}
export default Root;
```


**Note** that you can also use `q:ref` on template components to get a reference to the template component instance.


For more examples on using the `q:ref` attribute on components look at the [popup](#/components/popup) and [modal](#/components/modal) components.

