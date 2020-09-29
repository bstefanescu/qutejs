# The `q:for` attribute

This attribute can be used to render **reactive array like objects**. Any object having a `length` property is assumed to be an array like object.

This directive is **optimized** to work over arrays which **are frequently changing**: when the array instance is changed, the new list is compared to the previous one, and only the affected items are rendered again.

The syntax is similar to one used by the **[for](#/directives/for)** directive:

```xml
<some-tag q:for='item in list' />
```
with one difference: the `q:for` attribute doesn't accept the extra variables `index` or `hasNext` as the `for` directive.

Also, the `q:for` attribute is rendering repeatedly the same element, while the `for` directive is rendering repeatedly an HTML fragment.

If you need to render immutable lists you should use the `for` directive to avoid the overhead introduced by the `q:for` directive.

**Note** that the DOM is updated only when the list instance changes and not when altering the current list instance.

**Example**

Let's say `myList` is a reactive property on the following component:

```jsq
<q:template name='MyList'>
    <ul>
        <li q:for='item in myList'>{{item}}</li>
    </ul>
</q:template>

export default Qute(MyList).properties(() => ({
    myList: ["item 1", "item 2", "item 3"]
}));
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

The `q:key` value should point to a property of the item that is to be used as an ID. When iterating over primitive items like strings or numbers you can use the special value `'.'` which indicates that the item itself should be used as an id. You can also specify the ID as an arrow function taking the iterated item as argument and returning the id.

If you are using `q:for` without a related `q:key` attribute then the DOM updates will be done using **brute force** in the same way as for the `for` directive.

**Examples:**

1. `<div q:for='item in myList' q:key='.'>...</div>`
2. `<div q:for='item in myList' q:key='id'>...</div>`
3. `<div q:for='item in myList' q:key='item => item.id'>...</div>`

**Using `q:for` without a `q:key` is useless**. It is better to use `for` in that case.

**Note** that for your convenience you can also use a `key` attribute instead of `q:key` to specify the identifier. The difference is that the `key` attribute will be preserved as is on the DOM element.

The correct way to write the example above is:

```jsq
import Qute from '@qutejs/runtime';

<q:template name='MyList'>
    <ul>
        <li q:for='item in myList' q:key='.'>{{item}}</li>
    </ul>
</q:template>

export default Qute(MyList).properties(() => ({
    myList: ["item 1", "item 2", "item 3"]
}));
```

## The `_List` property type

The `q:for` directives can also be used to iterate over `List` objects created by the **[_List](#/model/proptypes)** property type. The `List` object wrap an array and provide an API specially designed to ease reactive lists manipulation.
To create a `List` object you must use the `_List` property type.

When iterating over `List` objects using the `q:for` directives you don't need to use the `q:key` directive since the list `key` is specified when creating the list property. Here is the same as the example above but using `_List`

```jsq
import Qute from '@qutejs/runtime';
import { _List } from '@qutejs/types';

<q:template name='MyList'>
    <ul>
        <li q:for='item in myList'>{{item}}</li>
    </ul>
</q:template>

export default Qute(MyList).properties({
    myList: _List(["item 1", "item 2", "item 3"])
});
```

Now you can modify the list and update the DOM using one line:

```jsq
this.myList.push('new item');
```

There is **no need** to force an update by calling `this.update()` or by replacing the list with its own copy. The `List` instance will automatically update the DOM.

### List API

#### `_List(key, initialValue)`

Create a new List property object.

+ **key** - the name of a list item field that can be used as the item unique identifier. Defaults to `'.'`.
+ **initiaValue** - an optional array to be used to initialize the list. Defaults to an empty array.

The **key** is optional: if not specified an implicit value of `'.'` will be used, which means the item itself is the unique identifier. This is usefull for primitive lists. Examples: `_List(['item 1', 'item 2', 'item 3'])`

**Usage:**

```javascript
import { _List } from '@qutejs/types';

Qute(ComponentTemplate).properties({
    myList: _List('id', [{
        { id: 1, text: 'item 1' },
        { id: 2, text: 'item 2' }
    ]);
})
```

### `ar` property

The underlying array.

#### `push()`

Same as `Array.prototype.push` but will update the DOM too.

#### `pop()`

Same as `Array.prototype.pop` but will update the DOM too.

#### `shift()`

Same as `Array.prototype.shift` but will update the DOM too.

#### `unshit()`

Same as `Array.prototype.unshift` but will update the DOM too.

### `splice()`

Same as `Array.prototype.splice` but will update the DOM too.

### `peek()`

Get the last item in the list.

### `size()`

GHet the size of the list

### `clear()`

Clear the list content.

### `set(array)`

Replace the list items with the items from the given array

### `prepend(array)`

Prepend the content of the given array to the list and update the DOM.

### `append(array)`

Append the content of the given array to the list and update the DOM.

### `update(updateFn)`

Run the given function to update the list then update the DOM. The fucntion signature is `void function(listArray)` where `listArray` is the `ar` property of the list.

### `getIndex(key)`

Get the index of an item given the item key.

### `getItem(key)`

Get an item given its key.

### `setItem(key, item)`

Set an item givenj its key.

### `removeItem(key)`

Remove an item given its key.

### `updateItem(key, updateFn)`

Given an item key, run an update function on that item, then update the DOM. The function signature is `void function(item)`.

### `insertBefore(item, beforeKey)`

Insert the given item before the item identified by `beforeKey`, then udpate the DOM.

### `moveBefore(key, beforeKey)`

Move the item identified by `key` before the item indetified by `beforeKey`, then update the DOM.

## Examples

The following examples are not using the **_List** property. You can find a complete example about using `_List` and a comparision between using the `_List` property and using raw arrrays in the **[Todo List Example](#/examples/todo)**.


### Adding Items

The following example is displaying a list of items and allows the used to add a new item by clicking on the `Add` button.

```jsq
import Qute from '@qutejs/runtime';

<q:template name='MyItem'>
  <div>{{$attrs.text}}</div>
</q:template>

<q:template name='RootTemplate'>
  <div>
    <my-item q:for='item in list' q:key='.' text={item} />
    <button @click='add'>Add</button>
  </div>
</q:template>

export default Qute(RootTemplate, {
  counter: 0,
  add() {
    this.list.push('Item '+(this.counter++));
    this.update(); // schedule a DOM update
  }
}).properties(() => ({
    list: ['Item X', 'Item Y']
}));
```

### Removing items

Let's adding a remove button.

```jsq
import Qute from '@qutejs/runtime';

<q:template name='MyItem'>
  <tr>
    <td>{{$attrs.text}}</td>
    <td>
	    <button q:emit-remove-onclick={$attrs.text}>Remove</button>
    </td>
  </tr>
</q:template>

<q:template name='RootTemplate'>
  <div>
	  <table width='100%'>
    	<my-item q:for='item in list' q:key='.' text={item} @remove='onRemove' />
	  </table>
  	<button @click='add'>Add</button>
  </div>
</q:template>


export default Qute(RootTemplate, {
  counter: 0,
  onRemove(e) {
    var i = this.list.indexOf(e.detail);
    if (i > -1) {
        this.list.splice(i, 1);
        this.update(); // schedule a DOM update
    }
  },
  add() {
    this.list.push('Item '+(this.counter++));
    this.update(); // schedule a DOM update
  }
}).properties(() => ({
    list: ['Item X', 'Item Y']
}));
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
Also, since we can change the item text, we need to use an immutable id property to identify the item.

```jsq
import Qute from '@qutejs/runtime';

<q:template name='MyItemTemplate'>
  <tr>
    <td>{{text}}</td>
    <td>
        <button @click='edit'>Edit</button>
        <button q:emit-remove-onclick={id}>Remove</button>
    </td>
  </tr>
</q:template>

<q:template name='RootTemplate'>
  <div>
      <table width='100%'>
        <my-item q:for='item in list' q:key='id' id={item.id} text={item.text} @remove='onRemove'/>
      </table>
      <button @click='add'>Add</button>
  </div>
</q:template>

var counter = 1;

const MyItem = Qute(MyItemTemplate, {
    edit() {
        var r = prompt("Item text", this.text);
        if (r != null) {
            this.text = r;
        }
    }
}).properties({
    id: null, text: null
});

export default Qute(RootTemplate, {
  onRemove(e) {
      var idToRemove = e.detail;
      var i = this.list.findIndex(function(item) {
        return item.id === idToRemove;
      });
      if (i > -1) {
        this.list.splice(i, 1);
        this.update();
      }
  },
  add() {
    var id = counter++;
    this.list.push({id: id, text:'Item '+id});
    this.update();
  }
}).properties(() => ({
    list: [
        {id: 'x', text: 'Item X'},
        {id: 'y', text: 'Item Y'}
    ]
}));
```



