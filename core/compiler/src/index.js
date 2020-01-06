import { ERR, makeSymbols } from './utils.js';
import parseHTML from './html-parser.js';
import { transpile, loadXTags } from './xtag-parser.js';

/*
attrs: {key: value, $, @}

h(tag, attrs[, bindings, events], children) - output dom node
v(expr) - variable text
t(text) - static text
f(list, item, index, hasNext, node) - for
x(expr, ifFragment, elseFragment) - if
c(tag, attrs, children) - view
*/



/*
1. Rewrite var names inside a literal object representation: we need to avoid rewriting words inside simple or double quoted strings or unquoted keys (which looks like vars)

QSTR:
'(?:\\.|[^'])*'
DQSTR:
"(?:\\.|[^"])*"
VAR:
[a-zA-Z_\$][0-9a-zA-Z_\$]*
KEY:
[\{,]\s*[a-zA-Z_\$][0-9a-zA-Z_\$]*\s*\:

((?:QSTR)|(?:DQSTR)|(?:KEY))|(VAR)
=> p1: ignore (String or key), p2: var

2. Rewrite var names in expressions (no literal obj reprentation)
We can do this using the same regex as above like this:
((?:QSTR)|(?:DQSTR))|(VAR)
=> p1: ignore (String), p2: var
*/
var VAR_RX = /^[a-zA-Z_\$][0-9a-zA-Z_\$]*$/;
var EXPR_RX = /((?:'(?:\\.|[^'])*')|(?:"(?:\\.|[^"])*"))|([a-zA-Z_\$][0-9a-zA-Z_\$\.]*)/g;
var OBJ_RX = /((?:'(?:\\.|[^'])*')|(?:"(?:\\.|[^"])*")|(?:[\{,]\s*[a-zA-Z_\$][0-9a-zA-Z_\$\.]*\s*\:))|([a-zA-Z_\$][0-9a-zA-Z_\$\.]*)/g;

var ARROW_FN_RX = /^(\(?)\s*((?:[a-zA-Z_$][a-zA-Z_$0-9]*)(?:\s*,\s*[a-zA-Z_$][a-zA-Z_$0-9]*)*)(\)?)\s*=>\s*(.*)$/;
// nested is a special tag we added for convenience in the regular html tags - it is used as a more meaningful replacement of template or div
var HTML_TAGS = makeSymbols("nested html head meta link title base body style nav header footer main aside article section h1 h2 h3 h4 h5 h6 div p pre blockquote hr ul ol li dl dt dd span a em strong b i u s del ins mark small sup sub dfn code var samp kbd q cite ruby rt rp br wbr bdo bdi table caption tr td th thead tfoot tbody colgroup col img figure figcaption map area video audio source track script noscript object param embed iframe canvas abbr address meter progress time form button input textarea select option optgroup label fieldset legend datalist menu output details summary command keygen acronym applet bgsound basefont big center dir font frame frameset noframes strike tt xmp template".split(" "));


function _s(val) {
    return JSON.stringify(val);
}

function _key(match) {
	var i = match.indexOf('.');
	return i > 0 ? match.substring(0,i) : match;
}
// write expr (without literal objects) by rewriting vars
function __x(expr, ctx) {
    return expr.replace(EXPR_RX, function(match, p1, p2) {
    	if (!p2) return match;
    	if (p2 === 'this') { // replace by '_'
    		return '_';
    	} else if (p2.startsWith('this.')) {
    		return '_'+p2.substring(4);
    	}
    	return !ctx.symbols[_key(match)] ? '_.'+p2 : match;
    });
}
function _x(expr, ctx) {
    return '(' + __x(expr, ctx) + ')';
}
// write literal object by rewriting vars
function _o(expr, ctx) {
    return '(' + expr.replace(OBJ_RX, function(match, p1, p2) {
    	if (!p2) return match;
    	if (p2 === 'this') { // replace by '_'
    		return '_';
    	} else if (p2.startsWith('this.')) {
    		return '_'+p2.substring(4);
    	}
    	return !ctx.symbols[_key(match)] ? '_.'+p2 : match;
    }) + ')';
}
function _xo(expr, ctx) {
	if (expr == null) return 'null';
	var c = expr.charAt(0);
	return (c === '{' || c === '[' ? _o : _x)(expr, ctx);
}
// used to wrap a compiled expr in a lambda function
function _v(expr) {
	return 'function(_){return '+expr+'}';
}
function _f(expr) {
	return 'function(){return '+expr+'}';
}
function _r(expr) { // a sub-rendering context fn
	return 'function($){return '+expr+'}';
}

