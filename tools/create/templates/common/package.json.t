{
  "name": "%%name%%",
  "version": "%%version%%",
  "description": "%%description%%",
  "main": "dist/index.cjs.js",
  "module": "dist/index.esm.js",
  "browser": "dist/%%name%%.js",
  "unpkg": "dist/%%name%%.min.js",
  "files": [
    "dist"
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

