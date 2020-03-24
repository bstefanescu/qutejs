# Tag Directive

The tag directive can be used to render dynamic HTML tags or components by taking the actual tag name from a variable.

The tag name variable is specified through the *is* attribute. The **is** attribute is expecting a javascript expression. If you want to use a literal for example the string 'link', then you need to write `is="'link'"`.  \
You can use both `is='expr'` or `is={expr}` syntaxes to specify the `is` value.

### Examples

#### A dynamic HTML tag

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

<q:template name='action'>
<tag is='$attrs.is||"a"' href='#' q:emit-click><slot/></tag>
</q:template>

<q:template name='root'>
<action is='button' @click='window.alert("Hello!")'>My Button</action>
</q:template>

export default Qute('root');
```

#### A dynamic Qute component

```jsq
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';

<q:template name='link'>
<a class='link' href='#' q:emit-click><slot/></a>
</q:template>

<q:template name='component'>
<tag is='$attrs.is' q:attrs><nested><slot/></nested></tag>
</q:template>

<q:template name='root'>
<component is='link' @click='window.alert("Hello!")'>My Link</component>
</q:template>

export default Qute('root');
```

**Notes**

1. The `tag` directive is not reactive - that means if the `is` expression changes then the tag will no change. The `is` expression is only used the first time the directive is rendered