function getArrowFn(expr, ctx) {
	var m = ARROW_FN_RX.exec(expr);
	if (m) {
		var open = m[1];
		var args = m[2].trim();
		var close = m[3];
		var body = m[4].trim();

		if (!!open !== !!close) {
			ERR('Invalid arrow function syntax: '+expr);
		}
		if (!body) {
			ERR('Invalid arrow function syntax: '+expr);
		}
		// 123 = { and 125 = }
		var bs = body.charCodeAt(0);
		var be = body.charCodeAt(body.length-1);
		if (bs === 123) {
			if (be !== 125) {
				ERR('Invalid arrow function syntax: '+expr);
			} // else body is in the form { ... }
		} else if (be === 125) {
			ERR('Invalid arrow function syntax: '+expr);
		} else { // no { ... }
			body = '{'+body+';}';
		}
		// push in ctx.symbols  the local vars
		var symbols = ctx.symbols;
		var localSymbols = Object.assign({},symbols);
		args.split(/\s*,\s*/).forEach(function (key) { localSymbols[key] = true; });
		ctx.symbols = localSymbols;
		var r = '(function('+args+')'+__x(body, ctx)+')($1,_)'; // call the inline fn with the _ (this) and the $1 argument
		ctx.symbols = symbols; // restore symbols
		return r;
		// pop from ctx symbols the local vars
	}
	return null;
}
// write a callback (e.g. they are used by events)
// if the event is a var name => we generate a fn: function(e) { expr(e) }
// otherwise we generate a function: function() { expr }
function _cb(expr, ctx) {
	if (VAR_RX.test(expr)) {
		// event listeners will be called with args:
		// 1. for functions: VM.callback(event) - where this is the VM
		// 2. for vm methods: VM.callback(event) - where this is the VM
		// 3. for expressions: $1 - the event, this - the vm
		// the event cb function must always be called with the element as the 'this' object
		if (ctx.imports[expr]) { // an imported function
			return "function($1){return "+expr+".call(this, $1)}";
		} else { // a vm method
			return "function($1){return this."+expr+"($1)}";
		}
	} else {
		var arrowFn = getArrowFn(expr, ctx);
		if (arrowFn) {
			//return "function(this,$1){"+arrowFn+"}";
			return "function($1){var _=this;"+arrowFn+"}";
		} else {
			return "function($1){var _=this;"+_x(expr, ctx)+"}";
		}
	}
}

