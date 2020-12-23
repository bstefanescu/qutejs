

import Qute from '@qutejs/runtime';

const { ViewModel, Property, Watch } = Qute;

/* abstract */ class Choice extends ViewModel {
    render() {
        throw new Error("Rendering must be defined by derived classes");
    }

    @Property value;
    @Property checked;

    _input;

    connected() {
        // init -> set value
        this._onInputChange = event => {
            this.$data.checked = this._input.checked;
            event.stopPropagation();
            event.preventDefault();
            this.emit('change', this);
        }
        this._input.value = this.value || '';
        this._input.checked = this.checked;
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
        return false;
    }

}

export default Choice;
