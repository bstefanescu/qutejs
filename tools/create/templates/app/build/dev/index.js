/*
 * This file is only used to build the application in dev mode by replacing @qute/runtime to its dev mode version.
 */
import Qute from '@qutejs/dev'; // this is importing the dev version of Qute
import '../../src/index.js';
export default Qute;
