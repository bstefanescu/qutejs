import assert from 'assert';
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
import Component from '../src/index.js';

describe('Component', function() {

	it('is reactive', function(done) {
		var component = new Component().mount();
		assert.equal(component.$el.parentNode, window.document.body); // component is mounted in the document body
		assert.equal(component.$el.getElementsByTagName('span')[0].textContent, 'coding');
		component.verb = 'playing';
		Qute.runAfter(function() { // run after update is done
			assert.equal(component.$el.getElementsByTagName('span')[0].textContent, 'playing');
			done();
		})
	});

});
