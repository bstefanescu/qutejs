import assert from 'assert';
import {document} from '@qutejs/window';
import Qute from '@qutejs/runtime';
import App from '../src/app.jsq';

describe('Application', function() {

	it('is reactive', function(done) {
		var app = new App().mount();
		assert.equal(app.$el.parentNode, document.body); // component is mounted in the document body
		assert.equal(app.$el.getElementsByTagName('span')[0].textContent, 'coding');
		app.verb = 'playing';
		Qute.runAfter(function() { // run after update is done
			assert.equal(app.$el.getElementsByTagName('span')[0].textContent, 'playing');
			done();
		})
	});

});
