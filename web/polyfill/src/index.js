/**
 * The polyfills required by Qute to run on IE >= 9:
 * - String.prototype.startsWith - no IE support
 * - Element.prototype.matches   - no IE support (IE is using msMatchesSelector)
 * - Element.prototype.closest   - no IE support
 * - Object.assign               - no IE support
 * - CustomEvent                 - broken IE support
 */

//classList is partially supported on ie10
import './class-list.js';
// No IE support
import './object-assign.js';
// For IE >=9 - required by compiler.js
import './starts-with.js';
// custom event (No IE support)
import './custom-event.js';
// Element closest and matches For IE>=9 (impl in edge 15)
import './element-closest.js';
// used by popup, modal etc. (impl in IE10, on older firefox requires a vendor prefix)
import './requestAnimationFrame.js';
// Promise: optional polyfill. Not required by the Qute runtime, but nice to have.
// (it is required by qute-dev.js and qute-i18n.js)
import './promise.js';
// document.currentScript polyfill used to dynamically omport components (see Qute.import and @qutejs/importer)
import 'current-script-polyfill';