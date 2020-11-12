const D_View = 'View';
const D_Template = 'Template';
const D_Render = 'Render';
const D_Mixin = 'Mixin';
const D_Watch = 'Watch';
const D_On = 'On';
const D_Channel = 'Channel';
const D_Prop = 'Property';
const D_Required = 'Required';
const D_DataModel = 'DataModel';
const D_AsyncDataModel = 'AsyncDataModel';

const QUTE_DECORATORS = {};

const DecoratorProto = {
    checkSuperClass(dclass) {
        if (!dclass.superClass && this.superClass) {
            throw new Error(`Cannot use decorator @${this.name} on class ${dclass.name}. The class must extend ${this.superClass}`);
        }
    }
}

function registerQuteDecorator(meta) {
    const qdeco = Object.create(DecoratorProto);
    Object.assign(qdeco, meta);
    QUTE_DECORATORS[meta.name] = qdeco;
    QUTE_DECORATORS['Qute.'+meta.name] = qdeco;
}

registerQuteDecorator({
    name: D_View,
    superClass: 'Qute.Application',
    void: true
});
registerQuteDecorator({
    name: D_Template,
    superClass: 'Qute.ViewModel',
    void: true
});
registerQuteDecorator({
    name: D_Render,
    superClass: 'Qute.ViewModel',
    void: true
});
registerQuteDecorator({
    name: D_Mixin,
    void: true
});
registerQuteDecorator({
    name: D_Watch,
    superClass: 'Qute.ViewModel',
    void: true
});
registerQuteDecorator({
    name: D_On,
    superClass: 'Qute.ViewModel',
    void: true
});
registerQuteDecorator({
    name: D_Channel,
    superClass: 'Qute.ViewModel',
    void: true
});
registerQuteDecorator({
    name: D_Prop,
    superClass: 'Qute.ViewModel',
    vmProp: true,
    void: true
});
registerQuteDecorator({
    name: D_Required,
    required: true,
    void: true
});
registerQuteDecorator({
    name: D_DataModel,
    superClass: 'Qute.Service',
    svcProp: true,
    void: true
});
registerQuteDecorator({
    name: D_AsyncDataModel,
    superClass: 'Qute.Service',
    svcProp: true,
    async: true,
    void: true
});

function getDecoratorInfo(name) {
    return QUTE_DECORATORS[name];
}

function commentDecorator(ms, start, end) {
    ms.appendLeft(start, '//');
    //ms.appendLeft(start, '/*');
    //ms.appendRight(end, '*/');
}

function commentField(ms, start, end) {
    ms.appendLeft(start, '//');
    //ms.appendLeft(start, '/*');
    //ms.appendRight(end, '*/');
}

function removeDecorator(ms, start, end) {
    _removeStmt(ms, start, end, /[ \t]*\n?/m);
}


function removeField(ms, start, end) {
    _removeStmt(ms, start, end, /\s*?\n|(\s*;?[ \t]*\n?)/m);
}

function _removeStmt(ms, start, end, tailRX) {
    var text = ms.original;

    var lineStart = text.lastIndexOf('\n', start);
    if (lineStart === -1) lineStart = 0;
    if (!text.substring(lineStart, start).trim()) {
        start = lineStart+1;
    }

    var tail = text.substring(end);
    var match = tailRX.exec(tail);

    if (match) {
        end += match[0].length;
    }

//    console.log('>>>>>>>>>REMOVE: ['+text.substring(start, end)+']');
    ms.remove(start, end);
}

function resolveMemberPath(node, result) {
    if (node.type === 'MemberExpression') {
        resolveMemberPath(node.object, result);
        result.push(node.property.name);
    } else {
        result.push(node.name);
    }
    return result;
}

function getDecoratorName(decorator, mapper) {
    const expr = decorator.expression;
    if (expr.name) {
        return expr.name;
    } else if (expr.type === 'MemberExpression') {
        const path = resolveMemberPath(expr, []);
        return mapper ? mapper(path) : path.join('.');
    } else if (expr.callee) {
        const callee = expr.callee; // the name can be composed from multiple segments: @Qute.View
        if (callee.type === 'MemberExpression') {
            const path = resolveMemberPath(callee, []);
            return mapper ? mapper(path) : path.join('.');
        } else {
            return callee.name;
        }
    }
    throw new Error('Bug? Cannot find decorator name for '+JSON.stringify(decorator));
}

export {
    getDecoratorInfo,
    removeDecorator,
    removeField,
    commentDecorator,
    commentField,
    getDecoratorName
}