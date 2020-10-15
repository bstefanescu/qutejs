import MagicString from 'magic-string';
//import  Meriyah from 'meriyah';
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
        unit.comment = this.comment;
        if (unit) {
            var ms = new MagicString(code);
            unit.transpile(ms);
            return {
                code: ms.toString(),
                map: sourceMap ? ms.generateMap() : null,
                ast: ast
            }
        }
    }
}


