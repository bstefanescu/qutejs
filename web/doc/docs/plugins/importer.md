# Qute Importer Plugin (@qutejs/importer)

This plugin provides support for lazy components and several functions to dynamically load remote scripts in a web page.

## Lazy Components

**Lazy Components** are Qute components that can be referenced in templates without being included in the application. The component code will be downloaded only when the component is rendered.

Using lazy components you can create smaller applications by packaging only the main features inside the application. All optional features can be used through lazy components to be loaded only when needed.

To define a lazy component you need to use the `LazyComponent(pathOrUrl[, exportName])` function. This will create a reference to the remote component that you can use in templates.

**Example:**

```jsq
import Qute from '@qutejs/runtime';
import { LazyComponent } from '@qutejs/importer';

// define a lazy component
const MyLazyComponent = LazyComponent('/doc/files/lazy-component.js');

// use the component in a template
<q:template name='MyTemplate'>
    <div>
        <if value={showLazyComponent}>
            <my-lazy-component color='green'/>
        <else />
            <button q:onclick={e => this.showLazyComponent = true}>Show Lazy Component</button>
        </if>
    </div>
</q:template>

export default Qute(MyTemplate).properties({
    showLazyComponent: false
})
```

Here is the the [lazy component code](/doc/files/lazy-component.js) used int the example above.

To be able to import components without specifying an export name, yout must expose your component instance in the `window.__QUTE_IMPORT__` property. Otherwise you must specify the export name as the second argument:

```javascript
const MyLazyComponent = LazyComponent('/doc/files/lazy-component.js', 'LazyComponent');
```

## Importer API

The importer package exports the following functions:

### `LazyComponent(pathOrUrl[, exportName])`

Create a lazy component given a location for the component file to load when needed.

* **pathOrUrl** the location of the component file. Can be an URL, a relative or absolute path which will be resolved relative to the document page URL (i.e. `window.location`). Absolute paths must start with a `/` and relative paths with a `../'`or `./`.  \
You can also use the package name of the component. In this case the component file will be located on https://unpkg.com.
You can register a custom URL resolver using `setImporterOptions` function.
* **exportName** this parameter is **optional** and represent the name of the global variable where the component object is injected in the current `window` object. If the component is injected in `window.__QUTE_IMPORT__` then the parameter can be ommited, otherwise it **must** be defined.

### `setImporterOptions(opts)`

Can be used to configure the importer. The **opts** argument is an object that may contains the following properties:

* `resolve` -  a custom URL resolver function. The resolver signature is: `String resolve(String pathOrUrl)` and must return an URL from where to load the component.
* `renderError` - a custom function to render a LazyComponent when the component fails to load. By default nothing is rendered and an error is thrown. The function siganture is `Element renderError(renderingContext, error)`.
* `renderPending` - a custom function to render a **loading element** (e.g. a spinner) while the lazy component is loading. By default no loading element is shown. The function siganture is `Element renderPending(renderingContext)`

### `importScript(location, exportName, onLoad, onError)`

Load a script from the given **location** URL, which will be injected into **window[exportName]** property. If the component is successfully loaded the **onLoad** callback will be called otherwise the **onError** callback will be called.

* **location** - the location from where to load the component. The location will be resolved to a URL as explained above.
* **exportName** - the global variable (i.e. window property) where the component will be injected. If `__QUTE_IMPORT__` is used you should use a `null` value.
* **onLoad** - a callback to be called when the component was loaded: `void onLoad(component)`
* **onError** - a callback to be called if the component failed to load: `void onError(error)`

### `serialImport(importLocations, onload, onerror)`

Import multiple scripts (e.g. components) in order. Scripts are loaded in serial - one at a time.

* **importLocations** - an array of locations from where to import scripts. Locations are resolved to URLs.
* **onLoad** - a callback to be called when all the scriptrs where loaded. The function takes a single argument: an object that binds the given locations to the loaded scripts (i.e. exported object): `{location: exportObject}`
* **onError** - a callback to be called if a script failed to load. The function takes a single argument: the error.

### `importAll(importLocations, onload, onerror)`

Import multiple scripts (e.g. components) in parallel.

* **importLocations** - an array of locations from where to import scripts. Locations are resolved to URLs.
* **onLoad** - a callback to be called when all the scriptrs where loaded. The fucntion has the same signature as for the `serialImport` onLoad callback
* **onError** - a callback to be called if a script failed to load. The function takes a single argument: an array of errors.
