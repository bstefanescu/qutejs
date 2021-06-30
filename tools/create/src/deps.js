
const CLIENT_DEPS = [
    ['-D', 'rollup'],
    ['-D', '@rollup/plugin-commonjs'],
    ['-D', '@rollup/plugin-node-resolve'],
    ['-D', '@rollup/plugin-buble'],
    ['-D', 'rollup-plugin-terser'],
    ['-D', 'rollup-plugin-koa-devserver'],
    ['-D', '@qutejs/rollup-plugin-qute'],
    // test deps
    ['-D', 'mocha'],
    ['-D', 'source-map-support'],
    //['-D', '@qutejs/test-utils']
    // runtime deps
    ['-P', '@qutejs/window'],
    ['-P', '@qutejs/runtime']
];

const SERVER_DEPS = [
    ['-D', 'supertest'],
    ['-D', 'supertest'],
    // additional runtime deps on client side
    // TODO create a @qutejs/app project and reference it
    ['-P', '@qutejs/form'],
    ['-P', '@qutejs/router'],
    // runtime deps on server side
    ['-P', 'koa-webapp']
];

export default function getDependencies(type) {
    if (type === 'sap') {
        return CLIENT_DEPS.concat(SERVER_DEPS);
    } else {
        return CLIENT_DEPS;
    }
}
