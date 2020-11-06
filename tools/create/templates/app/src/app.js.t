import Qute from '@qutejs/runtime';
import %%componentName%%Template from './app.jsq';

const {ViewModel, Template, Property} = Qute;

@Template(%%componentName%%Template)
class %%componentName%% extends ViewModel {
    @Property verb = "coding";
}

export default %%componentName%%;
