// A regex HTML PARSER extended to support special attr names (inspired from https://johnresig.com/blog/pure-javascript-html-parser/)


var STAG_RX = /^<([-A-Za-z0-9_:]+)((?:\s+[-\w@#:]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|(?:\{[^}]*\})|[^>\s]+))?)*)\s*(\/?)>/,
    ETAG_RX = /^<\/([-A-Za-z0-9_:]+)[^>]*>/,
    ATTR_RX = /([-A-Za-z0-9_@#:]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|(?:\{((?:\\.|[^}])*)\})|([^>\s]+)))?/g;

var voids = {else:true, case:true, area:true, base:true, br:true, col:true, embed:true, hr:true, img:true, input:true, link:true, meta:true, param:true, source:true, track:true, wbr:true};

export default function parseHTML(html, handler) {
    function handleStartTag(tagName, attrsDecl, isVoid) { // void elements are tags with no close tag
        tagName = tagName.toLowerCase();
        isVoid = isVoid || voids[tagName];
        if (!isVoid) stack.push(tagName);
        var attrs = [];
        ATTR_RX.lastIndex = 0;
        var m = ATTR_RX.exec(attrsDecl);
        while (m) {
            // preserve empty values like: "" or ''. If attribute with no value then the boolean true is used as the value
            var v = m[2] != null ? m[2] : (m[3] != null ? m[3] : (m[4] != null ? m[4] : (m[5] != null ? m[5] : true)))
            attrs.push({ name: m[1], value: v, expr: m[4] != null });
            m = ATTR_RX.exec(attrsDecl);
        }
        handler.start(tagName, attrs, !!isVoid);
    }

    function handleEndTag(tagName) {
        tagName = tagName.toLowerCase();
        var top = stack.pop();
        if (top !== tagName) throw new Error('Unmatched close tag. Current Open tag is <'+top+'> but found </'+tagName+'>')
        handler.end(tagName);
    }

    var text = '', match = null, stack = [];
    while (html) {
        var i = html.indexOf('<');
        if (i === -1) {
            text += html;
            html = null; // exit
        } else if (i > 0) {
            text += html.substring(0, i);
            html = html.substring(i);
        } else { // i === 0
            var c = html.charAt(i+1);
            if (c === '!' && html.substring(i+2, i+4) === '--') { // <!--
                if (text && handler.text) { handler.text(text); text = ''; }
                var k = html.indexOf('-->', i+3);
                if (k === -1) {
                    throw new Error('Parse error: comment not closed');
                }
                if (handler.comment) handler.comment(html.substring(i+3, k));
                html = html.substring(k+3);
            } else if (c === '/' && (match = ETAG_RX.exec(html))) { // end tag
                if (text && handler.text) { handler.text(text); text = ''; }
                html = html.substring(i+match[0].length);
                handleEndTag(match[1]);
            } else if (match = STAG_RX.exec(html)) { // start tag
                if (text && handler.text) { handler.text(text); text = ''; }
                html = html.substring(i+match[0].length);
                handleStartTag(match[1], match[2], match[3]);
            } else { // not a html tag
                // get the next <
                var next = html.indexOf('<', i+1);
                if (next === -1) {
                    text += html;
                    html = null;
                } else {
                    text += html.substring(i, next);
                    html = html.substring(next);
                }
            }
        }
    }
    if (text && handler.text) handler.text(text);
    if (stack.length > 0) {
        throw new Error("Unclosed tag: "+stack[0]);
    }
}

