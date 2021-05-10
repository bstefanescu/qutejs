{
  "name": "%%name%%",
  "version": "%%version%%",
  "description": "%%description%%",
  "type": "module",
  "main": "dist/esm/index.js",
  "module": "dist/esm/index.js",
  "exports": {
    ".": "dist/esm/index.js",
    "./themes/*.css": "./themes/*.css",
    "./package.json": "./package.json"
  },
  "browser": "dist/%%name%%-%%version%%.js",
  "unpkg": "dist/%%name%%-%%version%%.min.js",
  "files": [
    "dist",
    "themes"
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
