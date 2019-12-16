import {document} from '@qutejs/window';
import ERR from './error.js';
import UpdateQueue from './update.js';
import Rendering from './rendering.js';

function ListFragment(rendering, listFn) {
	this.start = document.createComment('[list]');
	this.end = document.createComment('[/list]');
	this.r = rendering;
	this.listFn = listFn;
	this.length = 0;

	this.updateChildren = function(model) {
		var first = this.start.nextSibling;
		if (!first || first === this.end || !first.$up) return;
		var n = first, end = this.end;
		while (n && n !== end) {
			if (n.$up) {
				var ups = n.$up;
				for (var i=0,l=ups.length;i<l;i++) {
					ups[i](model);
				}
			}
			n = n.nextSibling;
		}
	}

	this.clear = function() {
		var n = this.start;
		var end = this.end;
		var parent = n.parentNode;
		while (n.nextSibling && n.nextSibling !== end) {
			parent.removeChild(n.nextSibling);
		}
		if (!n.nextSibling) ERR(10);
		this.length = 0;
	}

	this.get = function(index) {
		if (index < 0 || index > this.length) {
			return null;
		}
		var l = this.length, n = null;
		if (index < l/2) { // from start
			n = this.start.nextSibling;
			while (index-- > 0) n = n.nextSibling;
		} else { // from end
			index = l - index - 1;
			n = this.end.previousSibling;
			while (index-- > 0) n = n.previousSibling;
		}
		return n;
	}

	this.getInsertion = function(index) {
		if (index < 0 || index > this.length) ERR(11, index, length);
		if (index === 0) {
			return this.start.nextSibling;
		}
		if (index === this.length) {
			return this.end;
		}
		return this.get(index);
	}

	this.createItem = function(r, item, index, hasNext) {
		return listFn(r, item, index, hasNext);
	}

	this.insert = function(data, from, count) {
		if (!from) from = 0; // if undefined null or 0
		if (!count) count = data.length - from; // if undefined null or 0
		if (count < 1) return;
		var l = from+count;
		var listFn = this.listFn;
		var r = this.r;
		var node = this.getInsertion(from);
		if (!node) ERR(12, index, this.length);
		//TODO redraw if list fragment is broken insted of throwing an error?
		var childR, vm = r.vm, parent = node.parentNode;
		var ll = l-1;
		for (var i=from; i<ll; i++) {
			// we need to wrapp each child in a rendering ctx to be able to disconnect when items are removed
			childR = new Rendering(vm);
			var child = this.createItem(childR, data[i], i, true);
			if (child) {
				parent.insertBefore(child, node);
				r.$push(childR);
				child.__qute_ctx__ = childR;
			}
		}
		childR = new Rendering(vm);
		var child = this.createItem(childR, data[ll], ll, l<data.length);
		if (child) {
			parent.insertBefore(child, node);
			r.$push(childR);
			child.__qute_ctx__ = childR;
		}
		this.length = data.length;
	}

	this.remove = function(from, count) {
		if (from + count > this.length) {
			// TODO enable only if debug mode
			//throw new Error('Removed range exceed the list length: '+from+'#'+count+'. Length is '+this.length);
			return;
		}
		var node = this.get(from);
		if (!node) ERR(13, from, this.length);
		var i=0, parent = this.start.parentNode;
		node = node.previousSibling; // cannot be null
		while (i++<count) {
			var child = node.nextSibling;
			child.__qute_ctx__ && child.__qute_ctx__.$disconnect();
			parent.removeChild(child);
		}
		this.length -= count;
	}

	this.move = function(from, to) {
		// TODO this can be optimized (we can search for the 2 nodes in the same time: get2(i1, i2))
		var node = this.get(from);
		if (!node) ERR(14, from, this.length);
		var dstNode = this.get(to);
		if (!dstNode) ERR(15, to, this.length);
		dstNode = dstNode.nextSibling;
		if (dstNode) {
			dstNode.parentNode.insertBefore(node, dstNode);
		} else {
			dstNode.parentNode.append(node);
		}
	}
}



