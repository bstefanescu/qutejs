
function decorateMethod(methodName, decoratorCalls) {
    if (!decoratorCalls.length) return null;
    const name = JSON.stringify(methodName);
    let callDefine, out = `  d = Object.getOwnPropertyDescriptor(proto, ${name});\n`;
    decoratorCalls.forEach(dcall => {
        if (dcall.void) {
            out += `  ${dcall.value}(proto, ${name}, d);\n`;
        } else {
            callDefine = true;
            out += `  d = ${dcall.value}(proto, ${name}, d) || d;\n`;
        }
    });
    if (callDefine) out += `  Object.defineProperty(proto, ${name}, d);\n`;
    return out;
}

function getDefinePropCall(text, field, decorator) {
    // args: Type, key, value, arg
    var type, key, value, arg;
    // get the type from decorator
    let decoArgs = decorator.expression.arguments;
    if (decoArgs && decoArgs.length > 0) {
        let decoArg0 = decoArgs[0];
        type = text.substring(decoArg0.start, decoArg0.end);
        if (decoArgs.length > 1) {
            let decoArg1 = decoArgs[1];
            arg = text.substring(decoArg1.start, decoArg1.end);
        }
    }
    // the key
    key = JSON.stringify(field.key.name);
    // if the value is defined and not a literal or an identifier then we wrap it in a factory function
    if (field.value) {
        value = text.substring(field.value.start, field.value.end);
        const fieldValue = field.value;
        const fieldValueType =fieldValue.type;
        if (!type) {
            if (fieldValueType === 'Literal') {
                const valueType = typeof fieldValue.value;
                if (valueType === 'string') {
                    type = 'String';
                } else if (valueType === 'number') {
                    type = 'Number';
                } else if (valueType === 'boolean') {
                    type = 'Boolean';
                }
            }
        }
    } else {
        value = 'void(0)';
    }

    var methodCall = `this.defineProp(${type||'null'}, ${key}, ${value}`;
    if (arg) methodCall += `, ${arg}`;
    return methodCall+');\n';
}

