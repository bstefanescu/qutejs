import Promise from 'promise-polyfill';
import window from '@qutejs/window';

if (!window.Promise) {
  window.Promise = Promise;
} else if (!window.Promise.prototype['finally']) {
  window.Promise.prototype['finally'] = Promise.prototype['finally'];
}
