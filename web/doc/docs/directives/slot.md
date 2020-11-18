# Slot Directive

The slot directive can be used to inject templates inside a component from the caller context.

Let's say you want to create a component which display an alert message. You want this alert message to contain rich HTML text which can be specified by the caller when the component is used:

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='AlertMessage'>
<div class='alert'><slot/></div>
</q:template>

<q:template name='RootTemplate'>
<alert-message><b>Error:</b> {{errorMessage}}</alert-message>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    errorMessage = "Something bad happened!"
}
export default Root;
```

The content of the alert-message component will replace the <slot/> element in the component template.

**Note** that content can contain references to variables or other components and will be evaluated in the **context of the caller** (and not of the component defining the slot).
In our example the `errorMessage` variable will be evaluated in the contex of the component containing the 'alert-message'.

## Named slots

In some situations you may want more than one injectable content. In this case you can use named slots. Just give a name to your slots and then use the **nested** directive to inject the content to the correspondiong slot.

#### Example

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='AlertMessage'>
<div>
  <h3><slot name='title' /></h3>
  <div class='alert'><slot name='content'/></div>
</div>
</q:template>

<q:template name='RootTemplate'>
<alert-message>
	<nested name='title'>Error</nested>
	<nested name='content'>{{errorMessage}}</nested>
</alert-message>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    errorMessage = "Something bad happened!"
}
export default Root;
```

**Note** that the nested tag must be a direct child of the target component. Any content outside a nested directive which is a direct child of the target component will be ignored.

## Default Slot Value

A slot can have a default value. If no content is injected in the slot (i.e. no corresponding nested directive is used) then the slot will use the default value.

#### Example

```jsq
<q:template name='AlertMessage'>
<div class='alert'><slot>Unknown Error!</slot></div>
</q:template>

<q:template export>
<alert-message />
</q:template>
```

By calling `<alert-message/>` (with no content) then the slot will use the default value: `Unknown Error!`

If no default value is specified then no content will be displayed for a slot with no corresponding `nested` directive.

This applies to named slots too.

## Default slot

When using a single slot you don't need to use a name. But in fact the slot will automatically receive the name 'default'.

`<slot/>` is equivalent to `<slot name='default'/>`

In the same way a `nested` directive can be used without a name. In this case it will inject the content into the default slot.

`<nested>...</nested>` is equivalent to `<nested name='default'>...</nested>`

## Slot propagation

Slots can be propagated down to components on any nested level. Here is an example:

```jsq
<q:template name='MyTitle'>
	<h3><slot/></h3>
</q:template>

<q:template name='MyContent'>
	<div class='content'><slot/></div>
</q:template>

<q:template name='MyPanel'>
	<div class='panel'>
		<my-title>
			<nested><slot name='title'/></nested>
		</my-title>
		<my-content>
			<nested><slot name='content'/></nested>
		</my-content>
	</div>
</q:template>

<q:template export>
<my-panel>
	<nested name='title'>The panel title</nested>
	<nested name='content'>The panel content</nested>
</my-panel>
</q:template>
```

## Injecting variable content

You can also inject variable content inside slots. To do this, use the **[q:html](#/attributes/q-html)** attribute on the `nested` directive.

We can rewrite the previous example like this:

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template } = Qute;

<q:template name='MyTitle'>
	<h3><slot/></h3>
</q:template>

<q:template name='MyContent'>
	<div class='content'><slot/></div>
</q:template>

<q:template name='MyPanel'>
	<div class='panel'>
		<my-title>
			<nested><slot name='title'/></nested>
		</my-title>
		<my-content>
			<nested><slot name='content'/></nested>
		</my-content>
	</div>
</q:template>

<q:template name='RootTemplate'>
<my-panel>
    <nested name='title' q:html='title'/>
    <nested name='content'>The panel content</nested>
</my-panel>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    title = "The <span style='color: green'>title</span>";
}
export default Root;
```

In that case the `title` slot will get its HTML content from the variable named `title`. Of course the `title` variable is resolved in the context of the `my-panel` component.

## Testing if a slot was defined

You can use the `$slots` component property to test from the component template whether or not a slot was defined when component was used in a template. To test if a slot exists use this expression: `$slots && $slots['slot-name']` where `slot-name` is the slot name to test. To test if the default slot is defined, use: `$slots && $slots.default`.

Using this technique we can for example wrap the slot in an element only if the slot is defined:

```xml
<q:template name='TestSlot'>
    ...
    <if value={$slots && $slots.default}>
        <div class='slot-wrapper'>
            <slot />
        </div>
    </if>
    ...
</q:template>
```

## The `q:slot` attribute directive

A `<nested></nested>` element behaves like an HTML fragment that will be injected in a target slot.
Sometimes you may want to inject a single element in a target slot and not an HTML fragment. In that case you can use the `q:slot` directive.

A `q:slot` may take a value: the target slot name, or no value at all if the target slot is the default one.

**Example:**

```xml
<my-dialog>
	<h3 q:slot='title'>The title</h3>
	<div class='dialog-body' q:slot>The dialog body.</div>
</my-dialog>
```

The above example is equivalent to:

```xml
<my-dialog>
	<nested><h3>The title</h3></nested>
	<nested><div class='dialog-body'>The dialog body.</div></nested>
</my-dialog>
```

Here is an working example:

```jsq
<q:template name='MyDialog'>
    <div class='dialog' style='border:1px solid #cecece'>
        <div><slot name='title'/></div>
        <hr/>
        <div><slot/></div>
    </div>
</q:template>

<q:template export>
    <my-dialog>
        <h3 q:slot='title'>The title</h3>
        <div class='dialog-body' q:slot>The dialog body.</div>
    </my-dialog>
</q:template>
```
