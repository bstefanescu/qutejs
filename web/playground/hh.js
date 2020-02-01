// A regex HTML PARSER extended to support special attr names (inspired from https://johnresig.com/blog/pure-javascript-html-parser/)

var hh = (function() {
'use strict';

// ---------- parse attrs ------------

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

function parseAttrs(text, from) {
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

// -----------------------------------

var STAG_RX = /^<([-A-Za-z0-9_:]+)((?:\s+[-\w@#:]+(?:\s*=\s*(?:(?:"[^"]*")|(?:'[^']*')|(?:\{.*\})|[^>\s]+))?)*)\s*(\/?)>/,
    ETAG_RX = /^<\/([-A-Za-z0-9_:]+)[^>]*>/;

var voids = {else:true, case:true, area:true, base:true, br:true, col:true, embed:true, hr:true, img:true, input:true, link:true, meta:true, param:true, source:true, track:true, wbr:true};

function parseHTML(html, handler) {
    function handleStartTag(tagName, attrsDecl, isVoid) { // void elements are tags with no close tag
        tagName = tagName.toLowerCase();
        isVoid = isVoid || voids[tagName];
        if (!isVoid) stack.push(tagName);

        var attrs = parseAttrs(attrsDecl);

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


var BLOCKS = {
	address:true, article: true, aside: true, blockquote: true, div:true, dl: true, fieldset: true, figure: true, footer: true, form: true, h1: true, h2: true, h3: true, h4: true, h5: true, h6: true,
	header: true, main: true, nav: true, noscript: true, ol: true, p: true, pre: true, section: true, table: true, tfoot: true, ul: true, tr: true, script: true, select: true
}

var INLINE = {
	a: true, abbr: true, acronym: true, b: true, bdo: true, big: true, br: true,
	button: true, cite: true, code: true, dfn: true, em: true, i: true, img: true, input: true, kbd: true,
	label: true, map: true, object: true, output: true, q: true, samp: true,
	small: true, span: true, strong: true, sub: true, sup: true, textarea: true, time: true, tt: true, var: true
}

return function(html) {
	var out = [];
	var ind = "\n";
	function indent() {
		return ind+"    ";
	}
	function unindent() {
		return ind.substring(0,ind.length-4);
	}
	function esc(text) {
		return text.replace('"', '\\"');
	}
	function applyIndent(text) {
		//return text.replace('\n', '\n'+ind);
		return text;
	}
	parseHTML(html.trim(), {
		start: function(tag, attrs, isVoid) {
			out.push("<span class='hh-tag'>&lt;</span><span class='hh-name'>", tag, "</span>");
			if (attrs.length) {
				for (var i=0,l=attrs.length; i<l; i++) {
					var attr = attrs[i];
					var key = attr.name;
					var value = attr.value;
					out.push(" <span class='hh-key'>", key, "</span>");
					if (value !== true) {
						out.push("<span class='hh-eq'>=</span><span class='hh-val'>\"", esc(value), "\"</span>");
					}
				}
			}
			if (isVoid) {
				out.push("<span class='hh-tag'>/&gt;</span>");
			} else {
				out.push("<span class='hh-tag'>&gt;</span>");
				if (BLOCKS[tag]) {
					ind = indent();
					out.push(ind);
				}
			}
		},
		end: function(tag) {
			if (BLOCKS[tag]) {
				var oldInd = ind;
				ind = unindent();
				out.push(ind);
			}
			out.push("<span class='hh-tag'>&lt/</span><span class='hh-name'>", tag, "</span><span class='hh-tag'>&gt;</span>");
			if (!INLINE[tag]) {
				out.push(ind);
			}
		},
		comment: function(comment) {
			out.push("<span class='hh-comment'><!-- ", applyIndent(comment) ," --><span>");
		},
		text: function(text) {
			out.push(applyIndent(text));
		}
	});

	return "<div style='white-space:pre'>"+out.join('')+"</div>";
}

})();
