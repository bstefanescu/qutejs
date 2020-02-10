import {polyfillFormControl, polyfillFormCheckValidity} from './polyfill/index.js';


function reportFormValidity(form, config, asyncRun) {
	var update = [];
	var r = checkFormValidity(form, config, update);
	// TODO async?
	if (update.length) {
		var _report = function() {
			update.forEach(function(inputEl) {
				reportValidationError(inputEl, config);
			});
		}
		if (asyncRun) {
			window.setTimeout(_report, 0);
		} else {
			_report();
		}
	}
	return r;
}

function reportInputValidity(el, config, asyncRun) {
	var inputEl = checkInputValidity(el, config);
	if (inputEl) {
		if (asyncRun) {
			window.setTimeout(function() {
				reportValidationError(inputEl, config);
			}, 0);
		} else {
			reportValidationError(inputEl, config);
		}
	}
	return inputEl;
}

function checkFormValidity(form, config, update) {
	var elements = form.elements, isValid = true;
	for (var i=0,l=elements.length; i<l; i++) {
		var el = checkInputValidity(elements[i], config);
		if (el) {
			update && update.push(el);
			if (!el.validity.valid) isValid = false;
		}
	}
	return isValid;
}

/*
 * Return the input element if error sgtate should be updated (either input has error or error was fixed),
 * otherwise return null.
 */
function checkInputValidity(el, config) {
	var r = null;
	el.__qute_validator && el.setCustomValidity('');
	if (!el.checkValidity()) {
		r = el;
	} else if (el.__qute_validator) { // custom validator
		var err = el.__qute_validator(el);
		if (err) {
			el.setCustomValidity(err);
			r = el;
		} else {
			el.setCustomValidity('');
		}
	}
	if (el.__qute_vmsg && !el.validationMessage) {
		r = el; // error was fixed
	}
	el.__qute_vmsg = el.validationMessage;
	return r;
}

function _errorKey(el) {
	var validity = el.validity;
	if (validity.customError || validity.valid) return null;

	if (validity.valueMissing) {
		return 'required';
	} else if (validity.badInput || validity.typeMismatch) {
		return 'type';
	} else if (validity.patternMismatch) {
		return 'pattern';
	} else if (validity.tooLong) {
		return 'maxlength';
	} else if (validity.tooShort) {
		return 'minlength';
	} else if (validity.rangeOverflow) {
		return 'max';
	} else if (validity.rangeUnderflow) {
		return 'min';
	} else if (validity.stepMismatch) {
		return 'step';
	}
	return null;
}

// get the actual validation message as defined by user
function getValidationMessage(el, config) {
	if (!el.validationMessage || !config.messages) {
		return el.validationMessage;
	}
	var msg, key = _errorKey(el);
	if (key) {
		var msgs = config.messages[el.name];
		if (msgs) {
			if (typeof msgs === 'string') {
				msg = msgs;
			} else {
				msg = msgs[key] || msgs['error'];
			}
		}
		if (!msg) {
			msgs = config.messages['*'];
			if (msgs) {
				if (typeof msgs === 'string') {
					msg = msgs;
				} else {
					msg = msgs[key] || msgs['error'];
				}
			}
		}
	}
	return msg || el.validationMessage;
}

function setupValidation(form, config) {
	if (!form.checkValidity) {
		polyfillFormCheckValidity(form);
	}
	var elements = form.elements;
	for (var i=0,l=elements.length; i<l; i++) {
		var el = elements[i];
		if (!el.checkValidity) {
			polyfillFormControl(el);
		}
		if (el.willValidate) {
			if (config.onblur) {
				el.addEventListener('blur', function(e) {
					reportInputValidity(e.target, config);
				});
			}

		}
	}
}

function reportValidationError(el, config) {
	var msg = getValidationMessage(el, config);
	if (config.report) {
		config.report(el, msg);
	} else {
		var errorEl = el.form.getElementsByClassName('-q-valid-msg-'+el.name)[0];
		if (errorEl) {
			errorEl.textContent = msg;
			if (el.validity.valid) { // clear any previous error
				el.classList.remove('invalid');
				errorEl.style.display = 'none';
			} else { // display the current error
				el.classList.add('invalid');
				errorEl.style.display = '';
			}
		} else {
			console.warn('No validation message placeholder defined for '+el.name+'. Insert an element: <span|div q:validation-message="'+el.name+'">');
		}
	}
}

export function formValidateDirective(xattrs, valueExpr, el) {
	var config = Object.assign({
		onblur: true,
		report: null,
		messages: null
	}, this.eval(valueExpr) || {});
	if (!el) {
		throw new Error('Cannot use q:validate: Target element is not a form!');
	}
	el.addEventListener('submit', function(e) {
		if (!reportFormValidity(this, config, true)) {
			e.stopImmediatePropagation();
			e.preventDefault();
		}
	});
	el.noValidate = true;
	return function(el) {
		setupValidation(el, config);
	}
}

export function validationMessageDirective(xattrs, valueExpr, el) {
	var inputName = this.eval(valueExpr);
	if (!inputName) throw new Error('q:validation-message must take as value the related input name');
	return function(el) {
		el.className = (el.className ? el.className + ' -q-valid-msg-' : '-q-valid-msg-')+inputName;
	}
}

// custom validation
export function inputValidationDirective(xattrs, valueExpr, el) {
	el.__qute_validator = this.eval(valueExpr);
}

