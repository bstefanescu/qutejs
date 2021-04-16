export default function toExternalFn(externalOpt) {
    let fn;
    if (externalOpt) {
        if (Array.isArray(externalOpt)) {
            const externalSet = new Set(externalOpt);
            fn = function(id) {
                return externalSet.has(id);
            }
        } else if (typeof externalOpt === 'function') {
            fn = externalOpt;
        }
    }
    return fn || function() { return false; };
}
