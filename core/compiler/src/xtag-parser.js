/**
 * Transform jsq files to js files
 * No map file is required since the transformation preserve original code lines
 */
import { ERR, splitList } from './utils.js';


const TAG_RX = /(?:^|\n)\s*<(?:(x-tag)|(x-style))(\s+[^>]*)?>/;
const TAG_END_RX = /\s*<\/(?:(x-tag)|(x-style))\s*>/;
const ATTR_RX = /([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;
const CNT_LINES_RX = /\n/g;

function getTagName(match) {
    if (match[1]) return 'x-tag';
    if (match[2]) return 'x-style';
    ERR("Bug?");
}


function parseAttrs(attrsDecl) {
    var attrs = {};
    ATTR_RX.lastIndex = 0;
    var m = ATTR_RX.exec(attrsDecl);
    while (m) {
        // preserve empty values like: "" or ''. If attribute with no value then the boolean true is used as the value
        attrs[m[1]] = m[2] != null ? m[2] : (m[3] != null ? m[3] : (m[4] != null ? m[4] : true));
        m = ATTR_RX.exec(attrsDecl);
    }
    return attrs;
}

function newLines(text) { // remove any characters but new lines from given text
	var ar = text.match(CNT_LINES_RX);
    return ar ? ar.join('') : '';
}
function newLinesCount(text) { // remove any characters but new lines from given text
	return (text.match(CNT_LINES_RX)||'').length;
}

function parseXTags(source, handler) {
    var parts = [];
    var m = TAG_RX.exec(source);
    while (m) {
    	var lfs = newLines(m[0]);
        var partText = source.substring(0, m.index);
        if (partText) {
            handler.text(partText+lfs);
        }
        source = source.substring(m.index+m[0].length);
        var stag = getTagName(m);
        var attrs = m[3];
        if (attrs) attrs = attrs.trim();
        m = TAG_END_RX.exec(source);
        if (!m) ERR(`Invalid qute file: No closing </${stag}> found.`);

        var etag = getTagName(m);
        if (etag !== stag) ERR(`Invalid qute file: Found closing tag '${etag}'. Expecting '${stag}'`);

        partText = source.substring(0, m.index);
        handler.tag(stag, attrs ? parseAttrs(attrs) : null, partText);

        source = source.substring(m.index+m[0].length);
        m = TAG_RX.exec(source);
    }
    // scan for imports on the remaining text
    if (source)  {
        handler.text(source);
    }
}


// ======================= transform JSQ to JS =====================

function handleTemplate(compiler, attrs, text) {
	if (!attrs || !attrs.name) ERR("x-tag attribute 'name' is required");
    var name = attrs.name;
    //var fname = kebabToCamel(name);
    var imports = attrs.import || null;

    var compiledFn = compiler.compile(text, splitList(imports));
    return 'Qute.register("'+name+'", '+compiledFn+', true);\n';
}

function handleStyle(compiler, attrs, text) {
    return 'Qute.css('+JSON.stringify(text.trim())+');\n';
}

function transpile(compiler, source, opts) {
    // We do not validate source -> If the source is not including a import Qute from ... then
    // a syntgax error will be trown by javascript (since Qute symbol will not be found)

	var out = '';
    parseXTags(source, {
        tag: function(tag, attrs, text) {
            if (text) {
                if (tag === 'x-tag') {
                    out += handleTemplate(compiler, attrs, text);
                } else if (tag === 'x-style') {
                    out += handleStyle(compiler, attrs, text);
                } else {
                	ERR(`Unsupported tag: '${tag}'`);
                }
                if (!(opts && opts.removeNewLines)) out += newLines(text);
            }
        },
        text: function(text) {
        	if (text) {
                // js can be used to transform fragments
                out += opts && opts.js ? opts.js(text) : text;
            }
        }
    });

    return out;
}

/*
  cb is a callback which will be called when an xtag was parsed:
  cb(xtagName, xtagFn, isCompiled)
 */
function loadXTags(compiler, source, cb) {
    parseXTags(source, {
        tag: function(tag, attrs, text) {
            if (tag !== 'x-tag') ERR(`Unsupported tag: '${tag}'`);
            if (!attrs || !attrs.name) ERR("x-tag attribute 'name' is required");
            var fn = compiler.compileFn(text, splitList(attrs.import));
            cb(attrs.name, fn, !attrs.static)
        },
        text: function(){} // ignore
    });
}

export { transpile, loadXTags }

