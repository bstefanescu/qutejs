# Modularity and Lazy Loading

When implementing complex applications you always arrive at a point when you ask yourself:
What the hell is that?

We always start with an awesome application, small and clean, and finally, we often end up with a fat and ugly one.

Qute, will not save you from this. You are the brain, so you decide on how to design your application!

But, Qute is giving you the tools you need to successfully create complex applications.

## Changing Component Implementations

Let's say you are building an application using [boostratp](https://getbootstrap.com/). So you use some Qute bootstrap wrapper components like a `bs-button`.

Tomorrow, you fall in love with [foundation](https://get.foundation/). And you want to replace all your bootstrap components with the foundation equivalent ones.

### How Qute helps you?

You can define component aliases. So instead of writing `<bs-button>Click Me</bs-button>`, you can write `<my-button>Click Me</my-button>` and define an alias:

```
Qute.addAliases({
	'my-button': 'bs-button'
});
```

When you want to move to Zurb Foundation you just redefine the corresponding aliases like:

```
Qute.addAliases({
	'my-button': 'zf-button'
});
```

You can add aliases before mounting the root component.

**Keep in mind** that there isn't any official support for `bootstrap` or `zurb foundation`. These names were cited as an example.

## Minify Applications

A complex application can become very big, especially when you use optional big components like editors, charts etc.

Let's say you are building an application who's primarily goal is to browse some data. Some users may be able to edit the data, some others to see reports etc. All these additional components like editing or viewing reports are usually big components, increasing your application size with hundreds of kilobytes.

### How Qute helps you?

You can use lazy loaded components. Instead of packaging all the optional components insie your main application code, you can, load these optional components at demand.

To achieve this you simply need to specify where a component is available. You can bind components either by URLs, either by its **npm package** name. In the later case the component will be downloaded from `https://unpkg.com`. To define a remote component use the `Qute.addImports` method:

```
Qute.addImports({
	'my-component': '@qutejs/my-component',
	'my-private-component': 'https://myserver.com/my-private-component.js'
});
```
When Qute will render a `<my-component/>` tag it will download the component definition from the remote location and then render it on the page.

