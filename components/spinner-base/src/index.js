import Qute from '@qutejs/runtime';

export default function baseSpinner(el, r, xattrs) {
    if (!xattrs) return;
    // x-small, small, large, x-large or size?
    if (xattrs.class) el.className += ' '+xattrs.class;
    if (xattrs.center) {
        el.style.display = 'block';
        el.style.margin = 'auto';
    }
    if (xattrs.$show) {
        r.up(Qute.Rendering.SetDisplay(el, r.model, xattrs.$show))();
    }
}
