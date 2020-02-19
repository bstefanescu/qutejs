import {document} from '@qutejs/window';
import ArrayDiff from './array-diff.js';

/*
Reqs:

1. Item need to be added/removed at runtime without causing leaks.
Each item should register its updaters to its own context so that when it is removed the
updaters are automatically removed.

Solution: use a rendering context per item. Store the context as a DOM element prop: __qute_ctx__,
so that we can easily retrieve the rendering context when removing an element.

2. Items must be notified when parent rendering connects / disconnects

Solution: the ListFragment itself implements the connect / disconnect contract of Rendering and register itself as a sub-rendering
(even if it is not a real rendering instance). It will be then called easch time the parent connect / disconnect, and will be able to connect disconnect each item rendering.
To retrieve item renderings we need to store each rendering context (from 1.) into a element property '__qute_ctx__'
this way we can connect/disconnect items by iterating over the DOM children elements.

3. Only the list expr is bound to the parent rendering model. All the other item properties will be bound to its own model (the iteration model)
The model is stored as usually in the rendering instance linked corresponding to the item (from 1.)

4. To be able to quickly update the DOM we need to store [key -> itemEElement] pairs
to quiclky retrieve an element using its key.

Solution: 1. we can keep a map or we can store the key as an element 'data-qute-key' property and use querySelector to retrieve the item.
We implement 1. for now.

5. List diff is computed only when parent context is updating and the list expression
returns a different list instance that the current rendered one.

NOTE: If you wantt to be able to update the DOM when the curren list changes (e.g. list.push(..) called)
without cloning and setting a new instance of the list then we need to impl some sort of version mechanism:
list.$version=0 which we need to increment and then manually call vm.update() to force a DOM rendering

WARN: If list is not defining an item key then updates will be costly and will render the entire list fragment. and not only the differences
(you can use '.' for primitive sets to use the value as the key)
*/

export default function ListFragment(rendering, listFn, itemFn, key) {
	this.r = rendering;
	this.listFn = listFn;
	this.itemFn = itemFn;
	this.adiff = new ArrayDiff(key);
	this.items = {};
	this.start = document.createComment('[x-if]');
	this.end = document.createComment('[/x-if]');
}

ListFragment.prototype = {
	$create() {
		var frag = document.createDocumentFragment();
		frag.appendChild(this.start);
		frag.appendChild(this.end);
		// add the update function to the parent rendering updaters and trigger an update
		this.r.up(this.update.bind(this))();
		// register the list fragments as a sub context to be notified for connect / disconnect events.
		this.r.$push(this);
		return frag;
	},
	callItemR(methodName) {
		var end = this.end;
		var next = this.start.nextSibling;
		while (next && next !== end) {
			next.__qute_ctx__ && next.__qute_ctx__[methodName]();
			next = next.nextSibling;
		}
	},
	// life cycle hooks
	connect() {
		this.callItemR('connect');
	},
	disconnect() {
		this.callItemR('disconnect');
	},
	refresh() {
		this.callItemR('refresh');
	},
	// TODO not uet used
	uupdateItems() {
		this.callItemR('update');
	},

	renderItem(r, items, key, item) {
		var itemR = r.spawn();
		var el = this.itemFn(itemR, item);
		el.__qute_ctx__ = itemR;
		if (key) items[key] = el;
		r.isc && itemR.connect();
		return el;
	},
	// update the list
	update() {
		var list = this.listFn(this.r.model);
		var diff = this.adiff.update(list);
		if (diff) {
			ArrayDiff.run(this, diff);
		}
		//TODO
		//update item contexts too? or keep them isolated from parent updates?
		//this.updateItems();
	},

	// --------- ArrayDiff operations ---------
	clear() {
		//console.log('ListFragment:clear');
		this.items = null;
		var isc = this.r.isc;
		var end = this.end, start = this.start;
		var parent = end.parentNode;
		while (start.nextSibling !== end) {
			var el = start.nextSibling;
			isc && el.__qute_ctx__ && el.__qute_ctx__.disconnect();
			parent.removeChild(el);
		}
	},
	set(ar, keyOf) {
		//console.log('ListFragment:set', ar, keyOf);
		this.clear();
		if (!ar || !ar.length) return;
		var r = this.r;
		var end = this.end;
		var parent = end.parentNode;
		if (!keyOf) {
			keyOf = function() {};
		}
		var i=0,items = {};
		for (var l=ar.length; i<l; i++) {
			var item = ar[i];
			var itemEl = this.renderItem(r, items, keyOf(item), item);
			parent.insertBefore(itemEl, end);
		}
		this.items = items;
	},
	remove(key) {
		//console.log('ListFragment:remove', key);
		var itemEl = this.items && this.items[key];
		if (itemEl) {
			itemEl.parentNode.removeChild(itemEl);
			this.r.isc && itemEl.__qute_ctx__ && itemEl.__qute_ctx__.disconnect();
			delete this.items[key];
		} else {
			console.error('cannot find cached element', key); // TODO
		}
	},
	_insert(item, key, beforeEl) {
		var itemEl = this.renderItem(this.r, this.items, key, item, -1, false);
		beforeEl.parentNode.insertBefore(itemEl, beforeEl);
	},
	insert(item, key, beforeKey) {
		//console.log('ListFragment:insert', item, key, beforeKey);
		var beforeEl = this.items && this.items[beforeKey];
		if (beforeEl) {
			this._insert(item, key, beforeEl);
		} else {
			console.error('cannot find cached element', beforeKey); // TODO
		}
	},
	append(item, key) {
		//console.log('ListFragment:append', item, key);
		this._insert(item, key, this.end);
	},
	move(key, beforeKey) {
		//console.log('ListFragment:move', key, beforeKey);
		var beforeEl = this.items && this.items[beforeKey];
		var el = this.items && this.items[key];
		if (beforeEl && el) {
			beforeEl.parentNode.insertBefore(el, beforeEl);
		} else {
			console.error('cannot find cached element', key, beforeKey); // TODO
		}
	}
}

