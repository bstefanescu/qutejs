# The x-for attribute

This attribute can be used to render **reactive array like objects**. Any object having a `length` property is assumed to be an array like object.

This directive is **optimized** to work over lists which **are frequently changing**: when the list instance is changed, the new list is compared to the previous one, and only the affected items are rendered again.

The syntax is similar to one used by the **[for](#/directives/for)** directive:

```xml
<some-tag x-for='item in list' />
```
with one difference: the `x-for` attribute doesn't accept the extra variables `index` or `hasNext` as the `for` directive.

Also, the `x-for` attribute is rendering repeatedly the same element, while the `for` directive is rendering repeatedly an HTML fragment.

If you need to render immutable lists you should use the `for` directive to avoid the overhead introduced by the `x-for` directive.

**Note** that the DOM is updated only when the list instance changes and not when altering the current list instance.

**Example**

Let say `myList` is a reactive property on the following component:

```javascript
<x-tag name='my-list'>
  <div x-for='item in myList'>...</div>
</x-tag>

Qute('my-list', {
  init() {
    return {myList: ["item 1", "item 2", "item 3"]}
  }
});
```

Modifying the component list property like this:

```javascript
this.myList.push('new item');
```

will **not trigger** any DOM update since the list instance remained the same.  \
To trigger a DOM update you have two options:

1. Either force the update by calling `update()`:

```javascript
this.myList.push('new item');
this.update();
```

2. Either replace the list instance with its own copy:

```javascript
this.myList.push('new item');
this.myList = this.myList.slice(0);
```

## The `x-key` directive

The `x-for` directive can optimize the DOM updates **only** if an unique identifier string is given for each iterated item. This unique string can be specified using the `x-key` directive.

The `x-key` value should point to a property of the item that is to be used as an ID. In case of primitive items like strings or numbers you can use the special value '.' which indicates that the item itself should be used as an id.

If you are using `x-for` without a related `x-key` attribute then the DOM updates will be done using **brute force** in the same way as the `for` directive.

**Examples:**

1. `<div x-for='item in myList' x-key='.'>...</div>`
2. `<div x-for='item in myList' x-key='id'>...</div>`

**Using `x-for` without an `x-key` is useless**. It is better to use `for` in that case.

The correct way to write the example above is:

```javascript
<x-tag name='my-list'>
  <div x-for='item in myList' x-key='.'>...</div>
</x-tag>

Qute('my-list', {
  init() {
    this.myList = ["item 1", "item 2", "item 3"];
  }
});
```

## Examples

### Adding Items

The following example is displaying a list of items and allows the used to add a new item by clicking on the `Add` button.

```jsq
  <x-tag name='item'>
    <div>{{$attrs.text}}</div>
  </x-tag>

  <x-tag name='root'>
    <div>
      <item x-for='item in list' x-key='.' text={item} />
      <button @click='add'>Add</button>
    </div>
  </x-tag>

  export default Qute('root', {
    counter: 0,
    add() {
      this.list = this.list.concat('Item '+(this.counter++));
    },
    init() {
      return {
        list: ['Item X', 'Item Y']
      };
    }
  });
```

### Removing items

Let's adding a remove button.

```jsq
<x-tag name='item'>
  <tr x-listeners>
    <td>{{$attrs.text}}</td>
    <td>
	    <button @click='emit("remove", $attrs.text)'>Remove</button>
    </td>
  </tr>
</x-tag>

<x-tag name='root'>
  <div>
	  <table width='100%'>
    	<item x-for='item in list' x-key='.' text={item} @remove='onRemove' />
	  </table>
  	<button @click='add'>Add</button>
  </div>
</x-tag>


export default Qute('root', {
  counter: 0,
  onRemove(e) {
    var i = this.list.indexOf(e.detail);
    if (i > -1) {
        this.list.splice(i, 1);
        this.list = this.list.splice(0);
    }
  },
  add() {
    this.list = this.list.concat('Item '+(this.counter++));
  },
  init() {
    return {
      list: ['Item X', 'Item Y']
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

## List item reactivity

You can use reactive components (i.e. ViewModel components) if you need property reactivity inside list items.
Let's rewrite the example above, and attach a ViewNodel to the `item` template.
Also, since we can chamnge the item text, we need to use an immutable id property to identify the item.

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
        <item x-for='item in list' x-key='id' id={item.id} text={item.text} @remove='onRemove'/>
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
      return { id: null, text: null};
    }
});

export default Qute('root', {
  onRemove(e) {
      var idToRemove = e.detail;
      var i = this.list.findIndex(function(item) {
        return item.id === idToRemove;
      });
      if (i > -1) {
        this.list.splice(i, 1);
        this.list = this.list.slice(0);
        this.update();
      }
  },
  add() {
    var id = counter++;
    this.list.push({id: id, text:'Item '+id});
    this.update();
  },
  init() {
    return {
      list: [
        {id: 'x', text: 'Item X'},
        {id: 'y', text: 'Item Y'}
      ]
    };
  }
});
```



