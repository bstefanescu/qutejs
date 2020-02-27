# Todo List

```jsq
//@style https://stackpath.bootstrapcdn.com/bootstrap/4.4.1/css/bootstrap.min.css

<x-style>
.done {
  text-decoration: line-through;
}
</x-style>

<x-tag name='todo-list'>
	<div>
	<ul class="list-group">
		<li x-for='item in todos' x-key={item.id} class="list-group-item d-flex justify-content-between align-items-center">
            <span>
            <a href='#' @click='e=>checkItem(item.key)'>&#x2714;</a>
            <span x-class='{done:item.done}'>{{item.text}}</span>
            </span>
			<span><a href='#' class='close' @click='e=>removeItem(item.key)'>&times;</a></span>
		</li>
	</ul>
	<form class='form-inline'>
	<input x-call='el => input = el' type='text' class='form-control' style='display:inline-block'/>
	<button class='btn btn-primary' @click='addItem'>Add</button>
	</form>
	</div>
</x-tag>

<x-tag name='root'>
	<todo-list todos={todos}/>
</x-tag>

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
		return this.todos ? this.todos.findIndex(item => item.key === key) : -1;
	},
	removeItem(key) {
		var i = this.findItemIndex(key);
		if (i > -1) {
			var todos = this.todos;
			todos.splice(i, 1);
			this.todos = todos.splice();
		}
		return false;
	},
	checkItem(key) {
		var i = this.findItemIndex(key);
		if (i > -1) {
			this.todos[i].done = true;
		}
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