# Modal Component

The modal component display a modal dialog.

To open a modal yuou need to get the the instance of the modal component to call the corresponding methods. To get the instance of a modal you can use the **[q:ref](#/attributes/q-ref)** attribute to inject the instance in a parent component property.

Another way to open a modal is to use the `id` attribute on the modal component to bind the modal component to a unique id, then on the modal trigger element you can use the `q:modal-trigger` attribute to identify open the modal on click. The `q:modal-trigger` takes the modal id as value:

```jsq-norun
import { qModal, qModalTrigger } from '@qutejs/modal';

<q:template export>
  <q:modal id='my-modal'>Some content</q:modal>
  <button q:modal-trigger='my-modal'>Click me</button>
</q:template>
```

The `qute-Modal` class name is used on the modal root element.

## Modal API

### `open()`

Open the modal.

### `openAsync()`
Call `open()` inside a `window.setTimeout()` using a 0 timeout.

### `close()`

Close the modal.

### `isOpen`

A read only property to get the open status of a modal component.

## Attributes

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

Fired when an `action` was clicked. A clickable `action` is any clickable element inside the modal that define a `data-modal-action` attribute. The attribute value will be the action name.

The `event.detail` field points to an object like:

```javascript
{
  name: 'the-action-name',
  target: theActionElement,
  modal: theModalComponentInstance
}
```

**Note** that the `close` action will trigger a `close` event instead of the `action` event.

**Example:** `<button data-modal-action='next'>Next</button>`.

## Example: Using `q:ref` to open the modal

To open the modal through the API we need to obtain the modal component instance using the `q:ref` attribute.

```jsq
import Qute from '@qutejs/runtime';
import { qModal } from '@qutejs/modal';

const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
  <div>
    <button style='margin-left: 10px; margin-top: 10px; padding: 10px'
      @click='openModal'>Open modal</button>
    <q:modal q:ref='theModal' animation='scale-up'
      @open='onOpen' @close='onClose' @ready='onReady' @action='onAction'>
      <div style='border: 1px solid gray'>
        <h3 style='padding: 10px;margin-top:0; border-bottom: 1px solid gray'>Modal header</h3>
        <div style='padding: 10px'>
            The modal content.
            <hr>
            <button data-modal-action='my-action'>Modal Action</button>
        </div>
      </div>
    </q:modal>
  </div>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {

  theModal;

  openModal(event) {
    this.theModal.open();
  }
  onOpen(event) {
    console.log('modal about to open', event.detail);
  }
  onReady(event) {
    console.log('modal ready', event.detail);
  }
  onClose(event) {
    console.log('modal about to close', event.detail);
  }
  onAction(event) {
    console.log('modal action', event.detail);
    alert("Action: "+event.detail.name+" Dialog will be closed.");
    event.detail.modal.close();
  }
}
export default Root;
```

## Example: Using `q:modal-trigger` to open the modal

```jsq
import Qute from '@qutejs/runtime';
import { qModal, qModalTrigger } from '@qutejs/modal';

const { ViewModel, Template } = Qute;

<q:template name='RootTemplate'>
  <div>
    <button q:modal-trigger='my-modal' style='margin-left: 10px; margin-top: 10px; padding: 10px'>Open modal</button>
    <q:modal animation='scale-up' id='my-modal'
      @open='onOpen' @close='onClose' @ready='onReady' @action='onAction'>
      <div style='border: 1px solid gray'>
        <h3 style='padding: 10px;margin-top:0; border-bottom: 1px solid gray'>Modal header</h3>
        <div style='padding: 10px'>
            The modal content.
            <hr>
            <button data-modal-action='my-action'>Modal Action</button>
        </div>
      </div>
    </q:modal>
  </div>
</q:template>

@Template(RootTemplate)
class Root extends ViewModel {
  onOpen(event) {
    console.log('modal about to open', event.detail);
  }
  onReady(event) {
    console.log('modal ready', event.detail);
  }
  onClose(event) {
    console.log('modal about to close', event.detail);
  }
  onAction(event) {
    console.log('modal action', event.detail);
    alert("Action: "+event.detail.name+" Dialog will be closed.");
    event.detail.modal.close();
  }
}
export default Root;
```

## Demo

You can find a **[Modal Demo here](#/examples/modal-demo)**.
