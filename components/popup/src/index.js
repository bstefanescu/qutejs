import window, { document } from '@qutejs/window';
import Qute from '@qutejs/runtime';
import Popup from './popup.js';
import './popup.css';

const { ViewModel, Property, Watch } = Qute;

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

API:
	open(anchor)
	toggle(anchor)
	close()
*/



function qPopupTrigger(attrs, val, el, comp) {
	return function (el) {
		if (typeof val !== 'string') {
			throw new Error('Invalid value for q:popup-trigger. A popup id is expected.');
		}
		const id = this.eval(val);
		const app = this.model.$app;
		el.addEventListener('click', ev => {
			const popup = app.lookup(id);
			if (!popup) {
				throw Error('Popup not found: ' + id);
			}
			popup.toggle(el);
		});
	}
}

class qPopup extends ViewModel {

	@Property position = 'bottom start';
	@Property(String) animation = null;
	@Property autoClose = true;
	@Property(String) id;

	render() {
		return document.createComment('[popup]');
	}

	created() {
		var self = this;
		var slots = this.$slots;
		if (!slots || !slots.default) throw new Error('<popup> requires a content!');
		this.popup = new Popup(slots.default, {
			onOpen: function () {
				self.emit("open", self.popup.el);
			}, 
			onShow: function () {
				self.emit("show", self.popup.el);
			},
			onClose: function () {
				self.emit("close", self.popup.el);
			}
		}).animation(this.animation).position(this.position).closeOnClick(this.autoClose);
		this.id && this.publish(this.id);
	}

	open(target, now) {
		this.popup.open(target);
	}

	openAsync(target) {
		var popup = this.popup;
		window.setTimeout(function () {
			popup.open(target);
		}, 0);
	}

	toggle(target, now) {
		this.popup.toggle(target);
	}

	toggleAsync(target) {
		var popup = this.popup;
		window.setTimeout(function () {
			popup.toggle(target);
		}, 0);
	}

	close() {
		this.popup.close();
	}

	get isOpen() {
		return this.popup.isOpen();
	}

	@Watch('position')
	onPositionChanged(value) {
		this.popup.position(value);
		return false;
	}

	@Watch('animation')
	onAnimationChanged(value) {
		this.popup.animation(value);
		return false;
	}

	@Watch('autoClose')
	onAutoCloseChanged(value) {
		this.popup.closeOnClick(!!value);
		return false;
	}

}
qPopup.Popup = Popup;

export { qPopup, qPopupTrigger };
