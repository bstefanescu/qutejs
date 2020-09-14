import Qute from '@qutejs/runtime';
import ringSpinner from './ring.js';

var spinners = {
	"default": ringSpinner
};
var defSpinner = "default";

function Spinner(r, xattrs) {
	var type, show, clazz, style, center;
	// x-small, small, large, x-large
	if (xattrs) {
		type = xattrs.type;
		show = xattrs.$show;
		clazz = xattrs.class;
		style = xattrs.style;
		center = xattrs.center;
	} else {
		type = defSpinner;
	}
	var spinner = spinners[type || defSpinner];
	if (!spinner) spinner = ringSpinner;
	var el = document.createElement(spinner.tag || 'DIV');
	if (clazz || spinner.class) {
		if (clazz && spinner.class) {
			clazz = spinner.class + ' ' + clazz;
		} else if (spinner.class) {
			clazz = spinner.class;
		}
		el.setAttribute('class', clazz);
	}
	if (style) {
		el.setAttribute('style', style);
	}
	if (center) {
		el.style.display = 'block';
		el.style.margin = 'auto';
	}
	spinner.create(el, xattrs);
	if (show) {
		r.up(Qute.Rendering.SetDisplay(el, r.model, show))();
	}
	return el;
}

Spinner.add = function(type, spinner) {
	spinners[type] = spinner;
}
Spinner.setDefault = function(name) {
	defSpinner = name;
}
Spinner.register = function(name, opts) {
	return Qute(name, function(r, xattrs) {
		// use registered opts as default attribute values
		return renderSpinner(r, Object.assign(opts, xattrs || {}));
	});
}

Qute.Spinner = Spinner;

export default Spinner;
