# Routing

In modern javascript applications you often need a mechanism to navigate between local 'pages' and use the browser history to go back to the previous 'page' without interacting with the server.

Such a mechanism is named `routing` and there are various javascript implementations.

Qute is providing a built-in router implementation, but first, let's examine how a router can be integrated into a Qute Application.

The recommended way to do this is to set the router instance as a **Qute Applcation** property:

```javascript
var router = new Router();

// configure router
router.add('about', function() {
	// do comething
});
//...
router.add('*', function() {
	// do something
})

// create the Qute application and pass the router instance as an app property.
var app = new Qute.Application();
app.router = router;

// define the root component
@Template(RootTemplate)
class Root extends ViewModel {
    ...
}
// create the a root component and mount it
new Root(app).mount('app');
```

It will be then available in any **Qute Component** in the `Root` component tree as `this.$app.router`

If you want to hide the router instance from components then you can create a channel that accepts `route` requests and delegate the requests to the router instance:

```javascript
// create the router
var router = new Router();

// create the Qute application
var app = new Qute.Application();

// listen to 'route' requests
app.subscribe('route', function(key) {
  router.route(key);
});

// define the root component
@Template(RootTemplate)
class Root extends ViewModel {
    ...
}
// mount the app using the Root component
new Root(app).mount('app');
```

