var QutejsPopup = (function (Qute, window) {
	'use strict';

	Qute = Qute && Qute.hasOwnProperty('default') ? Qute['default'] : Qute;
	var window__default = 'default' in window ? window['default'] : window;

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
	};

	var VALIGN_FNS = {
		start: toVStart,
		end: toVEnd,
		center: toVCenter,
		top: toTop,
		bottom: toBottom
	};

	var HALIGN_FNS = {
		start: toHStart,
		end: toHEnd,
		center: toHCenter,
		left: toLeft,
		right: toRight
	};



	/*
	* Get the visible client rect contenttaining the target - relative to viewport
	*/
	function getVisibleClientRect(target, overflowingParents) {
		var left=0, top=0, right = window__default.innerWidth, bottom = window__default.innerHeight;
		if (overflowingParents.length) {
			for (var i=0,l=overflowingParents.length; i<l; i++) {
				var parent = overflowingParents[i];
				// TODO bounding client rect includes the border -> use clientRect to remove border?
				var prect = parent.getBoundingClientRect();
				if (prect.left > left) { left = prect.left; }
				if (prect.right < right) { right = prect.right; }
				if (prect.top > top) { top = prect.top; }
				if (prect.bottom < bottom) { bottom = prect.bottom; }
			}
		}
		return {
			left: left, top: top,
			right: right, bottom: bottom,
			width: right-left, height: bottom-top
		};
	}

	function createPopup(content) {
		var el = window.document.createElement('DIV');
		el.className = 'qute-popup';
		var style = el.style;
		style.visibility = 'hidden';
		style.position = 'absolute';
		style.overflow = 'hidden'; // needed by some effects (e.g. slide in)

		var contentEl = window.document.createElement('DIV');
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
			if (anchor.jquery) { anchor = anchor[0]; }
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
			if (!posFn) { throw new Error('Invalid position argument: '+this.pos+'. Expecting: top|bottom|left|right'); }
			posFn(erect, rect, crect, out);

			var ALIGN_FNS = out.top == null ? VALIGN_FNS : HALIGN_FNS;
			var alignFn = ALIGN_FNS[align];
			if (!alignFn) { throw new Error('Invalid vert align argument: '+align+'. Expecting: '+Object.keys(ALIGN_FNS).join('|')); }
			alignFn(erect, rect, crect, out);

			//var className = out.position+' '+out.align;
			//if (this.className) className = this.className + ' ' + className;
			//this.el.className = this.c


			style.left = (out.left + window__default.pageXOffset)+'px';
			style.top = (out.top + window__default.pageYOffset)+'px';
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
					window__default.requestAnimationFrame(function() {
						self.update(anchor);
						updating = false;
					});
					updating = true;
				}
			};
			var ofs = [],
				body = window.document.body,
				parent = anchor.parentNode;
			while (parent && parent !== body) {
				if (parent.scrollHeight > parent.clientHeight || parent.scrollWidth > parent.clientWidth) {
					ofs.push(parent);
					parent.addEventListener('scroll', updateFn);
				}
				parent = parent.parentNode;
			}
			window__default.addEventListener('scroll', updateFn);
			window__default.addEventListener('resize', updateFn);
			// TODO add resize listener

			this.ofs = ofs;
			// add close on click listener
			var closeOnClick;
			if (this.closeOnClickOpt) {
				closeOnClick = function(e) {
					if (!self.el.contains(e.target)) {
						self.close();
					}
				};

				window__default.setTimeout(function() {
					window.document.addEventListener('click', closeOnClick);
				}, 0);
			}


			this.cleanup = function() {
				if (closeOnClick) {
					window.document.removeEventListener('click', closeOnClick);
				}
				window__default.removeEventListener('resize', updateFn);
				window__default.removeEventListener('scroll', updateFn);
				for (var i=0,l=ofs.length; i<l; i++) {
					ofs[i].removeEventListener('scroll', updateFn);
				}
			};

			this.onOpen && this.onOpen(this);
			// mount the popup
			window.document.body.appendChild(this.el);
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
				};
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
			if (align) { this.align = align; }
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
	};

	var css = "\n.qute-popup.qute-effect-fade .qute-popup-content {\n\topacity: 0;\n\t-webkit-transition: opacity 0.3s;\n\t-moz-transition: opacity 0.3s;\n\t-ms-transition: opacity 0.3s;\n\ttransition: opacity 0.3s;\n}\n.qute-popup.qute-effect-fade.qute-show .qute-popup-content {\n\topacity: 1;\n}\n\n\n.qute-popup.qute-effect-slide .qute-popup-content {\n\t-webkit-transform: translateY(-20%);\n\t-moz-transform: translateY(-20%);\n\t-ms-transform: translateY(-20%);\n\ttransform: translateY(-20%);\n\topacity: 0;\n\t-webkit-transition: opacity 0.3s, transform 0.3s;\n\t-moz-transition: opacity 0.3s, transform 0.3s;\n\t-ms-transition: opacity 0.3s, transform 0.3s;\n\ttransition: opacity 0.3s, transform 0.3s;\n}\n.qute-popup.qute-effect-slide.qute-show .qute-popup-content {\n\t-webkit-transform: translateY(0);\n\t-moz-transform: translateY(0);\n\t-ms-transform: translateY(0);\n\ttransform: translateY(0);\n\topacity: 1;\n}\n";

	Qute.css(css);

	/*
	Attributes:

	- animation: optional: is set can be one of fade or slidde
	- position is a string in the form of "position algin" where
		position is one of: top, bottom, left, right
		and align is one of: start, end, center, fill, top, bottom, left, right

		left and right align are only valid for vertical positions.
		top and bottom align are ony valid for horizontal positions

	- auto-close: boolean - toggle close on click. Defaults to true

	The defaults are: animation: null, position: "bottom start", auto-close: true
	*/
	var index = Qute('popup', {
		init: function init() {
			return {
				position: 'bottom start',
				animation: null,
				autoClose: true
			}
		},
		render: function() {
			return document.createComment('[popup]');
		},
		created: function() {
			var slots = this.$slots;
			if (!slots || !slots.default) { throw new Error('<popup> requires a content!'); }
			this.popup = new Popup(slots.default).effect(this.animation).position(this.position).closeOnClick(this.autoClose);
			var self = this;
			this.popup.onOpen = function() {
				self.emit("open", self.popup.el);
			};
			this.popup.onClose = function() {
				self.emit("close", self.popup.el);
			};
		},
		open: function(target) {
			this.popup.open(target);
		},
		close: function() {
			this.popup.close();
		}
	}).channel(function(msg, data) {
		if (msg === 'open') {
			this.open(data);
		} else if (msg === 'close') {
			this.close();
		}
	}).watch('position', function(value) {
		this.popup.position(value);
		return false;
	}).watch('animation', function(value) {
		this.popup.effect(value);
		return false;
	}).watch('autoClose', function(value) {
		this.popup.closeOnClick(!!value);
		return false;
	});

	return index;

}(Qute, window));
//# sourceMappingURL=qutejs-popup-0.9.1.js.map
