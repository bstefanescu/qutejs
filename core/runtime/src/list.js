/*
A helper for reactive lists udpates
*/

import { closestListItem } from './utils.js';

export default function List(vm, propName, keyField) {
	this.vm = vm;
	this.name = propName;
	this.keyFn = keyField && keyField != '.' ? function(item) { return item[keyField] } : function(item) { return item; };
	var list = vm[propName];
	this.array = list ? list.slice() : [];
}
List.prototype = {
	getIndex(key) {
		var keyFn = this.keyFn;
		return this.array.findIndex(function(item) {
			return key === keyFn(item);
		});
	},
	get(key) {
		var i = this.getIndex(key);
		return i > -1 ? this.array[i] : undefined;
	},
	remove(key) {
		var i = this.getIndex(key);
		if (i > -1) {
			this.array.splice(i, 1);
			this.save();
		}
		return this;
	},
	push(item) {
		var r = this.array.push.apply(this.array, arguments);
		this.save();
		return this;
	},
	pop() {
		var r = this.array.pop();
		this.save();
		return r;
	},
	shift() {
		var r = this.array.shift();
		this.save();
		return r;
	},
	unshift() {
		var r = this.array.unshift.apply(this.array, arguments);
		this.save();
		return r;
	},
	splice() {
		var r = this.array.splice.apply(this.array, arguments);
		this.save();
		return r;
	},
	forEach(cb, thisArg) {
		this.array.forEach(cb, thisArg);
	},
	sort(cmpFn) {
		var r = this.array.sort(cmpFn);
		this.save();
		return r;
	},
	save() {
		this.vm[this.name] = this.array;
		return this;
	},
	updateItem(el) {
		var rendering = closestListItem(el);
		rendering && rendering.update();
	}
}