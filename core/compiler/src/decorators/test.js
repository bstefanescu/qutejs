
import Transpiler from './index.js';

const code = `
import Qute from '@qutejs/runtime';
const { Render, Template, Prop, Watch, Mixin, Required, Provide, View, Link, Inject} = Qute;

@View(MyViewModel)
class MyApp extends Qute.Application {
    static aStaticField = 'Hello!'

    get hello() {
        return "hello";
    }

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

    @Qute.Prop name =  'abcs';
    @Property age =  123;
    @Property enabled = true;
    @Property() arr = [1,2,3];
    @Property(Object) obj = {a:1};
    @Required @Property() map = new Map();
    @Property(List, 'id') items = [];
    @Property(Link, 'UserSession/user') user;

    @Inject('thelink') myLink = true;

    @Some(12) xxx;
    @Some yyy;

    @Watch('myString') @log
    watchProp() {
    }

    @On('click')
    onClick() {}

}`;

const r = new Transpiler().transpile(code);

console.log(r.code);
