# Qute Projects

The simplest method to create a new Qute application or component is to use the **Qute project generator**. You can also create from scratch a JavaScript project using your bundler of choice (like [rollup](https://rollupjs.org), [webpack](https://https://webpack.js.org/) etc.) and correctly configure the bundler to transpile `.jsq` files and resolve `.css` imports.

## Qute Project Generator

The **Qute project generator** initialize a **Qute Project**, generating the project structure and all the configuration files needed by the build process.

The Qute project generator is using **[rollup](https://rollupjs.org/guide/en/)** as the bundler, **[mocha](https://mochajs.org/)** as the test framework and **[babel](https://babeljs.io/)** for transpiling ES6 syntax.

## Creating a Qute Project

Before starting you need to have **[Node.js](https://nodejs.org/en/)** installed on your computer.

To create a **Qute Project**, type the following in a terminal:

```
npm init @qutejs
```

or if your **node version** is older than **10.3.0**, you must run the `npx` command:

```
npx @qutejs/create
```

It will ask you a bunch of questions, and then generate a directory with a `package.json` file and all the other files needed to build and test your product.

It will also ask you the project type. There are 2 project types:

1. **Application Project** - this one is suitable to create a JavaScript application
2. **Component Project** - this one is suitable to create a reusable Qute component.

The generated `package.json` is defining all the commands you need:

1. `npm run build` to build the project.
2. `npm test` to run tests.
3. `npm start` to start a local server for development. When starting the dev. server a development build is created in **`build/dev/{project-name}-dev.js`**.

Both of the project types have the following file structure:

```
.qute/
	build/
	rollup.config.js
	index.html
.vscode/
    build.js
    server.js
    extensions.json
    launch.json
    tasks.json
dist/
src/
	index.js
	...
test/
	some-test.js
	...
package.json
```

* The **`.vscode`** directory contains configuration for the `Visual Studio Code` editor. It provides a `development server task`,  a `development build task`, a `production build task`, `debugging support in Chrome` (you can modify the `launch.json` file to launch any vscode supported browser).  \
__Note__ that for the full support of `Qute` components (including `.jsq` files syntax, component preview etc.) you need to install the  **[vscode-qutejs](https://marketplace.visualstudio.com/items?itemName=quandora.vscode-qutejs)** extension.

* The **`src`** directory contains the project sources (usually `.js` and `.jsq` files). The build expect to find a `index.js` which will be the entry point to your application or component.
* The **`test`** directory contains  test sources (usually `.js` and `.jsq` files). Test files should be suffixed by `.test.js` or `.test.jsq`.
* The **`.qute`** directory contains the build configuration (i.e. `rollup.config.js`), the files used by the development server (i.e. `index.html` and `build/index.js`) and the generated test bundle (generated when testing: `.qute/build/test-bundle.js`.
* The **`dist`** directory will contain the bundles created by the build (e.g. my-app.js and my-app.min.js, etc.).

## Application Project

This type of project will build your code as a web application. The resulting web bundles will include the **Qute Runtime** too, so you don't need to separately load the runtime script in your HTML application file.

Two web bundles are generated: a regular and a minified one ready to be used in **production**.

An application is responsible of mounting the root component (aka the Application component). The application is not exporting anything to the window object.


## Component Project

This type of project will build your code as a reusable component. You can reuse the component in other projects through a javascript import:

```jsq-norun
import MyComponent from 'my-component';

<q:template name='SomeComponentTemplate'>
	<MyComponent>some content</MyComponent>
</q:template>
```

The component files are generated into the **lib/** directories in two flavors: `cjs` module and `esm` module.

The web bundles are generated in the **dist/** directory and **doesn't include** the **Qute Runtime**. If you want to directly use the component in a web page you must include the **Qute Runtime** library prior to the component bundle.

Two web bundles are generated: a regular and a minified bundle ready to be used in production.
