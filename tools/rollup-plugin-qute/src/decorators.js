import Compiler from '@qutejs/compiler';
import {matchExtensions} from './utils.js';

export default function quteDecorators (options = {}) {

    const comment = options.comment;
    const extensions = options.extensions || ['.jsq', '.qute', '.js'];

    const transpiler = new Compiler.DecoratorTranspiler(comment);

    return {
        name: 'qute-decorators',
        transform (source, path) {
            if (matchExtensions(path, extensions)) {
                return transpiler.transpile(source);
            }
        }
    }
}

