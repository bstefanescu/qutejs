# If Directive

The if directive can be used to conditionally insert an HTML fragment.

The if directive supports 2 attributes:
* **value** - *required* - define the conditional expression (which will be evaluated in the current model context).
* **x-change** - *optional* - listener function which will be invoked when the if expression changes.
	The listener will be called in the context of the ViewModel containing the **if** directive (the `this` variable will point to the container component instance) and the current state (true of false) will be passed as the first argument.

	The first time the **if** directive is rendered the listener will not be notified.

**Note:** The if directive will not render at all the HTML fragment if the condition evaluates to false.
If you want to conditionaly hide or show an element then use the **[x-show](#/attributes/x-show)** attribute.

**Syntax:**

```xml
<if value='condition' x-change='funcName'> ... </if>
```

### Example

```jsq
<x-tag name='root'>
<if value='hasSection2' x-change='onSection2Toggle'>
  <h1>Section 2</h1>
  <div>
  	Section content here
  </div>
</if>
</x-tag>

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
<x-tag name='root'>
<if value='user' x-change='onUserChanged'>
  <div>Hello {{user.name}}. <a href='#logout' @click='doLogout'>Logout</a></div>
<else/>
  <div><a href='#login' @click='doLogin'>Login</a></div>
</if>
</x-tag>

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

