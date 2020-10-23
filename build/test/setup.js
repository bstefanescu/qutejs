const path = require('path');
const Module = require('module');

const ALIASES = {
    '@qutejs/runtime': path.join(__dirname, '../../core/runtime')
}
const oldResolveFilename = Module._resolveFilename;
Module._resolveFilename = function (request, parentModule, isMain, options) {
    return oldResolveFilename.call(this, ALIASES[request] || request, parentModule, isMain, options);
}

require('@qutejs/register')({cache: false});
require('@babel/register')({extensions: ['.js', '.jsq'], "presets": ["@babel/preset-env"]});
