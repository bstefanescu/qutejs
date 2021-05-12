function render(rendering, xattrs) {
    var span = window.document.createElement('SPAN');
    if (xattrs.color) span.style.color = rendering.eval(xattrs.color);
    span.textContent = "Hello!";
    return span;
}
Qute.import(render);
