# Routing

In modern javascript applications you often need a mechanism to navigate between local 'pages' and use the browser history to go back to the previous 'page' without interacting with the server.

Such a mechanism is named `routing` and there are various javascript `routing` implementations.

Qute is providing a built-in router implementation, but first, let's examine how a router can be integrated into a Qute Application.

The recommended way to do this is to set the router instance as a **Qute Context** property:

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

// create the Qute application and pass the router imnsytance as a comntext property.
new MyApp({router: router}).mount('app');

```

It will be then available in any **Qute Component** as `this.$ctx.router`

If you want to hide the router instance from components then you can create a channel that accepts `route` requests and delegate the requests to the router instance:

```javascript
// create the Qute application and pass the router imnsytance as a comntext property.
var app = new MyApp({router: router}).mount('app');

app.$ctx.subscribe('route', function(key) {
	this.router.route(key);
});
```

If you use a channel to change routes you don't need anymore to store the route in the context. You can create create the channel using your root component (the application component) and let the router instance in the local scope of the root component module:

```javascript
var router = new Router();
// configure router here

// create the Qute application and the route channel.
new MyApp().subscribe('route', key => router.route(key)).mount('app');
```

Usually, a route will change the component of a **[view](#/directives/view)**. This `view` can be anywhere in the component tree, at any level. In order to modify the component displayed by the view from the root context you can simply create a channel on the component containing the view. Then you just post to the channel a request to change the view.

Here is an example that change the content of a view from a **Qute Context** service (we are not using a real router for the sake of brevity):

```jsq
<x-tag name='app'>
    <div>
        <div>
            <button @click="this.post('route', 'page1')">Page 1</button>
            <button @click="this.post('route', 'page2')">Page 2</button>
        </div>
        <hr />
        <view-wrapper x-channel='main-content' />
    </div>
</x-tag>

<x-tag name='view-wrapper'>
    <view is='currentView' />
</x-tag>

<x-tag name='page1'>
    <div>The Page 1 content</div>
</x-tag>

<x-tag name='page2'>
    <div>The Page 2 content</div>
</x-tag>

var MyApp = Qute('app');
var ViewWrapper = Qute('view-wrapper', {
    init() {
        return { currentView: null };
    }
}).channel(function(viewType) {
    this.currentView = viewType;
});

new MyApp().subscribe('route', function(key) {
        //router.route(key); // the route handler will call postAsync:
        this.postAsync('main-content', key);
    }).mount('app');

```

You can adapt any existing router using the method explained above.

## Qute Router

Qute is providing a router implementation that integrates into a **Qute Application** through the **Qute Context**, and simplify the way you register routes that post messages to Qute channels.

The router is registering a `route` channel that you can use to change routes. Also, it is assigning itself into the context as the `router` property.

Usage:

```javascript

var MyApp = Qute('my-app');

var myApp = new MyApp().mount('app');

new QuteRouter({
  "some/<path>+": function(vars) {
    // do somehting
  },
  "some/exact/path": "some/path/redirect",
  "some/<view>": "post:main-content/${view}"
}).install(myApp.$ctx).start();
```

### Routes Mapping

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

#### Augmenting Path Segments

You can augment variable segments by using the special modifiers: ? * and +. You cannot use such modifiers on composite segments (that are made from multiple variables or from a mix of text and variables).

**Examples:**

* `/<zeroOrMoreSegments>*/resource` - will match `/resource`, `/my/resource`, `/my/other/resource` etc. The sub-path will be captured in `zeroOrMoreSegments` variable (if not empty). For example `{zeroOrMoreSegments: 'my/other'}`

* `/<oneOrMoreSegments>+/resource` - will match `/my/resource`, `/my/other/resource` etc. The sub-path will be captured in `oneOrMoreSegments` variable. For example `{oneOrMoreSegments: 'my/other'}`

* `/<optionalSegment>?/resource` - will match `/resource`, `/my/resource` etc. The segment will be captured in `optionalSegment` variable (if not empty). For example `{optionalSegment: 'my'}`


#### Catch All Pattern.

You can use the `*` pattern to match any path. This is usefull to have a fallback for any other path not matched by a pattern.

#### Pattern Sorting

Before matcbhing the patterns are sorted so that longuest paths are tested first.

The patterns are sorted first in reverse lexicographical order, then patterns with less regular expressions are moved first.

**Example:** The following patterns `*`, `/some/long/path`, `some/long/<myvar>`, `some/path` will be sorted as:
`/some/long/path`, `some/path`, `/some/long/<myvar>`, `*`.s

#### Route Handlers

There are 3 types of routes handlers:

##### Functions

When the route is matched, fucntions are invoked with the captured variables passed as the first argument.

**Example:** `{'/some/path': function(vars) { ... } }`

##### Redirection Paths

When the route is matched the browser is redirected to the `path`.

**Example:** `{ '/some/path': '/some/other/path' }`

Redirects support variable expanding, so that you can use captured variables in target paths:

```
{
    '/some/<segment>': '/some/other/${segment}'
}
```

##### Channel Posts

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

Matching 'some/search' will trigger a post like: `ctx.postAsync('main-content', 'search', {view: 'search'})`.


### Router Methods

#### `install(componentOrCtx)`

Install the router in the given `Qute Context`. You can pass as context either a Qute Context object, either a component (in which case the context of the component will be used).

#### `start(options)`

Start listening for location changes. For the list of options see the **[locationBar.start(options)](https://github.com/KidkArolis/location-bar)** documentation.

The default is to use the location `hash`. To use `pushState` use these options:

```
{
  pushState: true,
  root: "/"
}
```

and specify the right root for you application.

#### `stop()`

Stop listening for location changes.

#### `navigate(path[, replace])`

Change the location to the given path. The `replace` argument is optional and defaults to `false`.
If you want to replace the current location (i.e. to avoid modifying the browser history) then use `true` for the `replace` argument.

#### `route(path[, replace])`

An alias for the `navigate` method.

#### `onChange(callback)`

Register a callback to be notified when the browser location change.

### Changing the Location from Components

To change the current location from a component you can either use

```
this.$ctx.router.navigate('/to/path', replace);
```
either post a message to the `route` channel:
```
this.post("route", "to/path", replace);
```
where the `replace` parameter can be omitted (it defaults to `false`).

