# Writing Plugins and Components

To write Qute plugins or components you should create a **Qute project** of type `component`.

Usually, the main entry (e.g. index.js file) of a component is returning the component type. You can also need to write plugins which are not necesarly providsing components, but some usefull API to be used by other components. In this case the main entry shold return the Object providing the API.

The web entry (the index file used to build the web bundle for the component) should not export anything since the component (or plugin) is meant to be used inside Qute, and not injected as a window variable.  \
In the case of components, this is straightforward since a component declaration like `Qute('component-name', { ... });` is registering the component type in the running Qute instance, so the component will be visible from other components - either indirectly through references in templates, either trough the `Qute.vm('component-name')` API method.  \
In the case of plugins (which are not providing components) you need to inject yourself the plugin API inside the current instance of Qute, so that others can use your plugin.

As an example you can look at the [i18n plugin](#/plugins/i18n) sources.

**The convention** is to add a property to the Qute instance which is named using the [pascal case](https://en.wikipedia.org/wiki/Camel_case) of the plugin package name.

### Example

Let's say we are creating an utility plugin named `my-tools` which is providing a set of utility functions to other Qute components. In the index.js file you need to define a proeprty on the running Qute instance to provide your utility fucntions. This field should be named `MyTools`. Example:

```jsq-norun
import Qute from '@qutejs/runtime';

const MyTools = {
	sayHello() {
		alert('Hello')
	}
}

// inject your utility methods in a Qute property using the pascal case of the package name.
Qute.MyTools = MyTools;

// export the utility methods
export default MyTools;
```

The `Qute.MyTools = MyTools;` line is needed, since your plugin may be loaded directly from the web page (and not included using an `import` in the application using it). So the only method to provide the plugin API is through the `Qute` instance.

For convenience, you should also epxort your plugin API using `export default`. This way, users that wants to import your plugin directly in an application file using the `import` keyword can easily access the exported API.

In some cases your plugin may provide both a component and an public API through the Qute instance. In that case you should export the component and inject the API in the Qute instance (you can look at popup and modal components as an example).




