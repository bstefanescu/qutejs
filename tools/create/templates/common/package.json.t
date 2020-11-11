{
  "name": "%%name%%",
  "version": "%%version%%",
  "description": "%%description%%",
  "main": "lib/index.cjs.js",
  "module": "lib/index.esm.js",
  "browser": "lib/%%name%%.js",
  "unpkg": "lib/%%name%%.min.js",
  "files": [
    "lib"
  ],
  "scripts": {
    "start": "npx rollup -c .qute/rollup.config.js -w --environment NODE_ENV:development",
    "build": "npx rollup -c .qute/rollup.config.js",
    "prepublishOnly": "npm test",
    "pretest": "npx rollup -c .qute/rollup.config.js --environment NODE_ENV:test",
    "test": "npx mocha --require source-map-support/register .qute/build/test-bundle.js"
  },
  "author": "%%author%%",
  "license": "%%license%%"
}