function _fn(name) {
	//TODO '$' must not be used as a for argument!!
	var r = '$.'+name+'(';
	if (arguments.length>1) {
		r += Array.prototype.slice.call(arguments, 1).join(',');
	}
	return r+')';
}
function _node(xattrs, ctx) {
	return xattrs ? xattrs.compile(ctx) : 'null';
}
function _nodes(children, ctx) {
	if (!children || !children.length) return 'null';
	return '['+children.map(function(child) {
		return child.compile(ctx);
	}).join(',')+']';
}
/*
function _bindings(bindings, ctx) {
	var out = [];
	for (var key in bindings) {
		out.push(_s(key)+':'+_v(_xo(bindings[key], ctx)));
	}
	return out.length ? '{'+out.join(',')+'}' : null;
}
*/
/*
function _bindings(bindings, ctx) {
	var out = [];
	for (var key in bindings) {
		out.push(_s(key)+':'+_xo(bindings[key], ctx));
	}
	return out.length ? _v('{'+out.join(',')+'}') : null;
}
*/
function _events(events, ctx) {
	var out = [];
	for (var key in events) {
		out.push(_s(key)+':'+_cb(events[key], ctx));
	}
	return out.length ? '{'+out.join(',')+'}' : null;
}
/*
function _attrs(attrs) {
	var out = null;
	if (attrs) {
		out = [];
		for (var key in attrs) {
			out.push(_s(key)+':'+_s(attrs[key]));
		}
	}
	return out && out.length ? '{'+out.join(',')+'}' : 'null';
}
*/
/*
ol impl which compile each binding as a function
function _xattrs(bindings, events, ctx) {
	var out = null;
	if (bindings) {
		out = [];
		for (var key in bindings) {
			// TODO use v(..) only if not a literal to optimize literal assignment like boolean or number (do not enclose in a function)
			out.push(_s(key)+':'+_v(_xo(bindings[key], ctx)));
		}
	}
	if (events) {
		out || (out = []);
		var v = _events(events, ctx);
		if (v) out.push('"$on":'+v);
	}
	return out && out.length ? '{'+out.join(',')+'}' : 'null';
}
*/
function _xattrs(attrs, bindings, xattrs, directives, events, ctx) {
	var out = null;
	if (attrs) {
		out = [];
		for (var key in attrs) {
			out.push(_s(key)+':'+_s(attrs[key]));
		}
	}
	if (bindings) {
		out || (out = []);
		for (var key in bindings) {
			out.push(_s(key)+':'+_v(_xo(bindings[key], ctx)));
		}
	}
	if (xattrs) {
		out || (out = []);
		for (var key in xattrs) {
			var val;
			if (key === '$attrs' || key === '$listeners') {
				val = xattrs[key];
			} else {
				val = _v(_xo(xattrs[key], ctx));
			}
			out.push(_s(key)+':'+val);
		}
	}
	if (directives) {
		out || (out = []);
		for (var key in directives) {
			out.push(_s(key)+':'+directives[key]); // directives are already encoded
		}
	}
	if (events) {
		out || (out = []);
		var v = _events(events, ctx);
		if (v) out.push('"$on":'+v);
	}
	return out && out.length ? '{'+out.join(',')+'}' : 'null';
}

function attrValue(attr) {
	return attr.value === true ? attr.name : attr.value;
}

function RootNode() {
	this.name = 'root';
	this.children = [];
	this.append = function(child) {
        this.children.push(child);
	}
	this.lastChild = function() {
		return this.children[this.children.length-1];
	}
	this.compile = function(ctx) {
		var children = this.children;
		if (children.length !== 1) ERR("the root node must have a single children element");
		return this.children[0].compile(ctx);
	}
	// trim the children (remove trailing and leading blank nodes)
	this.trim = function() {
		var children = this.children;
		if (children.length > 1) {
			var child = children[0];
			if (child instanceof TextNode && child.isBlank) children.shift();
			child = children[children.length-1];
			if (child instanceof TextNode && child.isBlank) {
				child.pop();
			}
		}
		return this;
	}
}

