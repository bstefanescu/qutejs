/*
// TESTS
1. Define VM
- vm, func view, render fn, class (wm with custom render?)
- getter, properties (dynamic, regular, )
- watch
- on
- Qute API

2. Lifecycle
- mount
- cleanup
- connnected
- etc

3. Rendering
- expr {{}}
- special attrs:
- properties:
- listeners
- channels
- lists
	- all ops

*/


import assert from 'assert';
import {snapshot} from '@qutejs/test-utils';
import window, {document} from '@qutejs/window';
import Qute from '..';
import Root from './register/root.jsq';

import { createMountPoint } from './utils.js';


describe('VM component', function() {
	var xtag = Qute.vm('vm-item');
	it('should be registered', function() {
		assert.ok(xtag);
	});
	it('should be a ViewModel', function() {
		var vm = new xtag();
		assert.equal(vm.$tag, 'vm-item');
		assert.equal(vm.$compiled, undefined);
		assert.ok(vm instanceof Qute.ViewModel);
	});
});
describe('FN component', function() {
	var xtag = Qute.template('fn-item');
	it('should be registered', function() {
		assert.ok(xtag);
	});
	it('should be a template function', function() {
		assert.equal(xtag.$tag, 'fn-item');
		assert.equal(xtag.$compiled, true);
	});
});
describe('Rendering function as template', function() {
	var xtag = Qute.template('js-template');
	it('should be registered', function() {
		assert.ok(xtag);
	});
	it('should be a rendering function', function() {
		assert.equal(xtag.$tag, 'js-template');
		assert.equal(xtag.$compiled, false);
	});
});
describe('Rendering function as VM', function() {
	var xtag = Qute.vm('js-item');
	it('should be registered', function() {
		assert.ok(xtag);
    });
	it('should be a rendering function', function() {
        var vm = new xtag();
		assert.equal(vm.$tag, 'js-item');
		assert.equal(vm.render, Qute.template('js-item'));
	});
});
describe('Root component', function() {
	var xtag = Qute.vm('root');
	it('should be registered', function() {
		assert.ok(xtag);
	});
	it('should be the root component', function() {
		assert.equal(xtag, Root);
	});
});

describe('Rendering root', function() {
	var root = new Root();
	var mountPoint = createMountPoint('root');
	it('should mount', function() {
		root.mount(mountPoint);
		assert.equal(root.$el.parentNode, mountPoint);
	});
	it('snapshot should match', function() {
		snapshot('register', mountPoint.innerHTML, true);
	});
});
