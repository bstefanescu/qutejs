import { ERR } from "@qutejs/commons";

export default function Link(id) {
    return function(target, key, value) {
        // value is ignored!
        if (target.__QUTE_VM__) { // we need to install a reactive property
            Object.defineProperty(target, key, target.$app.prop(id).bindVM(target, key));
        } else if (target.app) {
            target.app.prop(id).link(target, key);
        } else {
            ERR('@Link must be used on classes which provides an `app` property like Qute services');
        }
    }
}