# Todo List

We implemented the Todo List in 3 different ways.

The following examples demonstrates the usage of:

1. the **[q:for](#/attributes/q-for)** directive.
2. the `_List()` property type from `@qutejs/types` to easily manipulate reactive list properties.


## Example 1: Using a component for the todo item

We will create 2 ViewModel components: `todo-list` and `todo-item`.

The `todo-list` component is responsible for managing the list structure, while the `todo-item` is rendering a single item and is responsible for updating the item status.

We are using the `_List(key[, value])` proprtye type to initialize the reactive list property. The `key` argument must point to a item id property or a function trhat resolve the item id given the item. Because of that, you don't need to specify the  `key` attribute when using `q:for` directive since the key is given by the list property.

See [Property Types](#/model/proptypes) for more information on `_List`.


```jsq
import "https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css";

import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
import { _List, _Array } from '@qutejs/types';

// ------------------------------------------ Styles

<q:style>
.done {
  text-decoration: line-through;
}
</q:style>

// ------------------------------------------ Templates

<q:template name='TodoItemTemplate'>
	<li class="list-group-item d-flex justify-content-between align-items-center">
        <span>
	        <a href='#' @click='toggleDone'>&#x2714;</a>
	        <span q:class='{done:todo.done}'>{{todo.text}}</span>
        </span>
		<span><a href='#' class='close' q:emit-remove-onclick={todo.id}>&times;</a></span>
	</li>
</q:template>

<q:template name='TodoListTemplate'>
	<div>
		<ul class="list-group">
			<todo-item q:for='item in todos' todo={item} @remove='removeItem' />
		</ul>
		<form class='d-flex'>
			<input q:call='el => input = el' type='text' class='form-control' style='display:inline-block'/>
			<button class='btn btn-primary' @click='addItem'>Add</button>
		</form>
		<div style='text-align:center; margin-top: 10px'>
			<button @click='exportJson'>Export as JSON</button>
		</div>
	</div>
</q:template>

<q:template name='RootTemplate'>
	<todo-list todos={todos}/>
</q:template>

// ------------------------------------------ Javascript

const TodoItem = Qute(TodoItemTemplate, {
	toggleDone() {
		this.todo.done = !this.todo.done;
		// update the DOM: this is needed since todo instance didn't changed
		this.update();
		// notify parent about the change
		this.emit('change', this.todo);
		return false;
	}
}).properties({
    todo: null
});

var CNT = 0;
const TodoList = Qute(TodoListTemplate, {
	init() {
		this.input = null;
	},
	connected() {
		this.input.focus();
	},
	removeItem(e) {
		this.todos.removeItem(e.detail);
		return false;
	},
	addItem() {
		var text = this.input.value;
		if (text) {
			var randomId = 'todo-'+Date.now()+'-'+(CNT++);
			this.todos.push({id: randomId, text: text, done: false});
			this.input.value = '';
		}
		return false;
	},
	exportJson() {
		window.alert(JSON.stringify(this.todos));
	}
}).properties({
	todos: _List('id')
});

export default Qute(RootTemplate).properties({
    todos: _Array([
        { id: "todo1", text: "Write some code", done: false },
        { id: "todo2", text: "Drink a beer", done: true }
    ])
});
```


## Example 2: Not using a component for the Todo item.

In this example the todo item template will be inlined in the todo list template.

This approach is better in term of memory usage since it doesn't instantiate a component for each item.

```jsq
import "https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css";

import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
import { _List, _Array } from '@qutejs/types';

// ------------------------------------------ Styles

<q:style>
.done {
  text-decoration: line-through;
}
</q:style>

// ------------------------------------------ Templates

<q:template name='TodoListTemplate'>
	<div>
		<ul class="list-group">
			<li q:for='item in todos' class="list-group-item d-flex justify-content-between align-items-center">
	            <span>
		            <a href='#' @click='e=>checkItem(item.id)'>&#x2714;</a>
		            <span q:class='{done:item.done}'>{{item.text}}</span>
	            </span>
				<span><a href='#' class='close' @click='e=>removeItem(item.id)'>&times;</a></span>
			</li>
		</ul>
		<form class='d-flex'>
			<input q:call='el => input = el' type='text' class='form-control' style='display:inline-block'/>
			<button class='btn btn-primary' @click='addItem'>Add</button>
		</form>
		<div style='text-align:center; margin-top: 10px'>
			<button @click='exportJson'>Export as JSON</button>
		</div>
	</div>
</q:template>

<q:template name='RootTemplate'>
	<todo-list todos={todos}/>
</q:template>

// ------------------------------------------ Javascript

var CNT = 0;
const TodoList = Qute(TodoListTemplate, {
	init() {
		this.input = null;
	},
	connected() {
		this.input.focus();
	},
	removeItem(key) {
		this.todos.removeItem(key);
		return false;
	},
	checkItem(key) {
		this.todos.updateItem(key, item => {
			item.done = !item.done;
		});
		return false;
	},
	addItem() {
		var text = this.input.value;
		if (text) {
			var randomId = 'todo-'+Date.now()+'-'+(CNT++);
			this.todos.push({id: randomId, text: text, done: false});
			this.input.value = '';
			this.update();
		}
		return false;
	},
	exportJson() {
		window.alert(JSON.stringify(this.todos));
	}
}).properties({
    todos: _List('id')
});

export default Qute(RootTemplate).properties({
    todos: _Array([
        { id: "todo1", text: "Write some code", done: false },
        { id: "todo2", text: "Drink a beer", done: true }
    ])
});
```

## Example 3: Same as before but not using the `_List` property type.

Here is the same example as before, but without using the Qute list helper. The code is therefore a little more verbose.

**Note** that we use a special property `__dirty__` on the list instance to inform the udpater that a list item content changed. We can also clone the modified item and then replace the original item to force an item update.

```jsq
import "https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css";

import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

// ------------------------------------------ Styles

<q:style>
.done {
  text-decoration: line-through;
}
</q:style>

// ------------------------------------------ Templates

<q:template name='TodoListTemplate'>
	<div>
		<ul class="list-group">
			<li q:for='item in todos' q:key='id' class="list-group-item d-flex justify-content-between align-items-center">
	            <span>
		            <a href='#' @click='e=>checkItem(item.id)'>&#x2714;</a>
		            <span q:class='{done:item.done}'>{{item.text}}</span>
	            </span>
				<span><a href='#' class='close' @click='e=>removeItem(item.id)'>&times;</a></span>
			</li>
		</ul>
		<form class='d-flex'>
			<input q:call='el => input = el' type='text' class='form-control' style='display:inline-block'/>
			<button class='btn btn-primary' @click='addItem'>Add</button>
		</form>
		<div style='text-align:center; margin-top: 10px'>
			<button @click='exportJson'>Export as JSON</button>
		</div>
	</div>
</q:template>

<q:template name='RootTemplate'>
	<todo-list todos={todos}/>
</q:template>

// ------------------------------------------ Javascript

var CNT = 0;
const TodoList = Qute(TodoListTemplate, {
	init() {
		this.input = null;
	},
	connected() {
		this.input.focus();
	},
	findTodoIndex(key) {
		var list = this.todos;
		if (list) {
			for (var i=0,l=list.length; i<l; i++) {
				if (list[i].id === key) return i;
			}
		}
		return -1;
	},
	removeItem(key) {
		var i = this.findTodoIndex(key);
		if (i > -1) {
			var todos = this.todos;
			todos.splice(i, 1);
			this.update();
		}
		return false;
	},
	checkItem(key) {
		var i = this.findTodoIndex(key);
		if (i > -1) {
			this.todos[i].done = !this.todos[i].done;
			this.todos.__dirty__ = [ key ];
			this.update();
		}
		return false;
	},
	addItem(e) {
		var text = this.input.value;
		if (text) {
			var todos = this.todos || [];
			var randomId = 'todo-'+Date.now()+'-'+(CNT++);
			todos.push({id: randomId, text: text, done: false})
			this.input.value = '';
			this.update();
		}
		return false;
	},
	exportJson() {
		window.alert(JSON.stringify(this.todos));
	}
}).properties({
    todos: null
});

export default Qute(RootTemplate).properties(() => ({
    todos: [
        { id: "todo1", text: "Write some code", done: false },
        { id: "todo2", text: "Drink a beer", done: true }
    ]
}));
```



