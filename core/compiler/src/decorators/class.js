import { getPropMeta, getDecoratorName } from './utils.js';

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
        //field.decorators.forEach(d => console.log('>>>>>>>>DECO', d))
    },
    addDecoratedMethod(method) {
        if (!this.methods) {
            this.methods = [];
        }
        this.methods.push(method);
        //method.decorators.forEach(d => console.log('>>>>>>>>DECO', d))
    },
    transpile(ms, unit) {
        if (this.decorators) {
            this.decorators.forEach(deco => this.transpileDecorator(ms, deco, unit));
        }
        if (this.fields) {
            var vmprops = [];
            var svcprops = [];
            var fields = [];
            this.fields.forEach(field => {
                const meta = getPropMeta(field, unit.imports);
                if (meta) {
                    if (meta.vmProp) {
                        vmprops.push(field);
                    } else if (meta.svcProp) {
                        svcprops.push(field);
                    }
                } else {
                    fields.push(field);
                }
            })
            if (vmprops.length) this.transpileVMProps(ms, vmprops, unit);
            if (svcprops.length) this.transpileSvcProps(ms, svcprops, unit);
            if (fields.length) this.transpileFields(ms, fields, unit);
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
        var dname = getDecoratorName(decorator);
        unit.checkSuperClass(this, dname);
        if (unit.isQuteDecorator(dname)) {
            // avoid reassigning - simply write: decorator(TheClass);
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
        this.methods.forEach(method => {
            const methodName = method.key.name;
            const helperArgs = [];
            method.decorators.forEach(decorator => {
                unit.checkSuperClass(this, getDecoratorName(decorator));
                unit.removeDecorator(ms, decorator);
                let decoratorCall = text.substring(decorator.start+1, decorator.end); // we removed the leading @
                helperArgs.push(decoratorCall);
            });
            if (helperArgs.length > 0) {
                const helperName = unit.installDecorateHelper(ms);
                this.appendCode(`${helperName}(${this.name}, ${JSON.stringify(methodName)}, ${helperArgs.join(', ')});`);
            }
        });
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
            //console.log('!!!!!!!!!!!!!!!', text)
            ms.appendLeft(offset, `\n${tab}constructor(...args) {\n${tab}${tab}${stmts.join(tab+tab)}${tab}}` )
            //console.log('BODY=============', );
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
            const helperArgs = [];
            const key = field.key.name;
            let value = null;
            if (field.value) {
                value = text.substring(field.value.start, field.value.end);
            }
            if (value) {
                initFields.push('this.'+key+' = '+value+';\n');
            } else {
                initFields.push('this.'+key+' = void(0);\n');
            }
            field.decorators.forEach(decorator => {
                let decoratorCall = text.substring(decorator.start+1, decorator.end); // we removed the leading @
                helperArgs.push(decoratorCall);
                unit.removeDecorator(ms, decorator);
            });
            unit.removeField(ms, field);
            if (helperArgs.length > 0) {
                const helperName = unit.installDecorateHelper(ms);
                this.appendCode(`${helperName}(${this.name}, ${JSON.stringify(key)}, ${helperArgs.join(', ')});`);
            }
        });
    },
    transpileVMProps(ms, fields, unit) {
        const text = ms.original;
        let props = [], req = [];
        fields.forEach(field => {
            unit.checkSuperClass(this, field.__qute_meta.name);

            var key = field.key.name;
            var value = null;
            if (field.value) {
                value = text.substring(field.value.start, field.value.end);
            }
            if (value) {
                props.push(key+': '+value);
            } else {
                props.push(key+': void(0)');
            }
            if (field.__qute_required) {
                req.push(key);
            }
            field.decorators.forEach(decorator => {
                unit.removeDecorator(ms, decorator);
            });
            unit.removeField(ms, field);
        });

        var tab = '    ';
        this.appendCode(this.name+'.prototype.$props = () => ({\n'+tab+props.join(',\n'+tab)+'\n});');
        if (req.length > 0) {
            this.appendCode(this.name+'.prototype.$require = '+JSON.stringify(req)+';');
        }
    },
    transpileSvcProps(ms, fields, unit) {
        const text = ms.original;
        const initFields = this.ctorStmts;
        fields.forEach(field => {
            const meta = field.__qute_meta;
            unit.checkSuperClass(this, meta.name);

            var key = field.key.name;
            var value = null;
            if (field.value) {
                value = text.substring(field.value.start, field.value.end);
            } else {
                value = 'void(0)';
            }
            const definePropFn = meta.async ? 'defineAsyncProp' : 'defineProp';

            const decoArgs = field.__qute_deco.expression.arguments;
            if (!decoArgs || !decoArgs.length) {
                throw new Error('Invalid ${meta.name} decorator: must specify the data model ID as an argument');
            }
            const propId = text.substring(decoArgs[0].start, decoArgs[0].end);

            const args = field.value ? propId+', '+text.substring(field.value.start, field.value.end) : propId;

            initFields.push(`this.app.${definePropFn}(${args}).link(this, ${key});\n`);

            field.decorators.forEach(decorator => {
                unit.removeDecorator(ms, decorator);
            });
            unit.removeField(ms, field);
        });
    }

};
