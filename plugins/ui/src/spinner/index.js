import { document } from '@qutejs/window';
import baseSpinner from './base-spinner';
import './ring.css';

/*
<div class="qute-spinner-ring">
  <div></div>
  <div></div>
  <div></div>
  <div></div>
</div>
*/

function createPart(color, width) {
	var div = document.createElement('DIV');
	if (width) {
		div.style.borderWidth = width;
	}
	if (color) {
		div.style.borderColor = color+" transparent transparent transparent";
	}
	return div;
}


function qSpinner(r, xattrs) {
    var el = document.createElement('DIV');
	var color, size, width;
	if (xattrs) {
		color = xattrs.color;
		size = xattrs.size;
		width = xattrs.width;
	}
	if (size) {
		el.style.width = size;
		el.style.height = size;
    }
    let className = 'qute-spinner-ring';
	if (!color) {
		className += ' qute-spinner-colors';
    }
    el.className = className;
    baseSpinner(el, r, xattrs);
	el.appendChild(createPart(color, width));
	el.appendChild(createPart(color, width));
	el.appendChild(createPart(color, width));
	el.appendChild(createPart(color, width));
	return el;
}

export { qSpinner, baseSpinner };
