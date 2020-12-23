

import Qute from '@qutejs/runtime';

const { ViewModel, Property, Watch } = Qute;

/* abstract */ class Input extends ViewModel {
    render() {
        throw new Error("Rendering must be defined by derived classes");
    }

    @Property value;

    _input;

    connected() {
        // init -> set value
        this._onInputChange = event => {
            this.$data.value = this._input.value;
            event.stopPropagation();
            event.preventDefault();
            this.emit('change', this);
        }
        this._input.value = this.value || '';
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

}

export default Input;