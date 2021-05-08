import window from '@qutejs/window';
import { onTransitionEnd } from '@qutejs/ui';

// cover option: coverup / coverdown

function toBottomCover(erect, rect, crect, out) {
	out.top = rect.top;
	if (out.top + erect.height > crect.bottom) { // flip to top
		out.top = rect.bottom - erect.height;
	}
}

function toTopCover(erect, rect, crect, out) {
	out.top = rect.bottom - erect.height;
	if (out.top < crect.top) { // flip to bottom
		out.top = rect.top;
	}
}

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
	if (out.left < crect.left) { // move to the right so the popup is entirely visible on the left side
		out.left = crect.left;
	} else if (out.left + erect.width > crect.right) { // move to the left so the popup is entirely visible on the right side
		out.left = crect.right - erect.width;
	}
}



var POS_FNS = {
	top: toTop,
	bottom: toBottom,
	left: toLeft,
	right: toRight,
	coverup: toTopCover,
	coverdown: toBottomCover
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
* Get the visible container rect defined by the given overflow parents. If no overflow parents are given the viewport will be used.
*/
function getVisibleClientRect(container, overflowingParents) {
	var left, top, right, bottom;
	if (container) {
		var rect = container.getBoundingClientRect();
		left = rect.left;
		top = rect.top;
		right = rect.right;
		bottom = rect.bottom;
	} else {
		left = 0;
		top = 0;
		right = window.innerWidth;
		bottom = window.innerHeight;
	}
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

function createPopup(content, modifierClass) {
	let document = window.document;
	var el = document.createElement('DIV');
	var style = el.style;
	style.visibility = "hidden";
	style.position = "absolute";
	style.overflow = "hidden";
	el.className = modifierClass ? 'qute-Popup '+modifierClass : 'qute-Popup';
	var contentEl = document.createElement('DIV');
	contentEl.style.position = "relative";
	contentEl.className = 'qute-Popup-content';
	el.appendChild(contentEl);

	if (content.jquery) {
		contentEl.appendChild(content[0]);
	} else if (typeof content === 'string') {
		contentEl.innerHTML = content;
	} else if (Array.isArray(content)) {
		for (var i=0, l=content.length; i<l; i++) {
			contentEl.appendChild(content[i]);
		}
	} else { // assume an element
		contentEl.appendChild(content);
    }
	return el;
}
/*
 * options: closeOnClick, position, align, effect, modifierClass, open, ready, close
 * the open callback is called before the popup is added to the DOM (it is not yet visible)
 * the ready callback is called when the popup was opened (after it was added to the DOM and it is visible on the screen)
 *
 * To control the viewport where the popup is diplayed you can use a .qute-Popup--container class on a parent element to restrict to that element
 */
function Popup(content, options) {
    if (!options) options = {};
	this.el = createPopup(content, options.modifierClass);
	this.opts = {
		position: 'bottom',
		align: 'start',
		closeOnClick: true,
		animation: null,
		open: null,
		ready: null,
		close: null
	}
	if (options) {
		Object.assign(this.opts, options);
	}
}
Popup.prototype = {
	update: function(anchor) {
		const opts = this.opts;
		if (anchor.jquery) anchor = anchor[0];
		var crect = getVisibleClientRect(this.container, this.ofs);
		var rect = anchor.getBoundingClientRect();
		// if anchor is not hidden by the overflow then hide the popup
		if (rect.top >= crect.bottom || rect.bottom <= crect.top
			|| rect.left >= crect.right || rect.right <= crect.left) {
			this.el.style.visibility = 'hidden';
			return;
		}

		var style = this.el.style;
		// first check for special modifier 'fill' (before getting the boundingclient rect since setting the height/width will modify the rect)
		var pos = opts.position;
		var align = opts.align;
		if (align === 'fill') {
			if (pos ===  'left' || pos === 'right') {
				style.height = anchor.offsetHeight+'px';
			} else {
				style.width = anchor.offsetWidth+'px';
			}
			align = 'start';
		} else {
			style.width && (style.width = '');
			style.height && (style.height = '');
		}


		var erect = this.el.getBoundingClientRect(); // we only need width and height
		var out = {};

		var posFn = POS_FNS[pos];
		if (!posFn) throw new Error('Invalid position argument: '+pos+'. Expecting: top|bottom|left|right');
		posFn(erect, rect, crect, out);

		var ALIGN_FNS = out.top == null ? VALIGN_FNS : HALIGN_FNS;
		var alignFn = ALIGN_FNS[align];
		if (!alignFn) throw new Error('Invalid vert align argument: '+align+'. Expecting: '+Object.keys(ALIGN_FNS).join('|'));
		alignFn(erect, rect, crect, out);

		style.left = (out.left + window.pageXOffset)+'px';
		style.top = (out.top + window.pageYOffset)+'px';
		style.visibility = 'visible';

		return this;
	},
	open: function(anchor) {
        if (!anchor) throw new Error('Attempting to open a popup without specifying a target element!');
		let document = window.document;
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
		var container = anchor.closest('.qute-Popup--container');
		var root = container ? container : document.body;
		var ofs = [], parent = anchor.parentNode;
		while (parent && parent !== root) {
			if (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth) {
				ofs.push(parent);
				parent.addEventListener('scroll', updateFn);
			}
			parent = parent.parentNode;
		}
		window.addEventListener('scroll', updateFn);
		window.addEventListener('resize', updateFn);
		// TODO add resize listener

		this.container = container;
		this.ofs = ofs;
		// add close on click listener
		var closeOnClick;
		if (this.opts.closeOnClick) {
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

		this.opts.open && this.opts.open(this);
		// mount the popup
		document.body.appendChild(this.el);
		// show it
		this.update(anchor);
        this.el.classList.add('is-visible');
        this.opts.ready && this.opts.ready(this);
        return this;
	},
	close: function() {
		this.opts.close && this.opts.close(this);
		this.cleanup();
		var el = this.el;
		el.classList.remove('is-visible');
		if (this.opts.animation) {
            onTransitionEnd(el, function() {
                el.style.visibility = 'hidden';
                el.parentNode && el.parentNode.removeChild(el);
            });
		} else {
            el.style.visibility = 'hidden';
			el.parentNode.removeChild(el);
        }
        return this;
	},
	toggle: function(anchor) {
		if (this.el.parentNode) { // already opened
			this.close();
		} else {
			this.open(anchor);
        }
        return this;
	},
	isOpen: function() {
		return this.el.parentNode;
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
		this.opts.position = position;
		if (align) this.opts.align = align;
		return this;
	},
	closeOnClick: function(closeOnClick) {
		this.opts.closeOnClick = closeOnClick;
		return this;
	},
	animation: function(animation) {
        var previousAnimation = this.opts.animation;
        this.opts.animation = animation;
        var cl = this.el.classList;
        if (previousAnimation) {
            cl.remove('qute-Popup--'+previousAnimation);
        }
        cl.add('qute-Popup--'+animation);
		return this;
	}
}

export default Popup;
