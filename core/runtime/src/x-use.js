import ERR from './error.js';
import {getDirective} from './registry.js';

export default function applyUserDirectives(el, vm, directives) {
	for (var key in directives) {
		if (key === '@') {
			directives[key].call(vm, el);
		} else {
			var userDir = getDirective(key);
			if (!userDir) {
				ERR(50, key);
			}
			userDir.call(vm, el, directives[key]);
		}
	}
}
