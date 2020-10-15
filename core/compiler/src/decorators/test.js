
import Transpiler from './index.js';

const code = `
import Qute from '@qutejs/runtime';
import { Render, Prop, Watch, Mixin, Required} from '@qutejs/decorators';

@Abc
@Mixin(One,Two)
@Render(SomeTemplate)
class MyViewModel extends Qute.ViewModel {

    constructor(x) {
        console.log('dd');
    }
    @Required @Prop() myString1    ;
    @Required @Prop myString2 = null;
    @Prop('string') myString3 = 'bla';

    // text input element
    @log
    input;

    @Watch('myString') @log
    watchProp() {

    }
}`;

const r = new Transpiler().transpile(code);

console.log(r.code);
