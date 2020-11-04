import { document } from '@qutejs/window';
import baseSpinner from '@qutejs/spinner-base';
import './ellipsis.css';

/*
<div class="qute-spinner-ellipsis">
  <div class="bounce1"></div>
  <div class="bounce2"></div>
  <div class="bounce3"></div>
</div>
*/

function createDot(className, color, size) {
	var div = document.createElement('DIV');
	var style = div.style;
	if (color) style.backgroundColor = color;
	if (size) {
		style.width = size;
		style.height = size;
	}
	div.className = className;
	return div;
}

export default function Spinner(r, xattrs) {
    const el = document.createElement('DIV');
	let color, size;
	if (xattrs) {
		color = xattrs.color;
		size = xattrs.size;
	}
    let className = 'qute-spinner-ellipsis';
	if (!color) {
		className += ' qute-spinner-ellipsis-colors';
	}
    el.className += className;
    baseSpinner(el, r, xattrs);
	el.appendChild(createDot('bounce1', color, size));
	el.appendChild(createDot('bounce2', color, size));
    el.appendChild(createDot('bounce3', color, size));
	return el;
}
