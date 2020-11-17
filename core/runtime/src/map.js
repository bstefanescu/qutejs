/*
 A simple Map polyfill
 Used by the <view> directive `cache` option.
 */

function SimpleMap() {
	this.keys = [];
	this.vals = [];
}

SimpleMap.prototype = {
	set(key, val) {
		var i = this.keys.indexOf(key);
		if (i < 0) {
			this.keys.push(key);
			this.vals.push(val);
		} else {
			this.keys[i] = keys;
			this.vals[i] = val;
		}
	},
	get(key) {
		var i = this.keys.indexOf(key);
		return i < 0 ? void(0) : this.vals[i];
	}
}

const MapImpl = typeof Map === 'function' ? Map : SimpleMap;

export default MapImpl;
