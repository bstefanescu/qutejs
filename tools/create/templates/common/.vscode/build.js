/**
 * Build a dev version to be used inside a debugger laiunch configuration
 */

const loadConfigFile = require('rollup/dist/loadConfigFile');
const path = require('path');
const fs = require('fs');
const rollup = require('rollup');

// load the config file next to the current script;
// the provided config object has the same effect as passing "--format es"
// on the command line and will override the format of all outputs
process.env.NODE_ENV = 'development';
process.env.DEV_SERVER_PORT = '0'; // disable dev server
loadConfigFile(path.resolve(__dirname, '../.qute/rollup.config.js'), {}).then(
    async ({options, warnings}) => {
        // "warnings" wraps the default `onwarn` handler passed by the CLI.
        // This prints all warnings up to this point:
        if (warnings.count) {
            console.log(`We currently have ${warnings.count} warnings`);
        }
        // This prints all deferred warnings
        warnings.flush();
        if (Array.isArray(options)) options = options[0];

        // options is an "inputOptions" object with an additional "output"
        // property that contains an array of "outputOptions".
        // The following will generate all outputs and write them to disk the same
        // way the CLI does it:
        try {
            const bundle = await rollup.rollup(options);
            await Promise.all(options.output.map(bundle.write));
        } catch(e) {
            console.error(e);
            writeErrorScript(options.output[0].file, e);
        }
    }
);

function writeErrorScript(file, error) {
    file = path.resolve(__dirname, '../', file)
    var msg = JSON.stringify(error.stack.replace(/<|>/g, function(m) {
        return m === '<' ? '&lt;' : '&gt;';
    }));
    fs.writeFileSync(file, `
        var msg = ${msg};
        var div = document.createElement("DIV");
        div.innerHTML = "<h3>Build Error</h3><pre>"+msg+"</pre>";
        document.body.appendChild(div);
    `);
}
