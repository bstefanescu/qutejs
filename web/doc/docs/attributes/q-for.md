# The `q:for` attribute

This directive can be used to render mutable **arrays** and keep them in sync with the DOM: each time the array instance changes, the DOM is optimally updated to reflect changes. This can be done optimally only if items in the arrays can be uniquely identified. This is done by specifying a `q:key` attribute indicating the field of the item to be used as an unique identifier or a function that accept an item and return an unique identifier for the item.

If the items in the array cannot be uniquely identified then you better use the **[for](#/directives/for)** directive.

This directive is **optimized** to work over arrays which **are frequently changing**: when the array instance is changed, the new list is compared to the previous one, and only the affected items are rendered again.

The syntax is similar to one used by the **[for](#/directives/for)** directive:

```xml
<some-tag q:for='item in list' q:key='id' />
```

with one difference: the `q:for` attribute doesn't accept the extra variables `index` or `hasNext` as the `for` directive. Also, the `q:for` attribute is rendering repeatedly the same element, while the `for` directive is rendering repeatedly an HTML fragment.

If you want to render immutable lists you should use the `for` directive to avoid the overhead introduced by the `q:for` directive.

**Note** that the DOM is updated only when the list instance changes and not when altering the content of the current list instance.

**Example**

Let's say `myList` is a reactive property on the following component:

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

<q:template name='MyListTemplate'>
    <ul>
        <li q:for='item in myList' q:key='id'>{{item.value}}</li>
    </ul>
</q:template>

@Template(MyListTemplate)
class MyList extends ViewModel {
    @Property(Array) myList = [
        {id: 1, value: "item 1"},
        {id: 2, value: "item 2"},
        {id: 3, value: "item 3"}
    ];
}

export default MyList;
```

Modifying the component list property like this:

```javascript
this.myList.push('new item');
```

will **not trigger** any DOM update since the list instance remains the same.  \
To trigger a DOM update you have two options:

1. Either force the update by calling `update()`:

```javascript
this.myList.push('new item');
this.update();
```

2. Either replace the list instance with its own copy:

```javascript
this.myList.push('new item');
this.myList = this.myList.slice(); // this will trigger an update
```

## The `q:key` attribute

The `q:for` directive can optimize the DOM updates **only** if an unique identifier is given for each iterated item. This unique string can be specified using the `q:key` directive.

If a string, the `q:key` value should point to a property of the item that is to be used as an ID. When iterating over primitive items like strings or numbers you can use the special value `'.'` which indicates that the item itself should be used as an id. You can also specify the ID as an arrow function taking the iterated item as argument and returning the id.

**Be aware** when using `'.'` as the list key: the key value must be unique in the list, this means the `'.'` will only works for lists with unique values!

If you are using `q:for` without a related `q:key` attribute then the DOM updates will be done using **brute force** in the same way as for the `for` directive, and we will have a warning logged on the console.

**Examples:**

1. `<div q:for='item in myList' q:key='.'>...</div>`
2. `<div q:for='item in myList' q:key='id'>...</div>`
3. `<div q:for='item in myList' q:key='item => item.id'>...</div>`

**Using `q:for` without a `q:key` is not recommended**. It is better to use `for` in that case.

**Note** that for convenience you can also use a `key` attribute instead of `q:key` to specify the identifier. The difference is that the `key` attribute will be preserved as is on the DOM element.


## The `List` property type

To simplify working with arrays and reactivity, Qute is providing a **[List](#/model/proptypes)** property type which wraps an array and provides an API specially designed to ease reactive lists manipulation.

When iterating over `List` properties using the `q:for` directives you don't need to use the `q:key` directive since the list `key` is specified when creating the list property. Here is the same as the example above but using `List`

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property, List } = Qute;

<q:template name='MyListTemplate'>
    <ul>
        <li q:for='item in myList'>{{item.value}}</li>
    </ul>
</q:template>

@Template(MyListTemplate)
class MyList extends ViewModel {
    @Property(List, 'id') myList = [
        {id: 1, value: "item 1"},
        {id: 2, value: "item 2"},
        {id: 3, value: "item 3"}
    ];
}

export default MyList;
```

Now you can modify the list and update the DOM at the same time using one line:

```javascript
this.myList.push('new item');
```

There is **no need** to force an update by calling `this.update()` or by replacing the list with its own copy. The `List` instance will automatically update the DOM.

### List API

A list instance can be created using the `Qute.List(viewModel, listKey[, initialValueAsArray])` constructor, or indirectly using the `@Property` decorator: `@Property(List, listKey) items = initialValueAsArray;`.

The **listKey** argument is required and should be either the name of an item field to be used as the key, either the special key `'.'` which means the item itself should be used as a key or either a function which takes the item and should return a unique value that identify the item.

The **initiaValueAsArray** argument is optional and is used to initialize the list. Defaults to an empty array.

**Be aware**, when using the special key `'.'` the list must only contains unique values!

**Usage:**

```javascript
import Qute from '@qutejs/runtime';
const { ViewModel, Property, List } = Qute;

class MyListComponent extends ViewModel {
    @Property(List, 'id') myList = [{
        { id: 1, text: 'item 1' },
        { id: 2, text: 'item 2' }
    ]);
}
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

The following examples are not using the **List** property. You can find a complete example about using `List` and a comparision between using the `List` property and using raw arrrays in the **[Todo List Example](#/examples/todo)**.


### Adding Items

The following example is displaying a list of items and allows the used to add a new item by clicking on the `Add` button.

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

<q:template name='MyItem'>
  <div>{{$attrs.text}}</div>
</q:template>

<q:template name='RootTemplate'>
  <div>
    <my-item q:for='item in list' q:key='.' text={item} />
    <button @click='add'>Add</button>
  </div>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    counter = 0;
    @Property list = ['Item X', 'Item Y'];

    add() {
        this.list.push('Item '+(this.counter++));
        this.update(); // force a DOM update
    }
}

export default Root;
```

### Removing items

Let's adding a remove button.

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

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

@Template(RootTemplate)
class Root extends ViewModel {
    counter = 0;
    @Property list = ['Item X', 'Item Y'];

    add() {
        this.list.push('Item '+(this.counter++));
        this.update(); // force a DOM update
    }

    onRemove(e) {
        var i = this.list.indexOf(e.detail);
        if (i > -1) {
            this.list.splice(i, 1);
            this.update(); // schedule a DOM update
        }
    }
}

export default Root;
```

You can notice how the `item` component (which is a template component - since it hasn't a model) is emitting a `remove` event when the remove button is pressed so that the parent component, which is controling the list, remove the item.

This is the **recommended** way to **interact with parent components** - by emitting events.

There are also other ways to do this - like for example to pass an attribute which points to a parent `remove` function, and to call this function to perform the remove:


```xml
<button @click='$attrs.remove($attrs.index)'>Remove</button>

...

<item q:for='item in list' text={item} remove={removeItem} />
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
const { ViewModel, Template, Property } = Qute;

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

@Template(MyItemTemplate)
class MyItem extends ViewModel {
    @Property(String) id;
    @Property(String) text;

    edit() {
        var r = prompt("Item text", this.text);
        if (r != null) {
            this.text = r;
        }
    }
}

@Template(RootTemplate)
class Root extends ViewModel {
    @Property(Array) list = [
        {id: 'x', text: 'Item X'},
        {id: 'y', text: 'Item Y'}
    ];

    onRemove(e) {
        var idToRemove = e.detail;
        var i = this.list.findIndex(function(item) {
            return item.id === idToRemove;
        });
        if (i > -1) {
            this.list.splice(i, 1);
            this.update();
        }
    }
    add() {
        var id = counter++;
        this.list.push({id: String(id), text:'Item '+id});
        this.update();
    }
}

export default Root;
```



