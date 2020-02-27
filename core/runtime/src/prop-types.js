
function _prop(key, convert) {
	return {
		get: function() {
			return this.$data[key];
		},
		set: function(value) {
			if (convert) value = convert(value);
			var old = this.$data[key];
			if (old !== value) {
				this.$data[key] = value;
				var watcher = this.$el && this.$watch && this.$watch[key]; // if not connected whatchers are not enabled
				// avoid updating if watcher return false
				if (watcher && watcher.call(this, value, old) === false) return;
				this.update();
			}
		},
		enumerable: key.charCodeAt(0) !== 95 // keys starting with _ are not enumerable
	}
}

export function createProp(vm, key, val) {
	if (val == null) return _prop(key);

	var type = typeof val;
	if (type === 'number') {
		return _prop(key, Number);
	} else if (type === 'boolean') {
		return _prop(key, Boolean);
	} else if (val.$convert) {
		this.$data[key] = val.value;
		return _prop(key, val.$convert);
	} else if (val.$bindVM) {
		return val.$bindVM(vm, key);
	}
	return _prop(key);
}

export function NumberProp(value) {
	this.value = value;
}
NumberProp.prototype.$convert = Number;
export function StringProp(value) {
	this.value = value;
}
StringProp.prototype.$convert = String;
export function BooleanProp(value) {
	this.value = value;
}
BooleanProp.prototype.$convert = Boolean;


