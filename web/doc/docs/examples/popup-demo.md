# Popup demo

```jsq
<q:template name='root'>
  <div>
    <b>Animation:</b> <select @change='changeAnimation'>
        <option value=''>None</option>
        <option value='fade'>Fade</option>
        <option value='slide'>Slide</option>
    </select>
    <b style='margin-left: 2em'>Position:</b>
    <select @change='changePosition'>
        <optgroup label='Bottom'>
          <option value='bottom start'>Bottom Start</option>
          <option value='bottom end'>Bottom End</option>
          <option value='bottom fill'>Bottom Fill</option>
          <option value='bottom center'>Bottom Center</option>
          <option value='bottom left'>Bottom Left</option>
          <option value='bottom right'>Bottom Right</option>
        </optgroup>
        <optgroup label='Top'>
          <option value='top start'>Top Start</option>
          <option value='top end'>Top End</option>
          <option value='top fill'>Top Fill</option>
          <option value='top center'>Top Center</option>
          <option value='top left'>Top Left</option>
          <option value='top right'>Top Right</option>
        </optgroup>
        <optgroup label='Right'>
          <option value='right start'>Right Start</option>
          <option value='right end'>Right End</option>
          <option value='right fill'>Right Fill</option>
          <option value='right center'>Right Center</option>
          <option value='right top'>Right Top</option>
          <option value='right bottom'>Right Bottom</option>
        </optgroup>
        <optgroup label='Left'>
          <option value='left start'>Left Start</option>
          <option value='left end'>Left End</option>
          <option value='left fill'>Left Fill</option>
          <option value='left center'>Left Center</option>
          <option value='left top'>Left Top</option>
          <option value='left bottom'>Left Bottom</option>
        </optgroup>
    </select>
    <br/>
    <button class='popup-btn' @click='openPopup'>Open popup</button>

    <popup position={position} animation={animation} q:channel='my-popup'>
        <div class='my-popup'>
          <h3>Popup header</h3>
          <div>
            The popup content
          </div>
        </div>
    </popup>
  </div>
</q:template>

<q:style>
.popup-btn {
  position: fixed;
  left: 50%;
  top: 50%;
  padding: 10px;
  font-weight: bold;
  transform: translate(-50%, -50%);
}
.my-popup {
  border: 1px solid black;
  padding: 10px;
  background-color: #FEF9E7;
}

.my-popup h3 {
  margin-top: 0;
}
</q:style>

export default Qute('root', {
    init() {
		return {
          position: 'bottom start',
          animation: null
        }
    },
    openPopup(event) {
      this.postAsync("my-popup", "open", event.target);
	},
    changeAnimation(e) {
      this.animation = e.target.value;
    },
    changePosition(e) {
      this.position = e.target.value;
    }
});
```

