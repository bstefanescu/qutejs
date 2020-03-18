# Tag Directive

The tag directive can be used to render dynamic HTML tags or components by taking the actual tag name from a variable.

The tag name variable is specified through the *is* attribute. The **is** attribute is expecting a javascript expression. If you want to use a literal for example the string 'link', then you need to write `is="'link'"`.  \
You can use both `is='expr'` or `is={expr}` syntaxes to specify the `is` value.

### Examples

#### A dynamic HTML tag

```jsq
<x-tag name='action'>
<tag is='$attrs.is||"a"' href='#' q:emit-click><slot/></tag>
</x-tag>

<x-tag name='root'>
<action is='button' @click='window.alert("Hello!")'>My Button</action>
</x-tag>

export default Qute('root');
```

#### A dynamic Qute component

```jsq
<x-tag name='link'>
<a class='link' href='#' q:emit-click><slot/></a>
</x-tag>

<x-tag name='component'>
<tag is='$attrs.is' x-attrs><nested><slot/></nested></tag>
</x-tag>

<x-tag name='root'>
<component is='link' @click='window.alert("Hello!")'>My Link</component>
</x-tag>

export default Qute('root');
```

**Notes**

1. The `tag` directive is not reactive - that means if the `is` expression changes then the tag will no change. The `is` expression is only used the first time the directive is rendered

