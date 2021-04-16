(function (css, beforeTarget) {
    var style = document.createElement('style');
    style.type = 'text/css';
    style.appendChild(document.createTextNode(css));
    if (beforeTarget) {
        var target = document.getElementById(beforeTarget);
        if (target) {
            target.parentNode.insertBefore(style, target);
            return;
        }
    }
    (document.head || document.getElementsByTagName('head')[0]).appendChild(style);
})
