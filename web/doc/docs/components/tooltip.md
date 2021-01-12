# Tooltip Component

A customizable attribute directive to display tooltips on target elements. 
The tooltip component is using the **[popup component](#/components/popup)** to display the tooltip popup.

## Basic usage

```jsq
import { qTooltip } from '@qutejs/tooltip';

<q:template export>
  <div style='padding: 20px;'>
    Hello <i q:tooltip='John Doe'>John</i>!
  </div>
</q:template>
```

You can also use HTML formatted text by injecting the tooltip text from a property of the container component:

```jsq
import Qute from '@qutejs/runtime';
import { qTooltip } from '@qutejs/tooltip';

const {ViewModel, Template, Property} = Qute;


<q:template name='RootTemplate'>
  <div style='padding: 20px;'>
    Hello <i q:tooltip={fullName}>{{firstName}}</i>!
  </div>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
    @Property(String) firstName = 'John';
    @Property(String) lastName = 'Doe';
    @Property(String) role = 'Member';

    get fullName() {
      return this.firstName + ' ' + this.lastName + ' - <b>'+this.role+'</b>';
    }
}

export default Root;
```

## Tooltip configuration

Here is a list of the configurable tooltip properties:

* **position** - defaults to `'top'`
* **align** - defaults to `'center'`
* **animation** - defaults to `'fade'`
* **delay** - defaults to `600`

You can customize these properties either globally (the configuration will apply to all tooltips]) by setting the properties of the `Tooltip.defaultOpts` object, either by creating a custom tooltip attribute. 

### Global cusotmization

```jsq
import { qTooltip, Tooltip } from '@qutejs/tooltip';

Tooltip.defaultOpts.position = "right";
Tooltip.defaultOpts.align = "center";

<q:template export>
  <div style='padding: 20px;'>
    Hello <i q:tooltip='John Doe'>John</i>!
  </div>
</q:template>
```

### Creating a custom tooltip

```jsq
import { Tooltip } from '@qutejs/tooltip';

const qTooltip = Tooltip.create({
  position: "bottom",
  align: "center",
  animation: "slide",
  delay: 200
});

<q:template export>
  <div style='padding: 20px;'>
    Hello <i q:tooltip='John Doe'>John</i>!
  </div>
</q:template>
```

## Customizing styles

You can modify the default style of the tooltip by overriding the class rule:

```css
.qute-Popup.qute-Popup--tooltip .qute-Popup-content {
    -webkit-font-smoothing: antialiased;
    background-color: #232F34;
    color: white;
    font-size: 1rem;
    padding: 4px 6px;
    margin: 10px;
    pointer-events:none;
    border-radius: 2px;
}
```
