# For Directive

The `for` directive should be used to iterate over **immutable** array like objects or object keys.

Although the `for` directive is **reactive** (i.e. if the target list is a reactive property and is replaced by another list then the DOM is updated), it will use brute force to update the DOM: the previous elements are replaced with the new ones.

If you need a `for` directive **optimized for reactivity and DOM updates** then you should use **[q:for](#/attributes/q-for)** which is only updating the changed items.

This directive was optimized to work over static lists and is giving some additional features over the `q:for` directive:

1. Each iteration renders a document fragment, and not a single element.
2. It provides an extra `index` and `hasNext` attributes for each iterated item.
3. Can iterate over object keys by obtaining the array using `Object.keys()`.

Any object having a `length` property will be treated as an **array like object**, otherwise the list will be obtained using `Object.keys(...)`.

**Syntax:** `<for value='item[,index,hasNext] in staticList'> ... </for>`

**Note:** item, index and hasNode can be replaced by any valid javascript variable identifier. But the order matters: the first identifier is the item key, the second one is the index key and the third one is the hasNext key.


### Examples

#### Simple iteration:

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
<for value='item in list'>
	<li> <a href={item.href}>{{item.title}}</a></li>
</for>
</q:template>

@Template(RootTemplate)
class RootComponent extends ViewModel {
    list = [
        {href: '#1', title: 'Item 1'},
        {href: '#2', title: 'Item 2'},
        {href: '#3', title: 'Item 3'}
    ]
}
export default RootComponent;
```

#### Retrieving the index:

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
<for value='item,index in list'>
	<li>{{index+1}}. <a href={item.href}>{{item.title}}</a></li>
</for>
</q:template>

@Template(RootTemplate)
class RootComponent extends ViewModel {
    list = [
        {href: '#1', title: 'Item 1'},
        {href: '#2', title: 'Item 2'},
        {href: '#3', title: 'Item 3'}
    ]
}
export default RootComponent;
```

#### Using hasNext:

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
<for value='item,index,hasNext in list'>
	<li>{{index+1}}. <a href={item.href}>{{item.title}}</a> <if value='hasNext'><hr></if></li>
</for>
</q:template>

@Template(RootTemplate)
class RootComponent extends ViewModel {
    list = [
        {href: '#1', title: 'Item 1'},
        {href: '#2', title: 'Item 2'},
        {href: '#3', title: 'Item 3'}
    ]
}
export default RootComponent;
```

### Iterating over non array like objects

When using a regular object instead of an array like object to iterate on then, the list to iterate is obtained using the `Object.keys()` method.

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
<for value='key in dict'>
	<li>{{key}} = {{dict[key]}}</li>
</for>
</q:template>

@Template(RootTemplate)
class RootComponent extends ViewModel {
	dict = {
        a: 1,
        b: 2,
        c: 3
	}
}
export default RootComponent;
```

### List instance reactivity

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

<q:template name='RootTemplate'>
<div>
	<button @click='changeList'>Change the list</button>
	<ul>
	<for value='item in list'>
		<li>{{item}}</li>
	</for>
	</ul>
</div>
</q:template>

@Template(RootTemplate)
class RootComponent extends ViewModel {
    @Property listIndex = 0;
    lists = [
        ["a", "b", "c", "d"],
        [1, 2, 3]
    ];

	changeList() {
		this.listIndex = (this.listIndex + 1) % 2;
	}

    get list() {
        return this.lists[this.listIndex];
    }
}
export default RootComponent;
```

