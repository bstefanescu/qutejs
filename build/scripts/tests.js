/**
 * Build tests and run
 */


const fs = require('fs');
const path = require('path');

const rollup = require('rollup');
const Mocha = require('mocha');

const qute = require('@qutejs/rollup-plugin-qute');
const commonjs = require('@rollup/plugin-commonjs');
const nodeResolve = require('@rollup/plugin-node-resolve').nodeResolve;

async function buildTests(ws, project) {
    let format = project.type === 'module' ? 'esm' : 'cjs';
    format = 'cjs'; // force cjs for now since esm is failing
    /*
    let name = project.name.replace(/\//g, '-');
    if (name.startsWith('@')) {
        name = name.substring(1);
    }
    */
    const testBundle = path.join(project.root, 'dist', 'test-bundle.cjs');
    const inputOptions = {
        input: path.join(project.root, 'test/**/*.test.js?(q)'),
        plugins: [
            qute({test:true}),
            nodeResolve( {preferBuiltins: true} ),
            commonjs({
                include: ['**/node_modules/**', 'node_modules/**']
            })
        ]
    }
    const outputOptions = {
        file: testBundle,
        format: format,
        sourcemap: true,
        intro: `process.env.QUTEJS_TEST_SNAPSHOTS_DIR="${path.join(project.root, "test", "snapshots")}";\n`
    };
    // create a bundle
    const bundle = await rollup.rollup(inputOptions);
    if (bundle.watchFiles.length > 1) {
        // write the bundle
        await bundle.write(outputOptions);
        // closes the bundle
        await bundle.close();
        return testBundle;
    } else {
        return null;
    }
}

function runMocha(file) {
    return new Promise((resolve, reject) => {
        const mocha = new Mocha();
        mocha.addFile(file);
        mocha.run(function (failures) {
            if (failures === 0) {
                resolve(failures);
            } else {
                reject(failures);
            }
        });
    });
}

async function runTests(ws, project, args) {
    process.chdir(project.root);
    const testFile = await buildTests(ws, project);
    if (testFile) {
        console.log(`Running tests in project ${project.name}`);
        const r = await runMocha(testFile);
        if (r !== 0) {
            process.exit(r);
        }
    } else {
        console.log(`Skiping project ${project.name} - No tests found`);
    }
    process.chdir(ws.root);
}

module.exports = async function(ws, project, args) {
    await runTests(ws, project, args);
}