# The `q:markdown` attribute

This is similar to [q:html](#/attributes/q-html) but inject static markdown content into an element. \
For this to work, you must define a **markdown converter** by using:

```javascript
Qute.Rendering.markdown = markdownConverter;
```

where markdownConverter is a function that takes as argument the markdown content to convert and return the corresponding HTML content.

As an example, to use [marked.js](https://github.com/markedjs/marked) you will need include the `marked.js` script and to register it like this:

```javascript
Qute.Rendering.markdown = marked.parse;
```

It **only works on DOM elements** and cannot be used on component elements.

## Example

```jsq
<q:template export>
<div q:markdown>
# My Header

Some content
</div>
</q:template>
```

You can also pass the markdown content through an attribute value:

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

<q:template name='RootTemplate'>
<div q:markdown={content} />
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    @Property content = `
# My Header

Some content`;
}
export default Root;
```
