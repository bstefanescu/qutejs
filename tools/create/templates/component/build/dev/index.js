/*
 * This file is only used to build the application in dev mode by replacing @qutejs/runtime to its dev mode version.
 */
import Qute from '@qutejs/dev'; // this is importing the dev version of Qute
import Component from '../../src/index.jsq';

new Component().mount('app');

export default Qute;
