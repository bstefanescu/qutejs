import { removeDecorator, removeField, commentDecorator, commentField, getDecoratorInfo, getDecoratorName } from './utils.js';
import DecoratedClass from './class.js';

export default function DecoratedUnit(quteImport, classes) {
    this.comment = false;
    this.quteImport = quteImport;
    this.classes = classes;
}
DecoratedUnit.prototype = {
    transpile(ms) {
        var transpiled = false;
        this.classes.forEach(clazz => {
            if (clazz.hasDecorators()) {
                clazz.transpile(ms, this);
                transpiled = true;
            }
        });
        return transpiled;
    },
    getDecoratorInfo(deco) {
        if (!this.quteImport) return null; // No Qute import found so we assume this is not a Qute decorator
        const name = getDecoratorName(deco, path => {
            if (path[0] === this.quteImport) path[0] = 'Qute';
            return path.join('.');
        });
        return getDecoratorInfo(name);
    },
    removeDecorator(ms, decorator) {
        var fn = this.comment ? commentDecorator : removeDecorator;
        fn(ms, decorator.start, decorator.end);
    },
    removeField(ms, field) {
        var fn = this.comment ? commentField : removeField;
        var start = field.start;
        if (field.static) {
            // in the current version of meriyah the 'static' keyword is not part of the field range
            const text = ms.original;
            if (!/^static\s/m.test(text.substring(field.start, field.end).trim())) {
                //search for the static keyword
                const preText = text.substring(0, field.start);
                start = preText.search(/\sstatic\s+$/m);
                if (start < 0) throw new Error('Could not find static keyword for static field: '+text.substring(field.start, field.end));
            }
        }
        fn(ms, start, field.end);
    },
    getPropMeta(property) {
        let meta = null;
        if (property.decorators.length > 0) {
            var decos = property.decorators;
            for (var i=0,l=decos.length; i<l; i++) {
                var deco = decos[i];
                var decoratorInfo = this.getDecoratorInfo(deco);
                if (decoratorInfo) {
                    if (decoratorInfo.required) {
                        property.__qute_required = true;
                    } else if (decoratorInfo.vmProp) {
                        if (meta) throw new Error(`Decorators "${meta.name}" and "${decoratorInfo.name}" cannot be both used on the same field`);
                        meta = decoratorInfo;
                        property.__qute_deco = deco;
                        property.__qute_meta = meta;
                    } else if (decoratorInfo.svcProp) {
                        if (meta) throw new Error(`Decorators "${meta.name}" and "${decoratorInfo.name}" cannot be both used on the same field`);
                        meta = decoratorInfo;
                        property.__qute_deco = deco;
                        property.__qute_meta = meta;
                    }
                }
            }
        }
        return meta;
    }
}


DecoratedUnit.load = function(ast) {
    var quteImport;
    var classes = [];

    var nodes = ast.body;
    for (var i=0,l=nodes.length; i<l; i++) {
        var node = nodes[i];
        var type = node.type;
        if (!quteImport && type === 'ImportDeclaration') {
            var source = node.source.value;
            if (source === '@qutejs/runtime') {
                node.specifiers.forEach(sp => {
                    if (sp.type === 'ImportDefaultSpecifier') { // default import
                        //console.log('+++++++++++++++', sp);
                        quteImport = sp.local.name;
                    }
                })
            } else { // iin tests we do not use @qutejs/runtime but '..'

            }
        } else if (type === 'ClassDeclaration') {
            var dclass = loadClass(node);
            if (dclass.hasDecorators()) {
                classes.push(dclass);
            }
       }
    }

    return classes.length ? new DecoratedUnit(quteImport, classes) : null;
}

function loadClass(node) {
    var dclass = new DecoratedClass(node);
    node.body.body.forEach(member => {
        var type = member.type;
        if (type === 'MethodDefinition') {
            if (member.kind === 'constructor') {
                dclass.ctor = member;
            } else if (member.decorators.length) {
                dclass.addDecoratedMethod(member)
            }
        } else if (type === 'FieldDefinition') {
            dclass.addField(member);
        }
    });
    return dclass;
}

