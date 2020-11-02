# The `q:on` attribute

This attribute is an alternative notation for **event attributes**.  \
See the **[Templates](#/model/templates)** section for more details.

## Example

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

<q:template name='RootTemplate'>
  <div>
    <button @click='handleClick'>Click me: using @</button>
    <button q:onclick='handleClick'>Click me: using q:on</button>
  </div>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
	handleClick() {
		window.alert('hello!');
	}
}
export default Root;
```
