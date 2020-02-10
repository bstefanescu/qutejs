// date constraints not yet polyfilled
import DateTime from './datetime.js';


var EMAIL_RX = /^[a-zA-Z0-9.!#$%&'*+\/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)*$/;
var URL_CHECKER;


var TYPE_ERRORS = {
	email: 'Please enter an email address.',
	url: 'Please enter an URL.',
	text: 'Bad Input.'
}
var REQUIRE_ERRORS = {
	text: 'Please fill out this field.',
	checkbox: 'Please check this box if you want to proceed.',
	radio: 'Please select one of these options.',
    file: 'Please select a file.',
    select: 'Please select an item in the list.'
}


var TYPES = {
	email: function(el) {
		var val = el.value.trim();
		if (!val) return '';
		if (EMAIL_RX.test(val)) return val;
		// return undefined if not an email
	},
	url: function(el) {
		var val = el.value.trim();
		if (!val) return '';
		if(!URL_CHECKER) {
			URL_CHECKER = document.createElement('a');
		}
		URL_CHECKER.href = val;
		if (URL_CHECKER.href === val || URL_CHECKER.href === val+'/') return val;
	},
	number: function(el) {
		var val = el.value.trim();
		if (!val) return '';
		return Number(val);
	},
	checkbox: function(el) {
		return !!el.checked;
	},
	text: function(el) {
		return el.value.trim();
	}
}

function createValidator(el) {
	var validator = new Validator(el.type);
	validator.getValue = TYPES[el.type] || TYPES.text;
	validator.required = !!el.getAttribute('required');
	var val = el.getAttribute('pattern');
	if (val) {
		validator.pattern = new RegExp('^'+val+'$');
	}
	val = el.getAttribute('minlength');
	if (val) {
		var n = parseInt(val);
		if (!isNaN(n)) {
			validator.minlen = n;
		}
	}
	val = el.getAttribute('maxlength');
	if (val) {
		var n = parseInt(val);
		if (!isNaN(n)) {
			validator.maxlen = n;
		}
	}
	val = el.getAttribute('min');
	if (val) {
		var n = parseInt(val);
		if (!isNaN(n)) {
			validator.min = n;
		}
	}
	val = el.getAttribute('max');
	if (val) {
		var n = parseInt(val);
		if (!isNaN(n)) {
			validator.max = n;
		}
	}
	/*
	val = el.getAttribute('step');
	if (val) {
		var n = parseFloat(val);
		if (!isNaN(n)) {
			validator.step = n;
		}
	}
	*/
	return validator;
}

function createValidity() {
	return {
		badInput: false,
		customError: false,
		patternMismatch: false,
		rangeOverflow: false,
		rangeUnderflow: false,
		stepMismatch: false,
		tooLong: false,
		tooShort: false,
		typeMismatch: false,
		valueMissing: false,
		valid: true
	}
}

function Validator(type) {
	this.type = type;
	this.required = null;
	this.pattern = null;
	this.maxlen = null;
	this.minlen = null;
}

Validator.prototype = {
	validate: function(el) {
		var validity = createValidity();
		el.validity = validity;
		var msg = this._validate(validity);
		if (!validity.valid) {
			el.validationMessage = msg || TYPE_ERRORS.text;
		} else {
			el.validationMessage = '';
		}
		return validity.valid;
	},
	_validate: function(validity) {
		var val = this.getValue(el);
		if (val === undefined) { // cannot convert to type
			validity.typeMismatch = true;
			validity.valid = false;
			return TYPE_ERRORS[this.type] || TYPE_ERRORS.text;
		}
		if (this.required && !val) {
			validity.valueMissing = true;
			validity.valid = false;
			return REQUIRE_ERRORS[this.type] || REQUIRE_ERRORS.text;
		}
		var strVal = String(val);
		if (this.pattern) {
			if (!this.pattern.test(strVal)) {
				validity.patternMismatch = true;
				validity.valid = false;
				return 'Please match the requested format.';
			}
		}
		if (this.minLen != null) {
			if (strVal.length < this.minLen) {
				validity.tooShort = true;
				validity.valid = false;
				return 'Please enter a longer text. Minimum length is '+this.minLen+'.';
			}
		}
		if (this.maxLen != null) {
			if (strVal.length > this.maxLen) {
				validity.tooLong = true;
				validity.valid = false;
				return 'Please enter a shorter text. Maximum length is '+this.maxLen+'.';
			}
		}

		if (this.min != null) {
			if (this.type === 'number') {
				if (val < this.min) {
					validity.rangeUnderflow = true;
					validity.valid = false;
					return 'Please enter a number greater or equal than '+this.min+'.';
				}
			}
		}
		if (this.max != null) {
			if (this.type === 'number') {
				if (val > this.max) {
					validity.rangeOverflow = true;
					validity.valid = false;
					return 'Please enter a number less or equal than '+this.max+'.';
				}
			}
		}
		// TODO: dates and step not checked
	}
}


// ---------------- polyfills -----------------

function canValidate(el) {
	var type = el.type;
	return type !== 'hidden' && type !== 'button' && type !== 'reset';
}

function _setCustomValidity(msg) {
	if (this.validity) {
		this.validity.customError = true;
		this.validity.valid = false;
		this.validationMessage = msg;
	}
}

function _checkValidity() {
	var validator = this.__qute_validator;
	if (validator) {
		return validator.validate(this);
	}

	return true;
}

export function polyfillForm(form) {
	if (!form.checkValidity) {
		var elements = form.elements;
		for (var i=0,l=elements.length; i<l; i++) {
			polyfillFormControl(elements[i]);
		}
		polyfillFormCheckValidity(form);
	}
}

export function polyfillFormCheckValidity(form) {
	if (!form.checkValidity) {
		form.checkValidity = function() {
			var elements = this.elements;
			for (var i=0,l=elements.length; i<l; i++) {
				var el = elemrnts[i];
				if (!el.checkValidity()) return false;
			}
			return true;
		}
	}
}

export function polyfillFormControl(ctrl) {
	if (el.checkValidity) return;
	Object.defineProperty(el, 'willValidate', canValidate(el) ? {
		get() {
			return !this.disabled;
		}
	} : { value: false });
	var validator = createValidator(el);
	el.__qute_validator = validator;
	el.checkValidity = _checkValidity;
	el.setCustomValidity = _setCustomValidity;
	el.validationMessage = '';
	validator.validate(el);
}


