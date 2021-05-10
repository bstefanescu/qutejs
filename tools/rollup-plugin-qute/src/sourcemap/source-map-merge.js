import binarySearch from 'binary-search';
import sourceMap from 'source-map';
const { SourceMapConsumer, SourceMapGenerator } = sourceMap;

export function printMappings(map, rtl) {
    let c = new SourceMapConsumer(map);
    c.eachMapping(item => {
        const origKey = item.originalLine + ':' + item.originalColumn;
        const genKey = item.generatedLine + ':' + item.generatedColumn;
        console.log(rtl ? genKey + ' <- ' + origKey : origKey + ' -> ' + genKey);
    });
}

export function stringifyMappings(map, rtl) {
    let r = [];
    let c = new SourceMapConsumer(map);
    let arrow = rtl ? ' <- ' : ' -> ';
    c.eachMapping(item => {
        const origKey = item.originalLine + ':' + item.originalColumn;
        const genKey = item.generatedLine + ':' + item.generatedColumn;
        r.push(rtl ? genKey + ' <- ' + origKey : origKey + ' -> ' + genKey);
    });
    return r.join('\n');
}

const _comparePositions = (x, y) => {
    if (x.line === y.line) {
        return x.col - y.col;
    } else {
        return x.line - y.line;
    }
};

/**
 * A sorted array of positions to be used to find matching positions
 */
class Positions {
    constructor() {
        this.ar = [];
    }
    add(line, col, item) {
        this.ar.push({
            line: line,
            col: col,
            item: item
        });
    }

    sort() {
        this.ar.sort(_comparePositions);
        return this;
    }

    /**
     * Get the index for an exact match (line,col) or a negative value if not found (see binary-search for the negative value)
     * @param {*} line
     * @param {*} col
     */
    indexOf(line, col) {
        return binarySearch(this.ar, {line: line, col: col}, _comparePositions);
    }

    /**
     * Get an exact match given a line and a column or null if not found
     * @param {*} line
     * @param {*} col
     */
    get(line, col) {
        const index = this.indexOf(line, col);
        return index > -1 ? this.ar[index] : null;
    }

    /**
     * Find a match or the previous position given a line and a column.
     * If not an exact match is found it returns the position just before.
     * Ex: For a sequence of positions in the first map: { 8.0 <- 7.0, 9.0 <- 8.0 } and a mapping
     * 20:0 <- 8:16 in the second map, `find(8, 16)` will return the 8.0 <- 7.0 entry (the entry which is just before the inexisting match)
     * If no position is found before null is returned.
     * @param {*} line
     * @param {*} col
     */
    find(line, col) {
        const index = this.indexOf(line, col);
        if (index < 0) { // not found
            const prevIndex = -(index + 1) - 1; // the index before the item would be inserted.
            if (prevIndex > -1) {
                return this.ar[prevIndex].item;
            } else {
                return null;
            }
        } else {
            return this.ar[index].item;
        }
    }

}

Positions.fromOriginalPositions = (consumer) => {
    const positions = new Positions();
    consumer.eachMapping(item => {
        positions.add(item.originalLine, item.originalColumn, item);
    }, null, SourceMapConsumer.ORIGINAL_ORDER);
    return positions;
}
Positions.fromGeneratedPositions = (consumer) => {
    const positions = new Positions();
    consumer.eachMapping(item => {
        positions.add(item.generatedLine, item.generatedColumn, item);
    }, null, SourceMapConsumer.GENERATED_ORDER);
    return positions;
}

// we only compare lines not columns
function _removeUnorderedMappings(mappings) {
    if (mappings.length < 2) return mappings;
    const out = [];
    let prev = {original:{line:1,column:0}};
    for (let i=0,l=mappings.length; i<l; i++) {
        let item = mappings[i];
        if (item.original.line >= prev.original.line) {
            out.push(item);
            prev = item;
        }
    }
    return out;
}

/**
 * Step 1.
 * Iterate over the second map to connect original positions to generated positions in the first map
 * in order to rewrite using first map original positions.
 * Positions not matching any generated position in the previous map are added as is.
 * Step 2.
 * Remaining positions in the first map that was not included in a rewrite in step1
 * should be added in the merged mapping too. To do this, we are applying the same logic as in step 1
 * by iterating over the remained mappings in the first map and compute matches with the generated
 * mappings in step 1 to rewrite these mappings if needed
 * Step 3.
 * Sort generated mappigns by generated positions and remove the entries for which the original position is
 * not ordered in ascending order. Usually such an entry may be a side effect of multiple merges.
 * The last will not work if code order is not preserved by transofrmations
 *
 * @param {*} source
 * @param {*} c0
 * @param {*} c1
 */
