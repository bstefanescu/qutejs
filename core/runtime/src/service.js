import {ERR} from '@qutejs/commons';

export default function Service(app) {
    if (!app) ERR('Invalid service constructor: you must pass to the Qute.Service super class an "app" argument');
    this.app = app;
}
Service.prototype = {
    __QUTE_SVC__: true
}


