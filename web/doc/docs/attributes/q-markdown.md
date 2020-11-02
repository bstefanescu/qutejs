# The `q:markdown` attribute

This is a marker attribute (doesn't take a value) and can be used to inject static markdown content.
The markdown content will be converted into an HTML string before being inserted.

For this to work, you must define a **markdown converter** by using:

```javascript
Qute.converters.markdown = markdownConverter;
```

where markdownConverter is a function that takes as argument the markdown content to convert and return the corresponding HTML content.

As an example, to use [marked.js](https://github.com/markedjs/marked) you will need include the `marked.js` script and to register it like this:

```javascript
Qute.Rendering.converters.markdown = marked;
```

It **only works on DOM elements** and cannot be used on component tags.

## Example

```jsq
<q:template export>
<div q:markdown>
# My Header

Some content
</div>
</q:template>
```

You can also pass the markdown content through an attribute:

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


# The q:content-* attribute

In the same way, you can use any type of content to be converted into HTML and inserted in an element.
Just use the attribute `q:content-typeName` where **typeName** is the name of the type to convert and register the converter using the same type name:

```javascript
Qute.Rendering.converters.typeName = theConvertFunction;
```

## Example

```jsq
<q:template export>
<div q:content-random />
</q:template>

Qute.Rendering.converters.random = function() {
	return Math.random().toString(36).substring(2, 15);
}
```


