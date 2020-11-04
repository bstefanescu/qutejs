
export default function inputValueDirective(xattrs, valueExpr) {
    var rendering = this, value, boundProp = (typeof valueExpr === 'string') ? valueExpr : null;

    if (boundProp && !rendering.vm) {
        // current component not a ViewModel - throw an error
        throw new Error('q:value bound to "'+valueExpr+'" property but the current component is not a ViewModel component!');
    }

    function getInputValue(el) {
        var type = el.type;
        if (type === 'checkbox') {
            return !!el.checked;
        } else {
            // in case of a radio the clicked radio should be
            // the selected one so it is correct to return the value
            return el.value;
        }
    }

    function setInputValue(el, value) {
        var type = el.type;
        if (type === 'checkbox') {
            el.checked = !!value;
        } else if (type === 'radio') {
            el.checked = el.value === value;
        } else if (el.value !== value) {
            el.value = value == null ? '' : value;
        }
    }

    function updateValue(el) {
        var newValue = boundProp ? rendering.vm[boundProp] : rendering.eval(valueExpr);
       	setInputValue(el, newValue);
    }

    return function(el) {
        if (boundProp) {
            // then automatically update prop when changed
            el.addEventListener('change', function(e) {
                rendering.vm[boundProp] = getInputValue(el);
            });
        }
        //TODO we may use an update count to avoid updating if not necessarily
        rendering.up(function() { updateValue(el) });
        updateValue(el);
    }

}
