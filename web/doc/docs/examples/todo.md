# Todo List

We implemented the Todo List in 3 different ways.

The following examples demonstrates the usage of:

1. the **[q:for](#/attributes/q-for)** directive.
2. the `ViewModel.getList()` helper to easily manipulate reactive list properties.


## Example 1: Using a component for the todo item

We will create 2 ViewModel components: `todo-list` and `todo-item`.

The `todo-list` component is responsible for managing the list structure, while the `todo-item` is rendering a single item and is responsible for updating the item status.

We are using the `ViewModel.getList()` method to get a list helper which is providing methods to ease list manipulation and DOM update.

```jsq
//@style https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css

import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

// ------------------------------------------ Styles

<q:style>
.done {
  text-decoration: line-through;
}
</q:style>

// ------------------------------------------ Templates

<q:template name='todo-item'>
	<li class="list-group-item d-flex justify-content-between align-items-center">
        <span>
	        <a href='#' @click='toggleDone'>&#x2714;</a>
	        <span q:class='{done:todo.done}'>{{todo.text}}</span>
        </span>
		<span><a href='#' class='close' q:emit-remove-onclick={todo.id}>&times;</a></span>
	</li>
</q:template>

<q:template name='todo-list'>
	<div>
		<ul class="list-group">
			<todo-item q:for='item in todos' q:key='id' todo={item} @remove='removeItem' />
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

<q:template name='root'>
	<todo-list todos={todos}/>
</q:template>

// ------------------------------------------ Javascript

Qute('todo-item', {
	init() {
		return { todo: null };
	},
	toggleDone() {
		this.todo.done = !this.todo.done;
		// update the DOM: this is needed since todo instance didn't changeds
		this.update();
		// notify parent about the change
		this.emit('change', this.todo);
		return false;
	}
});

var CNT = 0;
Qute('todo-list', {
	init() {
		this.input = null;
		return {
			todos: null
		}
	},
	connected() {
		this.input.focus();
	},
	todoList() {
		return this.getList('todos', 'id');
	},
	removeItem(e) {
		this.todoList().removeItem(e.detail);
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
});

export default Qute('root', {
	init() {
		return {
			todos: [
				{ id: "todo1", text: "Write some code", done: false },
				{ id: "todo2", text: "Drink a beer", done: true }
			]
		}
	}
});
```


## Example 2: Not using a component for the Todo item.

In this example the todo item template will be inlined in the todo list template.

This approach is better in term of memory usage since it doesn't instantiate a component for each item.

```jsq
//@style https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css

import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

// ------------------------------------------ Styles

<q:style>
.done {
  text-decoration: line-through;
}
</q:style>

// ------------------------------------------ Templates

<q:template name='todo-list'>
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

<q:template name='root'>
	<todo-list todos={todos}/>
</q:template>

// ------------------------------------------ Javascript

var CNT = 0;
Qute('todo-list', {
	init() {
		this.input = null;
		return { todos: null };
	},
	todoList() {
		return this.getList('todos', 'id');
	},
	connected() {
		this.input.focus();
	},
	removeItem(key) {
		this.todoList().removeItem(key);
		return false;
	},
	checkItem(key) {
		this.todoList().updateItem(key, item => {
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
});

export default Qute('root', {
	init() {
		return {
			todos: [
				{ id: "todo1", text: "Write some code", done: false },
				{ id: "todo2", text: "Drink a beer", done: true }
			]
		}
	}
});
```

## Example 3: Same as before but not using the Qute list helper.

Here is the same example as before, but without using the Qute list helper. The code is therefore a little more verbose.

**Note** that we use a special property `__dirty__` on the list instance to inform the udpater that a list item content changed. We can also clone the modified item and then replace the original item to force an item update.

```jsq
//@style https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css

import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

// ------------------------------------------ Styles

<q:style>
.done {
  text-decoration: line-through;
}
</q:style>

// ------------------------------------------ Templates

<q:template name='todo-list'>
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

<q:template name='root'>
	<todo-list todos={todos}/>
</q:template>

// ------------------------------------------ Javascript

var CNT = 0;
Qute('todo-list', {
	init() {
		this.input = null;
		return {
			todos: null
		}
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
});

export default Qute('root', {
	init() {
		return {
			todos: [
				{ id: "todo1", text: "Write some code", done: false },
				{ id: "todo2", text: "Drink a beer", done: true }
			]
		}
	}
});
```


