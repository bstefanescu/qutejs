import window from '@qutejs/window';

export default function qFlex(rendering, xattrs, slots) {
    var el = window.document.createElement('DIV');
    var style = 'display:flex;';
    if (xattrs) {
        var keys = Object.keys(xattrs);
        for (var i=0,l=keys.length; i<l; i++) {
            var key = keys[i];
            var value = rendering.eval(xattrs[key]);
            style += key+':'+value+';'
        }
    }
    if (slots && slots.default) {
        var children = slots.default;
        for (var i=0,l=children.length; i<l; i++) {
            el.appendChild(children[i]);
        }
    }
    el.setAttribute('style', style)
    return el;
}
