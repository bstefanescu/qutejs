import Compiler from '@qutejs/compiler';
import {matchExtensions} from './utils.js';

export default function quteDecorators (options = {}) {

    const comment = options.comment;
    const extensions = options.extensions || ['.jsq', '.qute', '.js'];

    const transpiler = new Compiler.DecoratorTranspiler(comment); // TODO use hires?

    return {
        name: 'qute-decorators',
        transform (source, path) {
            if (matchExtensions(path, extensions)) {
                const r = transpiler.transpile(source, true); // {code, map, ast}
                if (r) {
                    r.ast = null; // do not return the ast - it may not be compatible with rollup
                    return r;
                }
            }
        }
    }
}

