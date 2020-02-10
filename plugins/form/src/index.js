import Qute from '@qutejs/runtime';
import {formValidateDirective, validationMessageDirective, inputValidationDirective} from './validation.js';
import inputModelDirective from './input-model.js';
import selectModelDirective from './select-model.js';

Qute.registerDirective('form', 'validate', formValidateDirective);
Qute.registerDirective('input', 'model', inputModelDirective);
Qute.registerDirective('select', 'model', selectModelDirective);
Qute.registerDirective('textarea', 'model', inputModelDirective);
Qute.registerDirective('input', 'validate', inputValidationDirective);
Qute.registerDirective('textarea', 'validate', inputValidationDirective);
Qute.registerDirective('select', 'validate', inputValidationDirective);
Qute.registerDirective('validation-message', validationMessageDirective);
