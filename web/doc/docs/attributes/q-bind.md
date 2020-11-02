# The `q:bind` attribute

This attribute is an alternative notation for **bounded attributes**.  \
See the **[Templates](#/model/templates)** section for more details.

## Example

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
  <ul>
  	<li style={'color:'+color}>Using jsx like notation</li>
  	<li q:bind-style="'color:'+color">Using 'q:bind' atribute</li>
  </ul>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    color = 'green';
}
export default Root;
```