Usually, a route will change the component of a **[view](#/directives/view)**. This `view` can be anywhere in the component tree, at any level. In order to modify the component displayed by the view from the root context you can create a channel on the component containing the view. Then you just post to the channel a request to change the view.

Or, even more simple, is to use an **[application property](#/app/data)** to set the current view component.

Here is an example that change the content of a view from a **Qute Application** service (we are not using a real router for the sake of brevity):

```jsq
import Qute from '@qutejs/runtime';

const { ViewModel, Template, Link } = Qute;

<q:template name='RootTemplate'>
    <div>
        <div>
            <button @click="this.post('route', 'page1')">Page 1</button>
            <button @click="this.post('route', 'page2')">Page 2</button>
        </div>
        <hr />
        <view is={currentPage} />
    </div>
</q:template>

<q:template name='PageOne'>
    <div>The Page 1 content</div>
</q:template>

<q:template name='PageTwo'>
    <div>The Page 2 content</div>
</q:template>

var pages = {
    page1: PageOne,
    page2: PageTwo
}

// create the Qute application
var app = new Qute.Application();

// create the router
function Router(app) {
  app.defineProp('Pages/current', null).link(this, 'currentPage');
  this.route = function(key) {
    console.log('Route to', key);
    // here -> manage browser history state
    this.currentPage = pages[key];
  }
}
var router = new Router(app);

// listen to 'route' requests
app.subscribe('route', function(key) {
  router.route(key);
});

@Template(RootTemplate)
class Root extends ViewModel {
    @Link('Pages/current') currentPage; // bind to app property
}
new Root(app).mount('app');
```

You can adapt any existing javascript router using the method explained above.


# The Qute Router

Qute is providing a router implementation that simplify the way you register routes and post messages to components.

The router is provided by the `@qutejs/router` package. (it is not part of the Qute runtime package)

The router is registering a `route` channel that you can use to change routes. Also, it is assigning itself into the Qute application instance as the `router` property.

Usage:

```javascript
import Router from '@qutejs/router';

var router = new Router({
  "some/<path>+": function(vars) {
    // do somehting
  },
  "some/exact/path": "some/path/redirect",
  "some/<view>": "post:main-content/${view}"
});

// initialize the app here
var app = new Qute.Application();
// create the root component
// define the root component
@Template(RootTemplate)
class Root extends ViewModel {
    ...
}
// mount the application
new Root(app).mount('app');

router.install(app).start();
```

If you are not explicitly instantiating a **Qute application** you can also install the router directly on the root component (this will install the router on the implicit application instance created by the root component):

```javascript
var router = new Router({ ... });
// define the root component
@Template(RootTemplate)
class Root extends ViewModel {
    ...
}
var root = new Root().mount('app');
router.install(root).start();
```

## Routes Mapping

To define your routes you should map handlers (functions) to path patterns. The handlers are responsible to do some action when the browser location change and the path pattern matches the current path. The `path` is usually specified using the location `hash` part (e.g. #/some/path) but you can also use regular paths by enabling the `pushState` mode.

The router is using the **[location-bar](https://github.com/KidkArolis/location-bar)** library to manage the browser history so you can find there more about the `setup` options.

The path patterns can use expressions like `<varName[:regex]>` to capture variables. To specify custom regular expressions when capturing variable you can append the regular expression prefixed by a ':' character: `<varName:[0-9]+>`. The default regular expression for a variable is `[^/]+` (matches a path segment).

You can also use regular expressions without capturing the match into a variable, by omitting the variable name: `<:[0-9]+>`.

You must avoid using capturing groups `(group)` inside regular expressions since it may break the caputring variables. If you need to use groups then use non capturing groups: `(?:group)`.

**Examples:**

* `/users/<name>` - will match "/users/foo" and will capture `{name: 'foo'}`.
* `/files/<file>.<ext>` - will match "/files/readme.txt" and will capture `{file: 'readme', ext: 'txt'}`
* `/archive/<year:[0-9]{4}>-<month:[0-9]{2}>-<day:[0-9]{2}>`. - will match "/archive/2013-09-30" and will capture: `{year: '2013', month: '09', day: '30'}`
* `/some/<:[a-zA-Z]+>` - will match "/some/Page" but will not capture anything.
* `/some/page` - exact match (will only match /some/page)

### Augmenting Path Segments

You can augment variable segments by using the special modifiers: ? * and +. You cannot use such modifiers on composite segments (that are made from multiple variables or from a mix of text and variables).

**Examples:**

* `/<zeroOrMoreSegments>*/resource` - will match `/resource`, `/my/resource`, `/my/other/resource` etc. The sub-path will be captured in `zeroOrMoreSegments` variable (if not empty). For example `{zeroOrMoreSegments: 'my/other'}`

* `/<oneOrMoreSegments>+/resource` - will match `/my/resource`, `/my/other/resource` etc. The sub-path will be captured in `oneOrMoreSegments` variable. For example `{oneOrMoreSegments: 'my/other'}`

* `/<optionalSegment>?/resource` - will match `/resource`, `/my/resource` etc. The segment will be captured in `optionalSegment` variable (if not empty). For example `{optionalSegment: 'my'}`


### Catch All Pattern.

You can use the `*` pattern to match any path. This is usefull to have a fallback for any other path not matched by a pattern.

### Pattern Sorting

Before matcbhing the patterns are sorted so that longuest paths are tested first.

The patterns are sorted first in reverse lexicographical order, then patterns with less regular expressions are moved first.

**Example:** The following patterns `*`, `/some/long/path`, `some/long/<myvar>`, `some/path` will be sorted as:
`/some/long/path`, `some/path`, `/some/long/<myvar>`, `*`.s

## Route Handlers

There are 4 types of routes handlers:

### 1. Functions

When the route is matched, fucntions are invoked with the captured variables passed as the first argument.

**Example:** `{'/some/path': function(vars) { ... } }`

### 2. Redirection Paths

When the route is matched the browser is redirected to the `path`.

**Example:** `{ '/some/path': '/some/other/path' }`

Redirects support variable expanding, so that you can use captured variables in target paths:

```
{
    '/some/<segment>': '/some/other/${segment}'
}
```

### 3. Channel Posts

To post a message to a channel you can just use an expression of the type: `post:channel-name/message`.
This will trigger a message post to the specified channel when the route is matched.

**Example:**

```
{
    'some/path': 'post:main-content/message'
}
```

The captured variables are passed as the message data.

You can use `${someVar}` variables inside the post expression to expand captured variables:

```
{
    'some/<view>': 'post:main-content/${view}'
}
```

Matching 'some/search' will trigger a post like: `app.postAsync('main-content', 'search', {view: 'search'})`.

### 4. Application Properties Setters

To set an **[application property](#/app/data)** from a route mapping, you should use an expression of the type: `model:propName=value`, where value is any JSON parsable value. You can `${someVar}` variables inside the expression to expand captured variables.

**Example:**

```
{
    'some/<view>': 'model:Pages/currentPage="${view}"'
}
```

Matching 'some/search' will trigger the following operation:

`app.prop('Pages/currentPage').set("search")`


## Router Methods

### `Qute.Router(mapping)`

The router constructor. The mapping argument is optional and contains route definitions.

### `install(coponentOrApp)`

Install the router in the given `Qute Application`. You can pass as argument either a [Qute Application instance](#/app/instance), either a component (in which case the application bound to the component will be used).

Returns back the router instance.

### `map(bindings)`

Add the given path mappings

### `add(path, to)`

Add a single path mapping

### `start(options)`

Start listening for location changes. For the list of options see the **[locationBar.start(options)](https://github.com/KidkArolis/location-bar)** documentation.

The default is to use the location `hash`. To use `pushState` use these options:

```
{
  pushState: true,
  root: "/"
}
```

and specify the right root for you application.

Returns back the router instance.

### `stop()`

Stop listening for location changes.

### `navigate(path[, replace])`

Change the location to the given path. The `replace` argument is optional and defaults to `false`.
If you want to replace the current location (i.e. to avoid modifying the browser history) then use `true` for the `replace` argument.

### `route(path[, replace])`

An alias for the `navigate` method.

### `onChange(callback)`

Register a callback to be notified when the browser location change.

## Changing the Location from Components

To change the current location from a component you can either use

```
this.$app.router.navigate('/to/path', replace);
```
either post a message to the `route` channel:
```
this.post("route", "to/path", replace);
```
where the `replace` parameter can be omitted (it defaults to `false`).

