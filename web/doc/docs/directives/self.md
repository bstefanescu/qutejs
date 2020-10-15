# Self Directive

This directive can be used to reference the current ViewModel component to call it again.

This gives you the ability to create recursive calls.

**Note:** For now it can only be used to recursively call ViewModel components. It is not working with function components or customm rendering functions.

## Example

```jsq
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

const MyTree = Qute(RecursiveTemplate).properties(() => ({
    items: null
}));

export default Qute(RootTemplate).properties(() => ({
    tree: [
        {name: "Item 1", children: [{name: "Item 1.1"}, {name: "Item 1.2"}]},
        {name: "Item 2"}
    ]
}));
```