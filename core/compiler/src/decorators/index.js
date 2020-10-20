import MagicString from 'magic-string';
// --- works with node modules:
//import  Meriyah from 'meriyah';
//const parse = Meriyah.parseScript;
// ---- this one works with rollup:
import  {parseScript as parse} from 'meriyah';

import DecoratedUnit from './unit.js';


export default function Transpiler(comment) {
    this.comment = !!comment;
}
Transpiler.prototype = {
    transpile(code, sourceMap) {
        const ast = parse(code, {
            module: true,
            next: true,
            ranges: true,
            lexical: true
        });

        var unit = DecoratedUnit.load(ast);
        if (unit) {
            unit.comment = this.comment;
            var ms = new MagicString(code);
            unit.transpile(ms);
            return {
                code: ms.toString(),
                map: sourceMap ? ms.generateMap() : null,
                ast: ast
            }
        }
        return null; // no decorators found
    }
}

