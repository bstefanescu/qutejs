# The `q:for` attribute

This attribute can be used to render **reactive array like objects**. Any object having a `length` property is assumed to be an array like object.

This directive is **optimized** to work over lists which **are frequently changing**: when the list instance is changed, the new list is compared to the previous one, and only the affected items are rendered again.

The syntax is similar to one used by the **[for](#/directives/for)** directive:

```xml
<some-tag q:for='item in list' />
```
with one difference: the `q:for` attribute doesn't accept the extra variables `index` or `hasNext` as the `for` directive.

Also, the `q:for` attribute is rendering repeatedly the same element, while the `for` directive is rendering repeatedly an HTML fragment.

If you need to render immutable lists you should use the `for` directive to avoid the overhead introduced by the `q:for` directive.

**Note** that the DOM is updated only when the list instance changes and not when altering the current list instance.

**Example**

Let say `myList` is a reactive property on the following component:

```javascript
<q:template name='my-list'>
  <div q:for='item in myList'>...</div>
</q:template>

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

## The `q:key` directive

The `q:for` directive can optimize the DOM updates **only** if an unique identifier string is given for each iterated item. This unique string can be specified using the `q:key` directive.

The `q:key` value should point to a property of the item that is to be used as an ID. When iterating over primitive items like strings or numbers you can use the special value '.' which indicates that the item itself should be used as an id. You can also specify the ID as an arrow function taking the iterated item as argument and returning the id.

If you are using `q:for` without a related `q:key` attribute then the DOM updates will be done using **brute force** in the same way as for the `for` directive.

**Examples:**

1. `<div q:for='item in myList' q:key='.'>...</div>`
2. `<div q:for='item in myList' q:key='id'>...</div>`
3. `<div q:for='item in myList' q:key='item => item.id'>...</div>`

**Using `q:for` without a `q:key` is useless**. It is better to use `for` in that case.

**Note** that for your convenience you can also use a `key` attribute instead of `q:key` to specify the identifier. The difference is that the `key` attribute will be preserved as is on the DOM element.

The correct way to write the example above is:

```javascript
<q:template name='my-list'>
  <div q:for='item in myList' q:key='.'>...</div>
</q:template>

Qute('my-list', {
  init() {
    this.myList = ["item 1", "item 2", "item 3"];
  }
});
```

## The ViewModel List Helper

The Qute `ViewModel` provides a helper to deal with reactive list modification and udpates. You can use this helper to minimize the code needed to modify lists, or you can directly modify the list and then call `ViewModel.update()` to trigger an update.

For more information see the **[List Helper Documentation](#/advanced/list)**

Also, you can find a complete example of a reactive list (and a comparision between using the List Helper and not using it) in the **[Todo List Example](#/examples/todo)**.

## Examples

### Adding Items

The following example is displaying a list of items and allows the used to add a new item by clicking on the `Add` button.

```jsq
import Qute from '@qutejs/runtime';

<q:template name='item'>
  <div>{{$attrs.text}}</div>
</q:template>

<q:template name='root'>
  <div>
    <item q:for='item in list' q:key='.' text={item} />
    <button @click='add'>Add</button>
  </div>
</q:template>

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
import Qute from '@qutejs/runtime';

<q:template name='item'>
  <tr>
    <td>{{$attrs.text}}</td>
    <td>
	    <button q:emit-remove-onclick={$attrs.text}>Remove</button>
    </td>
  </tr>
</q:template>

<q:template name='root'>
  <div>
	  <table width='100%'>
    	<item q:for='item in list' q:key='.' text={item} @remove='onRemove' />
	  </table>
  	<button @click='add'>Add</button>
  </div>
</q:template>


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

<item q:for='item,index in list' index={index} text={item} remove={removeItem} />
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
import Qute from '@qutejs/runtime';

<q:template name='item'>
  <tr>
    <td>{{text}}</td>
    <td>
        <button @click='edit'>Edit</button>
        <button q:emit-remove-onclick={id}>Remove</button>
    </td>
  </tr>
</q:template>

<q:template name='root'>
  <div>
      <table width='100%'>
        <item q:for='item in list' q:key='id' id={item.id} text={item.text} @remove='onRemove'/>
      </table>
      <button @click='add'>Add</button>
  </div>
</q:template>

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



