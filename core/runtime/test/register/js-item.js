import window from '@qutejs/window';

// register the js component:
function renderJsComponent(rendering, xattrs, slots) {
    var li = window.document.createElement('LI');
	var a = window.document.createElement('A');
    li.appendChild(a);
	a.href = rendering.eval(xattrs.href);
	a.textContent = rendering.eval(xattrs.text);
	return li;
}

export default renderJsComponent;
