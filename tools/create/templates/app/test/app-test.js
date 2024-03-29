import assert from 'assert';
import window from '@qutejs/window';
import Qute from '@qutejs/runtime';
import App from '../src/app.js';

describe('Application', function() {

	it('is reactive', function(done) {
		var app = new App().mount();
		assert.equal(app.$el.parentNode, window.document.body); // component is mounted in the document body
		assert.equal(app.$el.getElementsByTagName('span')[0].textContent, 'coding');
		app.verb = 'playing';
		Qute.runAfter(function() { // run after update is done
			assert.equal(app.$el.getElementsByTagName('span')[0].textContent, 'playing');
			done();
		})
	});

});
