import window from '@qutejs/window';
import Qute from '@qutejs/runtime';


function liValueDirective(xattrs, valueExpr) {
    return function(el) {
        el.setAttribute('data-value', this.eval(valueExpr) || '');
    }
}

export default function groupDirective(xattrs, valueExpr) {
    var rendering = this, value, boundProp = (typeof valueExpr === 'string') ? valueExpr : null;

    if (boundProp && !rendering.vm) {
        // current component not a ViewModel - throw an error
        throw new Error('q:value bound to "'+valueExpr+'" property but the current component is not a ViewModel component!');
    }

    function setValue(el, newValue) {
        if (value !== newValue) {
            var children = el.children;
            for (var i=0,l=children.length; i<l; i++) {
                var child = children[i];
                if (child.tagName === 'LI') {
                    var liVal = child.getAttribute('data-value');
                    if (liVal === newValue) {
                        child.classList.add('active');
                    } else {
                        child.classList.remove('active');
                    }
                }
            }
        }
    }

    function evalValueExpr() {
        return boundProp ? rendering.vm[boundProp] : rendering.eval(valueExpr);
    }

    return function(el) {
        el.addEventListener('click', function(e) {
            var li = e.target.closest('li');
            if (li) {
                var liVal = li.getAttribute('data-value');
                if (liVal && !li.classList.contains('active')) {
                    e.preventDefault();
                    e.stopPropagation();
                    setValue(el, liVal);
                    window.setTimeout(function() {
                        if (boundProp) rendering.vm[boundProp] = liVal;
                        el.dispatchEvent(new window.CustomEvent("change",
                            {bubbles: true, detail: liVal }));
                    }, 0);
                }
            }
        });
        rendering.up(function() {
            setValue(el, evalValueExpr());
        });
        setValue(el, evalValueExpr());
    }
}


Qute.registerDirective('li', 'value', liValueDirective);
Qute.registerDirective('ul', 'model', groupDirective);
Qute.registerDirective('ol', 'model', groupDirective);
