import Qute from '@qutejs/runtime';

<q:template name='%%name%%'>
  <div>
    <h3>I am the {{$tag}} component</h3>
    Let's start <span>{{verb}}</span>!
  </div>
</q:template>

export default Qute('%%name%%', {
  init() {
    return {
      verb: "coding"
    }
  }
});

