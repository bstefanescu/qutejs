
import Transpiler from './index.js';

const code = `
import Qute from '@qutejs/runtime';
import { Render, Prop, Watch, Mixin, Required, DataModel, AsyncDataModel, ViewModel} from '@qutejs/types';

@ViewModel(MyViewModel)
class MyApp extends Qute.App {

    @Service('Router')
    router = new Router(this, config);

}

@Abc
@Mixin(One,Two)
@Render(SomeTemplate)
class MyViewModel extends Qute.ViewModel {

    constructor(x) {
        super(x);
        console.log('dd');
    }
/*
    @Prop(List, 'id') items;
    @Prop(Link, 'UserSession/user') user;
    @Required @Prop() myString1;
    @Required @Prop myString2 = null;
    @Prop(String) myString3 = 'bla';

    @AsyncDataModel("bla") user = me();

    // text input element
    @log
    input;
*/

    @Prop name =  'abcs';
    @Prop age =  123;
    @Prop enabled = true;
    @Prop() arr = [1,2,3];
    @Prop(Object) obj = {a:1};
    @Required @Prop() map = new Map();
    @Prop(List, 'id') items = [];
    @Prop(Link, 'UserSession/user') user;

    @Watch('myString') @log
    watchProp() {

    }
}`;

const r = new Transpiler().transpile(code);

console.log(r.code);
