import assert from 'assert';
import {document} from '@qutejs/window';
import Qute from '@qutejs/runtime';
import Component from '../src/index.jsq';

describe('Component', function() {

	it('is reactive', function(done) {
		var component = new Component().mount();
		assert.equal(component.$el.parentNode, document.body); // component is mounted in the document body
		assert.equal(component.$el.getElementsByTagName('span')[0].textContent, 'coding');
		component.verb = 'playing';
		Qute.runAfter(function() { // run after update is done
			assert.equal(component.$el.getElementsByTagName('span')[0].textContent, 'playing');
			done();
		})
	});

});
