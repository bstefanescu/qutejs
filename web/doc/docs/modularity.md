# Building Large Applications

When implementing complex applications, you usually start with an awesome prototype, small and clean, and finally you end up with a fat application which is difficult to maintain.

Qute provides some mechanisms to help developing smaller applications and easily replaceable components.

## Changing Component Implementations

Let's say you are building an application using [boostratp](https://getbootstrap.com/). So you use some Qute bootstrap wrapper components like a `bs-button`.

Later, you decide to switch to [foundation](https://get.foundation/). And you want to replace all your bootstrap components with the foundation equivalent ones.

To achieve this you can use component aliases. So instead of writing `<bs-button>Click Me</bs-button>`, you can write `<my-button>Click Me</my-button>` and define an alias:

```
Qute.addAliases({
	'my-button': 'bs-button'
});
```

When you want to move to Zurb Foundation you just redefine the corresponding aliases like this:

```
Qute.addAliases({
	'my-button': 'zf-button'
});
```

You must define aliases before mounting the root component.

**Keep in mind** that there isn't any official support for `bootstrap` or `zurb foundation`. These names were cited as an example.

## Lazy Loading Components

A complex application can become very large, especially when you use optional components like editors, charts etc.

Let's say you are building an application who's primarily goal is to browse some data. Some users may be able to edit the data, some others to see reports etc. All these additional components like editing or viewing reports are usually large components, increasing your application size with hundreds of kilobytes.

To keep your application small, Qute let's you dynamically load components from remote locations, only when needed.

Thus, instead of packaging all the optional components insie your main application code, you can load these optional components on demand.

To specify a remote component location you can either use an URL to the component javascript, either use the **npm package** name containing the component in which case the component will be downloaded https://unpkg.com. TO create the binding between the component name and its location you need to use the `Qute.addImports` method:

```
Qute.addImports({
	'my-component': '@qutejs/my-component',
	'my-private-component': 'https://myserver.com/my-private-component.js'
});
```

When Qute will render a `<my-component/>` tag it will download the component definition from the remote location and then render it on the page.

You can also use the dynamic `import` feature of Qute to conditionaly load javascript dependencies (as for example polyfills):

```javascript
function loadApp() {
	new MyApp().mount();
}
function importError() {
	alert('Failed to load polyfill');
}
if (!window.Promise) {
	Qute.import('promise-polyfill', loadApp, importError);
}
```
