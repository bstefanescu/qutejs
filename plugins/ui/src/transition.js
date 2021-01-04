import window from '@qutejs/window';

function whichTransitionend() {
    var transitions = {
        "transition"      : "transitionend",
        "OTransition"     : "oTransitionEnd",
        "MozTransition"   : "transitionend",
        "WebkitTransition": "webkitTransitionEnd"
    }
    var style = document.createElement('DIV').style;
    for(var transition in transitions) {
        if (style[transition] != undefined) {
            return transitions[transition];
        }
    }
}

var transitionEndEvent = whichTransitionend();

// handle the first transition end event on the given element.
// After the event is handled the handler is unregistered.
function onTransitionEnd(elt, handler) {
    if (transitionEndEvent) {
        var _handler = function(e) {
            try {
                return handler(e);
            } finally {
                elt.removeEventListener(transitionEndEvent, _handler);
            }
        }
        elt.addEventListener(transitionEndEvent, _handler);
    }
}

// will run the code in the next repaint (not the current one)
var runOnNextRepaint = window.requestAnimationFrame
    ? function(fn) {
        window.requestAnimationFrame (function() {
            window.requestAnimationFrame(fn);
        })
    } : function(fn) {
        window.setTimeout(fn, 20); // ~ 16.7 ms for 60fps
    }

export { transitionEndEvent, onTransitionEnd, runOnNextRepaint };