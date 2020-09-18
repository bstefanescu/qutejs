function render(rendering, xattrs) {
    var span = document.createElement('SPAN');
    if (xattrs.color) span.style.color = rendering.eval(xattrs.color);
    span.textContent = "Hello!";
    return span;
}

window.__QUTE_IMPORT__ = render;
