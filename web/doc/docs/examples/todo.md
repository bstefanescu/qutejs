# Todo List

We implemented the Todo List in 3 different ways.

The following examples demonstrates the usage of:

1. the **[x-for](#/attributes/x-for)** directive.
2. the `ViewModel.getList()` helper to easily manipulate reactive list properties.
3. the `Qute.closestListItem(el)` method to retrieve the closest list item rendering context containing a DOM element.


## Example 1: Using a component for the todo item

We will create 2 ViewModel components: `todo-list` and `todo-item`.

The `todo-list` component is responsible for managing the list structure, while the `todo-item` is rendering a single item and is responsible for updating the item status.


```jsq
//@style https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css

//import Qute from '@qutejs/runtime';

// ------------------------------------------ Styles

<x-style>
.done {
  text-decoration: line-through;
}
</x-style>

// ------------------------------------------ Templates

<x-tag name='todo-item'>
	<li class="list-group-item d-flex justify-content-between align-items-center">
        <span>
	        <a href='#' @click='toggleDone'>&#x2714;</a>
	        <span x-class='{done:todo.done}'>{{todo.text}}</span>
        </span>
		<span><a href='#' class='close' x-emit:remove@click={todo.id}>&times;</a></span>
	</li>
</x-tag>

<x-tag name='todo-list'>
	<div>
		<ul class="list-group">
			<todo-item x-for='item in todos' x-key='id' todo={item} @remove='removeItem' />
		</ul>
		<form class='d-flex'>
			<input x-call='el => input = el' type='text' class='form-control' style='display:inline-block'/>
			<button class='btn btn-primary' @click='addItem'>Add</button>
		</form>
		<div style='text-align:center; margin-top: 10px'>
			<button @click='exportJson'>Export as JSON</button>
		</div>
	</div>
</x-tag>

<x-tag name='root'>
	<todo-list todos={todos}/>
</x-tag>

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
		this.todoList().remove(e.detail);
		return false;
	},
	addItem() {
		var text = this.input.value;
		if (text) {
			var randomId = 'todo-'+Date.now()+'-'+(CNT++);
			this.todoList().push({id: randomId, text: text, done: false});
			this.input.value = '';
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

Because we don't use a component for each item we need to explicitly update the DOM corresponding to the updated item through the `list.updateItem(el)` method.

```jsq
//@style https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css

//import Qute from '@qutejs/runtime';

// ------------------------------------------ Styles

<x-style>
.done {
  text-decoration: line-through;
}
</x-style>

// ------------------------------------------ Templates

<x-tag name='todo-list'>
	<div>
		<ul class="list-group">
			<li x-for='item in todos' x-key='id' class="list-group-item d-flex justify-content-between align-items-center">
	            <span>
		            <a href='#' @click='e=>checkItem(item.id, e.target)'>&#x2714;</a>
		            <span x-class='{done:item.done}'>{{item.text}}</span>
	            </span>
				<span><a href='#' class='close' @click='e=>removeItem(item.id)'>&times;</a></span>
			</li>
		</ul>
		<form class='d-flex'>
			<input x-call='el => input = el' type='text' class='form-control' style='display:inline-block'/>
			<button class='btn btn-primary' @click='addItem'>Add</button>
		</form>
		<div style='text-align:center; margin-top: 10px'>
			<button @click='exportJson'>Export as JSON</button>
		</div>
	</div>
</x-tag>

<x-tag name='root'>
	<todo-list todos={todos}/>
</x-tag>

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
		this.todoList().remove(key);
		return false;
	},
	checkItem(key, el) {
		var list = this.todoList();
		var item = list.get(key);
		if (item) {
			item.done = !item.done;
			list.updateItem(el);
		}
		return false;
	},
	addItem() {
		var text = this.input.value;
		if (text) {
			var randomId = 'todo-'+Date.now()+'-'+(CNT++);
			this.todoList().push({id: randomId, text: text, done: false});
			this.input.value = '';
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

**Note** that we use `Qute.closestListItem(el).update()` to do the same as `list.updateItem(el)`.

```jsq
//@style https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css

//import Qute from '@qutejs/runtime';

// ------------------------------------------ Styles

<x-style>
.done {
  text-decoration: line-through;
}
</x-style>

// ------------------------------------------ Templates

<x-tag name='todo-list'>
	<div>
		<ul class="list-group">
			<li x-for='item in todos' x-key='id' class="list-group-item d-flex justify-content-between align-items-center">
	            <span>
		            <a href='#' @click='e=>checkItem(item.id, e.target)'>&#x2714;</a>
		            <span x-class='{done:item.done}'>{{item.text}}</span>
	            </span>
				<span><a href='#' class='close' @click='e=>removeItem(item.id)'>&times;</a></span>
			</li>
		</ul>
		<form class='d-flex'>
			<input x-call='el => input = el' type='text' class='form-control' style='display:inline-block'/>
			<button class='btn btn-primary' @click='addItem'>Add</button>
		</form>
		<div style='text-align:center; margin-top: 10px'>
			<button @click='exportJson'>Export as JSON</button>
		</div>
	</div>
</x-tag>

<x-tag name='root'>
	<todo-list todos={todos}/>
</x-tag>

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
	findItemIndex(key) {
		return this.todos ? this.todos.findIndex(item => item.id === key) : -1;
	},
	removeItem(key) {
		var i = this.findItemIndex(key);
		if (i > -1) {
			var todos = this.todos;
			todos.splice(i, 1);
			this.todos = todos.slice();
		}
		return false;
	},
	checkItem(key, el) {
		var i = this.findItemIndex(key);
		if (i > -1) {
			this.todos[i].done = !this.todos[i].done;
		}
		Qute.closestListItem(el).update();
		return false;
	},
	addItem(e) {
		var text = this.input.value;
		if (text) {
			var todos = this.todos || [];
			var randomId = 'todo-'+Date.now()+'-'+(CNT++);
			todos.push({id: randomId, text: text, done: false})
			this.todos = todos.slice(); // change the list instance to force update
			this.input.value = '';
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


