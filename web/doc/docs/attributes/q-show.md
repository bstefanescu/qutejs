# The `q:show` attribute

This attribute can be used to dynamically hide or show an element based on the state of the model.

The `q:show` attribute will set the CSS display property to 'none' when the bound expression evaluates to *falsy* otherwise it will restore the initial value (it rembers the last nome 'none' value and restore it).

## Example

```xml
<li q:show='user' style='display:inline-block'><a href='#logout'>Logout</a></li>

```

In this example the `li` element will show only if the user property is *thruty*.

If user is not define then the display property will be set to false. When the `user` property is set the display property will be set to 'inline-block' (it remmebers and restore the initial value).


## Using `q:show` on components

When using `q:show` attribute on components it will modify the display style property on the component root element. This works for both **functional** and **ViewModel** components.

**Note** that the `q:show` attribute will be evaluated in the outside context of the target component.

Example:

```jsq
import Qute from '@qutejs/runtime';

<q:template name='TestShow'>
    <div><slot/></div>
</q:template>

<q:template name='RootTemplate'>
  <div>
    <test-show q:show={showIt}>Hello!</test-show>
    <button @click={e => showIt=!showIt}>{{showIt?'Hide':'Show'}}</button>
  </div>
</q:template>


export default Qute(RootTemplate).properties({
    showIt: true
});
```