function DomNode(name, attrs) {
	this.name = name;
	this.attrs = null;
	this.bindings = null;
	this.xattrs = null; // directives like x-show
	// for future use (not yet used)
	// directives are custom attrs that can be  contirbuted by apps
	// They are treated like xattrs but are output as is (as they are encoded at read time)
	this.directives = null;
	this.events = null;
	this.children = [];

	this.attr = function(name, value) {
		if (!this.attrs) this.attrs = {};
		this.attrs[name] = value;
	}
	this.bind = function(name, value) {
		var bindings = this.bindings || (this.bindings = {});
		bindings[name] = value.trim();
	}
	this.xattr = function(name, value) {
		if (!this.xattrs) this.xattrs = {};
		this.xattrs[name] = value.trim();
	}
	this.directive = function(name, value) {
		if (!this.directives) this.directives = {};
		this.directives[name] = value;
	}
	this.on = function(name, value) {
		var events = this.events || (this.events = {});
		events[name] = value.trim();
	}

	this.append = function(node) {
		this.children.push(node);
	}

	this.compile = function(ctx) {
		if (this.name === 'tag') {
			var attrs = this.attrs;
			if (!attrs || !attrs.is) ERR("<tag> requires an 'is' attribute");
			var isAttr = attrs.is;
			delete attrs.is;
			return _fn('g', _v(_x(isAttr, ctx)), // g from tag
				//_attrs(this.attrs),
				_xattrs(this.attrs, this.bindings, this.xattrs, this.directives, this.events, ctx),
				_nodes(this.children, ctx));
		}
		if (this.name === 'view') {
			var attrs = this.attrs;
			if (!attrs || !attrs.is) ERR("<view> requires an 'is' attribute");

			var isExpr = _v(_x(attrs.is, ctx));
			delete attrs.is;
			var noCache = 'false';
			if ('x-nocache' in attrs) {
				delete attrs['x-nocache'];
				noCache = 'true';
			}
			var onChange = 'null';
			if ('x-change' in attrs) {
				onChange = _cb(attrs['x-change'], ctx);
				delete attrs['x-change'];
			}

			return _fn('w', // w from view ?
				isExpr,
				onChange,
				noCache,
				_xattrs(this.attrs, this.bindings, this.xattrs, this.directives, this.events, ctx), //xattrs
				_r(_nodes(this.children, ctx)) // childrenFn
			);
		}
		var fname, tag;
		//if (ctx.isXTag(this.name))
		if (this.name in HTML_TAGS) { // a dom element
			fname = 'h'; // h from html
			tag = _s(this.name);
		} else { // a component
			var tag = ctx.resolve(this.name);
			if (tag) { // resolved compile time
				fname = 'v'; // v from view model
			} else { // should resolve at runtime
				fname = 'r'; // r from runtime
				tag = _s(this.name);
			}
		}
		if (this.name==='pre') {
			ctx = ctx.push();
			ctx.pre = true;
		}
		return _fn(fname, tag,
			//_attrs(this.attrs),
			_xattrs(this.attrs, this.bindings, this.xattrs, this.directives, this.events, ctx),
			_nodes(this.children, ctx));
	}

	this.xcontent = function(type, attr) {
		if (attr.value === true) {
			return new StaticNode(this, type);
		} else {
			//TODO: use type ...
    		this.xattr('$html', attr.value);
    	}
    	return this;
	}

	function parseXAttrs(val) {
		if (val === true) return 'null';
		var first = true;
		if (val.charCodeAt(0) === 33) { // a ! -> exclude rule
			val = val.substring(1);
			first = false;
		}
		var ar;
		val = val.trim();
		if (val.indexOf(',') > -1) {
			ar = val.split(/\s*,\s*/);
		} else {
			ar = val.split(/\s+/);
		}
		ar.unshift(first); // insert the filter type (true for inclusion, false for exclusion) as the first item
		return _s(ar);
	}

	this.parseAttrs = function(attrs) {
		var r = this;
		for (var i=0,l=attrs.length; i<l; i++) {
	    	var attr = attrs[i];
	    	var name = attr.name;
	        var c = name[0];
	        if (c === ':') {
	        	this.bind(name.substring(1), attr.value);
	        } else if (c === '@') {
	        	this.on(name.substring(1), attr.value);
	        } else if ('x-for' === name) {
	        	r = new ListNode(attr.value, this);
	        } else if ('x-attrs' === name) {
	        	this.xattr('$attrs', parseXAttrs(attr.value));
	        } else if ('x-listeners' === name) {
	        	this.xattr('$listeners', parseXAttrs(attr.value));
	        } else if ('x-channel' === name) {
	        	this.attr('$channel', attr.value); // use a regular attr since valkue is always a string literal
			} else if ('x-show' === name) {
				this.xattr('$show', attr.value);
			} else if ('x-class' === name) {
				this.xattr('$class', attr.value);
			} else if ('x-style' === name) {
				this.xattr('$style', attr.value);
			} else if ('x-toggle' === name) {
				this.xattr('$toggle', attr.value);
			} else if ('x-html' === name) {
				if (attr.value === true) {
					r = new StaticNode(this, null);
				} else {
    				this.xattr('$html', attr.value);
    			}
			} else if ('x-markdown' === name) {
				r = new StaticNode(this, 'markdown');
	        } else if (name.startsWith('x-content-')) {
	        	var ctype = name.substring('x-content-'.length);
	        	r = new StaticNode(this, ctype !== 'html' ? ctype : null);
	        } else if (attr.expr) {
	        	// an expression: support { ... } as an alternative for :name
	    		this.bind(name, attr.value);
	    	} else if (name.startsWith('x-bind:')) {
	    		this.bind(name.substring(7), attr.value);
	    	} else if (name.startsWith('x-on:')) {
	    		this.on(name.substring(5), attr.value);
	        } else {
	        	this.attr(name, attrValue(attr));
	        }
		}
		return r;
	}

	return this.parseAttrs(attrs);
}
// a DomNode that has static children (set with innerHTML from the template content)
function StaticNode(node, type) {
	this.node = node;
	this.compile = function(ctx) {
		return _fn('hh', _s(this.node.name),
			//_attrs(this.node.attrs),
			_xattrs(this.node.attrs, this.node.bindings, this.node.xattrs, this.node.directives, this.node.events, ctx),
			_s(this.html.join('')),
			_s(type)
		);
	}

	// compile logic
	this.tag = node.name;
	this.stack = [];
	this.html = [];
	this.start = function(tagName, attrs, isVoid) {
		var html = this.html;
		html.push('<', tagName);
		for (var i=0,l=attrs.length; i<l; i++) {
			var attr = attrs[i];
			html.push(' ', attr.name);
			if (attr.value !== true) {
				html.push('="', attr.value, '"');
			}
		}
		html.push(isVoid?'/>':'>');
		if (!isVoid) this.stack.push(tagName);
	}
	this.end = function(tagName) {
		var tag = this.stack.pop();
		if (tag) { // subtree traversed
			if (tag !== tagName) ERR(`Closing tag '${tagName}' doesn't match the start tag '${tag}'`);
			this.html.push('</', tagName, '>');
		} else {
			return true; // finished
		}
	}
	this.text = function(text) {
		this.html.push(text);
	}
}

