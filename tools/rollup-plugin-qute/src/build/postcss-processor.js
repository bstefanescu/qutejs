import os from 'os';
import postcss from 'postcss';

// normalzie windows paths to posix paths
function normalizePath(path) {
    return path && path.replace(/\\+/g, '/');
}

/**
 *
 * @param {*} ctx - the rollup build context
 * @param {*} plugins - the postcss plugins
 * @param {*} opts - the postcss options
 */
export default function Processor(ctx, plugins, opts) {
    this.ctx = ctx;
    this.plugins = plugins;
    this.opts = opts;
}
Processor.prototype = {
    async processFiles(files) {
        return this.process(Array.from(files).map(file => `@import "${file}";`).join(os.EOL));
    },
    async process(code) {
        const result = await postcss(this.plugins).process(code, this.opts);
        for (const message of result.messages) {
          if (message.type === 'dependency') {
            this.addDependency(message.file);
          }
        }
        for (const warning of result.warnings()) {
            if (!warning.message) {
              warning.message = warning.text;
            }
            this.warn(warning);
        }
        const outputMap = result.map && JSON.parse(result.map.toString());
        if (outputMap && outputMap.sources) {
            outputMap.sources = outputMap.sources.map(v => normalizePath(v));
        }
        return {
            code: result.css,
            map: outputMap
        };
    },
    addDependency(dep) {
        //TODO: Error: Cannot call addWatchFile after the build has finished.
        //this.ctx.addWatchFile(dep);
    },
    warn(warning) {
        this.ctx.warn(warning);
    }
}
