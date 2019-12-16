# Popup Component

The popup component display a popup element that can be positioned relative to a **target** element.

## Attributes

### x-channel

This attribute is **required**.

Indicates, the channel name to use when interacting with the popup instance. The popup channel provides two message types **open** and **close**.

#### open

Open the popup. You must specify the **target** element as the extra data attribute of the message.

**Example**
```
ctx.post('popup-channel', 'open', targetEl);
```

#### close

Close the popup

**Example**
```
ctx.post('popup-channel', 'close');
```

### position

This attribute is **optional** and defaults to `bottom start`

Indicates the popup position relative to the target element. The position value is specified as a "position alignment" string where possible values are: `bottom`, `top`, `left` or `right` for position part and `start`, `end`, `center`, `fill`, `left`, `right`, `top` or `bottom` for the alignment part. When using a `vertical` only `horizontal` aligments can be specified. Same, when using an `horizontal`position only `vertical` aligment can be specified.

**Examples:** `bottom start`, `bottom right`, `bottom fill`, `right start`, `right center`, `right top` etc.

See the **[Popup demo](playground/index.html#popup-demo)** in the playground for all the possible positions.


### animation

This attribute is **optional** and defaults to `null`

Indicates the animation effect to use. Possible values are **fade** or **slide** (from top to bottom).
You can also use **custom animation names** by creating some `CSS` rules for your animation and a class named 'qute-effect-xxx' where xxx is the animation name.


Here are, as an example, the `CSS` rules for the `fade` animation:

```css
.qute-popup.qute-effect-fade .qute-popup-content {
  opacity: 0;
  -webkit-transition: opacity 0.3s;
  -moz-transition: opacity 0.3s;
  -ms-transition: opacity 0.3s;
  transition: opacity 0.3s;
}
.qute-popup.qute-effect-fade.qute-show .qute-popup-content {
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

### close

Fired when the popup is closed.

The `event.detail` field points to the popup root element.


## Example

```jsq
<x-tag name='root'>
  <div>
    <button style='margin-left: 50px; margin-top: 50px; padding: 10px'
      @click='this.post("my-popup", "open", $1.target)'>Open popup</button>
    <popup position='bottom start' animation='slide' x-channel='my-popup'
      @open='onOpen' @close='onClose'>
      <div style='border: 1px solid gray; padding: 10px'>
        <h3 style='margin-top:0'>Popup header</h3>
        <div>The popup content</div>
      </div>
    </popup>
  </div>
</x-tag>

export default Qute('root', {
  onOpen(event) {
    console.log('popup about to open', event.detail);
  },
  onClose(event) {
    console.log('popup closed', event.detail);
  }
});
```

## Demo

You can find a **[Popup Demo](playground/index.html#popup-demo)** into the playground.
