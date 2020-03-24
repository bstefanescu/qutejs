# Modal Component

The modal component display a modal dialog.

## Attributes

### q:channel

This attribute is **required**.

Indicates, the channel name to use when interacting with the modal instance. The modal channel provides two message types **open** and **close**.

#### open

Open the modal.

**Example**
```
app.post('modal-channel', 'open');
```

#### close

Close the modal.

**Example**
```
app.post('modal-channel', 'close');
```

### animation

This attribute is **optional** and defaults to `null`

Indicates the animation effect to use: Possible values are

* **scale-up**
* **slide-right**
* **slide-bottom**
* **newspaper**
* **fall**
* **side-fall**
* **sticky-up**

You can create a custom animation through `CSS` and by creating a custom class named `md-effect-xxx` where xxx is the animation name.

Here are, as an example, the `CSS` rules for the `slide-right` animation:


```css
.md-effect-slide-right .md-content {
  -webkit-transform: translateX(20%);
  -moz-transform: translateX(20%);
  -ms-transform: translateX(20%);
  transform: translateX(20%);
  opacity: 0;
  -webkit-transition: all 0.3s cubic-bezier(0.25, 0.5, 0.5, 0.9);
  -moz-transition: all 0.3s cubic-bezier(0.25, 0.5, 0.5, 0.9);
  transition: all 0.3s cubic-bezier(0.25, 0.5, 0.5, 0.9);
}

.md-show.md-effect-slide-right .md-content {
  -webkit-transform: translateX(0);
  -moz-transform: translateX(0);
  -ms-transform: translateX(0);
  transform: translateX(0);
  opacity: 1;
}
```

### close-on-esc

This attribute is **optional** and defaults to `true`.

Indicates whether or not to close the modal when pressing the `ESC` key.

### close-on-click

This attribute is **optional** and defaults to `true`.

Indicates whether or not to close the modal when clicking outside.

### disable-scroll

This attribute is **optional** and defaults to `true`.

Indicates whether or not to disable page scrolling when modal is displayed.

## Events

### open

Fired when the modal is opened but before becoming visible.

The `event.detail` field points to the modal root element.

### ready

Fired after the modal was opened. When this event is fired, the animation (if any) already ended and the modal is visible.

The `event.detail` field points to the modal root element.

### close

Fired when the modal is closed.

The `event.detail` field points to the modal root element.

### action

Fired when an `action` was clicked. A clickable `action` is any clickable element inside the modal that define a `data-md-action` attribute. The attribute value will be the action name.

The `event.detail` field points to an object like:

```javascript
{
  name: 'the-action-name',
  target: theActionElement,
  modal: theModalRootElement
}
```

**Note** that the `close` action will trigger a `close` event instead of the `action` event.

**Example:** `<button data-md-action='next'>Next</button>`.


## Example

```jsq
import Qute from '@qutejs/runtime';
import '@qutejs/modal';

<q:template name='root'>
  <div>
    <button style='margin-left: 10px; margin-top: 10px; padding: 10px'
      @click='this.post("my-modal", "open")'>Open modal</button>
    <modal animation='scale-up' q:channel='my-modal'
      @open='onOpen' @close='onClose' @ready='onReady' @action='onAction'>
      <div style='border: 1px solid gray'>
        <h3 style='padding: 10px;margin-top:0; border-bottom: 1px solid gray'>Modal header</h3>
        <div style='padding: 10px'>
            The modal content.
            <hr>
            <button data-md-action='my-action'>Modal Action</button>
        </div>
      </div>
    </modal>
  </div>
</q:template>

export default Qute('root', {
  onOpen(event) {
    console.log('modal about to open', event.detail);
  },
  onReady(event) {
    console.log('modal ready', event.detail);
  },
  onClose(event) {
    console.log('modal about to close', event.detail);
  },
  onAction(event) {
    console.log('modal action', event.detail);
    alert("Action: "+event.detail.name+" Dialog will be closed.");
    this.post('my-modal', 'close');
  }
});
```

## Demo

You can find a **[Modal Demo here](#/examples/modal-demo)**.
