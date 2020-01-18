import assert from 'assert';
import ArrayDiff from '../src/array-diff.js';

function ERR(ar1, ar2) {
	assert.fail(ar1+' != '+ ar2);
}
function TestDiff(key, force) {
	this.ar = null;
	this.map = null;
	this.key = key;
	this.log = console.log.bind(this);
	this.force = force;
}
TestDiff.prototype = {
	silent() {
		this.log = function(){};
		return this;
	},
	verbose() {
		this.log = console.log.bind(this);
		return this;
	},
	assert(ar1, ar2) {
		if (!ar1 || !ar1.length) {
			if (!ar2 || !ar2.length) {
				return;
			}
			ERR(ar1, ar2);
		}
		if (!ar2 || !ar2.length) {
			if (!ar1 || !ar1.length) {
				return;
			}
			ERR(ar1, ar2);
		}
		if (ar1.length !== ar2.length) {
			ERR(ar1, ar2);
		}
		for (var i=0,l=ar1.length; i<l; i++) {
			if (ar1[i] !== ar2[i]) {
				ERR(ar1, ar2);
			}
		}
	},
	test() {
		for (var i=0,l=arguments.length-1; i<l; i++) {
			var ar1 = arguments[i].slice(0);
			var ar2 = arguments[i+1].slice(0);
			this.testUpdate(ar1, ar2);
		}
	},
	testUpdate(input, output) {
		this.log("Testing Update:", input, '->', output);

		this.ar = null;
		this.map = null;
		var adiff = new ArrayDiff(this.key);

		var diff = adiff.update(input);
		ArrayDiff.run(this, diff);
		this.assert(this.ar, input);

		diff = adiff.update(output);
		ArrayDiff.run(this, diff);
		this.assert(this.ar, output);

		this.log('-------------------------------------------');
	},
	valueOf(key) {
		var item = this.map[key];
		if (item === undefined) throw new Error('BUG? No key found: '+key);
		return item;
	},
	indexOf(key) {
		var i = this.ar.indexOf(this.valueOf(key));
		if (i < 0) throw new Error('BUG? item index not found: '+key);
		return i;
	},
	clear() {
		this.log('# clear');
		this.ar = null;
		this.map = null;
	},
	set(ar, keyOf) {
		this.log('# set', ar);
		this.ar = ar.slice(0);
		this.map = {};
		ar.forEach(item => {
			this.map[keyOf(item)] = item;
		});
	},
	remove(key) {
		this.log('# remove', key);
		this.ar.splice(this.indexOf(key), 1);
	},
	insert(item, key, beforeKey) {
		this.log('# insert', key, beforeKey);
		this.map[key] = item;
		this.ar.splice(this.indexOf(beforeKey), 0, item);
	},
	append(item, key) {
		this.log('# append', key);
		this.map[key] = item;
		this.ar.push(item);
	},
	move(key, beforeKey) {
		this.log('# move', key, beforeKey);
		var item = this.valueOf(key);
		var beforeItem = this.valueOf(beforeKey);
		var index = this.ar.indexOf(item);
		this.ar.splice(index, 1);
		var beforeIndex = this.ar.indexOf(beforeItem);
		this.ar.splice(beforeIndex, 0, item)
	}
};

describe('Testing Array Diff', function() {

	it('Common cases works', function() {
		new TestDiff('.').silent().test(
			[4,5],
			[3,4,5], // unshift
			[3,4,5,6], // append
			[1,2,3,4,5,6,7,8], // unshift + append
			[0,1,2,3,4,10,5,6,7,8,9], // unshift + insert + append
			[11,10,9,8,7,6,5,4,3,2,1,0,12], // sort + unshift + append
			[9,8,6,5,2,1], // multiple remove
			[0,9,7,3,5,2,1,4], // multiple inserts
			[1,2,3], // something random
			[3,2,1], // swap left and right
			[4,5], // replace with another list
			[6,7,8,9], // replace with another list
			[6,7,8,9] // no changes
		);
	});

	it('Random diff works', function() {
		new TestDiff('.').silent().test(
			[1,2,3],
			[1,2,3,4,5],
			[3,4,5],
			[3],
			[1,2,3,4,5],
			[3,5,6],
			[1,2,3,4,5,6],
			[2,7,4,3,5],
			[]
		);
	});

	it('diffing on similar arrays works', function() {
		var adiff = new ArrayDiff('.');

		var diff = adiff.update([1,2,3]);
		assert.equal(diff.length, 3);
		assert.equal(diff[0], 1); // one set

		diff = adiff.update([1,2,3]);
		assert.equal(diff.length, 0);
	});

	it('diffing on same array instance works', function() {
		var input = [1,2,3];
		var adiff = new ArrayDiff('.');

		var diff = adiff.update(input);
		assert.equal(diff.length, 3);
		assert.equal(diff[0], 1); // one set
		input.push('bla');
		diff = adiff.update(input);
		assert.equal(diff.length, 3);
		assert.equal(diff[0], 4); // one append
	});


});

