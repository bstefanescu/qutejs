# The `q:on` attribute

This attribute is an alternative notation for **event attributes**.  \
See the **[Templates](#/templates)** section for more details.

## Example

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

<q:template name='root'>
  <div>
    <button @click='handleClick'>Click me: using @</button>
    <button q:onclick='handleClick'>Click me: using q:on</button>
  </div>
</q:template>

export default Qute('root', {
	handleClick() {
		window.alert('hello!');
	}
});
```
