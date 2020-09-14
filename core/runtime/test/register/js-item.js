import {document} from '@qutejs/window';

// register the js component:
function renderJsComponent(rendering, xattrs, slots) {
    var li = document.createElement('LI');
	var a = document.createElement('A');
    li.appendChild(a);
	a.href = rendering.eval(xattrs.href);
	a.textContent = rendering.eval(xattrs.text);
	return li;
}

export default renderJsComponent;

