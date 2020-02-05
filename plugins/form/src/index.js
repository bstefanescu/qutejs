import Qute from '@qutejs/runtime';
//import formValidateDirective from './validation.js';
import inputModelDirective from './input-model.js';
import selectModelDirective from './select-model.js';

//Qute.registerDirective('form', 'validate', formValidateDirective);
Qute.registerDirective('input', 'model', inputModelDirective);
Qute.registerDirective('select', 'model', selectModelDirective);
Qute.registerDirective('textarea', 'model', inputModelDirective);
