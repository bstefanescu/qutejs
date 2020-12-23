
const InputHandler = {
    set(el, value) {
        el.value = value == null ? '' : value;
    },
    get(el) {
        return el.value;
    }
}

const CheckboxHandler = {
    set(el, value) {
        el.checked = !!value;
    },
    get(el) {
        return !!el.checked;
    }
}

const RadioHandler = {
    set(el, value) {
        el.checked = el.value === value;
    },
    get(el) {
        return el.checked ? el.value : null;
    }
}

function forEachOption(el, fn) {
    var opts = el.options;
    for (var i=0,l=opts.length; i<l; i++) {
        fn(opts[i]);
    }
}

const MultiSelectHandler = {
    set(el, value) {
        if (typeof value === 'string') {
            value = [value];
        }
        if (!value || !value.length) {
            forEachOption(el, function(opt) {
                opt.selected = false;
            });
        } else {
            forEachOption(el, function(opt) {
                options.selected = value.indexOf(opt.value) > -1;
            });
        }
    },
    get(el) {
        const selected = [];
        forEachOption(el, function(opt) {
            if (opt.selected) selected.push(opt.value);
        });
        return selected;
    }
}

function getHandler(el) {
    const tag = el.tagName;
    if (!("type" in el)) {
        throw new Error('Unsupported element "'+tag+'" for form:model directive.');
    }
    switch (el.type) {
        case 'checkbox': return CheckboxHandler;
        case 'radio': return RadioHandler;
        case 'select-multiple': return MultiSelectHandler;
        default: return InputHandler;
    }
}

export default function qModel(xattrs, propName, el, comp) {
    if (!propName) {
        // use the _$form_model_ref property
        const modelRef = this.model._$form_model_ref;
        if (modelRef && modelRef.name && modelRef.rendering) {
            return qModel.call(modelRef.rendering, xattrs, modelRef.name, el, comp);
        } else {
            throw new Error("form:model must take a value");
        }
    }
    if (typeof propName !== 'string') {
        throw new Error("form:model can only take a literal string value");
    }
    const vm = this.vm;

    if (!vm) {
        // current component not a ViewModel - throw an error
        throw new Error('form:model was bound to "'+propName+'" property but the current component is not a ViewModel component!');
    }

    if (comp) {
        if (!("value" in comp)) { // just store the
            comp._$form_model_ref = {
                rendering: this,
                name: propName
            }
        } else {
            // for component elements we must install the handler
            this.up(function() {
                comp.value = vm[propName];
            })();
            // install the listener after the element is creates
            return function(el) {
                el.addEventListener('change', function(event) {
                    // only accept change events coming from the component root element.
                    if (event.target.__qute__ === comp) {
                        vm[propName] = comp.value;
                    }
                });
            }
        }
    } else {
        // for HTML elements install the directive after the DOM element was fully initialized
        return function(el) {
            const handler = getHandler(el);
            this.up(function() {
                handler.set(el, vm[propName]);
            })();
            // automatically update prop when changed
            el.addEventListener('change', function(event) {
                vm[propName] = handler.get(el);
            });
        }
    }
}
