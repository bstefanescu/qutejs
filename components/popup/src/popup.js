import window, {document} from '@qutejs/window';

//TODO: 1. add position classes to be able to adapt the effects: bottom, top, right, left
// 2. remove popup.css and use some global animation css?
// 3. use same api notations and styles with modal.js

function toBottom(erect, rect, crect, out) {
	out.top = rect.bottom;
	if (out.top + erect.height > crect.bottom) { // flip to top
		out.top = rect.top - erect.height;
	}
}

function toTop(erect, rect, crect, out) {
	out.top = rect.top - erect.height;
	if (out.top < crect.top) { // flip to bottom
		out.top = rect.bottom;
	}
}

function toVStart(erect, rect, crect, out) {
	out.top = rect.top;
	if (out.top + erect.height > crect.bottom) { // flip
		out.top = rect.bottom - erect.height;
	}
}

function toVEnd(erect, rect, crect, out) {
	out.top = rect.bottom - erect.height;
	if (out.top < crect.top) { // flip
		out.top = rect.top;
	}
}

function toVCenter(erect, rect, crect, out) {
	out.top = rect.top + (rect.height - erect.height) / 2;
}

function toRight(erect, rect, crect, out) {
	out.left = rect.right;
	if (out.left + erect.width > crect.right) { // flip to left
		out.left = rect.left - erect.width;
	}
}

function toLeft(erect, rect, crect, out) {
	out.left = rect.left - erect.width;
	if (out.left < crect.left) { // flip to right
		out.left = rect.right;
	}
}


function toHStart(erect, rect, crect, out) {
	out.left = rect.left;
	if (out.left + erect.width > crect.right) { // flip
		out.left = rect.right - erect.width;
	}
}

function toHEnd(erect, rect, crect, out) {
	out.left = rect.right - erect.width;
	if (out.left < crect.left) { // flip
		out.left = rect.left;
	}
}

function toHCenter(erect, rect, crect, out) {
	out.left = rect.left + (rect.width - erect.width) / 2;
}



var POS_FNS = {
	top: toTop,
	bottom: toBottom,
	left: toLeft,
	right: toRight
}

var VALIGN_FNS = {
	start: toVStart,
	end: toVEnd,
	center: toVCenter,
	top: toTop,
	bottom: toBottom
}

var HALIGN_FNS = {
	start: toHStart,
	end: toHEnd,
	center: toHCenter,
	left: toLeft,
	right: toRight
}



/*
* Get the visible client rect contenttaining the target - relative to viewport
*/
function getVisibleClientRect(target, overflowingParents) {
	var left=0, top=0, right = window.innerWidth, bottom = window.innerHeight;
	if (overflowingParents.length) {
		for (var i=0,l=overflowingParents.length; i<l; i++) {
			var parent = overflowingParents[i];
			// TODO bounding client rect includes the border -> use clientRect to remove border?
			var prect = parent.getBoundingClientRect();
			if (prect.left > left) left = prect.left;
			if (prect.right < right) right = prect.right;
			if (prect.top > top) top = prect.top;
			if (prect.bottom < bottom) bottom = prect.bottom;
		}
	}
	return {
		left: left, top: top,
		right: right, bottom: bottom,
		width: right-left, height: bottom-top
	};
}

function createPopup(content) {
	var el = document.createElement('DIV');
	el.className = 'qute-popup';
	var style = el.style;
	style.visibility = 'hidden';
	style.position = 'absolute';
	style.overflow = 'hidden'; // needed by some effects (e.g. slide in)

	var contentEl = document.createElement('DIV');
	contentEl.className = 'qute-popup-content';
	contentEl.style.position = 'relative';
	el.appendChild(contentEl);

	if (content.jquery) {
		contentEl.appendChild(content[0]);
	} else if (typeof content === 'string') {
		contentEl.innerHTML = content;
	} else if (Array.isArray(content)) {
		for (var i=0, l=content.length; i<l; i++) {
			contentEl.appendChild(content[i]);
		}
	} else { // assume a element
		contentEl.appendChild(content);
	}
	return el;
}
/*
 * options: closeOnClick, position, align
 */
