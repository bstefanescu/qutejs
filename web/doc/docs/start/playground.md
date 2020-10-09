# The Qute Playground

To play around with components you can use the **[Qute Playground](/playground/index.html)**.

To write a component in the playground, you should write all the component parts (the javascriopt code, the templates and the styles) in a single file in `JSQ` format.

You don't need to explicitely mount the component in the preview panel. Just use an `export default` on the component constructor you want to mount. The playground will mount it for you:

```jsq
import Qute from '@qutejs/runtime';

<q:template name='HelloWorldTemplate'>
    <div>Hello world</div>
</q:template>
export default Qute(HelloWorldTemplate);
```

You can also mount **template components** not only `ViewModel` components. Just use the export attribute on the template you want to mount:

```jsq
<q:template export>
    <div>Hello world</div>
</q:template>
```

To test some features like the **Qute application instance** you need to mount yourself the component if needed. Just use `app` as the target element:

```jsq
import Qute from '@qutejs/runtime';

<q:template name='HelloWorldTemplate'>
    <div>Hello world</div>
</q:template>
const app = new Qute.App();
const HelloComponent = Qute(HelloWorldTemplate);
new HelloComponent(app).mount('app');
```

**Note** that all the runnable examples in the documentation are also opened in the playground!

## How imports are resolved

When using the playground to write components you can import dependencies by using the URL of the dependency web bundle file, or by simply using the package name.

When using the package name the library will be located using the **[unpkg.com](https://unpkg.com)** CDN.  \
In that case be sure to include an `unpkg` or `browser` entry in the package.json of your library to specify which bundle to expose through **unpkg.com**.

You can import both javascript iife bundles and css files.

## CDN

All Qute libraries and components are available from **unpkg.com**.

For example, to download the latest **Qute runtime** you can use: https://unpkg.com/@qutejs/runtime

## Using qute transpiler in browser: the `@qutejs/dev` package

The playground uses the `@qutejs/dev` package to load and transpile JSQ files. You can use it yourself if you need to transpile JSQ content in the browser, but this should be never used in production.

**Example:**

```jsq-norun
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8"/>
    <script type="text/javascript" src='https://unpkg.com/@qutejs/dev'></script>
  </head>
  <body>
    <script type='text/jsq'>
        import Qute from '@qutejs/runtime';
        import window from '@qutejs/window';

        <q:style>
        .username { color: green; }
        </q:style>

        // the component template
        <q:template name='MyComponentTemplate'>
        <div q:class='{authenticated:user}'>
            <if value={!user}>
                <p>Enter a username and click on the login button:</p>
                <div><input type='text' q:ref='input'>
                <button @click='handleLogin'>Login</button>
                </div>
            <else />
            Hello <span class='username'>{{user}}</span>.
            <button @click='handleLogout'>Logout</button>
            </if>
        </div>
        </q:template>

        // create a ViewModel component
        window.MyComponent = Qute(MyComponentTemplate, {
            init() {
                this.input = null;
            },
            handleLogin() {
                const value = this.input.value.trim();
                if (value) {
                    this.user = value;
                } else {
                    window.alert('Enter a user name!');
                }
            },
            handleLogout() {
                this.user = null;
            }
        }).properties({
            user: null
        });
    </script>
    <script>
      // load inlined components
      Qute.load().then(function() {
        // create a new instance of MyComponent and mount it in the document body.
        new window.MyComponent().mount();
      });
    </script>
  </body>
</html>
```

`Qute.load()` is loading all components declared in the page inside `<script type='text/jsq'></script>` tags, and return a promise which is fulfilled when all the components are loaded.

