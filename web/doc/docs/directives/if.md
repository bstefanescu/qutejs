# If Directive

The if directive can be used to conditionally insert an HTML fragment.

The if directive supports 2 attributes:
* **value** - *required* - define the conditional expression (which will be evaluated in the current model context).
* **onchange** - *optional* - listener function which will be invoked when the if expression changes.
	The listener will be called in the context of the ViewModel containing the **if** directive (the `this` variable will point to the container component instance) and the active if branch index (0 for the if branch, 1 - for the next else-if branch, and so on) will be passed as the first argument. If no if branch is active then -1 is passed as argument (this happens when you are not using an `else` statement and any of the if conditions are met).

	The first time the **if** directive is rendered the listener will not be notified.

**Note:** The if directive will not render at all the HTML fragment if the condition evaluates to false.
If you want to conditionaly hide or show an element then use the **[q:show](#/attributes/q-show)** attribute.

**Syntax:**

```xml
<if value='condition' onchange='funcName'> ... </if>
```

### Example

```jsq
<q:template name='root'>
<if value='hasSection2'>
  <h1>Section 2</h1>
  <div>
  	Section content here
  </div>
</if>
</q:template>

export default Qute('root', {
	init() {
		return {
			hasSection2: true
		}
	}
});
```

# Else Directive

The else directive can be used in conjuction with the *if* directive. It can only be used as a direct child of the *if* element.

**Syntax:**

```xml
<if value='expression'> ... <else/> ... </if>
```

### Example

```jsq
<q:template name='root'>
<if value='user' onchange='onUserChanged'>
  <div>Hello {{user.name}}. <a href='#logout' @click='doLogout'>Logout</a></div>
<else/>
  <div><a href='#login' @click='doLogin'>Login</a></div>
</if>
</q:template>

export default Qute('root', {
	doLogin() {
		this.user = {name: 'Foo'};
	},
	doLogout() {
		this.user = null;
	},
	onUserChanged(hasUser) {
		console.log('user changed', hasUser);
	},
	init() {
		return {
			user: null
		}
	}
});
```

# Else-if directive

The else-if directive allows you to create conditional if / else if / else chains.

**Usage:**

```xml
<if value='expression1'>
	...
<else-if value='expression2' />
    ...
<else-if value='expression3' />
	...
</else>
	...
</if>
```

### Example

```jsq
<q:template name='root'>
	<div>
		Select status:
		<select @change='updateStatus'>
			<option value='active'>Active</option>
			<option value='closed'>Closed</option>
			<option value='other'>Unknown</option>
		</select>
		<hr/>
		<if value="status=='active'">
		Content for <i>active</i> status
		<else-if value="status=='closed'" />
		Content for <i>closed</i> status
		<else />
		Content for <i>unknown</i> status
		</if>
	</div>
</q:template>

export default Qute('root', {
	init() {
		return {
			status: 'active'
		}
	},
	updateStatus(e) {
		this.status = e.target.value;
	}
});
```


