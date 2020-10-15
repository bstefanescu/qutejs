
const D_Template = 'Template';
const D_Render = 'Render';
const D_Mixin = 'Mixin';
const D_Watch = 'Watch';
const D_On = 'On';
const D_Channel = 'Channel';
const D_Prop = 'Prop';
const D_Required = 'Required';
const D_DataModel = 'Required';
const D_AsyncDataModel = 'Required';

const QUTE_DECORATORS = {};

function registerQuteDecorator(name, superClass, isPropMarker) {
    QUTE_DECORATORS[name] = { superClass: superClass, prop: isPropMarker }
}

registerQuteDecorator(D_Template, 'Qute.ViewModel');
registerQuteDecorator(D_Render, 'Qute.ViewModel');
registerQuteDecorator(D_Mixin);
registerQuteDecorator(D_Watch, 'Qute.ViewModel');
registerQuteDecorator(D_On, 'Qute.ViewModel');
registerQuteDecorator(D_Channel, 'Qute.ViewModel');
registerQuteDecorator(D_Prop, 'Qute.ViewModel', true);
registerQuteDecorator(D_Required);
registerQuteDecorator(D_DataModel, 'Qute.Service');
registerQuteDecorator(D_AsyncDataModel, 'Qute.Service');



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

function isVmProp(property, imports) {
    if (property.decorators.length > 0) {
        var decos = property.decorators;
        var required = false, prop = false;
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
                    if (quteName === D_Required) { // @Required
                        property.__qute_required = true;
                    } else if (decoratorInfo.prop) {
                        property.__qute_prop = quteName;
                        prop = true;
                    }
                }
            }
        }
    }
    return prop;
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
    isVmProp,
    removeDecorator,
    removeField,
    commentDecorator,
    commentField,
    getDecoratorName
}