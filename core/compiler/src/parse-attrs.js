
var ATTR_KEY = /\s*([A-Za-z0-9_@:-]+)(\s*=\s*)?/g;
var ATTR_V_Q = /\\*'/g;
var ATTR_V_DQ = /\\*"/g;
var ATTR_V_EXPR = /\{|\}/g;
var WS = /\s+/g;

function parseQuotedAttrValue(rx, text, index, attr) {
    rx.lastIndex = index+1;
    var m = rx.exec(text);
    while (m) {
        if (m[0].length & 1) { // odd
            // end of quoted string
            attr.value = text.substring(index+1, rx.lastIndex-1);
            return rx.lastIndex;
        } // else continue
        m = rx.exec(text);
    }
    var qlabel = rx === ATTR_V_DQ ? "double quoted" : "quoted";
    throw new Error('Unmatched end quote for '+qlabel+' attribute value: "'+ text+'" at index '+index);
}

function parseExprAttrValue(text, index, attr) {
    ATTR_V_EXPR.lastIndex = index+1;
    var open = 1, m = ATTR_V_EXPR.exec(text);
    while (m) {
        if (m[0].charCodeAt(0) === 123) { // a {
            open++;
        } else { // a }
            open--;
        }
        if (!open) {
            attr.expr = true;
            attr.value = text.substring(index+1, ATTR_V_EXPR.lastIndex-1);
            return ATTR_V_EXPR.lastIndex;
        }
        m = ATTR_V_EXPR.exec(text);
    }
    throw new Error('Unmatched end curly brace for expression attribute value: "'+ text+'" at index '+index);
}

function parseUnquotedAttrValue(text, index, attr) {
    WS.lastIndex = index;
    var m = WS.exec(text);
    if (m) {
        attr.value = text.substring(index, m.lastIndex);
        return m.lastIndex;
    } else {
        attr.value = text.substring(index);
        return text.length;
    }
}

function parseAttrValue(text, index, attr) {
    var first = text.charCodeAt(index);
    if (first === 34) { // "
        return parseQuotedAttrValue(ATTR_V_DQ, text, index, attr);
    } else if (first === 39) { // '
        return parseQuotedAttrValue(ATTR_V_Q, text, index, attr);
    } else if (first === 123) { // {
        return parseExprAttrValue(text, index, attr);
    } else { // stop at first whitespace
        return parseUnquotedAttrValue(text, index, attr);
    }
}

export default function parseAttrs(text, from) {
    text = text.trim();
    if (!text) return [];

    var attrs = [], lastIndex = from || 0;
    ATTR_KEY.lastIndex = lastIndex;
    var m = ATTR_KEY.exec(text);
    while (m) {
        var attr = { name: m[1], value: null, expr: false };
        if (m[2]) { // read value
            ATTR_KEY.lastIndex = parseAttrValue(text, ATTR_KEY.lastIndex, attr);
        } else { // boolean attr
            attr.value = true;
            var c = text[ATTR_KEY.lastIndex];
        }
        attrs.push(attr);
        lastIndex = ATTR_KEY.lastIndex;
        m = ATTR_KEY.exec(text);
    }
    if (lastIndex < text.length) {
        var lastAttr = attrs.length ? attrs[attrs.length-1] : null;
        if (lastAttr) lastAttr = lastAttr.name+'='+lastAttr.value; else lastAttr = 'N/A';
        throw new Error('Invalid attributes in "'+text+'" . Last parsed attribute: "'+lastAttr+'"');
    }
    return attrs;
}

