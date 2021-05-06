
const {tr1,tr2,tr3,tr,code} = require('./mappings.js');
const { printMappings, stringifyMappings, merge } = require('../src/sourcemap/source-map-merge.js');
const assert = require('assert');

describe('Merge sourcemap', function() {
    let mergedMap = merge(tr1.map, tr2.map, tr3.map);
	it('Merged sourcemap of three different tranforms is correct', function() {
        assert.strictEqual(stringifyMappings(mergedMap), stringifyMappings(tr.map));
	});
});