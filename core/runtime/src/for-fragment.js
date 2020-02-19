
export default function ForFragment(rendering, listFn, iterationFn) {
	this.r = rendering;
	this.listFn = listFn;
	this.iterationFn = iterationFn;
	this.list = null;
	this.listR = null;
	this.start = document.createComment('[for]');
	this.end = document.createComment('[/for]');
}

ForFragment.prototype = {
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
		this.listR && this.listR.connect();
	},
	disconnect() {
		this.listR && this.listR.disconnect();
	},
	refresh() {
		this.listR && this.listR.refresh();
	},
	// --- end rendering hooks ------
	clear() {
		var end = this.end, start = this.start;
		var parent = end.parentNode;
		while (start.nextSibling !== end) {
			var el = start.nextSibling;
			parent.removeChild(el);
		}
		this.r.isc && this.listR && this.listR.disconnect();
		this.listR = null;
		this.list = null;
	},
	update(model, initialUpdate) {

		var list = this.listFn(this.r.model);
		if (!list) {
			this.clear();
			return;
		}
		if (list !== this.list) {
			// remove current list
			this.clear();
			this.list = list;
			if (list) {
				if (!Array.isArray(list)) {
					list = Object.keys(list);
				}
				if (list.length > 0) {
					var r = this.r.spawn();
					var iterationFn = this.iterationFn;
					var end = this.end;
					var parent = end.parentNode;
					var l = list.length-1;
					for (var i=0; i<l; i++) {
						var children = iterationFn(list[i], i, true);
						if (children) {
							for (var k=0,ll=children.length; k<ll; k++) {
								parent.insertBefore(children[k], end);
							}
						}
					}
					// append last item
					var children = iterationFn(list[l], l, false);
					if (children) {
						for (var k=0,ll=children.length; k<ll; k++) {
							parent.insertBefore(children[k], end);
						}
					}
					this.listR = r;
				}
			}
		} else if (this.listR) {
			this.listR.update();
		}
	}
}


