import {document} from '@qutejs/window';
import Qute from '../..';

// register the js component:
function renderJsComponent(rendering, xattrs, slots) {
	var li = document.createElement('LI');
	var a = document.createElement('A');
    li.appendChild(a);
	a.href = rendering.eval(this.$attrs.href);
	a.textContent = rendering.eval(this.$attrs.text);
	return li;
}

export default Qute('js-item', renderJsComponent);

