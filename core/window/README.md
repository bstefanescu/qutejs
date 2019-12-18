# Qute: A Javascript Component Model.

Qute is a **reactive component model** designed for **plain old javascript** lovers.

## @qutejs/window

This package provides an abstraction for the browser window global. Any time you need to use a browser global you must import it from this package:

```
import window from '@qutejs/window';
```

You can also import other globals (that are properties of the window object):

```
import {document} from '@qutejs/window';
```

# Getting Started

Use the Qute project generator to create a new Qute application or component project:

```
npm init @qutejs
```

Go here for the **[Qute documentation](https://qutejs.org)**.

# Installing

```
npm install @qutejs/window
```

# Usage

```
import window, {document} from '@qutejs/window';
```

# Building

Qute packages are built from the Qute multi-package repository root.
See [github](https://github.com/bstefanescu/qutejs).

# Authors

**[Bogdan Stefanescu](mailto:bogdan@quandora.com)** - *Intial Work* - [Quandora](https://quandora.com)

# License

[MIT](LICENSE)

