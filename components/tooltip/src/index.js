import Tooltip from './tooltip.js';

Tooltip.create = function(opts) {
    return function qTooltip(attrs, val, el, comp) {
        return function (el) {        
            let text = this.eval(val);
            const baseOpts = {
                text: text
            }
            // TODO support template function?
            new Tooltip(el, opts ? Object.assign(baseOpts, opts) : baseOpts);
        }
    }
}

const qTooltip = Tooltip.create();
export { qTooltip, Tooltip };
