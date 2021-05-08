import window from '@qutejs/window';
// we don't use vars to store computed values like the transitionend event or
// to ensure the rollup tree-shaking is correctly working (otherwise it may include code that is not needed)
// because of the additional side effects
// see https://github.com/rollup/rollup/wiki/Troubleshooting#tree-shaking-doesnt-seem-to-be-working
//
// this is why we store the computed trabsitionend event on the whichTransitionend function itself
// and we don't store the runOnNextRepaint in a global var.

function whichTransitionend() {
    // check cached result
    if ('__qute_cache' in whichTransitionend) {
        return whichTransitionend.__qute_cache;
    } else {
        var transitions = {
            "transition"      : "transitionend",
            "OTransition"     : "oTransitionEnd",
            "MozTransition"   : "transitionend",
            "WebkitTransition": "webkitTransitionEnd"
        }
        var transitionEndEvent, style = window.document.createElement('DIV').style;
        for(var transition in transitions) {
            if (style[transition] != undefined) {
                transitionEndEvent = transitions[transition];
                break;
            }
        }
        // cache event name
        return (whichTransitionend.__qute_cache = transitionEndEvent);
    }
}

                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        // handle the first transition end event on the given element.
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        // After the event is handled the handler is unregistered.
function onTransitionEnd(elt, handler, timeout) {
    var transitionEndEvent = whichTransitionend();
    if (transitionEndEvent) {
        var _handler = function(e) {
            try {
                return handler(e);
            } finally {
                elt.removeEventListener(transitionEndEvent, _handler);
            }
        }
        elt.addEventListener(transitionEndEvent, _handler);
    } else {
        window.setTimeout(handler, timeout || 20);
    }
}

// will run the code in the next repaint
function runOnNextRepaint(fn) {
    if (window.requestAnimationFrame) {
        window.requestAnimationFrame (function() {
            window.requestAnimationFrame(fn);
        })
    } else {
        window.setTimeout(fn, 20); // ~ 16.7 ms for 60fps
    }
}

export { whichTransitionend, onTransitionEnd, runOnNextRepaint };