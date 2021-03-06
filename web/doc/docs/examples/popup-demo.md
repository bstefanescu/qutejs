# Popup demo

```jsq
import Qute from '@qutejs/runtime';
import { qPopup, qPopupTrigger } from '@qutejs/popup';
const { ViewModel, Template, Property } = Qute;

<q:template name='RootTemplate'>
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
        <optgroup label='Cover'>
          <option value='coverdown start'>Cover Down + Start</option>
          <option value='coverdown end'>Cover Down + End</option>
          <option value='coverdown fill'>Cover Down + Fill</option>
          <option value='coverup start'>Cover Up + Start</option>
          <option value='coverup end'>Cover Up + End</option>
          <option value='coverup fill'>Cover Up + Fill</option>
        </optgroup>
    </select>
    <br/>
    <button class='popup-btn' q:popup-trigger='my-popup'>Open popup</button>

    <q:popup position={position} animation={animation} id='my-popup'>
        <div class='my-popup'>
          <h3>Popup header</h3>
          <div>
            The popup content
          </div>
        </div>
    </q:popup>
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

@Template(RootTemplate)
class Root extends ViewModel {
    @Property animation;
    @Property position = "bottom start";

    changeAnimation(e) {
      this.animation = e.target.value;
    }
    changePosition(e) {
      this.position = e.target.value;
    }
}
export default Root;
```

