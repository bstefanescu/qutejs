import Qute from '@qutejs/runtime';
import {formValidateDirective, validationMessageDirective, inputValidationDirective} from './validation.js';
import inputModelDirective from './input-model.js';
import selectModelDirective from './select-model.js';
import controlModelDirective from './control-model.js';

Qute.registerDirective('form', 'validate', formValidateDirective);
Qute.registerDirective('input', 'model', inputModelDirective);
Qute.registerDirective('select', 'model', selectModelDirective);
Qute.registerDirective('textarea', 'model', inputModelDirective);
Qute.registerDirective('input', 'validate', inputValidationDirective);
Qute.registerDirective('textarea', 'validate', inputValidationDirective);
Qute.registerDirective('select', 'validate', inputValidationDirective);
Qute.registerDirective('validation-message', validationMessageDirective);

var FormApi = {
	// Enable the q:model directive on a custom form control
	// The control must be implemented as a ViewModel component and must provide a 'value' reactive property.
	// For bidirectional updates it must also trigger a change event when the control value is changed.
	registerControl: function(tag) {
		Qute.registerDirective(tag, 'model', controlModelDirective);
	}
}
Qute.Form = FormApi;
export default FormApi;