var AP = Array.prototype;
var ListProto = {
	$createListFragment: function(rendering, listFn) {
		var listRendering = new Rendering(rendering.vm);
		if (!this.lfs) this.lfs = [];
		var lf = new ListFragment(listRendering, listFn);
		var frag = document.createDocumentFragment();
		frag.appendChild(lf.start);
		frag.appendChild(lf.end);
		lf.insert(this.$data); // initialize
		rendering.up(lf.updateChildren.bind(lf)); // register children updates
		this.lfs.push(lf);
		rendering.$push(listRendering);
		return frag;
	},
	/*
	$destroy: function() { //TODO not used
		this.lfs = null;
	},
	*/
	$updateNow: function() {
		if (this.lfs) {
			var ops = this.ops;
			var data = this.$data;
			var lfs = this.lfs;
			var l = lfs.length;
			while (ops.length) {
				var op = ops.shift();
				for (var i=0,l=lfs.length; i<l; i++) {
					op(lfs[i], data);
				}
			}
		}
	},
	$update: function(op) {
		if (this.lfs) {
			if (this.ops.push(op) === 1) { // if queue is empty start an update task
				var self = this;
				UpdateQueue.push(function() {
					self.$updateNow();
				});
			}
		}
	},
	$redraw: function() {
		this.$update(function(lf, data) {
			lf.clear();
			lf.insert(data);
		});
	},
	$insert: function(from, count) {
		this.$update(function(lf, data) {
			lf.insert(data, from, count);
		});
	},
	$remove: function(from, count) {
		this.$update(function(lf, data) {
			lf.remove(from, count);
		});
	},
	$move: function(from, to) {
		this.$update(function(lf, data) {
			lf.move(from, to);
		});
	},

	toJSON: function() {
		return this.$data;
	},
	data: function() {
		return this.$data;
	},
	newList: function() {
		return new List(this.$data);
	},

	clear: function() {
		this.replace([]);
	},
	replace: function (ar) {
		this.$data = ar;
		this.$redraw();
	},

	move: function(from, to) {
		this.$data.splice(to, 0, this.$data.splice(from, 1)[0]);
		this.$move(from, to);
	},

	remove: function(item) {
		var i = this.$data.indexOf(item);
		if (i > -1) {
			return this.splice(i, 1);
		}
	},

	push: function() {
		var from = this.$data.length;
		var r = AP.push.apply(this.$data, arguments);
		this.$insert(from, arguments.length);
		return r;
	},
	unshift: function() {
		var from = this.$data.length;
		var r = AP.unshift.apply(this.$data, arguments);
		this.$insert(0, arguments.length);
		return r;
	},
	pop: function() {
		var r = AP.pop.apply(this.$data, arguments);
		this.$remove(this.$data.length, 1);
		return r;
	},
	shift: function() {
		var r = AP.shift.apply(this.$data, arguments);
		this.$remove(0, 1);
		return r;
	},
	splice: function(start, deleteCount) {
		var argsl = arguments.length;
		var len = this.$data.length;
		var r = AP.splice.apply(this.$data, arguments);
		if (argsl === 1) {
			this.$remove(start, len-start);
		} else if (argsl === 2) {
			this.$remove(start, deleteCount);
		} else { // some inserted items
			if (deleteCount) this.$remove(start, deleteCount);
			this.$insert(start, argsl-2);
		}
		return r;
	},
	sort: function(cmp) {
		this.$data.sort(cmp);
		this.$redraw();
		return this.$data;
	},
	reverse: function() {
		this.$data.reverse();
		this.$redraw();
		return this.$data;
	},
	get: function(i) {
		return this.$data[i];
	},
	slice: function() {
		return AP.slice.apply(this.$data, arguments);
	},
	forEach: function(cb, thisArg) {
		this.$data.forEach(cb, thisArg);
	},
	map: function(cb, thisArg) {
		return this.$data.map(cb, thisArg);
	},
	filter: function(cb, thisArg) {
		return this.$data.filter(cb, thisArg);
	},
	find: function(cb, thisArg) {
		return this.$data.find(cb, thisArg);
	},
	findIndex: function(cb, thisArg) {
		return this.$data.findIndex(cb, thisArg);
	},
	reduce: function(cb, initialValue) {
		return this.$data.reduce(cb, initialValue);
	},
	reduceRight: function(cb, initialValue) {
		return this.$data.reduceRight(cb, initialValue);
	},
	indexOf: function(elem, from) {
		return this.$data.indexOf(elem, from || 0);
	},
	lastIndexOf: function(elem, from) {
		return this.$data.lastIndexOf(elem, from || this.$data.length-1);
	},
	//TODO add some, every, ...
}
Object.defineProperty(ListProto, 'length', {get:function() {return this.$data.length}});

export default function List(data) {
	this.ops = []; // update operations queue
	this.lfs = null; // the list fragment
	this.$data = data || []; // the backed data
}
List.prototype = ListProto;
