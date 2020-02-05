
function polyfillForm(el) {

}

function polyfillFormControl(el) {

}


function checkFormValidity(form) {
	var elements = form.elements, r = [];
	for (var i=0,l=elements.length; i<l; i++) {
		var el = elements[i];
		if (el.willValidate) {
			if (!el.checkValidity()) {
				r.push(el)
			} else {

			}
		}
	}
}

function reportValidity(el, config) {
	var oldValidationMessage = el.validationMessage;
	if (!el.checkValidity()) {
		config.reporter.onInvalid(el);
		return false;
	} else {
		if (el.$validator) {
			el.setCustomError(el.$validator(el) || '');
		}
		if (oldValidationMessage) {
		config.reporter.onValid(el); // remove error message
	}
	return true;
}

function setupValidation(form, config) {
	var elements = form.elements, r = [];
	for (var i=0,l=elements.length; i<l; i++) {
		var el = elements[i];
		if (!el.checkValidity) {
			polyfillFormControl(el);
		}
		if (el.willValidate) {
			if (config.onblur) {
				el.addEventListener('blur', function(e) {
					console.log('BLUR!!', e.target, e.target.value, e.target.checked);
					var oldValidationMessage = el.validationMessage;
					reportValidity()
					if (!el.checkValidity()) {
						config.reporter.onInvalid(el);
					} else if (oldValidationMessage) {
						config.reporter.onValid(el); // remove error message
					}
				});
			}

		}
	}
}

function checkValidity(form) {
	var elements = form.elements, r = [];
	for (var i=0,l=elements.length; i<l; i++) {
		var el = elements[i];
		if (el.willValidate) {
			if (!el.checkValidity()) {
				r.push(el);
			}
			console.log('========WILL VALIDATE', el);
		} else {
			console.log('========NO VALIDATE', el);
		}
	}
	return r.length ? r : null;
}

function showError(el, msg) {
	el.classList.add('invalid');
	var els = el.form.getElementsWithClass('.-q-valid-msg-'+el.name);
	if (els && els.length) {
		_showError(el, els[0]);
	}
}

function clearError(el) {
	el.classList.remove('invalid');

}

export default function formValidateDirective(xattrs, valueExpr, el) {
	var config = Object.assign({
		onblur: true,
		reporter: { onValid: clearError, onInvalid: showError }
	}, this.eval(valueExpr) || {});
	if (!el) {
		throw new Error('Cannot use q:validate: Target element is not a form!');
	}
	el.addEventListener('submit', function() {
		console.log('SUBMIT EVENT -> DO VALIFDATIOn');
	})
	return function(el) {
		setupValidation(el, config);
	}
}
