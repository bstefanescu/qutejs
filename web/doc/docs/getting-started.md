# Getting Started

Qute is composed of two main layers:

1. **The presentation layer** - which includes the [templates](#/templates) and the [component model](#/components).
2. **The application layer** - which includes the [application data model](#/app/data) and [logic](#/app/instance).

When developing basic UI components you will mostly use the **presentation layer**. And you can completely ignore the **application layer**.  \
When developing more complex components or javascript applications you will need to focus more on the application layer (i.e. **business logic and data**), and less on individual components composing the presentation layer.

The **goal** of Qute is to let you **focus where you need to**. Qute model try to be as concise as possible in order to hide from you repetitive and glue code.  \
So that, you finally write less code and focus more on the business logic.

To quickly design and test Qute components you can use the **[Qute Playground](../playground/index.html)** or directly code components inlined in a web page.  \
Though, this method is not suitable for production projects.

A Qute component is made from javascript code, from some HTML based templates and possibly from some CSS fragments.  \
All these parts of a component are transpiled to javascript code and when you deploy a component for production, you deploy a minified javascript file that contains all the parts a component is made of.

### Example: Component declared in a .jsq file

```jsq
import Qute from '@qutejs/runtime';

// the component template
<q:template name='my-component'>
  <div q:class='{authenticated:user}'>
    <if value='!user'>
      Click <a href='#' @click='doLogin' class='common-link'>here</a> to login
    <else />
      Hello {{user.firstName}}. <a href='#' @click='doLogout'>Logout</a>
    </if>
  </div>
</q:template>

// the component ViewModel definition
export default Qute('my-component', {
    init() {
        this.loginUrl = './login';
        // return the reactive model
        return {
            user: {
                firstName: 'John',
                lastName: 'Doe'
            }
        };
    },
    doLogin() {
        this.user = {firstName: 'John', lastName: 'Doe'};
    },
    doLogout() {
        this.user = null;
    }
});
```

All the parts of a component can be written in a same file which should use the **`.jsq`** extension. `JSQ` files are transpiled to Javascript by the Qute compiler.  \
It is also possible to keep the parts of a component in separate files, one for the javascript code (i.e. a `.js` file), another for the HTML templates (i.e. a `.jsq` file), and another one for the CSS fragments (i.e. a `.css` file). Then you import the `.jsq` and the `.css` file into the javascript file.

See the **[JSQ File Format](#/advanced/jsq)** section for more information on `JSQ` files.

### Example: Component declared in two files: a .js and a .jsq file.


1. The template file (e.g. `my-component.jsq`)

```jsq-norun
import Qute from '@qutejs/runtime';

// the component template
<q:template name='my-component'>
<div q:class='{authenticated:user}'>
  <if value='!user'>
    Click <a href='#' @click='doLogin' class='common-link'>here</a> to login
  <else />
    Hello {{user.firstName}}. <a href='#' @click='doLogout'>Logout</a>
  </if>
</div>
</q:template>
```

2. The ViewModel file (e.g. `my-component.js`):

```jsq-norun
import Qute from '@qutejs/runtime';
import './my-component.jsq';

// the component ViewModel definition
export default Qute('my-component', {
	init() {
		this.loginUrl = './login';
		return {
			user: {
				firstName: 'John', lastName: 'Doe'
			}
		};
	},
    doLogin() {
	    this.user = {firstName: 'John', lastName: 'Doe'};
    },
    doLogout() {
    	this.user = null;
    }
});
```

### Importing the Qute runtime

You can notice the `Qute` runtime was imported in both files, even in the `.jsq` template where `Qute` is not directly used. This is because the template will be transpiled to javascript code where the `Qute` variable is used, so it must be imported in the file.  \
More, in JSQ files you must always use `Qute` as the runtime name, otherwise a compilation failure will be thrown.

Here is an example of an **invalid Qute import** in a JSQ file: `import QuteRuntime from '@qutejs/runtime'`.

### Using Browser Globals

When developing web components you usually need to access browser globals like the `window` or `document`.
The correct way to declare the `window` global is to import it from the `@qutejs/window` module.

The `@qutejs/window` dependency is considered external by the build configuration, thus, the bundle will be correctly generated to use the browser window at runtime.

When testing, the `@qutejs/window` will resolve to the **[window](https://www.npmjs.com/package/window)** module, so you will be able to use **[jsdom](https://www.npmjs.com/package/jsdom)** window in your test code.

**Examples:**

1. Importing the window instance: `import window from '@qutejs/window'`
2. Importing the window and the document instances: `import window, {document} from '@qutejs/window'`

### Mounting a Component

Once you created a component you can either use it in the template of another component, either mount it (as a root component) in the DOM. Mounting the component will render the component tree on the page.  \
To use a component inside another component template just use an element having the same name as the component you want to use.

**Example:**

```jsq-norun
import Qute from '@qutejs/runtime';

// example of components used in other component template
<q:template name='my-title'>
  <h3><a name={$attrs.name}><slot/></a></h3>
</q:template>
<q:template name='my-content'>
  <div><slot/></div>
</q:template>

// the root component template
<q:template name='my-component'>
  <div>
    <my-title name='the-title'>The title</my-title>
    <my-content>The content</my-content>
  </div>
</q:template>

// the component ViewModel definition
var MyComponent = Qute('my-component');
// instantiate and mount the component in the document body
new MyComponent().mount();
```

## Component Namespace

To isolate user defined components and avoid name clashes with external components you can use a namespace. To define a component in a namespace just prefix the component name with the namespace prefix.  \
**Example:** `<q:template name='my:select'>` will define a component named `select` in the `my` namespace.
To use such components in templates you need to specify the qualified name (including the prefix).

All components which are not explicitly prefixed with a namespace, will be part of the default Qute namespace which is using the `q` prefix.  \
**Example:** `<q:template name='popup'>` is equivalent to `<q:template name='q:popup'>`.

Components inside the default namespace can be specified with both the qualified name or the local name (i.e. non prefixed name) when used in other templates.

Also note that **Qute built-in directives** are all part of the default namespace, so for example you can write either `<q:if value='expr'>`, either `<if value='expr'>` to use an if directive. Both forms are equivalent.

In the rest of the documentation we will use the local name (i.e. without prefix) for all Qute built-in directives.

Go to **[Templates](#/templates)** and **[Components](#/components)** sections to find out more about Qute Components.

## Qute Project Generator

In order to help you with the _build_ process, Qute is providing a **project generator** that initialize a **Qute Project**, generating the project structure and all the configuration files needed by the build process.

The Qute project generator is using **[rollup](https://rollupjs.org/guide/en/)** as the bundler, **[mocha](https://mochajs.org/)** as the test framework and **[babel](https://babeljs.io/)** for transpiling ES6 syntax, but you can easily create a boilerplate based on bundlers or test frameworks of your choice.

### Creating a Qute Project

Before starting you need to have **[Node.js](https://nodejs.org/en/)** installed on your computer.

To start a **Qute Project**, type the following in a terminal:

```
npm init @qutejs
```

or if your **node version** is older than **10.3.0**, you must run the `npx` command:

```
npx @qutejs/create
```

It will ask you a bunch of questions, and then generate a directory with a `package.json` file and all the other files needed to build and test your product.

It will also ask you the project type. There are 2 project types:

1. **Application Project** - this one is suitable to create a javascript application
2. **Component Project** - this one is suitable to create a reusable Qute component.

The generated `package.json` is defining all the commands you need:

1. `npm run build` to build the project.
2. `npm test` to run tests.
3. `npm start` to start a local server for development. When starting the dev. server a development build is created in **`build/dev/{project-name}-dev.js`**.

Both of the project types have the following file structure:

```
build/
	dev/
		index.html
		index.js
	test/
		setup.js
	rollup.config.js
dist/
lib/
src/
	index.js
	...
test/
	some.test.js
	...
package.json
```

* The **`src`** directory contains the project sources (usually `.js` and `.jsq` files). The build expect to find a `index.js` which will be the entry point to your application or component.
* The **`test`** directory contains  test sources (usually `.js` and `.jsq` files). Test files should be suffixed by `.test.js` or `.test.jsq`.
* The **`build`** directory contains the build configuration (i.e. `rollup.config.js`), the test runner setup (i.e. `test/setup.js`) and the content root used by the development server (i.e. the `dev` directory).
* The **`dist`** directory will contain the web bundles created by the build (e.g. my-app.js and my-app.min.js).
* The **`lib`** directory **only exists for component projects**. It will contain the `CJS` and `ESM` files generated by the build. These files are required to import your component in other components, and are referenced in the component `package.json`.

### Application Project

This type of project will build your code as a web application. The resulting web bundles will include the **Qute Runtime** too, so you don't need to separately load the runtime script in your HTML application file.

Two web bundles are generated: a regular and a minified one ready to be used in **production**.

### Component Project

This type of project will build your code as a reusable component. You can reuse the component in other projects through a javascript import:

```jsq-norun
import 'my-component';

<q:template name='my-other-component'>
	<my-component>some content</my-component>
</q:template>

...
```

The component files are generated into the **lib/** directories in two flavors: `cjs` module and `esm` module.

The web bundles are generated in the **dist/** directory and **doesn't include** the **Qute Runtime**. If you want to directly use the component in a web page you must include the **Qute Runtime** library prior to the component bundle.

Two web bundles are generated: a regular and a minified bundle ready to be used in production.

## Quickly Design Components

As mentioned you can use the **[Playground](../playground/index.html)** to quickly design your components, but also, you can directly write **Qute Components** inlined in a web page using the editor of your choice.

To be able to test your inlined components you must include the **[qute-dev.js](../dist/qute-dev-0.9.0.js)** bundle which contains everything is needed to transpile and run components. Do not use the **qute-dev.js** bundle in production.

Before releasing your components it is recommended to create a **Qute Component Project** and copy your component code there (and adapting it to use import / export statements). Then build the component and release to npm registry if needed.

### Inlined Component Example

```jsq-norun
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <script type="text/javascript" src='../dev/lib/qute-dev.js'></script>
  </head>
  <body>
    <script type='text/jsq'>
      <q:template name='my-template'>
      <div q:class='{authenticated:user}'>
        <if value='!user'>
          Click <a @click='doLogin' href='#' class='common-link'>here</a> to login
        <else />
          Hello {{user.firstName}}. <a href='#' @click='doLogout'>Logout</a>
        </if>
      </div>
      </q:template>

      export default Qute('my-template', {
        init() {
          this.loginUrl = './login';
          return {
            user: {
              firstName: 'John', lastName: 'Doe'
            }
          };
        },
        doLogin() {
          this.user = {firstName: 'John', lastName: 'Doe'};
        },
        doLogout() {
          this.user = null;
        }
      });
    </script>
    <script>
      // load inlined components
      Qute.load();
      // get the Component ViewModel by name
      var MyTemplate = Qute.vm('my-template');
      // create a new instance and mount it in the document body.
      new MyTemplate().mount();
    </script>
  </body>
</html>
```
The `Qute.load()` call is loading all components declared in the page inside `<script type='text/jsq'></script>` tags.

You **notice** that when writing inlined components you can omit importing the `Qute` runtime since imports are not supported in browser. The development environment will take care of injecting the Qute runtime in your component code.
