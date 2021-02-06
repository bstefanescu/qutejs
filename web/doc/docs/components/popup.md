# Popup Component

The popup component display a popup element that can be positioned relative to a **target** element.

To open a popup yuou need to get the the instance of the popup component to call the corresponding method. To get the instance of a popup you can use the **[q:ref](#/attributes/q-ref)** attribute to inject the instance in a parent component property. 

Another way to open a popup is to use the `id` attribute on the popup component to bind the popup component to a unique id, then on the popup trigger element you can use the `q:popup-trigger` attribute to identify open / close the popup on click. The `q:popup-trigger` takes the popup id as value:

```jsq-norun
import { qPopup, qPopupTrigger } from '@qutejs/popup';

<q:template export>
  <q:popup id='my-popup'>Some content</q:popup>
  <button q:popup-trigger='my-popup'>Click me</button>
</q:template>

```

The `qute-Popup` class name is used on the popup root element.

## Popup API

### `open(anchor)`

Open the popup relative to the given anchor element.

### `openAsync(anchor)`
Call `open()` inside a `window.setTimeout()` using a 0 timeout.

### `toggle(anchor)`

Toggle the popup relative to the given anchor element. The `toggleNow` attribute is optional and defaults to false. If false, the popup will be toggled _asynchrounously_ (i.e. after the current UI loop task is processed)

### `toggleAsync(anchor)`
Call `toggle()` inside a `window.setTimeout()` using a 0 timeout.

### `close()`

Close the popup

### `isOpen`

A read only property to get the open status of a popup component.

## Attributes

### position

This attribute is **optional** and defaults to `bottom start`

Indicates the popup position relative to the target element. The position value is specified as a "position alignment" string where possible values are: `bottom`, `top`, `left`, `right`, `coverdown`, `coverup` for position part and `start`, `end`, `center`, `fill`, `left`, `right`, `top` or `bottom` for the alignment part. When using a `vertical` position only `horizontal` aligments can be specified. Same, when using an `horizontal` position only `vertical` aligment can be specified.

**Examples:** `bottom start`, `bottom right`, `bottom fill`, `right start`, `right center`, `right top` etc.

See the **[Popup demo](playground/index.html#popup-demo)** in the playground for all the possible positions.

**Note** The `position` property is a **hint**. The popup will be displayed as close as possible to the given position, depending on the parent client area. If the popup will not be entirely visible then it will  be moved to fit into the parent client area. All overflowing parents (i.e. having the posibility to scroll) and the window viewport are used to compute the final position. If you need to restrict the positioning to a certain container element (and not to the window viewport) you can use a `qute-Popup--container` class on the container element. You can have multiple nested `qute-Popup--container` elements: in that case only the closest container to the popup trigger will be used as the container.

### animation

This attribute is **optional** and defaults to `null`

Indicates the animation effect to use. Possible values are **fade** or **slide** (from top to bottom).
You can also use **custom animation names** by creating some `CSS` rules for your animation and a class named 'qute-effect-xxx' where xxx is the animation name.


Here are, as an example, the `CSS` rules for the `fade` animation:

```css
.qute-Popup--fade .qute-Popup-content {
    opacity: 0;
    transition: opacity 0.3s;
}

.qute-Popup--fade.is-visible .qute-Popup-content {
    opacity: 1;
}
```

### auto-close

This attribute is **optional** and defaults to `true`.

Indicates whether or not to auto close the popup when clicking outside.

## Events

### open

Fired when the popup is opened but before becoming visible.

The `event.detail` field points to the popup root element.

### ready

Fired when the popup is opened and after becoming visible.

The `event.detail` field points to the popup root element.

### close

Fired when the popup is closed.

The `event.detail` field points to the popup root element.

## Example: Using `q:ref` to open the popup

To open the popup through the API we need to obtain the popup component instance using the `q:ref` attribute.

```jsq
import Qute from '@qutejs/runtime';
import { qPopup } from '@qutejs/popup';

const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
  <div>
    <button style='margin-left: 50px; margin-top: 50px; padding: 10px'
      @click='openPopup'>Open popup</button>
    <q:popup q:ref='thePopup' position='bottom start' animation='slide'
      @open='onOpen' @close='onClose'>
      <div style='border: 1px solid gray; padding: 10px'>
        <h3 style='margin-top:0'>Popup header</h3>
        <div>The popup content</div>
      </div>
    </q:popup>
  </div>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
  openPopup(event) {
    this.thePopup.toggle(event.target);
  }
  onOpen(event) {
    console.log('popup about to open', event.detail);
  }
  onClose(event) {
    console.log('popup closed', event.detail);
  }
}
export default Root;
```

## Example: Using `q:popup-trigger` to open the popup

```jsq
import Qute from '@qutejs/runtime';
import { qPopup, qPopupTrigger } from '@qutejs/popup';

const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
  <div>
    <button style='margin-left: 50px; margin-top: 50px; padding: 10px'
      q:popup-trigger='my-popup'>Open popup</button>
    <q:popup position='bottom start' animation='slide' id='my-popup'
      @open='onOpen' @close='onClose'>
      <div style='border: 1px solid gray; padding: 10px'>
        <h3 style='margin-top:0'>Popup header</h3>
        <div>The popup content</div>
      </div>
    </q:popup>
  </div>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
  onOpen(event) {
    console.log('popup about to open', event.detail);
  }
  onClose(event) {
    console.log('popup closed', event.detail);
  }
}
export default Root;
```

## Demo

You can find a **[Popup Demo here](#/examples/popup-demo)**.
