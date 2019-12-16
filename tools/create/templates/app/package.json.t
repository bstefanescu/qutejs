{
  "name": "%%name%%",
  "version": "%%version%%",
  "description": "%%description%%",
  "scripts": {
    "start": "npx rollup -c build/rollup.config.js -w --environment NODE_ENV:development",
    "build": "npx rollup -c build/rollup.config.js",
    "prepublishOnly": "npm run build && npm test",
    "test": "npx mocha --recursive -r build/test/setup.js \"test/*.test.+(js|jsq)\""
  },
  "author": "%%author%%",
  "license": "%%license%%"
}
