require('@qutejs/register');
require('@babel/register')({
        extensions: [ ".js", ".jsq" ],
        presets: [
                ["@babel/preset-env", {"targets": { node: true }}]
        ],
        // we only need to transform import / export statements?
        //plugins: [ "@babel/plugin-transform-modules-commonjs" ]
});
require('source-map-support/register');
