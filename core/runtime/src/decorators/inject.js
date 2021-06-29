import { ERR } from "@qutejs/commons";
import Link from './link.js';

export default function Inject(id) {
    return function(target, key, value) {
        // value is ignored!
        if (target.__QUTE_VM__) { // we need to install a reactive property
            Link(target, key, id);
        } else if (target.app) {
            target.app.prop(id).inject(target, key);
        } else {
            ERR('@Inject must be used on ViewModels or classes which provides an `app` property like Qute services');
        }
    }
}