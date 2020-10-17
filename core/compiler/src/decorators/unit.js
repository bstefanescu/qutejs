import { removeDecorator, removeField, commentDecorator, commentField, getDecoratorInfo } from './utils.js';
import DecoratedClass from './class.js';

const QUTE_DECORATE_HELPER = '__qute_decorate_member__';

export default function DecoratedUnit(quteImport, imports, rimports, classes) {
    this.comment = false;
    this.quteImport = quteImport;
    this.imports = imports || []; // local alias to remote name (for qute decorartor imports)
    this.classes = classes;
    this.helperInstalled = rimports && (QUTE_DECORATE_HELPER in rimports) ? QUTE_DECORATE_HELPER : null;
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
    getRequiredDecoratorSuperClass(name) {
        const quteDecoratorName = this.imports[name];
        if (quteDecoratorName) {
            var info = getDecoratorInfo(quteDecoratorName);
            return info ? info.superClass : null;
        }
        return null;
    },
    checkSuperClass(klass, decoratorName) {
        if (!klass.superClass) {
            const superClass = this.getRequiredDecoratorSuperClass(decoratorName);
            if (superClass) {
                throw new Error(`Cannot use decorator @${decoratorName} on class ${klass.name}. The class must extend ${superClass}`);
            }
        }
    },
    isQuteDecorator(name) {
        return name in this.imports;
    },
    getQuteDecorator(name) {
        return this.imports[name];
    },
    removeDecorator(ms, decorator) {
        var fn = this.comment ? commentDecorator : removeDecorator;
        fn(ms, decorator.start, decorator.end);
    },
    removeField(ms, field) {
        var fn = this.comment ? commentField : removeField;
        fn(ms, field.start, field.end);
    },
    installDecorateHelper(ms) {
        if (!this.helperInstalled) {
            // generate a name?
            //const helperName = QUTE_DECORATE_HELPER+Date.now();
            ms.prepend(`import { ${QUTE_DECORATE_HELPER} } from '@qutejs/types';\n`);
            this.helperInstalled = QUTE_DECORATE_HELPER;
        }
        return this.helperInstalled;
    }
}


DecoratedUnit.load = function(ast) {
    var quteImport;
    var imports = null;
    var rimports = null;
    var classes = [];

    var nodes = ast.body;
    for (var i=0,l=nodes.length; i<l; i++) {
        var node = nodes[i];
        var type = node.type;
        if (type === 'ImportDeclaration') {
            var source = node.source.value;
            if (source === '@qutejs/runtime') {
                node.specifiers.forEach(sp => {
                    if (sp.type === 'ImportDefaultSpecifier') { // default import
                        //console.log('+++++++++++++++', sp);
                        quteImport = sp.local.name;
                    }
                })
            } else if (source === '@qutejs/types') {
                if (!imports) {
                    imports = {};
                    rimports = {};
                }
                node.specifiers.forEach(sp => {
                    if (sp.type === 'ImportSpecifier') { // default import
                        //console.log('+++++++++++++++2', sp);
                        imports[sp.local.name] = sp.imported.name;
                        rimports[sp.imported.name] = sp.local.name;
                    }
                })
            }
        } else if (type === 'ClassDeclaration') {
            // fix for decorators bug
            if (Array.isArray(nodes[i-1]) && !node.decorators.length) {
                node.decorators = nodes[i-1];
            }
            var dclass = loadClass(node);
            if (dclass.hasDecorators()) {
                classes.push(dclass);
            }
       }
    }
    //console.log('!!!!!!!!!!!!DECO IMPORTS', imports, rimports);

    return classes.length ? new DecoratedUnit(quteImport, imports, rimports, classes) : null;
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

