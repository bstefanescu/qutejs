
const D_Template = 'Template';
const D_Render = 'Render';
const D_Mixin = 'Mixin';
const D_Watch = 'Watch';
const D_On = 'On';
const D_Channel = 'Channel';
const D_Prop = 'Prop';
const D_Required = 'Required';
const D_DataModel = 'DataModel';
const D_AsyncDataModel = 'AsyncDataModel';

const QUTE_DECORATORS = {};

function registerQuteDecorator(meta) {
    QUTE_DECORATORS[meta.name] = meta;
}

registerQuteDecorator({
    name: D_Template,
    superClass: 'Qute.ViewModel'
});
registerQuteDecorator({
    name: D_Render,
    superClass: 'Qute.ViewModel'
});
registerQuteDecorator({
    name: D_Mixin
});
registerQuteDecorator({
    name: D_Watch,
    superClass: 'Qute.ViewModel'
});
registerQuteDecorator({
    name: D_On,
    superClass: 'Qute.ViewModel'
});
registerQuteDecorator({
    name: D_Channel,
    superClass: 'Qute.ViewModel'
});
registerQuteDecorator({
    name: D_Prop,
    superClass: 'Qute.ViewModel',
    vmProp: true
});
registerQuteDecorator({
    name: D_Required
});
registerQuteDecorator({
    name: D_DataModel,
    superClass: 'Qute.Service',
    svcProp: true
});
registerQuteDecorator({
    name: D_AsyncDataModel,
    superClass: 'Qute.Service',
    svcProp: true,
    async: true
});



const VM_PROPS_DECORATORS = {
    'Prop': true,
    'String': true,
    'Boolean': true,
    'Link': true,
    'Object': true,
    'Array': true,
    'List': true,
    'Any': true,
}

function getPropMeta(property, imports) {
    let meta = null;
    if (property.decorators.length > 0) {
        var decos = property.decorators;
        for (var i=0,l=decos.length; i<l; i++) {
            var deco = decos[i];
            var name;
            var callee = deco.expression.callee;
            if (callee) { // decorators with arguments
                name = callee.name;
            } else {
                name = deco.expression.name;
            }

            const quteName = imports[name]; // get the import name

            if (quteName) {
                var decoratorInfo = QUTE_DECORATORS[quteName];
                if (decoratorInfo) {
                    if (quteName === D_Required) {
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

                        console.log('======>', meta);
                    }
                }
            }
        }
    }
    return meta;
}

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
    _removeStmt(ms, start, end, /\s*;?[ \t]*\n?/m);
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

function getDecoratorName(decorator) {
    var expr = decorator.expression;
    return expr.name || (expr.callee && expr.callee.name);
}

export {
    getDecoratorInfo,
    getPropMeta,
    removeDecorator,
    removeField,
    commentDecorator,
    commentField,
    getDecoratorName
}