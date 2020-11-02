# Adding Mixins to a `ViewModel` Component

Mixins can be easily specified using the `@Mixin(Mixin1, Mixin2, ...)` decorator.

## Example

```jsq
import Qute from '@qutejs/runtime'

const { ViewModel, Template, Mixin, Property } = Qute;

<q:template name='RootTemplate'>
    <div>
        {{message}} <button @click={changeGreeting}>Change Greeting</button>
    </div>
</q:template>

const MyMixin = {
    changeGreeting() {
        this.message= 'Hi!';
    }
}

@Mixin(MyMixin)
@Template(RootTemplate)
class RootComponent extends ViewModel {
    @Property message = 'Hello!';
}

export default RootComponent;
```
