# The q:html attribute

This attribute can be used to inject static or dynamic HTML content into an element.

It **only works on DOM elements** and cannot be used on component tags.

## Injecting HTML content through reactive properties

**Usage:**

```xml
<div q:html='someVar'/>
```

where `someVar` resolve to a valid HTML text. The HTML text will be injected as the content of the div tag without being interpreted as a template.

```jsq
import Qute from '@qutejs/runtime';

<q:template name='root'>
<div q:html='content' />
</q:template>

export default Qute('root', {
	init() {
		return {
			content: "<p>This is some <b>HTML</b> content</p><p>Expressions are not interpreted: {{someProperty}}</p>",
			someProperty: 'hello!'
		}
	}
});
```
changing the `content` property value will be reflected in the DOM:


```jsq
import Qute from '@qutejs/runtime';

<q:template name='root'>
<div>
  <div q:html='content' />
  <button @click='changeContent' q:toggle-disabled={changed}>Click to change</button>
</div>
</q:template>

export default Qute('root', {
	init() {
		return {
			content: "<p>This is some <b>HTML</b> content</p><p>Expressions are not interpreted: {{someProperty}}</p>",
			someProperty: 'hello!',
			changed: false
		}
	},
	changeContent() {
		this.content = "<p>The content <b>changed</b>!</p>";
		this.changed = true;
	}
});
```


## Injecting inline HTML content

**Example:**

```jsq
import Qute from '@qutejs/runtime';

<q:template name='root'>
<div q:html>
    <p>This is some <b>HTML</b> content</p>
    <p>Expressions are not interpreted: {{someProperty}}</p>
</div>
</q:template>

export default Qute('root', {someProperty: "hello!"})
```

This construct is usefull to nest static content which will be never interpreted. It will be rendered as is.


