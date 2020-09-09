import { document } from '@qutejs/window';
import Spinner from '@qutejs/spinner';
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


function create(el, xattrs) {
	var color, size;
	if (xattrs) {
		color = xattrs.color;
		size = xattrs.size;
	}
	if (!color) {
		el.className += ' qute-spinner-ellipsis-colors';
	}
	el.appendChild(createDot('bounce1', color, size));
	el.appendChild(createDot('bounce2', color, size));
	el.appendChild(createDot('bounce3', color, size));
	return el;
}

Spinner.add('ellipsis', {
	tag: 'DIV',
	class: 'qute-spinner-ellipsis',
	create: create
});

export default Spinner;
