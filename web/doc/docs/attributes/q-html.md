# The `q:html` attribute

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
const { ViewModel, Template, Property } = Qute;

<q:template name='RootTemplate'>
    <div q:html={content} />
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    @Property content = "<p>This is some <b>HTML</b> content</p><p>Expressions are not interpreted: {{someProperty}}</p>";
    @Property someProperty = 'hello!';
}
export default Root;
```

changing the `content` property value will be reflected in the DOM:

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

<q:template name='RootTemplate'>
<div>
  <div q:html='content' />
  <button @click='changeContent' q:toggle-disabled={changed}>Click to change</button>
</div>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    @Property content = "<p>This is some <b>HTML</b> content</p><p>Expressions are not interpreted: {{someProperty}}</p>";
    @Property someProperty = 'hello!';
    @Property changed = false;

    changeContent() {
		this.content = "<p>The content <b>changed</b>!</p>";
		this.changed = true;
	}
}
export default Root;
```


## Injecting inline HTML content

**Example:**

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
<div q:html>
    <p>This is some <b>HTML</b> content</p>
    <p>Expressions are not interpreted: {{someProperty}}</p>
</div>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    someProperty = "hello!"
}
export default Root;
```

This construct is usefull to nest static content which will be never interpreted. It will be rendered as is.


