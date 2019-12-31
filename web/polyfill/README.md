# Qute: A Javascript Component Model for the DOM.

Qute is a **reactive component model** designed for **plain old javascript** lovers.

## @qutejs/polyfill

Provides all the polyfills required by Qute to work on IE >= 9.
The following polyfills are provided:

* `Element.classList`
* `CustomEvent`
* `Element.closest`
* `Element.matches`
* `Object.assign`
* `String.startsWith`

# Getting Started

Use the Qute project generator to create a new Qute application or component project:

```
npm init @qutejs
```

or (on **node versions** older than **10.3.0**)

```
npx @qutejs/create
```

Go here for the **[Qute documentation](https://qutejs.org)**.

# Installing

```
npm install @qutejs/polyfill
```

# Usage

```
import '@qutejs/polyfill';
```

# Building

Qute packages are built from the Qute multi-package repository root.
See [github](https://github.com/bstefanescu/qutejs).

# Authors

**[Bogdan Stefanescu](mailto:bogdan@quandora.com)** - *Intial Work* - [Quandora](https://quandora.com)

# License

[MIT](LICENSE)

