# The q:bind attribute

This attribute is an alternative notation for **bounded attributes**.  \
See the **[Templates](#/templates)** section for more details.

## Example

```jsq
import Qute from '@qutejs/runtime';

<q:template name='root'>
  <ul>
  	<li style={'color:'+color}>Using jsx like notation</li>
  	<li :style="'color:'+color">Using ':' prefix</li>
  	<li q:bind-style="'color:'+color">Using 'q:bind' atribute</li>
  </ul>
</q:template>

export default Qute('root', {
	init() {
		this.color = 'green';
	}
});
```