import {document} from '@qutejs/window';
import { onTransitionEnd } from '@qutejs/ui';

/*
@see https://tympanus.net/codrops/2013/06/25/nifty-modal-window-effects/ for modal effects
@see https://davidwalsh.name/css-vertical-center for vertical centering using translate
*/

function toggleScroll(enable) {
	var body = document.body;
	if (enable) {
        Object.assign(body.style, {overflow: 'initial', height: 'initial'})
	} else {
        Object.assign(body.style, {overflow: 'hidden', height: '100vh'})
	}
}

function getFocusableElements(root) {
	return (root || document).querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
}

function trapFocus() {
	var focusable = getFocusableElements(modal);
	var firstFocusable, lastFocusable;
	if (focusable.length) {
		firstFocusable = focusable[0];
		lastFocusable = focusable[focusable.length-1];
	}

}

function createModal(id, content, animation) {
	var container = document.createElement('DIV');
	container.id = id;
	var modal = document.createElement('DIV');
	modal.className = animation ? 'qute-Modal qute-Modal--'+animation : 'qute-Modal';
	modal.tabIndex = -1;
	var contentEl = document.createElement('DIV');
	contentEl.className = 'qute-Modal-content';
	modal.appendChild(contentEl);
	var overlay = document.createElement('DIV');
	overlay.className = 'qute-Modal-overlay';
	container.appendChild(modal);
	container.appendChild(overlay);

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

	return container;
}


export default function Modal(name, content, options) {
	this.id = '--qute-modal-'+name;
	this.opts = {
		animation: null,
		closeOnEsc: true,
		closeOnClick: true,
		disableScroll: true,
		open: null,
		close: null,
		ready: null,
		action: null
	}
	if (options) {
		Object.assign(this.opts, options);
	}
	this.el = createModal(this.id, content, this.opts.animation);
	this.activeElement = null;
	this.cleanup = null;
}
Modal.prototype = {
	isOpen: function() {
		return this.el.firstChild.classList.contains('is-visible');
	},
	open: function() {
		var modal = this.el.firstChild;
		var cl = modal.classList;
		if (cl.contains('is-visible')) return; // already visible

		var self = this;
		var opts = this.opts;
		opts.open && opts.open(this);

		cl.add('is-visible');
		// 0. save focus status
		this.activeElement = document.activeElement; // save the active element before opening
		// 1. disable scroll
		if (opts.disableScroll) toggleScroll(false);
		// 2. add click listener to handle close and other actions
		this.addListener(this.el, 'click', function(e) {
			var handled = false, target = e.target;
			if ((target === self.el.lastChild && opts.closeOnClick) || target.classList.contains('qute-Modal-close')) {
				// click on overlay or .qute-Modal-close
				self.close();
				handled = true;
			} else if (opts.action) {
				var action = target.getAttribute('data-md-action');
				if (action === 'close') {
					self.close();
					handled = true;
				} else if (action) {
					opts.action(action, target);
					handled = true;
				}
			}
			if (handled) {
				e.preventDefault();
				e.stopPropagation();
			}
		});
		//3. add keydown listener to trap focus inside the modal and to handle close on escape
		var focusable = getFocusableElements(modal);
		var firstFocusable, lastFocusable;
		if (focusable.length) {
			firstFocusable = focusable[0];
			lastFocusable = focusable[focusable.length-1];
		}
		this.addListener(modal, 'keydown', function(e) {
			if (e.keyCode === 27) {
				self.opts.closeOnEsc && self.close();
			} else if (firstFocusable && e.keyCode === 9) {
				var toFocus, focus = document.activeElement;
				if (e.shiftKey) {
					if (firstFocusable === focus) {
						toFocus = lastFocusable;
					}
				} else if (lastFocusable === focus) {
					toFocus = firstFocusable;
				}
				if (toFocus) {
					toFocus.focus();
					e.preventDefault();
				}
			}
		});

		// acquire focus - set focus on .md-focus marked element otherwise on the modal itself
		var toFocus = modal.getElementsByClassName('md-focus')[0] || modal;
		function acquireFocus() {
			toFocus.focus();
			opts.ready && opts.ready(this);
		}
		if (opts.animation) {
            onTransitionEnd(modal, function() {
                acquireFocus();
            });
		} else {
			acquireFocus();
		}
	},
	close: function() {
		this.el.firstChild.classList.remove('is-visible');
		this.opts.close && this.opts.close(this);
		if (this.opts.disableScroll) toggleScroll(true);
		if (this.activeElement) this.activeElement.focus();
		this.activeElement = null;
		if (this.cleanup) {
			this.cleanup();
			this.cleanup = null;
		}
	},
	addListener: function(el, name, fn) {
		el.addEventListener(name, fn);
		var nextCleanup = this.cleanup;
		this.cleanup = function() {
			el.removeEventListener(name, fn);
			nextCleanup && nextCleanup();
		}
	},
	// dinamically change the animation
	animation: function(animation) {
		this.opts.animation = animation;
		if (this.el) {
			this.el.firstChild.className = animation ? 'qute-Modal qute-Modal--'+animation : 'qute-Modal';
		}
	}

}