function Popup(content) {
	this.el = createPopup(content);
	this.pos = 'bottom';
	this.align = 'start';
	this.closeOnClickOpt = true;
	this.effectName = null;
}
Popup.prototype = {
	update: function(anchor) {
		if (anchor.jquery) anchor = anchor[0];
		var crect = getVisibleClientRect(anchor, this.ofs);
		var rect = anchor.getBoundingClientRect();
		// if anchor is not hidden by the overflow then hide the popup
		if (rect.top >= crect.bottom || rect.bottom <= crect.top
			|| rect.left >= crect.right || rect.right <= crect.left) {
			this.el.style.visibility = 'hidden';
			return;
		}

		var style = this.el.style;
		// first check for special modifier 'fill' (before getting the boundingclient rect since setting the height/width will modify the rect)
		var align = this.align;
		if (align === 'fill') {
			if (this.pos ===  'bottom' || this.pos === 'top') {
				style.width = anchor.offsetWidth+'px';
			} else {
				style.height = anchor.offsetHeight+'px';
			}
			align = 'start';
		} else {
			style.width && (style.width = '');
			style.height && (style.height = '');
		}


		var erect = this.el.getBoundingClientRect(); // we only need width and height
		var out = {};

		var posFn = POS_FNS[this.pos];
		if (!posFn) throw new Error('Invalid position argument: '+this.pos+'. Expecting: top|bottom|left|right');
		posFn(erect, rect, crect, out);

		var ALIGN_FNS = out.top == null ? VALIGN_FNS : HALIGN_FNS;
		var alignFn = ALIGN_FNS[align];
		if (!alignFn) throw new Error('Invalid vert align argument: '+align+'. Expecting: '+Object.keys(ALIGN_FNS).join('|'));
		alignFn(erect, rect, crect, out);

		//var className = out.position+' '+out.align;
		//if (this.className) className = this.className + ' ' + className;
		//this.el.className = this.c


		style.left = (out.left + window.pageXOffset)+'px';
		style.top = (out.top + window.pageYOffset)+'px';
		style.visibility = 'visible';

		return this;
	},
	open: function(anchor) {
		// compute overflowing parents and register scroll listeners
		if (this.el.parentNode) { // already opened
			return;
		}
		var updating = false, self = this;
		var updateFn = function() {
			if (!updating) {
				window.requestAnimationFrame(function() {
					self.update(anchor);
					updating = false;
				});
				updating = true;
			}
		}
		var ofs = [],
			body = document.body,
			parent = anchor.parentNode;
		while (parent && parent !== body) {
			if (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth) {
				ofs.push(parent);
				parent.addEventListener('scroll', updateFn);
			}
			parent = parent.parentNode;
		}
		window.addEventListener('scroll', updateFn);
		window.addEventListener('resize', updateFn);
		// TODO add resize listener

		this.ofs = ofs;
		// add close on click listener
		var closeOnClick;
		if (this.closeOnClickOpt) {
			closeOnClick = function(e) {
				if (!self.el.contains(e.target)) {
					self.close();
				}
			}

			window.setTimeout(function() {
				document.addEventListener('click', closeOnClick);
			}, 0);
		}


		this.cleanup = function() {
			if (closeOnClick) {
				document.removeEventListener('click', closeOnClick);
			}
			window.removeEventListener('resize', updateFn);
			window.removeEventListener('scroll', updateFn);
			for (var i=0,l=ofs.length; i<l; i++) {
				ofs[i].removeEventListener('scroll', updateFn);
			}
		}

		this.onOpen && this.onOpen(this);
		// mount the popup
		document.body.appendChild(this.el);
		// show it
		this.update(anchor);
		this.el.classList.add('qute-show');
	},
	close: function() {
		this.onClose && this.onClose(this);
		this.cleanup();
		var el = this.el;
		el.classList.remove('qute-show');
		if (this.effectName) {
			var fn = function() {
				el.style.visibility = 'hidden';
				el.parentNode && el.parentNode.removeChild(el);
				el.removeEventListener('transitionend', fn);
			}
			el.addEventListener('transitionend', fn);
		} else {
			el.style.visibility = 'hidden';
			el.parentNode.removeChild(el);
		}
	},
	position: function(position, align) {
		if (align === undefined) {
			position = position.trim();
			var i = position.indexOf(' ');
			if (i > -1) {
				align = position.substring(i+1).trim();
				position = position.substring(0, i);
			}
		}
		this.pos = position;
		if (align) this.align = align;
		return this;
	},
	closeOnClick: function(closeOnClick) {
		this.closeOnClickOpt = closeOnClick;
		return this;
	},
	effect: function(effect) {
		this.effectName = effect;
		this.el.className = effect ? 'qute-popup qute-effect-'+effect : 'qute-popup';
		return this;
	}
}

export default Popup;
