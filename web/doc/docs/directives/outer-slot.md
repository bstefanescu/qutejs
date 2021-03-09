# Outer-Slot Directive

The `outer-slot` directive can be used in conjunction with a `slot` directive to conditionally add some HTML content if the slot is defined. If the slot is not defined the `outer-slot` content will not be displayed.

```xml
<q:template name='OuterSlotExample'>
    <div>
    Hello
    <outer-slot name='bottom'>
        <hr>
        <slot name='bottom' />
    </outer-slot>
    </div>
</q:template>
```

In the example above, if the 'bottom' slot is defined then it will be displayed after the `<hr>` element, otherwise the `<hr>` will not be displayed at all.

For more details see the **[slot directive](#/directives/slot)**.
