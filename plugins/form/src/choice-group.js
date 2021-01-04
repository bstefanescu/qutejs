
import Qute from '@qutejs/runtime';
import ChoiceGroupTemplate from './choice-group.jsq';

const { ViewModel, Template, Property, On, Watch } = Qute;

const BASE_CLASS_NAME = '--qute-choice';

function qChoice(xattrs, val, el, comp) {
    (el || comp).__qute_choice = true;
    return function(el) {        
        this.addClass(el, val ? BASE_CLASS_NAME+' '+BASE_CLASS_NAME + '-'+this.eval(val) : BASE_CLASS_NAME)
    }
}

@Template(ChoiceGroupTemplate)
class ChoiceGroup extends ViewModel {
    @Property value;
    
    get _choiceClass() {
        let className = this.$attrs.name; 
        return className ? BASE_CLASS_NAME+'-'+className : BASE_CLASS_NAME;
    }

    get _choices() {
        return this.$el.getElementsByClassName(this._choiceClass);
    }

    _forEachChoice(fn) {
        const choices = this._choices;
        for (let i = 0,l=choices.length; i < l; i++) {
            let choice = choices[i];
            if (choice.__qute__) {
                choice = choice.__qute__;
            }
            fn(choice);
        }
    }

    connected() {
        const initialValue = this.value;
        const choices = this._choices;
        for (let i=0,l=choices.length; i<l; i++) {
            let choice = choices[i];
            if (choice.__qute__) {
                choice = choice.__qute__;
            }
            if (initialValue != null) {
                choice.checked = choice.value === initialValue;
            } else if (choice.checked) {
                if (this.$data.value == null) {
                    this.$data.value == choice.value;
                } else { // uncheck the checkbox?
                    checkbox.checked = false;
                }
            }
        }
    }

    @On('change')
    _onChoiceChanged(event) {
        const target = event.target;
        if (target.classList.contains(this._choiceClass)) {
            const choice = target.__qute__ || target;
            if (this.$data.value !== choice.value) {
                this._forEachChoice(c => {
                    if (c.checked && c !== choice) {
                        c.checked = false;
                    }
                });
                this.$data.value = choice.value;
                this.emitAsync('change', this);
            }
            return false;
        }
    }

    @Watch('value')
    _valueChanged(value) {
        this._forEachChoice(choice => {
            choice.checked = choice.value === value;
        });
        return false;
    }

}

export { qChoice, ChoiceGroup };
