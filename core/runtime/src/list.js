/*
A helper for reactive lists udpates
*/
export default function ListHelper(vm, propName, keyField) {
    if (!(propName in vm)) ERR("No reactive list property found: "+propName);
    var list = vm[propName];
    if (!list) vm[propName] = list = [];
    this.list = list;
    this.vm = vm;
    this.keyFn = keyField && keyField != '.' ? function(item) {
        return item[keyField];
    } : function(item) {
        return item;
    };
}
ListHelper.prototype = {
    getIndex(key) {
        var keyFn = this.keyFn, list = this.list;
        for (var i=0,l=list.length; i<l; i++) {
            if (key === keyFn(list[i])) {
                return i;
            }
        }
        return -1;
    },
    getItem(key) {
        var i = this.getIndex(key);
        return i < 0 ? undefined : this.list[i];
    },
    removeItem(key) {
        var i = this.getIndex(key);
        if (i > -1) {
            this.list.splice(i, 1);
            this.vm.update();
        }
        return this;
    },
    updateItem(key, updateFn) {
        var item = this.getItem(key);
        if (item !== undefined) {
            if (updateFn(item) !== false) {
                var list = this.list;
                if (!list.__dirty__) {
                    list.__dirty__ = [];
                }
                list.__dirty__.push(key);
                this.vm.update();
            }
        }
        return this;
    },
    update(updateFn) {
        if (!updateFn || updateFn(this.list) !== false) {
            this.vm.update();
        }
        return this;
    },
    moveBefore(key, beforeKey) {
        var index = this.getIndex(key);
        if (index === -1) throw new Error('No such item '+ key);
        var list = this.list, beforeIndex = -1;
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
