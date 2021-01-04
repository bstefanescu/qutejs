import Qute from '@qutejs/runtime';

const { ViewModel, Property, Watch } = Qute;

const BASE_CLASS_NAME = '--qute-choice';

/* abstract */ class Choice extends ViewModel {
    render() {
        throw new Error("Rendering must be defined by derived classes");
    }

    @Property value;
    @Property(Boolean) checked;

    _input;

    get isExclusive() {
        return this.__qute_choice;
    }

    ready() {
        this._input.value = this.value || 'true';
        this._input.checked = this.checked;
    }

    connected() {
        // init -> set value
        this._onInputChange = event => {
            this.checked = this._input.checked;
            event.stopPropagation();
            event.preventDefault();
            this.onToggle && this.onToggle(); 
            this.emit('change', this);
        }
        this._input.addEventListener('change', this._onInputChange);
    }

    disconnect() {
        this._onInputChange && this._input.removeEventListener('change', this._onInputChange);
    }

    @Watch('value')
    _onValueChange(value) {
        this._input.value = value;
        return false;
    }

    @Watch('checked')
    _onCheckedChange(value) {
        this._input.checked = value;
        // let subclasses update their state
        this.onToggle && this.onToggle(); 
    }

}

export default Choice;
