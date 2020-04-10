import { document } from '@qutejs/window';
import Qute from '@qutejs/runtime';
import Spinner from '@qutejs/spinner';
import css from './2dots.css';


/*
<div class="qute-spinner-2dots">
  <div class="dot1"></div>
  <div class="dot2"></div>
</div>
*/

function createDot(className, color) {
	var div = document.createElement('DIV');
	if (color) div.style.backgroundColor = color;
	div.className = className;
	return div;
}


function create(el, xattrs) {
	var color, color1, color2, size;
	if (xattrs) {
		color = xattrs.color;
		color1 = xattrs.color1;
		color2 = xattrs.color2;
		if (color) {
			if (!color1) color1 = color;
			if (!color2) color2 = color;
		}
		size = xattrs.size;
	}
	if (size) {
		el.style.width = size;
		el.style.height = size;
	}
	if (!color1 && !color2) {
		el.className += ' qute-spinner-2dots-colors';
	}
	el.appendChild(createDot('dot1', color1));
	el.appendChild(createDot('dot2', color2));
	return el;
}

Qute.css(css);

Spinner.add('2dots', {
	tag: 'DIV',
	class: 'qute-spinner-2dots',
	create: create
});

export default Spinner;

