
export default function selectValueDirective(xattrs, valueExpr) {
    var rendering = this, value, boundProp = (typeof valueExpr === 'string') ? valueExpr : null;

    if (boundProp && !rendering.vm.__VM__) {
        // current component not a ViewModel - throw an error
        throw new Error('x-use:value bound to "'+valueExpr+'" property but the current component is not a ViewModel component!');
    }

    //TODO impl multiple selection
    function updateSelectedValue(el) {
        var newValue = boundProp ? rendering.vm[boundProp] : rendering.eval(valueExpr);
        if (newValue !== value) {
            var opts = el.options;
            for (var i=0,l=opts.length; i<l; i++) {
                var opt = opts[i];
                if (opt.value === newValue) {
                    opt.selected = true;
                } else if (opt.selected) {
                    opt.selected = false;
                }
            }
        }
    }

    return function(el) {
        if (boundProp) {
            // then automatically update prop when changed
            el.addEventListener('change', function(e) {
                rendering.vm[boundProp] = el.selectedIndex > -1 ? el.options[el.selectedIndex].value : undefined;
            });
        }
        rendering.up(function() { updateSelectedValue(el) });
        updateSelectedValue(el);
    }
}

