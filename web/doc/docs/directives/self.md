# Self Directive

This directive can be used to reference the current ViewModel component to call it again.

This gives you the ability to create recursive calls.

**Note:** For now it can only be used to recursively call ViewModel components. It is not working with function components or customm rendering functions.

## Example

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property, Required } = Qute;

<q:template name='RecursiveTemplate'>
    <ul>
        <for value='item in items'>
            <li>
                {{item.name}}
                <if value='item.children && item.children.length'>
                    <self items={item.children} />
                </if>
            </li>
        </for>
    </ul>
</q:template>

<q:template name='RootTemplate'>
    <my-tree items={tree} />
</q:template>

@Template(RecursiveTemplate)
class MyTree extends ViewModel {
    @Required @Property(Array) items;
}

@Template(RootTemplate)
class Root extends ViewModel {
    @Property(Array) tree = [
        {name: "Item 1", children: [{name: "Item 1.1"}, {name: "Item 1.2"}]},
        {name: "Item 2"}
    ]
}

export default Root;
```