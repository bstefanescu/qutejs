const DevServer = require('koa-devserver');

const opts = {
    name: 'QuteJs DevServer',
    root: '.',
    host: '127.0.0.1',
    port: 8090,
    livereload: {
        watch: 'build/dev'
    }
}

const server = new DevServer(opts);
server.start();

['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, () => {
        server.stop();
        process.exit();
    })
});
