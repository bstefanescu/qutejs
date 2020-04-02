import Qute from '@qutejs/runtime';

// impl a q:model that can be used by components implementing custom form controls
// the requirement for the component using this directive is to provide
// a `value` property and to trigger a `change` event when the value changes

export default function controlModelDirective(xattrs, valueExpr, compOrEl) {
    var rendering = this, value, boundProp = (typeof valueExpr === 'string') ? valueExpr : null;

    if ( !(Qute.isVM(compOrEl) && ("value" in compOrEl)) ) {
        throw new Error('Only ViewModel components with a "value" property can use q:model');
    }

    if (boundProp && !rendering.vm) {
        // current component not a ViewModel - throw an error
        throw new Error('q:model bound to "'+valueExpr+'" property but the current component is not a ViewModel component!');
    }

    function updateValue() {
        var newValue = boundProp ? rendering.vm[boundProp] : rendering.eval(valueExpr);
        compOrEl.value = newValue;
    }

    // we need to update the value now
    updateValue();
    rendering.up(function() { updateValue() });

    return function(el) {
        if (boundProp) {
            // then automatically update prop when changed
            el.addEventListener('change', function(e) {
                rendering.vm[boundProp] = compOrEl.value;
            });
        }
    }

}
