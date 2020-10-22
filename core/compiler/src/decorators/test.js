
import Transpiler from './index.js';

const code = `
import Qute from '@qutejs/runtime';
const { Render, Template, Prop, Watch, Mixin, Required, DataModel, AsyncDataModel, View} = Qute;

@ViewModel(MyViewModel)
class MyApp extends Qute.App {

    @Service('Router')
    router = new Router(this, config);

}

@Abc
@Qute.Test.Mixin(One,Two)
@Template(SomeTemplate)
class MyViewModel extends Qute.ViewModel {

    constructor(x) {
        super(x);
        console.log('dd');
    }
/*
    @Property(List, 'id') items;
    @Property(Link, 'UserSession/user') user;
    @Required @Property() myString1;
    @Required @Property myString2 = null;
    @Property(String) myString3 = 'bla';

    @AsyncDataModel("bla") user = me();

    // text input element
    @log
    input;
*/

    @Qute.Prop name =  'abcs';
    @Property age =  123;
    @Property enabled = true;
    @Property() arr = [1,2,3];
    @Property(Object) obj = {a:1};
    @Required @Property() map = new Map();
    @Property(List, 'id') items = [];
    @Property(Link, 'UserSession/user') user;

    @Watch('myString') @log
    watchProp() {

    }
}`;

const r = new Transpiler().transpile(code);

console.log(r.code);
