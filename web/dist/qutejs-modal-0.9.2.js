var QutejsModal = (function (Qute, window) {
	'use strict';

	Qute = Qute && Qute.hasOwnProperty('default') ? Qute['default'] : Qute;

	/*
	@see https://tympanus.net/codrops/2013/06/25/nifty-modal-window-effects/ for modal effects
	@see https://davidwalsh.name/css-vertical-center for vertical centering using translate
	*/

	function toggleScroll(enable) {
		var body = window.document.body;
		if (enable) {
	        Object.assign(body.style, {overflow: 'initial', height: 'initial'});
		} else {
	        Object.assign(body.style, {overflow: 'hidden', height: '100vh'});
		}
	}

	function getFocusableElements(root) {
		return (root || window.document).querySelectorAll('button, a[href], input, select, textarea, [tabindex]:not([tabindex="-1"])');
	}

	function createModal(id, content, effect) {
		var container = window.document.createElement('DIV');
		container.id = id;
		var modal = window.document.createElement('DIV');
		modal.className = effect ? 'md-modal md-effect-'+effect : 'md-modal';
		modal.tabIndex = -1;
		var contentEl = window.document.createElement('DIV');
		contentEl.className = 'md-content';
		modal.appendChild(contentEl);
		var overlay = window.document.createElement('DIV');
		overlay.className = 'md-overlay';
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


	function Modal(name, content, settings) {
		this.id = '--qute-modal-'+name;
		this.settings = {
			effect: null,
			closeOnEsc: true,
			closeOnClick: true,
			disableScroll: true
		};
		if (settings) {
			Object.assign(this.settings, settings);
		}
		this.el = createModal(this.id, content, settings.effect);
		this.activeElement = null;
		this.cleanup = null;
	}
	Modal.prototype = {
		open: function() {
			var modal = this.el.firstChild;
			var cl = modal.classList;
			if (cl.contains('md-show')) { return; } // already visible

			var self = this;
			var settings = this.settings;
			settings.open && settings.open(this);

			cl.add('md-show');
			// 0. save focus status
			this.activeElement = window.document.activeElement; // save the active element before opening
			// 1. disable scroll
			if (settings.disableScroll) { toggleScroll(false); }
			// 2. add click listener to handle close and other actions
			this.addListener(this.el, 'click', function(e) {
				var handled = false, target = e.target;
				if ((target === self.el.lastChild && settings.closeOnClick) || target.classList.contains('md-close')) {
					// click on overlay or .md-close
					self.close();
					handled = true;
				} else if (settings.action) {
					var action = target.getAttribute('data-md-action');
					if (action === 'close') {
						self.close();
						handled = true;
					} else if (action) {
						settings.action(action, target);
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
					self.settings.closeOnEsc && self.close();
				} else if (firstFocusable && e.keyCode === 9) {
					var toFocus, focus = window.document.activeElement;
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
				settings.ready && settings.ready(this);
			}
			if (settings.effect) {
				var transitionEnd = function() {
					acquireFocus();
					modal.firstChild.removeEventListener('transitionend', transitionEnd);
				};
				modal.firstChild.addEventListener('transitionend', transitionEnd);
			} else {
				acquireFocus();
			}
		},
		close: function() {
			this.el.firstChild.classList.remove('md-show');
			this.settings.close && this.settings.close(this);
			if (this.settings.disableScroll) { toggleScroll(true); }
			if (this.activeElement) { this.activeElement.focus(); }
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
			};
		},
		// dinamically change the effect
		effect: function(effect) {
			this.settings.effect = effect;
			if (this.el) {
				this.el.firstChild.className = effect ? 'md-modal md-effect-'+effect : 'md-modal';
			}
		}

	};

	var css = "\n.md-close {\n\topacity: .5;\n}\n.md-close:hover {\n\topacity: .8;\n}\n.md-close:before {\n\tposition: absolute;\n\tright:0;\n\ttop:0;\n\tcursor: pointer;\n\tcontent: \"\\00d7\";\n\tfont-size: 24px;\n\tline-height: 24px;\n\tfont-weight: 500;\n\tpadding: 6px 14px;\n}\n\n.md-modal {\n\tposition: fixed;\n\ttop: 50%;\n\tleft: 50%;\n\twidth: 50%;\n\tmax-width: 630px;\n\tmin-width: 320px;\n\theight: auto;\n\tz-index: 2000;\n\tvisibility: hidden;\n\t-webkit-backface-visibility: hidden;\n\t-moz-backface-visibility: hidden;\n\tbackface-visibility: hidden;\n\t-webkit-transform: translateX(-50%) translateY(-50%);\n\t-moz-transform: translateX(-50%) translateY(-50%);\n\t-ms-transform: translateX(-50%) translateY(-50%);\n\ttransform: translateX(-50%) translateY(-50%);\n}\n.md-modal:focus {\n\toutline:none;\n}\n\n.md-show {\n\tvisibility: visible;\n}\n\n.md-overlay {\n\tposition: fixed;\n\twidth: 100%;\n\theight: 100%;\n\tvisibility: hidden;\n\ttop: 0;\n\tleft: 0;\n\tz-index: 1000;\n\topacity: 0;\n\tbackground: rgba(0,0,0,0.6);\n\t-webkit-transition: all 0.3s;\n\t-moz-transition: all 0.3s;\n\ttransition: all 0.3s;\n}\n\n.md-show ~ .md-overlay {\n\topacity: 1;\n\tvisibility: visible;\n}\n\n/* Content styles */\n.md-content {\n\tcolor: #333;\n\tbackground: white;\n\tposition: relative;\n\tborder-radius: 3px;\n\tmargin: 0 auto;\n}\n\n/* ---------------------- effects --------------------- */\n\n/* Effect 1: Fade in and scale up */\n.md-effect-scale-up .md-content {\n\t-webkit-transform: scale(0.7);\n\t-moz-transform: scale(0.7);\n\t-ms-transform: scale(0.7);\n\ttransform: scale(0.7);\n\topacity: 0;\n\t-webkit-transition: all 0.3s;\n\t-moz-transition: all 0.3s;\n\ttransition: all 0.3s;\n}\n\n.md-show.md-effect-scale-up .md-content {\n\t-webkit-transform: scale(1);\n\t-moz-transform: scale(1);\n\t-ms-transform: scale(1);\n\ttransform: scale(1);\n\topacity: 1;\n}\n\n/* Effect 2: Slide from the right */\n.md-effect-slide-right .md-content {\n\t-webkit-transform: translateX(20%);\n\t-moz-transform: translateX(20%);\n\t-ms-transform: translateX(20%);\n\ttransform: translateX(20%);\n\topacity: 0;\n\t-webkit-transition: all 0.3s cubic-bezier(0.25, 0.5, 0.5, 0.9);\n\t-moz-transition: all 0.3s cubic-bezier(0.25, 0.5, 0.5, 0.9);\n\ttransition: all 0.3s cubic-bezier(0.25, 0.5, 0.5, 0.9);\n}\n\n.md-show.md-effect-slide-right .md-content {\n\t-webkit-transform: translateX(0);\n\t-moz-transform: translateX(0);\n\t-ms-transform: translateX(0);\n\ttransform: translateX(0);\n\topacity: 1;\n}\n\n/* Effect 3: Slide from the bottom */\n.md-effect-slide-bottom .md-content {\n\t-webkit-transform: translateY(20%);\n\t-moz-transform: translateY(20%);\n\t-ms-transform: translateY(20%);\n\ttransform: translateY(20%);\n\topacity: 0;\n\t-webkit-transition: all 0.3s;\n\t-moz-transition: all 0.3s;\n\ttransition: all 0.3s;\n}\n\n.md-show.md-effect-slide-bottom .md-content {\n\t-webkit-transform: translateY(0);\n\t-moz-transform: translateY(0);\n\t-ms-transform: translateY(0);\n\ttransform: translateY(0);\n\topacity: 1;\n}\n\n/* Effect 4: Newspaper */\n.md-effect-newspaper .md-content {\n\t-webkit-transform: scale(0) rotate(720deg);\n\t-moz-transform: scale(0) rotate(720deg);\n\t-ms-transform: scale(0) rotate(720deg);\n\ttransform: scale(0) rotate(720deg);\n\topacity: 0;\n}\n\n.md-show.md-effect-newspaper ~ .md-overlay,\n.md-effect-newspaper .md-content {\n\t-webkit-transition: all 0.5s;\n\t-moz-transition: all 0.5s;\n\ttransition: all 0.5s;\n}\n\n.md-show.md-effect-newspaper .md-content {\n\t-webkit-transform: scale(1) rotate(0deg);\n\t-moz-transform: scale(1) rotate(0deg);\n\t-ms-transform: scale(1) rotate(0deg);\n\ttransform: scale(1) rotate(0deg);\n\topacity: 1;\n}\n\n/* Effect 5: fall */\n.md-effect-fall.md-modal {\n\t-webkit-perspective: 1300px;\n\t-moz-perspective: 1300px;\n\tperspective: 1300px;\n}\n\n.md-effect-fall .md-content {\n\t-webkit-transform-style: preserve-3d;\n\t-moz-transform-style: preserve-3d;\n\ttransform-style: preserve-3d;\n\t-webkit-transform: translateZ(600px) rotateX(20deg);\n\t-moz-transform: translateZ(600px) rotateX(20deg);\n\t-ms-transform: translateZ(600px) rotateX(20deg);\n\ttransform: translateZ(600px) rotateX(20deg);\n\topacity: 0;\n}\n\n.md-show.md-effect-fall .md-content {\n\t-webkit-transition: all 0.3s ease-in;\n\t-moz-transition: all 0.3s ease-in;\n\ttransition: all 0.3s ease-in;\n\t-webkit-transform: translateZ(0px) rotateX(0deg);\n\t-moz-transform: translateZ(0px) rotateX(0deg);\n\t-ms-transform: translateZ(0px) rotateX(0deg);\n\ttransform: translateZ(0px) rotateX(0deg);\n\topacity: 1;\n}\n\n/* Effect 6: side fall */\n.md-effect-side-fall.md-modal {\n\t-webkit-perspective: 1300px;\n\t-moz-perspective: 1300px;\n\tperspective: 1300px;\n}\n\n.md-effect-side-fall .md-content {\n\t-webkit-transform-style: preserve-3d;\n\t-moz-transform-style: preserve-3d;\n\ttransform-style: preserve-3d;\n\t-webkit-transform: translate(30%) translateZ(600px) rotate(10deg);\n\t-moz-transform: translate(30%) translateZ(600px) rotate(10deg);\n\t-ms-transform: translate(30%) translateZ(600px) rotate(10deg);\n\ttransform: translate(30%) translateZ(600px) rotate(10deg);\n\topacity: 0;\n}\n\n.md-show.md-effect-side-fall .md-content {\n\t-webkit-transition: all 0.3s ease-in;\n\t-moz-transition: all 0.3s ease-in;\n\ttransition: all 0.3s ease-in;\n\t-webkit-transform: translate(0%) translateZ(0) rotate(0deg);\n\t-moz-transform: translate(0%) translateZ(0) rotate(0deg);\n\t-ms-transform: translate(0%) translateZ(0) rotate(0deg);\n\ttransform: translate(0%) translateZ(0) rotate(0deg);\n\topacity: 1;\n}\n\n/* Effect 7:  slide and stick to top */\n.md-effect-sticky-up {\n\ttop: 0;\n\t-webkit-transform: translateX(-50%);\n\t-moz-transform: translateX(-50%);\n\t-ms-transform: translateX(-50%);\n\ttransform: translateX(-50%);\n}\n\n.md-effect-sticky-up .md-content {\n\t-webkit-transform: translateY(-200%);\n\t-moz-transform: translateY(-200%);\n\t-ms-transform: translateY(-200%);\n\ttransform: translateY(-200%);\n\t-webkit-transition: all .3s;\n\t-moz-transition: all .3s;\n\ttransition: all .3s;\n\topacity: 0;\n}\n\n.md-show.md-effect-sticky-up .md-content {\n\t-webkit-transform: translateY(0%);\n\t-moz-transform: translateY(0%);\n\t-ms-transform: translateY(0%);\n\ttransform: translateY(0%);\n\tborder-radius: 0 0 3px 3px;\n\topacity: 1;\n}\n\n\n";

	Qute.css(css);

	var modal_id = 0;

	/**
	 */
	var index = Qute("modal", {
		init: function() {
			return {
				animation: null,
				closeOnEsc: true,
				closeOnClick: true,
				disableScroll: true
			 };
		},
		render: function() {
			return document.createComment('[modal]');
		},
		created: function() {
			var slots = this.$slots;
			if (!slots || !slots.default) { throw new Error('<modal> requires a content!'); }

			var self = this;
			this.modal = new Modal('qute-modal-'+(modal_id++), slots.default, {
				effect: this.animation,
				closeOnEsc:this.closeOnEsc,
				closeOnClick: this.closeOnClick,
				disableScroll: this.disableScroll,
				open: function(modal) {
					self.emit("open", self.modal.el);
				},
				close: function(modal) {
					self.emit("close", self.modal.el);
				},
				ready: function(modal) {
					self.emit("ready", self.modal.el);
				},
				action: function(action, target) {
					self.emit("action", {modal: self.modal.el, name: action, target: target});
				}
			});
		},
		connected: function() {
			document.body.appendChild(this.modal.el);
		},
		disconnected: function() {
			document.body.removeChild(this.modal.el);
		},
		open: function() {
			this.modal.open();
		},
		close: function() {
			this.modal.close();
		}
	}).channel(function(msg) {
		if (msg === 'open') {
			this.open();
		} else if (msg === 'close') {
			this.close();
		}
	}).watch('animation', function(value) {
		this.modal.effect(value);
		return false;
	}).watch('closeOnEsc', function(value) {
		this.modal.settings.closeOnEsc = !!value;
		return false;
	}).watch('closeOnClick', function(value) {
		this.modal.settings.closeOnClick = !!value;
		return false;
	}).watch('disableScroll', function(value) {
		this.modal.settings.disableScroll = !!value;
		return false;
	});

	return index;

}(Qute, window));
//# sourceMappingURL=qutejs-modal-0.9.2.js.map