function TextNode(value) {
	this.value = value;
	this.isBlank = value.trim().length===0;
	this.compile = function(ctx) {
		var value = this.isBlank && !ctx.pre ? this.value.trim()+' ' : this.value;
		return _fn('t', _s(value));
	}
	this.append = function(text) {
		this.value += text;
		if (this.isBlank) this.isBlank = this.value.trim().length===0;
	}
}

function ExprNode() {
	this.parts = [];
	this.text = function(text) {
		this.parts.push(false, text);
	}
	this.expr = function(expr) {
		this.parts.push(true, expr);
	}
	this.compile = function(ctx) {
		var parts = this.parts;
		var out = [];
		for (var i=0,l=parts.length; i<l; i+=2) {
			if (parts[i]) out.push(_x(parts[i+1], ctx));
			else out.push(_s(parts[i+1]));
		}
		;
		return _fn('x', _v(out.join('+')));
	}
}

var FOR_RX = /^\s*(.+)\s+in\s+(.+)\s*$/;
function parseForExpr(listNode, expr) {
	var m = FOR_RX.exec(expr);
	if (!m) ERR("Invalid for expression");
	listNode.list = m[2].trim();
	var item = m[1].trim();
	if (item.indexOf(',') > -1) {
		var args = item.split(/\s*,\s*/);
		listNode.item = args[0];
		listNode.index = args[1];
		if (args.length > 2) listNode.hasNext = args[2];
	} else {
		listNode.item = item;
	}
}
function ListNode(expr, node) {
	this.node = node;
	this.list = null;
	this.item = null;
	this.index = '$2';
	this.hasNext = '$3';

	// parse expr
	parseForExpr(this, expr);

	this.append = function(node) {
		this.node.append(node);
	}

	this.compile = function(ctx) {
		// we wrap children in a inline fucntion def so that item, index and has_next are resolved inside the children nodes
		// also, _x function must not rewrite item, index and has_next variable ...
		// 1. compile children and avoid rewriting iteration vars
		var forCtx = ctx.push();
		var forSymbols = forCtx.symbols;
		forSymbols[this.item] = true;
		forSymbols[this.index] = true;
		forSymbols[this.hasNext] = true;
		var children = _node(this.node, forCtx);
		// 2. wrap children
		var childrenFn = 'function($,'+this.item+','+this.index+','+this.hasNext+'){return '+children+'}';
		return _fn('l', _v(_x(this.list, ctx)), childrenFn);
	}

}

