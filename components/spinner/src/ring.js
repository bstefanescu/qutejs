import { document } from '@qutejs/window';
import Qute from '@qutejs/runtime';
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


function create(el, xattrs) {
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
	if (!color) {
		el.className += ' qute-spinner-colors';
	}
	el.appendChild(createPart(color, width));
	el.appendChild(createPart(color, width));
	el.appendChild(createPart(color, width));
	el.appendChild(createPart(color, width));
	return el;
}

export default {
	tag: 'DIV',
	class: 'qute-spinner-ring',
	create: create
};
