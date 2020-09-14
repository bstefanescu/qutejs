
import MagicString from 'magic-string';
import { ERR, splitList } from './utils.js';
import { kebabToCompName } from '@qutejs/commons';

const TAG_RX = /^\s*<(?:(q\:template)|(q\:style))(\s+[^>]*)?>/gm;
const TAG_END_RX = /\s*<\/(?:(q\:template)|(q\:style))\s*>/g;
const ATTR_RX = /([-A-Za-z0-9_]+)(?:\s*=\s*(?:(?:"((?:\\.|[^"])*)")|(?:'((?:\\.|[^'])*)')|([^>\s]+)))?/g;

function getTagName(match) {
    if (match[1]) return 'q:template';
    if (match[2]) return 'q:style';
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

function compileTemplate(compiler, attrs, text) {
	if (!attrs || !attrs.name) ERR("q:template attribute 'name' is required");
	text = text.trim();
	if (!text) return '';

    var name = kebabToCompName(attrs.name);
    //var fname = kebabToCamel(name);
    var imports = attrs.import || null;

    var compiledFn = compiler.compile(text, splitList(imports));
    return "var "+name+" = "+compiledFn+';\n'+name+'.$compiled = true;\n';
}

function defaultCompileStyle(compiler, attrs, text) {
    text = text.trim();
    return text ? '__qutejs_runtime_lib_injectStyle__('+JSON.stringify(text)+');' : '';
}

function PrependText(code) {
	this.code = code;
}
PrependText.prototype = {
	compile(ms) {
        ms.prepend(this.code);
    }
}

function Text(from, to, code) {
	this.from = from;
	this.to = to;
	this.code = code;
}
Text.prototype = {
	compile(ms) {} // do nothing
}

function Template(from, to, code) {
	this.from = from;
	this.to = to;
	this.code = code;
}
Template.prototype = {
	compile(ms) {
		ms.overwrite(this.from, this.to, this.code);
	}
}

function Style(from, to, code) {
	this.from = from;
	this.to = to;
	this.code = code;
}
Style.prototype = {
	compile(ms) {
		ms.overwrite(this.from, this.to, this.code);
	}
}

export default function JSQ(source, compiler, compileStyle) {
	this.source = source;
    this.parts = [];
    this.compileStyle = compileStyle || defaultCompileStyle;
	this.load(source, compiler);
}
JSQ.prototype = {
	transpile(opts) {
		var sourceMap = true;
		if (opts && ('sourceMap' in opts)) {
			sourceMap = !!opts.sourceMap;
		}

		var source = this.source;
		var ms = new MagicString(source);
		var parts = this.parts;
		for (var i=0,l=parts.length; i<l; i++) {
			var part = parts[i];
			part.compile(ms);
		}

		return {
			code: ms.toString(),
			map: sourceMap ? ms.generateMap() : null
		};
	},

	load(source, compiler) {
		var parts = this.parts;
		TAG_RX.lastIndex = 0;
		TAG_END_RX.lastIndex = 0;
		var offset = 0;
        var m = TAG_RX.exec(source);
        var foundStyle = false;
		while (m) {
			if (!m[1] && !m[2]) ERR('BUG?');
			if (offset < m.index) {
				parts.push(new Text(offset, m.index, source.substring(offset, m.index)));
			}
			TAG_END_RX.lastIndex = m.index;
			var end = TAG_END_RX.exec(source);
			if (!end) ERR('No matching end tag was found for <'+(m[1]||m[2])+'>.');
			var content = source.substring(TAG_RX.lastIndex, end.index);
			var attrs = m[3] ? parseAttrs(m[3]) : null;
			var code, PartType;
			if (m[1]) { // a template
				if (!end[1]) ERR('No matching template end tag was found: </q:template>.');
				PartType = Template;
				code = compileTemplate(compiler, attrs, content);
			} else if (m[2]) { // a style
				if (!end[2]) ERR('No matching style end tag was found: </q:style>.');
				PartType = Style;
                code = this.compileStyle(compiler, attrs, content);
                foundStyle = true;
			} else {
				ERR('BUG?');
			}
			if (m[0][0] === '\n') code = '\n'+code;
			parts.push(new PartType(m.index, TAG_END_RX.lastIndex, code));
			offset = TAG_END_RX.lastIndex;
			TAG_RX.lastIndex = offset;
			m = TAG_RX.exec(source);
		}

		if (TAG_RX.lastIndex < source.length) {
			parts.push(new Text(TAG_RX.lastIndex, source.length, source.substring(TAG_RX.lastIndex, source.length)));
        }

        if (foundStyle && this.compileStyle === defaultCompileStyle) {
            // the default compileStyle method needs to add an import on top of the file.
            parts.unshift(new PrependText('import __qutejs_runtime_lib_injectStyle__ from "@qutejs/runtime/lib/inject-style.js";\n'));
        }
	}

}