function ForNode(tag, attrs) {
	this.list = null;
	this.item = null;
	this.index = '$2';
	this.hasNext = '$3';

	this.children = [];
	this.append = function(child) {
        this.children.push(child);
	}
	this.lastChild = function() {
		return this.children[this.children.length-1];
	}
	this.compile = function(ctx) {
		// we wrap children in a inline fucntion def so that item, index and has_next are resolved inside the children nodes
		// also, _x function must not rewrite item, index and has_next variable ...
		// 1. compile children and avoid rewriting iteration vars
		var forCtx = ctx.push();
		var forSymbols = forCtx.symbols;
		forSymbols[this.item] = true;
		forSymbols[this.index] = true;
		forSymbols[this.hasNext] = true;
		var children = _nodes(this.children, forCtx);
		// 2. wrap children
		var childrenFn = 'function('+this.item+','+this.index+','+this.hasNext+'){return '+children+'}';
		return _fn('a', _v(_x(this.list, ctx)), childrenFn);
	}

	if (attrs.length !== 1) ERR("For directive take exatcly one attribute");
	parseForExpr(this, attrs[0].value);
}

function IfNode(tag, attrs) {
	this.children = [];
	this.cases = null; // array of if-else / if nodes.
	this.change = null; // onchange event handler if any
	this.expr = null;

	// we don't check the attr name - any name may be used (not only 'value')
	var valueAttr = attrs[0];
	if (attrs.length === 2) {
		var changeAttr = attrs[1];
		if (valueAttr.name === 'x-change') {
			changeAttr = valueAttr;
			valueAttr = attrs[1];
		} else if (changeAttr.name !== 'x-change') {
			ERR(`Invalid if attribute '${changeAttr.name}'. You may want to use x-change?`);
		}
		this.change = changeAttr.value;
	} else if (attrs.length !== 1) {
		ERR("if has only one required attribute: value='expr' and an optional one: x-change='onChangeHandler'");
	}
	this.expr = attrValue(valueAttr);

	this.append = function(node) {
		if (node instanceof ElseNode) {
			if (this.cases) {
				var lastCase = this.cases[this.cases.length-1];
				if (lastCase.expr === null) ERR('Invalid if/else-id/else tags: else must be the last one in the chain.');
			} else {
				this.cases = [];
			}
			this.cases.push(node);
		} else if (this.cases) {
			var lastCase = this.cases[this.cases.length-1];
			lastCase.children.push(node);
		} else {
			this.children.push(node);
		}
	}

	this.compile = function(ctx) {
		// if/else-if/else signature: 'i', list_of_exprs, list_of_children, changeCb
		// else expr is null
		// if only if is present the a list of size is used.
		var change = this.change ? _cb(this.change, ctx) : 'null';

		var exprs = [ _v(_x(this.expr, ctx)) ], kids = [ _r(_nodes(this.children, ctx)) ];
		if (this.cases) {
			var cases = this.cases;
			for (var i=0,l=cases.length; i<l; i++) {
				var ifCase = cases[i];
				exprs.push(ifCase.expr ? _v(_x(ifCase.expr, ctx)) : 'null');
				kids.push(_r(_nodes(ifCase.children, ctx)));
			}
		}
		return _fn('i', '['+exprs.join(',')+']', '['+kids.join(',')+']', change);
	}
}

function ElseNode(tag, attrs) {
	this.children = [];
	this.expr === null;
	if (tag === 'else-if') {
		if (attrs.length !== 1) {
			ERR("the else-if tag must have a 'value' attribute");
		}
		// we don't check the attr name...
		this.expr = attrValue(attrs[0]);
	} //else the else tag: no attributes
}

//TODO
function SlotNode(tagName, attrs) {
	this.name = tagName;
	this.children = [];
	this.append = function(child) {
        this.children.push(child);
	}
	//TODO is this needed?
	this.lastChild = function() {
		return this.children[this.children.length-1];
	}
	this.process = function(processor) {
		return processor.processSlot(this);
	}
	this.compile = function(ctx) {
		return _fn('s', _s(this.slotName), _nodes(this.children, ctx));
	}
	if (attrs.length > 1) ERR("slot node take zero or one 'name' parameter");
	this.slotName = attrs.length ? attrValue(attrs[0]) : null;
}


var MUSTACHE_RX = /\{\{([^\}]+)\}\}/g;
//var BLANK_RX = /^\s*$/;

var NODES = {
	'if':  IfNode, 'q:if': IfNode,
	'else':  ElseNode, 'q:else': ElseNode,
	'else-if': ElseNode, 'q:else-if': ElseNode,
	'for':  ForNode, 'q:for':  ForNode,
	'slot': SlotNode, 'q:slot': SlotNode,

}

