import './tooltip.css';
import { Popup } from '@qutejs/popup';

function Tooltip(el, opts) {
    this.opts = Object.assign({}, Tooltip.defaultOpts, opts || {});
    this.el = el;
    var self = this;    
    this.onenter = function() {
        if (!self.hover) {
            self.hover = true;
            self.open();
        }
    }
    this.onleave = function() {
        if (self.hover) {
            self.hover = false;
            self.close();
        }
    }
    el.addEventListener('mouseenter', this.onenter);
    el.addEventListener('mouseleave', this.onleave);
    this.popup = null;
    this.hover = false;
}
Tooltip.defaultOpts = {
    position: 'top',
    align: 'center',
    animation: 'fade',
    delay: 600
}
Tooltip.prototype = {
    destroy() {
        this.el.removeEventListener('mouseenter', this.onenter);
        this.el.removeEventListener('mouseleave', this.onleave);
    },
    open() {
        if (!this.popup) window.setTimeout(() => {
            if (!this.popup && this.hover) {
                this.popup = new Popup(this.opts.text, {
                    modifierClass: 'qute-Popup--tooltip'
                })
                .position(this.opts.position, this.opts.align)
                .animation(this.opts.animation)
                .open(this.el);
            }
        }, this.opts.delay);
    },
    close() {
        if (this.popup) window.setTimeout(() => {
            if (this.popup) {
                this.popup.close();
                this.popup = null;
            }
        }, this.opts.delay);
    }
}

export default Tooltip;