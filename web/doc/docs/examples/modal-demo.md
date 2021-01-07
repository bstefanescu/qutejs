# Modal Demo

```jsq
import Qute from '@qutejs/runtime';
import { qModal, qModalTrigger } from '@qutejs/modal';
const { ViewModel, Template, Property } = Qute;

<q:template name='RootTemplate'>
  <div>
    <b>Animation:</b> <select @change='changeAnimation'>
        <option value=''>None</option>
        <option value='scale-up'>Fade-in and Scale Up</option>
        <option value='slide-right'>Slide from Right</option>
        <option value='slide-bottom'>Slide from Bottom</option>
        <option value='newspaper'>Newspaper</option>
        <option value='fall'>Fall</option>
        <option value='side-fall'>Side Fall</option>
        <option value='sticky-up'>Slide and Stick to Top</option>
  </select>
    <br/>
    <button q:modal-trigger='my-modal' style='padding:10px;margin:10px;'>Open modal</button>

    <q:modal animation={animation} id='my-modal'>
        <div class='my-modal' sttyle='border: 1px solid gray'>
          <h3 style='padding: 10px;margin-top:0; border-bottom: 1px solid gray'>Modal header</h3>
          <div style='padding:10px'>
            The modal content
          </div>
        </div>
    </q:modal>
  </div>
</q:template>


@Template(RootTemplate)
class Root extends ViewModel {
    @Property animation;

    changeAnimation(e) {
      this.animation = e.target.value;
    }
}
export default Root;
```

