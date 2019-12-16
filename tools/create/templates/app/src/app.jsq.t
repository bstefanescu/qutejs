import Qute from '@qutejs/runtime';

<x-tag name='%%name%%'>
  <div>
    <h3>I am the {{$tag}} component</h3>
    Let's start <span>{{verb}}</span>!
  </div>
</x-tag>

export default Qute('%%name%%', {
  init() {
    return {
      verb: "coding"
    }
  }
});

