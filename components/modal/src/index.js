import window, {document} from '@qutejs/window';
import Qute from '@qutejs/runtime';
import Modal from './modal.js';
import './modal.css';

const {ViewModel, Property, Watch} = Qute;

var modal_id = 0;


function qModalTrigger(attrs, val, el, comp) {
	return function (el) {
		const id = this.eval(val);
		const app = this.model.$app;
		if (typeof id !== 'string') {
			throw new Error('Invalid value for q:modal-trigger. A modal id is expected.');
		}

		el.addEventListener('click', ev => {
			const modal = app.lookup(id);
			if (!modal) {
				throw Error('Modal not found: ' + id);
			}
			modal.open();
		});
	}
}

/**
 * To customize the modal you can subclass it and implement the following methods:
 * onOpen, onClose, onReady, onAction
 */
class qModal extends ViewModel {

    @Property(String) animation = null;
    @Property closeOnEsc = true;
    @Property closeOnClick = true;
    @Property disableScroll = true;
	@Property(String) id;

	render() {
		return document.createComment('[modal]');
	}

	created() {
		var slots = this.$slots;
		if (!slots || !slots.default) throw new Error('<modal> requires a content!');

		var self = this;
		this.modal = new Modal('qute-modal-'+(modal_id++), slots.default, {
			animation: this.animation,
			closeOnEsc:this.closeOnEsc,
			closeOnClick: this.closeOnClick,
			disableScroll: this.disableScroll,
			open: function(modal) {
				self.onOpen && self.onOpen(modal);
				self.emit("open", self);
			},
			close: function(modal) {
				self.onClose && self.onClose(modal);
				self.emit("close", self);
			},
			ready: function(modal) {
				self.onReady && self.onReady(modal);
				self.emit("ready", self);
			},
			action: function(action, target) {
				self.onAction && self.onAction(action, target);
				self.emit("action", {modal: self, name: action, target: target});
			}
		});
		this.id && this.publish(this.id);
	}

	connected() {
		document.body.appendChild(this.modal.el);
	}

	disconnected() {
		document.body.removeChild(this.modal.el);
	}

	open(now) {
		this.modal.open();
	}

	openAsync() {
		var modal = this.modal;
		window.setTimeout(function() {
			modal.open();
		}, 0);
	}

	close() {
		this.modal.close();
	}

	get isOpen() {
		return this.isOpen();
	}

    @Watch('animation')
    onAnimationChanged(value) {
        this.modal.animation(value);
        return false;
    }

    @Watch('closeOnEsc')
    onCloseOnExecChanged(value) {
        this.modal.opts.closeOnEsc = !!value;
        return false;
    }

    @Watch('closeOnClick')
    onCloseOnClickChanged(value) {
        this.modal.opts.closeOnClick = !!value;
        return false;
    }

    @Watch('disableScroll')
    onDisableScrollChanged(value) {
        this.modal.opts.disableScroll = !!value;
        return false;
	}

	element() {
		return this.modal.el;
	}

	find(selector) {
		return this.modal.el && this.modal.el.querySelector(selector);
	}

}

export { Modal, qModal, qModalTrigger };