export default function DecoratedClass(classNode) {
    this.node = classNode;
    this.superClass = classNode.superClass;
    this.ctor = null;
    this.decorators = classNode.decorators && classNode.decorators.length ? classNode.decorators : null;
    this.fields = null; // all fields found on class
    this.methods = null; // decorated methods

    this.toAppend = '';
    this.ctorStmts = []; // statements to inject in the constructor
}
// TODO we must inspect thje imports to seee if ViewModel was renamed
DecoratedClass.prototype = {
    get name() {
        return this.node.id.name;
    },
    hasDecorators() {
        return this.decorators || this.fields || this.props || this.methods;
    },
    addField(field) {
        if (!this.fields) {
            this.fields = [];
        }
        this.fields.push(field);
    },
    addDecoratedMethod(method) {
        if (!this.methods) {
            this.methods = [];
        }
        this.methods.push(method);
    },
    transpile(ms, unit) {
        if (this.decorators) {
            this.decorators.forEach(deco => this.transpileDecorator(ms, deco, unit));
        }
        if (this.fields) {
            var vmprops = [];
            var fields = [];
            var staticFields = [];
            this.fields.forEach(field => {
                if (field.static) {
                    if (field.decorators && field.decorators.length > 0) {
                        throw new Error('Decorators are not supported on static fields: '+ms.original.substring(field.start, field.end));
                    }
                    staticFields.push(field);
                } else {
                    const meta = unit.getPropMeta(field);
                    if (meta) meta.checkSuperClass(this);
                    if (meta && meta.vmProp) {
                        vmprops.push(field);
                    } else {
                        fields.push(field);
                    }
                }
            })
            if (vmprops.length) this.transpileVMProps(ms, vmprops, unit);
            if (fields.length) this.transpileFields(ms, fields, unit);
            if (staticFields.length) this.transpileStaticFields(ms, staticFields, unit);
        }
        if (this.methods) {
            this.transpileMethods(ms, this.methods, unit);
        }
        if (this.ctorStmts.length > 0) {
            this.injectCtorStmts(ms, this.ctorStmts);
        }
        if (this.toAppend) {
            ms.appendLeft(this.node.end, this.toAppend);
        }
    },

    appendCode(stmt) {
        this.toAppend += '\n'+stmt;
    },

    transpileDecorator(ms, decorator, unit) {
        var text = ms.original;
        var decoratorCall = text.substring(decorator.start+1, decorator.end)+`(${this.name})`; // we removed the leading @
        var info = unit.getDecoratorInfo(decorator);
        if (info) {
            info.checkSuperClass(this);
            // a Qute decorator -> avoid reassigning - simply write: decorator(TheClass);
            this.appendCode(decoratorCall+';');
        } else {
            // use specs: TheClass = decorator(TheClass) || TheClass;
            this.appendCode(this.name +' = '+decoratorCall+' || '+this.name+';');
        }
        // remove  or comment? the decorator
        unit.removeDecorator(ms, decorator);
    },

    transpileMethods(ms, methods, unit) {
        let text = ms.original;
        let methodsToDecorate = [];
        this.methods.forEach(method => {
            const methodName = method.key.name;
            const methodDecorators = [];
            method.decorators.forEach(decorator => {
                const info = unit.getDecoratorInfo(decorator);
                if (info) { // a Qute decorator
                    info.checkSuperClass(this);
                }
                unit.removeDecorator(ms, decorator);
                let decoratorCall = text.substring(decorator.start+1, decorator.end); // we removed the leading @
                if (decoratorCall.lastIndexOf(')') === -1) decoratorCall += '()';
                methodDecorators.push({value: decoratorCall, void: info && info.void});
            });
            if (methodDecorators.length > 0) {
                methodsToDecorate.push({
                    name: methodName,
                    decorators: methodDecorators
                });
            }
        });
        if (methodsToDecorate.length > 0) {
            let snippets = [];
            methodsToDecorate.forEach(m => {
                snippets.push(decorateMethod(m.name, m.decorators));
            })
            this.appendCode(`(function(proto) {\n  let d;\n${snippets.join('')}})(${this.name}.prototype);`);
        }
    },

    injectCtorStmts(ms, stmts) {
        const text = ms.original;
        if (this.ctor) {
            // look for the `super()` call
            let offset = -1;
            let body = this.ctor.value.body;
            if (body.body.length > 0) {
                let firstStmt = body.body[0];
                if (firstStmt.type === 'ExpressionStatement') {
                    let firstExpr = firstStmt.expression;
                    if (firstExpr.callee && firstExpr.callee.type === 'Super') {
                        // insert after super
                        offset = firstExpr.end;
                        if (text[offset] === ';') offset++;
                    }
                }
            }
            if (offset === -1) {
                offset = body.start+1; // skip {
            }
            let tab = '    ';
            ms.appendLeft(offset, '\n'+tab+tab+stmts.join(tab+tab).trim()+'\n');
        } else {
            let tab = '    ';
            // create the ctor
            let classBody = this.node.body;
            let offset = classBody.start+1; // skip \\ {
            if (this.superClass) {
                ms.appendLeft(offset, `\n${tab}constructor(...args) {\n${tab}${tab}super(...args);\n\n${tab}${tab}${stmts.join(tab+tab)}${tab}}` )
            } else { // no super class - generate a default ctor
                ms.appendLeft(offset, `\n${tab}constructor() {\n${tab}${tab}${stmts.join(tab+tab)}${tab}}` )
            }
        }
    },

    /*
    fields are moved in constructor. If not construcor exists a new one is generated as follow:
      constructor(...args) {
        super(...args);
      }
      otherwise fields are moved inside the constructor just after super() if opne exists
      otherwise at the begining of the ctor
    */
    transpileFields(ms, fields, unit) {
        const text = ms.original;
        const initFields = this.ctorStmts;
        fields.forEach(field => {
            const key = field.key.name;
            let value = 'void(0)';
            if (field.value) {
                value = text.substring(field.value.start, field.value.end);
            }
            if (!field.decorators.length) {
                // we define the field if no decorators are present
                // kif the field is starting with _ we set enumerable to false
                if (key[0] === '_') {
                    initFields.push(`Object.defineProperty(this, "${key}", {value: ${value}, writable:true});\n`);
                } else {
                    initFields.push(`this.${key} = ${value};\n`);
                }
            } else {
                field.decorators.forEach(decorator => {
                    let decoratorCall = text.substring(decorator.start+1, decorator.end); // we removed the leading @
                    initFields.push(decoratorCall+`(this, "${key}", ${value});\n`);
                    unit.removeDecorator(ms, decorator);
                });
            }
            unit.removeField(ms, field);
        });
    },
    transpileStaticFields(ms, fields, unit) {
        const text = ms.original;
        fields.forEach(field => {
            const key = field.key.name;
            let value = 'void(0)';
            if (field.value) {
                value = text.substring(field.value.start, field.value.end);
            }
            this.appendCode(`${this.name}.${key} = ${value};`);
            unit.removeField(ms, field);
        });
    },
    transpileVMProps(ms, fields, unit) {
        const text = ms.original;
        const initFields = this.ctorStmts;
        let req = [];
        fields.forEach(field => {
            field.__qute_meta.checkSuperClass(this);

            initFields.push(getDefinePropCall(text, field, field.__qute_deco));

            if (field.__qute_required) {
                req.push(field.key.name);
            }
            field.decorators.forEach(decorator => {
                unit.removeDecorator(ms, decorator);
            });
            unit.removeField(ms, field);
        });

        // var tab = '    ';
        // this.appendCode(this.name+'.prototype.$props = () => ({\n'+tab+props.join(',\n'+tab)+'\n});');
        if (req.length > 0) {
            this.appendCode(this.name+'.prototype.$require = '+JSON.stringify(req)+';');
        }
    }

};
