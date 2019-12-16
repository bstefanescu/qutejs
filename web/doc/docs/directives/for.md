# For Directive

The for directive is iterating over lists (i.e. array like objects) or regular objects and renders an HTML fragment on each iteration.
Any object having an integer length property will be treated as an array like object, otherwise the list will be obtained using `Object.keys(...)`.

The **for** directive will **not update the DOM** when the list content changes (i.e. when items are added / removed / reordered).

If the list expression is based on a reactive property and this property changes (i.e. the list instance changes ) then the *for* directive will **udpate** the DOM accordingly.

Thus, **reactivity** is only supported on the list instance and not on the list content.

**Note:** If you need reactivity over the list content then use the [x-for](#/attributes/x-for) attribute.

**Syntax:** `<for value='item[,index,hasNext] in staticList'> ... </for>`

**Note:** item, index and hasNode can be replaced by any valid javascript variable identifier. But the order matters: the first identifier is the item key, the second one is the index key and the third one is the hasNext key.


### Examples

#### Simple iteration:

```jsq
<x-tag name='root'>
<for value='item in list'>
	<li> <a href={item.href}>{{item.title}}</a></li>
</for>
</x-tag>

export default Qute('root', {
	init() {
		this.list = [
			{href: '#1', title: 'Item 1'},
			{href: '#2', title: 'Item 2'},
			{href: '#3', title: 'Item 3'}
		]
	}
});
```

#### Retrieving the index:

```jsq
<x-tag name='root'>
<for value='item,index in list'>
	<li>{{index+1}}. <a href={item.href}>{{item.title}}</a></li>
</for>
</x-tag>

export default Qute('root', {
	init() {
		this.list = [
			{href: '#1', title: 'Item 1'},
			{href: '#2', title: 'Item 2'},
			{href: '#3', title: 'Item 3'}
		]
	}
});
```

#### Using hasNext:

```jsq
<x-tag name='root'>
<for value='item,index,hasNext in list'>
	<li>{{index+1}}. <a href={item.href}>{{item.title}}</a> <if value='hasNext'><hr></if></li>
</for>
</x-tag>

export default Qute('root', {
	init() {
		this.list = [
			{href: '#1', title: 'Item 1'},
			{href: '#2', title: 'Item 2'},
			{href: '#3', title: 'Item 3'}
		]
	}
});
```

### Iterating over non array like objects

When using a regular object instead of an array like object to iterate on then, the list to iterate is obtained using the `Object.keys()` method.

```jsq
<x-tag name='root'>
<for value='key in dict'>
	<li>{{key}} = {{dict[key]}}</li>
</for>
</x-tag>

export default Qute('root', {
	init() {
		this.dict = {
			a: 1,
			b: 2,
			c: 3
		}
	}
});
```

### List instance reactivity

```jsq
<x-tag name='root'>
<div>
	<button @click='changeList'>Change the list</button>
	<ul>
	<for value='item in list'>
		<li>{{item}}</li>
	</for>
	</ul>
</div>
</x-tag>

export default Qute('root', {
	changeList() {
		this.list = this.list === this.list1 ? this.list2 : this.list1;
	},
	init() {
		this.list1 = ["a", "b", "c", "d"];
		this.list2 = [1,2,3];
		return {
			list: this.list1
		}
	}
});
```

