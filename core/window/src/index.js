/**
 * This is a simple wrapper arround window to recreate a browser environments for tests.
 * When building web apps you must declare the window as external (it will be injected from the browsr)
 * to a void including this library in your web bundle
 * Usage: import window from '@qutejs/window';
 */
import Window from 'window';
const window = new Window();
export default window;
