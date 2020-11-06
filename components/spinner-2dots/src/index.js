import { document } from '@qutejs/window';
import baseSpinner from '../../spinner/src/base-spinner.js';
import './2dots.css';


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


export default function Spinner(r, xattrs) {
    const el = document.createElement('DIV');
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
    let className = 'qute-spinner-2dots';
	if (!color1 && !color2) {
		className += ' qute-spinner-2dots-colors';
    }
    el.className = className;
    baseSpinner(el, r, xattrs);
	el.appendChild(createDot('dot1', color1));
	el.appendChild(createDot('dot2', color2));
	return el;
}

