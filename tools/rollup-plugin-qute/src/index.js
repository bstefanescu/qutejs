import quteDecorators from './decorators.js';
import qute from './templates.js';
import webBuild from './build/quteWebBuild.js';
import nodeBuild from './build/quteNodeBuild.js';

//TODO we use templates plugin as the facade for backward compat - need to be fixed to use an plain object.
qute.templates = qute;
qute.decorators = quteDecorators;
qute.lib = nodeBuild;
qute.web = webBuild;

export default qute;
