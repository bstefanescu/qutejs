# Qute Spinner Component (@qutejs/spinner-base)

The **[Qute](https://qutejs.org)** spinner base provide a helper function to apply basic behavior (common to all spinners components) to a spinner component. The package is only intended to be used by Qute spinner components.

Qute is a **reactive component model** designed for **plain old javascript** lovers.

# Getting Started

Use the Qute project generator to create a new Qute application or component project:

```
npm init @qutejs
```

# Installing

```
npm install @qutejs/spinner-base
```

# Usage

```javascript
import baseSpinner from '@qutejs/spinner-base';

function MySPinner(r, xattrs) {
    let el = documet.createElement('DIV');
    // setup el attributes
    // apply common behavior like the `show` attribute
    baseSpinner(el, r, xattrs);
    return el;
}
```

The base spinner handles the following attributes: `q:show`, `class` and `center`.

Go to the **[Qute Spinner Component documentation](https://qutejs.org/doc/#/components/spinner)** for more information about spinner components.

# Building

Qute packages are built from the Qute multi-package repository root.
See [github](https://github.com/bstefanescu/qutejs).

# Authors

**[Bogdan Stefanescu](mailto:bogdan@quandora.com)** - *Intial Work* - [Quandora](https://quandora.com)

# License

[MIT](LICENSE)

