const CLEAR = 0;
const SET = 1;
const REMOVE = 2;
const INSERT = 3;
const APPEND = 4;
const MOVE = 5;

function valueAsKey(item) {
	return String(item);
}

export default function ArrayDiff(key) {
	this.ar = null;
	this.map = null;
	if (key === '.') {
		this.keyOf = valueAsKey;
	} else if (typeof key === 'string') {
		this.keyOf = function(item) { return item[key] }
	} else if (key) { // expect a fn
		this.keyOf = key;
	} else {
		this.keyOf = null;
	}
}
ArrayDiff.prototype = {
	clear() {
		var wasSet = !!(this.ar && this.ar.length > 0);
		this.ar = null;
		this.map = null;
		this.keyOf = null;
		return wasSet ? [ CLEAR ] : null;
	},
	set(from) {
		if (!from || !from.length) {
			return this.clear();
		}
		var keyOf = this.keyOf;
		if (keyOf) {
			var map = {};
			for (var i=0,l=from.length; i<l; i++) {
				map[keyOf(from[i])] = true;
			}
			this.map = map;
			this.keyOf = keyOf;
		} else {
			this.map = null;
		}
		this.ar = from.slice(0); // store a copy
		return [ SET, this.ar, keyOf ];
	},
	update(from) {
		if (this.ar === from) {
			return null;
		}
		if (from == null || !from.length) {
			return this.clear();
		}
		if (!this.ar || !this.ar.length) {
			return this.set(from);
		}
		var keyOf = this.keyOf;
		if (!keyOf) { // reset
			return this.set(from);
		}

		var ar = this.ar;
		var map = this.map;
		var fromMap = {};
		var l1 = ar.length;
		var l2 = from.length;
		var moved = {};
		var diff = [];

		// build an index for the from array
		for (var i=0; i<l2; i++) {
			fromMap[keyOf(from[i])] = true;
		}

		var i = 0, j = 0;
		for (; j<l1 && i<l2; i++) {
			var it2 = from[i];
			var key2 = keyOf(it2);
			var key1 = keyOf(ar[j]);

			if (moved[key1]) {
				j++; // skip moved items from dst array
				i--; // repeat current item
				continue;
			}

			if (moved[key2]) {
				// it2 already processed (moved) - skip and continue
				continue;
			}

			if (!map[key2]) {
				// a new item - insert
				if (j < l1) {
					diff.push(INSERT, it2, key2, key1);
				}
			} else {
				// item already exists
				if (key1 === key2) {
					// unchanged - continue
					j++;
				} else if (fromMap[key1]) {
					// items differs - moved
					moved[key2] = true;
					diff.push(MOVE, key2, key1);
				} else {
					// item removed
					diff.push(REMOVE, key1);
					i--; // repeat the item
					j++;
				}
			}
		}

		if (i < l2) {
			// 'ar' consumed but 'from' not consumed
			// all the remaining 'from' items must be appended if not already moved
			for (;i<l2;i++) {
				var item = from[i];
				var key = keyOf(item);
				if (!map[key]) {
					diff.push(APPEND, item, key);
				}
			}
		} else if (j < l1) {
			// 'from' consumed but 'ar' not consumed
			// remove remaining 'ar' items if they are not in from
			for (;j<l1;j++) {
				var key = keyOf(ar[j]);
				if (!fromMap[key]) {
					// item removed
					diff.push(REMOVE, keyOf(ar[j]));
				}
			}
		}

		if (diff.length) {
			this.ar = from.slice(0); // store a copy
			this.map = fromMap;
		} // else unchanged

		return diff;
	}
}


ArrayDiff.run = function(OPS, diff) {
	if (diff) {
		for (var i=0,l=diff.length; i<l;) {
			switch (diff[i]) {
				case APPEND: // append(item, key)
					OPS.append(diff[i+1], diff[i+2]);
					i+=3;
					break;
				case INSERT: // insert(item, key, beforeKey)
					OPS.insert(diff[i+1], diff[i+2], diff[i+3]);
					i+=4;
					break;
				case REMOVE: // remove(key)
					OPS.remove(diff[i+1]);
					i+=2;
					break;
				case MOVE: // move(key, beforeKey)
					OPS.move(diff[i+1], diff[i+2]);
					i+=3;
					break;
				case SET: // set(array, keyOf)
					OPS.set(diff[i+1], diff[i+2]);
					i+=3;
					break;
				case CLEAR: // clear()
					OPS.clear();
					i++;
					break;
				default: throw new Error('Invalid diff op '+diff[i]);
			}
		}
	}
}
