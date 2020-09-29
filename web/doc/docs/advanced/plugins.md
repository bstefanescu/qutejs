# Writing Plugins and Components

To write Qute plugins or components you should create a **Qute project** of type `component`.

Usually, the main entry (e.g. index.js file) of a component is returning the component type. You can also need to write plugins which are not necesarly providing components, but some usefull API to be used by other components. In this case the main entry shold return the Object providing the API.

The web entry (the index file used to build the web bundle for the component) will export the same component type which will be injected in the browser `window` instance. Additionally you may want to provide support for the **Qute Playground** by setting the component type to the `window.__QUTE_IMPORT__` global variable. This will allow the playground to import your component file, and also you can use the **[LazyImport](#/plugins/importer)** function without specifying the component type name.


### Example

Let's say we are creating an utility plugin named `my-tools` which is providing a set of utility functions to other Qute components.

The `index.js` file used as the entry point when importing 'MyTools' in another component using import:

```jsq-norun
import Qute from '@qutejs/runtime';

const MyTools = {
	sayHello() {
		alert('Hello')
	}
}

// export the utility methods
export default MyTools;
```

The `index-web.js` file used as the entry to build the web bundle of the plugin:

```jsq-norun
import MyTools from './index.js';

// add support for playground and anonymous LazyImport calls.
window.__QUTE_IMPORT__ = MyTools;

export default MyTools;
```

Now you can import your plugin in a playground script using:

```javascript
import MyTools from 'my-tools-package';
```

or use the LazyImport without specifying an export name:

```javascript
const MyTools = LazyComponent('my-tools-package');
```

Without using the line

```javascript
window.__QUTE_IMPORT__ = MyTools;
```

you will not be able to import the plugin in a playground script and when using the `LazyComponent` you must specify the export name:

```javascript
const MyTools = LazyComponent('my-tools-package', 'MyTools');
```