function __mergeMappings(source, c0, c1, preserveUnorderedOriginals) {
    if (!source) {
        throw new Error('mapping source cannot be empty');
    }

    const gen = new SourceMapGenerator({
        file: source
    });

    // generated mappings for the merged map
    const mergedMappings = new Map();
    // generated positions in second map
    const positions = new Positions();
    // the map to store remaining positions from first map after step 1 was run
    const prevPositionsMap = new Map();
    // generated positions in first map
    const prevPositions = new Positions();


    // compute prevPositions and prevPositionsMap
    c0.eachMapping(item => {
        prevPositions.add(item.generatedLine, item.generatedColumn, item);
        prevPositionsMap.set(item.generatedLine+':'+item.generatedColumn, item);
        //console.log('++++++++9:17', item.generatedLine+':'+item.generatedColumn, '<-', item.originalLine+':'+item.originalColumn);
    }, null, SourceMapConsumer.GENERATED_ORDER);

    // don't need to sort - should be already sorted since we used SourceMapConsumer.GENERATED_ORDER
    //prevPositions.sort();

    c1.eachMapping(item => {
        let origLine = item.originalLine;
        let origCol = item.originalColumn;
        let prev = prevPositions.find(origLine, origCol);
        if (prev) {
            if (origLine === prev.generatedLine && origCol === prev.generatedColumn) {
                // exact match - rewrite the mapping with original positions from previous map
                origLine = prev.originalLine;
                origCol = prev.originalColumn;
                // mark previous mapping as remapped
                prevPositionsMap.delete(prev.generatedLine+':'+prev.generatedColumn);
            } else if (origLine === prev.generatedLine) {
                // same line but different column - adjust the column
                const delta = origCol - prev.generatedColumn;
                origLine = prev.originalLine;
                origCol = prev.originalColumn+delta;
                // mark previous mapping as remapped
                prevPositionsMap.delete(prev.generatedLine+':'+prev.generatedColumn);
            } // else preserve the mapping as is
        } // else no match found - preserve the mapping from second map

        let genMapping = {
            source: source,
            original: {
                line: origLine, column: origCol
            },
            generated: {
                line: item.generatedLine, column: item.generatedColumn
            },
            name: item.name || void(0)
        };
        // add the merged mapping
        let key = genMapping.generated.line+':'+genMapping.generated.column;
        mergedMappings.set(key, genMapping);
        //console.log('IT1. added', key, '<-', genMapping.original.line+':'+genMapping.original.column)
        // updated merged map positions
        positions.add(item.originalLine, item.originalColumn, item);
    }, null, SourceMapConsumer.ORIGINAL_ORDER);

    // we need to sort since we use a binary search
    // positions.sort(); //  it should be sorted in the orginal position order

    // iterate over the remaining mappings in the previous map
    prevPositionsMap.forEach((item) => {
        let genLine = item.generatedLine;
        let genCol = item.generatedColumn;
        let skip = false;
        let next = positions.find(genLine, genCol);
        if (next) { // add it as is
            if (next.originalLine === genLine && next.originalColumn === genCol) {
                // should never happens since we already added matching positions
                console.warn('Should never happens', item , next);
                genLine = next.generatedLine;
                genCol = next.generatedColumn;
            } else if (next.originalLine === genLine) {
                // different col
                let delta = genCol - next.generatedColumn;
                genLine = next.generatedLine;
                genCol = next.generatedColumn + delta;
            } else { // ignore it
                // not matching any line from second map (should be a deleted line)
                skip = true;
            }
        } else {
            // nothing before add it as is?
        }

        //console.log("IT2. processing: ", genLine+':'+genCol, '<-', item.originalLine+':'+item.originalColumn);

        if (!skip) {
            let key = genLine+':'+genCol;
            if (!mergedMappings.has(key)) {
                mergedMappings.set(key, {
                    source: source,
                    original: {
                        line: item.originalLine, column: item.originalColumn
                    },
                    generated: {
                        line: genLine, column: genCol
                    },
                    name: item.name || void(0)
                })
                //console.log('    IT2. added', genLine+':'+genCol, '<-', item.originalLine+':'+item.originalColumn);
            } else {
                console.warn('! mapping already exists', item);
            }
        } else { // skip
            //console.log('    IT2. skipped', genLine+':'+genCol, '<-', item.originalLine+':'+item.originalColumn);
        }
    });

    // sort generated mappings
    let mappings = Array.from(mergedMappings.values());
    mappings.sort((x,y) => {
        let delta = x.generated.line - y.generated.line;
            return delta ? delta : x.generated.column - y.generated.column;
    });
    // remove entries for which the original position is not sorted in asc. order
    if (!preserveUnorderedOriginals) {
        mappings = _removeUnorderedMappings(mappings);
    }

    // generate the merged mapping
    mappings.forEach(value => {
        gen.addMapping(value);
    });

    return gen;
}

export function mergeMappingsAsString(map1, map2, preserveUnorderedOriginals) {
    return _mergeMappings(map1, map2, preserveUnorderedOriginals).toString();
}
export function mergeMappings(map1, map2, preserveUnorderedOriginals) {
    return JSON.parse(mergeMappingsAsString(map1, map2, preserveUnorderedOriginals));
}
export function _mergeMappings(map1, map2, preserveUnorderedOriginals) {
    return __mergeMappings(map2.file,
        new SourceMapConsumer(map1),
        new SourceMapConsumer(map2),
        preserveUnorderedOriginals);
}

export function merge() {
    const maps = Array.from(arguments).flat();
    let map = maps[0];
    for (let i=1,l=maps.length; i<l; i++) {
        map = mergeMappings(map, maps[i]);
    }
    return map;
}
