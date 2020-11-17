import {document} from '@qutejs/window';
import Map from './map.js'; // for IE < 11 support we need to use a simple map impl

/*
	- exprFn - is a model binding fn (i.e. takes a model as argument) that returns a key
	- render - is a cunftion that takes a rendering and a key as argument and return a DOM node or an array of nodes
*/
export default function SwitchFragment(rendering, name, exprFn, render, changeCb, nocache) {
	this.key = null; // the active case key
	this.caseR = null;
	this.cache = nocache ? null : new Map(); // key to rendering instance cache if cache is used.
	this.r = rendering;
	this.exprFn = exprFn;
	this.render = render;
	this.changeCb = changeCb;
	this.start = document.createComment('['+name+']');
	this.end = document.createComment('[/'+name+']');
}

SwitchFragment.prototype = {
	$create() {
		var frag = document.createDocumentFragment();
		frag.appendChild(this.start);
		frag.appendChild(this.end);
		// add the update function to the parent rendering updaters and trigger an update
		this.r.up(this.update.bind(this))(this.r.model, true);
		// register the list fragments as a sub context to be notified for connect / disconnect events.
		this.r.$push(this);
		return frag;
	},
	// ---- rendering hooks ---------
	connect() {
		this.caseR && this.caseR.connect();
	},
	disconnect() {
		this.caseR && this.caseR.disconnect();
	},
	refresh() {
		this.caseR && this.caseR.refresh();
	},
	// --- end rendering hooks ------
	clear() {
		var end = this.end, start = this.start;
		var parent = end.parentNode;
		while (start.nextSibling !== end) {
			var el = start.nextSibling;
			parent.removeChild(el);
		}
		this.r.isc && this.caseR && this.caseR.disconnect();
		this.caseR = null;
	},
	update(model, initialUpdate) {
		var key = this.exprFn(this.r.model);
		if (this.key !== key) { // case changed -> render case
			this.clear(); // remove existing content
			var cache = this.cache;
			var r = cache && cache.get(key);
			if (!r) {
				r = this.r.spawn();
				var nodes = this.render(r, key);
				if (nodes && !Array.isArray(nodes)) {
					nodes = [nodes];
				}
				r.$nodes = nodes;
				if (cache) cache.set(key, r);
			}
			// render nodes
			var nodes = r.$nodes;
			if (nodes) {
				var end = this.end;
				var parent = end.parentNode;
				for (var i=0,l=nodes.length; i<l; i++) {
					parent.insertBefore(nodes[i], end);
				}
			}
			this.caseR = r;
			this.key = key;
			this.r.isc && r.connect();
			if (!initialUpdate) {
				//TODO how we can automatically detect dirty states?
				this.caseR.update(); // force an update?
			}

			if (this.changeCb && !initialUpdate) { // avoid calling changeCb the first time the if is rendered
				this.changeCb.call(this.r.model, key);
			}
		} else if (this.caseR) {
			this.caseR.update(); // udpate
		}
	}
}


