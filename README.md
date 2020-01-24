# Qute: A Javascript Component Model.

Qute is a modern component model designed for plain old javascript lovers.
It is a clean and concise implementation of the MVVM pattern.

Qute can either be used as a component model to build plain javascript UI components, either as a framework to build modern javascript applications.

Qute is an alternative to the well known react and vue.js frameworks. It is not another rewrite of a Virtual DOM framework. In fact it doesn't use a Virtual DOM, it is just using the real DOM. And it has its own personality and strengths, and may be some bugs ;-)

## Qute Multi-Package Repository

This is the root package of the Qute multi-package repository. The package is private and only serves to build the Qute packages.

[![Build Status](https://travis-ci.com/bstefanescu/qutejs.svg?branch=master)](https://travis-ci.com/bstefanescu/qutejs)

# Getting Started

Use the Qute project generator to create a new Qute application or component project:

```
npm init @qutejs
```

or if your **node version** is older than **10.3.0** you must use the `npx` command:

```
npx @qutejs/create
```

Go here for the **[Qute documentation](https://qutejs.org)**.

# Installing

Qute is structured as a repository containing multiple inter-dependent packages and is using [ws4npm](https://www.npmjs.com/package/ws4npm) to manage the development process (build, test, publish etc.).

This is why you need to install first the `ws` tool:

```
npm install -g ws4npm
```

Then install dependencies using:

```
ws install
```

**Do not use** `npm install` to install dependencies!


# Building

## Running the build

```
npm run build
```

## Runing the distribution build (includes tests and web bundles)

```
npm run dist
```

## Running tests

```
npm test
```

## Start local development server

```
npm start
```

# Packages

1. Core
	* [@qutejs/window](core/window)
	* [@qutejs/commons](core/commons)
	* [@qutejs/compiler](core/compiler)
	* [@qutejs/runtime](core/runtime)
	* [@qutejs/dev](core/dev)
2. Plugins
	* [@qutejs/router](plugins/router)
2. Tools
	* [@qutejs/create](tools/create)
	* [@qutejs/register](tools/register)
	* [@qutejs/rollup-plugin-qute](tools/rollup-plugin-qute)
	* [@qutejs/test-utils](tools/test-utils)
3. Components
    * [@qutejs/modal](components/modal)
	* [@qutejs/popup](components/popup)
	* [@qutejs/spinner](components/spinner)
4. Web
	* [@qutejs/polyfill](web/polyfill)

# Authors

**[Bogdan Stefanescu](mailto:bogdan@quandora.com)** - *Intial Work* - [Quandora](https://quandora.com)

# License

[MIT](LICENSE)

