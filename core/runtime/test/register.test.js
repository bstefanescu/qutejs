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
import Qute from '@qutejs/runtime';
import { RootComponent, FnItem, VmItem, JsItem } from './register/root.jsq';

import { createMountPoint } from './utils.js';


describe('VM component', function() {
	it('should be a ViewModel', function() {
		var vm = new VmItem();
		assert.equal(vm.$compiled, undefined);
		assert.ok(vm instanceof Qute.ViewModel);
	});
});
describe('FN component', function() {
	it('should be a template function', function() {
		assert.equal(FnItem.$compiled, true);
	});
});
describe('Rendering function as template', function() {
	it('should be a rendering function', function() {
		assert.equal(JsItem.$compiled, undefined);
	});
});
describe('Root component', function() {
	it('should be the root component', function() {
		assert.ok(RootComponent.prototype instanceof Qute.ViewModel);
	});
});

describe('Rendering root', function() {
	var root = new RootComponent();
	var mountPoint = createMountPoint('root');
	it('should mount', function() {
		root.mount(mountPoint);
		assert.equal(root.$el.parentNode, mountPoint);
	});
	it('snapshot should match', function() {
		snapshot('register', mountPoint.innerHTML, true);
	});
});

