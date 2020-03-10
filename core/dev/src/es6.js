
import { transform } from 'buble';

function testES6() {
	try {
		new Function("(a = 0) => a; class X{}");
		return true;
	} catch (e) {
		return false;
	}
}

var ES6 = testES6();

export default function transpileES6(code) {
	return ES6 ? code : transform(code).code;
}
