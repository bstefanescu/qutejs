# The x-for attribute

This attribute can be used to render reactive lists. The syntax is similar to one used by the [for](#/directives/for) directive:
```xml
<some-tag x-for='item[,index,hasNext] in list' />
```
where list is an instance of a `Qute.List` object.

There are 3 differences between the `for` directive and the `x-for` attribtue:

1. The `for` directive is rendering **an HTML fragment** one or more times, while the `x-for` attribute is rendering **a single element** one or more times.
2. The `for` directive **can iterate over any array like javascript object**, while the `x-for` attribute **only iterates over instances of `Qute.List` objects**.
3. The `for` directive **is static** while the `x-for` attribute **is reactive** (the rendered lists is kept in sync with the list model).

Thus, **Qute** implements **list reactivity** by using a special array like object **instead of diffing** the DOM tree to detect where the DOM should be updated. Using this approach the DOM update is **faster**: modifying the list model will automatically update the DOM element list, without needing to make any diffs to detect where the update should be done.

It **is recommended** to use the [for](#/directives/for) directive if you don't need reactivity on list operations like insert, remove or item reordering.

**Warning:** `index` and `hasNext` are supported for consistency with the `for` directive syntax but are not **reactive**.
These properties are valid at the initial list rendering, but are not updated on subsequent modifications on the list.
So use these properties with caution.


## Qute.List

This is an array like object that wraps a Javascript array and connects it to a list of rendered DOM elements, so that any time the array changes the connected element list will change accordingly.

All usual array methods (like, push, indexOf, forEach, map, reduce, etc.) are implemented by Qute.List,
also serializing a `Qute.List` using `JSON.stringify` will outputs a json array (Qute.List is implementing a toJSON method 	whidh will return the wrapped array).


To create an empty reactive list you simply use the Qute.List constructor.

```javascript
new Qute.List()
```
Passing to the constructor an existing array will create a reactive list that wraps it:

```javascript
new Qute.List(['item1', 'item2'])
```

The downside of Qute.List is that you cannot use the bracket notations to access items by indexes (i.e. list[i] is not supported). You should insted use the `get(index)` method.

Apart the usual array methods the `Qute.List` is also providing the following ones:

1. `data()` - return the wrapped array
2. `newList()` - create a new Qute.List that wraps the same array.
3. `clear()` - remove all the list items. This operation is **reactive** (i.e. it will update the DOM).
3. `replace(arr)` - replace the ointernal array with a new one. This operation is **reactive**.
4. `move(from, to)` - move an item from `from` index to `to` index. This operation is **reactive**.
5. `remove(item)` - remove an item by value. This operation is **reactive**.

**Note** that a `Qute.List` object is reactive independently of the context in which it is defined. Example:

```javascript
Qute('my-list', {
  init() {
    this.theList = new Qute.List();
  }
});
```

In this example we defined a non reactive property `theList`. Assigning a new value to that property will not trigger any change in the DOM. But the list itself is reactive when used in a `x-for` directive attribute.

The `x-for` attribute will always generate a DOM structure synchronized with the `Qute.List` object.

## Examples

### Adding Items

The following example is displaying a list of items and allows the used to add a new item by clicking on the `Add` button.

```jsq
  <x-tag name='item'>
    <div>{{$attrs.index+1}}. {{$attrs.text}}</div>
  </x-tag>

  <x-tag name='root'>
    <div>
      <item x-for='item,index in list' index={index} text={item} />
      <button @click='add'>Add</button>
    </div>
  </x-tag>

  export default Qute('root', {
    counter: 0,
    add() {
      this.list.push('Item '+(this.counter++));
    },
    init() {
      return {
        list: new Qute.List(['Item X', 'Item Y'])
      };
    }
  });
```

You can play with this snippet and replace `this.list.push` with `this.list.unshift` to insert items on top.

### Removing items

Let's adding now a remove button.

```jsq
<x-tag name='item'>
  <tr>
    <td>{{$attrs.index+1}}. {{$attrs.text}}</td>
    <td>
	    <button @click='emit("remove", $attrs.index)'>Remove</button>
    </td>
  </tr>
</x-tag>

<x-tag name='root'>
  <div>
	  <table width='100%'>
    	<item x-for='item,index in list' index={index} text={item} @remove='onRemove' />
	  </table>
  	<button @click='add'>Add</button>
  </div>
</x-tag>


export default Qute('root', {
  counter: 0,
  onRemove(e) {
    this.list.splice(e.detail, 1)
  },
  add() {
    this.list.push('Item '+(this.counter++));
  },
  init() {
    return {
      list: new Qute.List(['Item X', 'Item Y'])
    };
  }
});
```

You can notice how the `item` component (which is a functional component - since it hasn't a model) is emitting	a `remove` event when the remove button is pressed so that the parent component which is controling the list do the remove.

This is the **recommended** way to **interact with parent components** - by emitting events.

There are also other ways to do this - like for example to pass an attribute which points to a parent `remove` function, and to call this function to perform the remove:


```xml
<button @click='$attrs.remove($attrs.index)'>Remove</button>

...

<item x-for='item,index in list' index={index} text={item} remove={removeItem} />
```

where `removeItem` is a function `bound` to the parent ViewModel instance:

```javascript
init() {
	this.removeItem = function(index) {
			this.list.splice(index, 1)
		}.bind(this);
    return {
      list: new Qute.List(['Item X', 'Item Y'])
    };
}
```

## List reactivity and the item index

You can **notice** the previous example has a **big issue**. The removal is done by item `index`.
The `index` property is not **reactive**, so removing items from the top of the list will break the removal of the items which follows down.

A reactive list is updating the DOM when its structure changes, that means when:

1. one or more items are inserted
2. one or more items are removed

But it will not update properties inside nested components like the `index`.
Thus, in the case of reactive lists which supports item removal it is not recommended to use the `index` which is valid  only the first time the list is rendered.

The solution to fix this removal problem is to use an unique ID for each item. This way, you first find the item to remove using its ID then you remove it.

In our case, to keep it simple, we may consider the text itself is the item ID so you can rewrite the snippet like this:

```jsq
<x-tag name='item'>
  <tr>
    <td>{{$attrs.text}}</td>
    <td>
	    <button @click='emit("remove", $attrs.text)'>Remove</button>
    </td>
  </tr>
</x-tag>

<x-tag name='root'>
  <div>
	  <table width='100%'>
    	<item x-for='item in list' text={item} @remove='onRemove' />
	  </table>
  	<button @click='add'>Add</button>
  </div>
</x-tag>


export default Qute('root', {
  counter: 0,
  onRemove(e) {
  	this.list.remove(e.detail);
  },
  add() {
    this.list.push('Item '+(this.counter++));
  },
  init() {
    return {
      list: new Qute.List(['Item X', 'Item Y'])
    };
  }
});
```

If you need to prefix the items with the item index then it is better to use [CSS counters](https://www.w3schools.com/css/css_counters.asp).


## List item reactivity

You can use reactive components (i.e. ViewModel components) if you need property reactivity inside list items.
Let's rewrite the example above, and attach a ViewNodel to the `item` template. Also we will add a unique ID to each item - so that we can modify the item text without breaking removel.

```jsq
<x-tag name='item'>
  <tr>
    <td>{{text}}</td>
    <td>
        <button @click='edit'>Edit</button>
        <button @click='emit("remove", id)'>Remove</button>
    </td>
  </tr>
</x-tag>

<x-tag name='root'>
  <div>
      <table width='100%'>
        <item x-for='item in list' id= {item.id} text={item.text} @remove='onRemove'/>
      </table>
      <button @click='add'>Add</button>
  </div>
</x-tag>

var counter = 1;

Qute('item', {
    edit() {
        var r = prompt("Item text", this.text);
        if (r != null) {
            this.text = r;
        }
    },
    init() {
      return {
        id: null,
        text: null // we define a reactive text property
      };
    }
});

export default Qute('root', {
  onRemove(e) {
      var idToRemove = e.detail;
      var i = this.list.findIndex(function(item) {
        return item.id === idToRemove;
      })
      if (i > -1) this.list.splice(i, 1);
  },
  add() {
    var id = counter++;
    this.list.push({id: id, text:'Item '+id});
  },
  init() {
    return {
      list: new Qute.List([
        {id: 'x', text: 'Item X'},
        {id: 'y', text: 'Item Y'}
      ])
    };
  }
});
```

**Note** that `$attrs.text` was replaced with `text` since now the `text` attribute has a corresponding `text` property in the model.



