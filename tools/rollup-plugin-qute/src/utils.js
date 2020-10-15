

export function matchExtensions(name, exts) {
    var i = name.lastIndexOf('.');
    if (i > -1) {
        var ext = name.substring(i);
        return exts.indexOf(ext) > -1;
    }
    return false;
}

