import window from '@qutejs/window';

/**
 * Can be used to test pseudo class support like ::-moz-range-progress
 * @param {*} selector
 */
function _isSelectorSupported(selector) {
    const testEl = window.document.createElement('DIV');
    try {
        testEl.matches(selector);
        return true;
    } catch (e) {
        return false;
    }
}
export default function isSelectorSupported(selector) {
    if ('__qute_cache' in isSelectorSupported) {
        return isSelectorSupported.__qute_cache;
    } else {
        return (isSelectorSupported.__qute_cache = _isSelectorSupported(selector));
    }
}