var SYMBOLS = {
	"true": true, "false": true, "undefined": true, "null": true, "void": true,
	"$0": true, "$1": true, "$2": true, "$3": true,
	"$": true, "this": true, "_": true,
	"JSON": true, "Object": true, "console": true, "window": true
};



function Compiler() {
	function Context(symbols, imports, resolve, pre) {
		this.pre = pre; // if pre then do not compact spaces in TextNodes
		this.resolve = resolve;
		this.symbols = symbols;
		this.imports = imports;
		this.push = function() {
			return new Context(Object.assign({}, this.symbols), this.imports, this.resolve, this.pre);
		}
	}
	// collector is used only when static html should be collected sue to an x-html attribute
	// See StaticNode
	this.collector = null;
	this.top = null;
	this.stack = [];
	this.lastText = null; // used to merge adjacent text nodes

	this.resolve = function(tag) {
		return null;// the default is to resolve at runtime
	}

	this.pushText = function(text) {
		if (this.lastText) this.lastText.append(text);
		else {
			var node = new TextNode(text);
			this.push(node, true);
			this.lastText = node;
		}
	}

	this.push = function(node, isVoid) {
		this.lastText = null;
		this.top.append(node);
		if (!isVoid) {
			this.stack.push(this.top);
			this.top = node;
		}
	}

	this.pop = function() {
		this.lastText = null;
        var top = this.top;
        this.top = this.stack.pop();
        return top;
	}


	this.text = function(text) {
		if (this.collector) {
			this.collector.text(text);
			return;
		}
	    var i = text.indexOf('{{'), s = 0;
	    if (i > -1) {
	        MUSTACHE_RX.lastIndex = i;
	        var match = MUSTACHE_RX.exec(text);
	        if (match) {
	           	var node = new ExprNode();
	            do {
	                var index = match.index;
	                if (index > s) {
	                    node.text(text.substring(s, index));
	                }
	                node.expr(match[1]);
	                s = MUSTACHE_RX.lastIndex;
	                match = MUSTACHE_RX.exec(text);
	            } while (match);
	            if (s < text.length) {
	                node.text(text.substring(s));
	            }
	            this.push(node, true);
	            return;
	        }
	    }
	    this.pushText(text);
	}

	this.start = function(tagName, attrs, isVoid) {
		if (this.collector) {
			this.collector.start(tagName, attrs, isVoid);
		} else {
			var NodeType = NODES[tagName];
			var node;
			if (NodeType) {
				node = new NodeType(tagName, attrs, isVoid);
			} else {
				node = new DomNode(tagName, attrs, isVoid);
				if (node instanceof StaticNode) {
					// allow <div x-conent-{random} />
					//if (isVoid) ERR("Static node (x-html) must have some content");
					this.collector = node;
				}
			}
			this.push(node, isVoid);
		}
	}

	this.end = function(tagName) {
		if (this.collector) {
			if (!this.collector.end(tagName)) {
				return
			}
			// subtree traversed - remove collector
			this.collector = null;
		}
		this.pop();
	}

	this.parse = function(text) {
		this.top = new RootNode();
		parseHTML(text.trim(), {
			start: this.start.bind(this),
			end: this.end.bind(this),
			text: this.text.bind(this)
		});
		// "trim" the root node (blank text mnodes mayt appear because of comments)
		return this.top.trim();
	}

    this.compile = function(text, imports, pre) { // r is the Renderer
    	var ctx = new Context(Object.assign(imports || {}, SYMBOLS), imports || {}, this.resolve, pre);
    	var r = this.parse(text).compile(ctx);
    	//console.log("COMPILED:",r);
        return 'function($){return '+r+';}';
    }

	this.compileFn = function(text, imports, pre) {
		var ctx = new Context(Object.assign(imports || {}, SYMBOLS), imports || {}, this.resolve, pre);
    	var r = this.parse(text).compile(ctx);
    	//console.log("COMPILED:",r);
		return new Function('$', 'return '+r+';');
	}

	this.transpile = function(source, opts) {
		return transpile(this, source, opts);
	}

	this.loadXTags = function(source, cb) {
		return loadXTags(this, source, cb);
	}

}

Compiler.parseHTML = parseHTML;

export default Compiler;
