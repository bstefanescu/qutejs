# Qute List Helper

The `ListHelper` can be used to facilitate reactive list manipuilation and update.

To get a list helper instance you need to call `ViewModel.getList(propertyName, keyField)`. The propertyName must be the name of a reactive list property of the `ViewModel` and the `keyField` is the name of the list item field that is used as the item unique key (this is usually an ID property).

If not specified of the special `'.'` value is specified then the item is assumed to be a primitive and the key will be obtained by invoking `String(item)`.

You can see a complete example of the ListHelper usage in the **[Todo List Example](#/examples/todo)**

## ListHelper API

### `getIndex(key)`

Get the index of the specified item key or `-1` if not found.

### `getItem(key)`

Get a list item by its key or `undefined` if not found.

### `removeItem(key)`

Remove an item given its key and schedule a DOM update.  \
Returns the ListHelper instance, so you can chain update methods.

This method is equivalent to the following javascript code:

```javascript
function removeItem(theViewModel, propertyName, keyField, theKeyToRemove) {
	var theReactiveList = theViewModel[propertyName];
	var i = theReactiveList.findIndex(item => item[keyField] === theKeyToRemove);
	if (i > -1) {
		theReactiveList.splice(i, 1);
		theViewModel.update();
	}
}
```

**Usage Example:**

```javascript
	// we are inside a ViewModel component (this points to the ViewmOdel component instance)
	this.getList('myList', 'id').removeItem('the-id-to-remove');
```

### `updateItem(key, updateFn)`

Update the item given its key using the `updateFn` and then schedule a DOM update.  \
To avoid updating the DOM you can. return `false` from the updateFn.  \
Returns the ListHelper instance, so you can chain update methods.

This method is equivalent to the following javascript code:

```javascript
function updateItem(theViewModel, propertyName, keyField, theKeyToUpdate, updateFn) {
	var theReactiveList = theViewModel[propertyName];
	var i = theReactiveList.findIndex(item => item[keyField] === theKeyToUpdate);
	if (i > -1) {
		if (updateFn(theReactiveList[i] !== false) {
			if (!theReactiveList.__dirty__) {
				theReactiveList.__dirty__ = [];
			}
			theReactiveList.__dirty__.push(theKeyToUpdate); // mark the item dirty so that the associated DOM element is updated.
			theViewModel.update();
		}
	}
}
```

**Usage Example:**

```javascript
	// we are inside a ViewModel component (this points to the ViewmOdel component instance)
	this.getList('myList', 'id').updateItem('the-id-to-update', item => {
		item.message = 'Hello!';
	});
```

### `udpate(updateFn)`

Update the list itself given an update method then trigger a DOM update.  \
Returns the ListHelper instance, so you can chain update methods.

**Usage Example:**

```javascript
	// we are inside a ViewModel component (this points to the ViewmOdel component instance)
	this.getList('myList', 'id').update(list => {
		list.push({id: 'new-item', message: 'hello'});
	});
```

The method is provided as convenience to chain multiple updates.

If you don't need to chain other updates you may want to directly update list without using the `ListHelper` as follows:

```javascript
	this.myList.push({id: 'new-item', message: 'hello'});
	this.update();
```

### `moveBefore(key, beforeKey)`

Move the item identified by `key` before the item identified by `beforeKey`. If beforeKey is not specified then move it at the end of the list.  \
Returns the ListHelper instance, so you can chain update methods.


