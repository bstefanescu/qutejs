/*
A helper for reactive lists udpates
*/
export default function List(vm, key, ar) {
    this.ar = ar ? ar.slice() : []; // always make a copy
    this.vm = vm;
    if (key === '.') {
		this.keyOf = function(item) { return String(item); };
	} else if (typeof key === 'string') {
		this.keyOf = function(item) { return item[key]; }
	} else { // expect a fn
		this.keyOf = key;
	}
}
List.prototype = {
    __qute_list: true, // marker to be used by list-fragment.js
    toJSON(key) { // serializew the object as an array
        if (!key) return this.ar;
    },
    set(ar) {
        if (!ar) ar = [];
        if (this.ar.length === 0 && ar.length === 0) {
            return;
        }
        if (ar !== this.ar) {
            this.ar = ar;
            this.vm.update();
        }
    },
    clear() {
        this.set([]);
    },
    size() {
        return this.ar.length;
    },
    push() {
        var r = this.ar.push.apply(this.ar, arguments);
        if (arguments.length > 0) {
            this.vm.update();
        }
        return r;
    },
    pop() {
        var r;
        if (this.ar.length > 0) {
            r = this.ar.pop();
            this.vm.update();
        }
        return r;
    },
    peek() {
        return this.ar[this.ar.length-1];
    },
    shift() {
        var r;
        if (this.ar.length > 0) {
            r = this.ar.shift();
            this.vm.update();
        }
        return r;
    },
    unshift() {
        var r = this.ar.unshift.apply(this.ar, arguments);
        if (arguments.length > 0) {
            this.vm.update();
        }
        return r;
    },
    splice() {
        var r = this.ar.splice.apply(this.ar, arguments);
        this.vm.update();
        return r;
    },
    prepend(array) {
        if (array && array.length > 0) {
            this.ar = array.concat(this.ar);
            this.vm.update();
        }
        return this;
    },
    append(array) {
        if (array && array.length > 0) {
            this.ar = this.ar.concat(array);
            this.vm.update();
        }
        return this;
    },
    update(updateFn) {
        if (!updateFn || updateFn(this.ar) !== false) {
            this.vm.update();
        }
        return this;
    },
    // keyed items related api
    getIndex(key) {
        var keyFn = this.keyOf, list = this.ar;
        for (var i=0,l=list.length; i<l; i++) {
            if (key === keyFn(list[i])) {
                return i;
            }
        }
        return -1;
    },
    getItem(key) {
        var i = this.getIndex(key);
        return i < 0 ? undefined : this.ar[i];
    },
    setItem(key, item) {
        var i = this.getIndex(key);
        if (i > -1) {
            this.ar[i] = item;
        }
    },
    removeItem(key) {
        var i = this.getIndex(key);
        if (i > -1) {
            this.ar.splice(i, 1);
            this.vm.update();
        }
        return this;
    },
    updateItem(key, updateFn) {
        var item = this.getItem(key);
        if (item !== undefined) {
            if (updateFn(item) !== false) {
                var list = this.ar;
                if (!list.__dirty__) {
                    list.__dirty__ = [];
                }
                list.__dirty__.push(key);
                this.vm.update();
            }
        }
        return this;
    },
    insertBefore(item, beforeKey) {
        var i = this.getIndex(beforeKey);
        if (i > -1) {
            this.ar.splice(i, 0, item);
            this.vn.update();
        }
    },
    moveBefore(key, beforeKey) {
        var index = this.getIndex(key);
        if (index === -1) throw new Error('No such item '+ key);
        var list = this.ar, beforeIndex = -1;
        if (beforeKey) {
            beforeIndex = this.getIndex(beforeKey);
        }
        if (index === beforeIndex) return;
        if (beforeIndex === -1) {
            list.push(list[index]);
            list.splice(index, 1);
        } else if (index < beforeIndex) {
            list.splice(beforeIndex, 0, list[index]);
            list.splice(index, 1);
        } else {
            list.splice(index, 1);
            list.splice(beforeIndex, 0, list[index]);
        }
        this.vm.update();
        return this;
    }
}
