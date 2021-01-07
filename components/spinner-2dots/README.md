# Qute Spinner Component (@qutejs/spinner)

A **[Qute](https://qutejs.org)** spinner plugin implementing a pure CSS spinner.

The spinner is based on the https://github.com/tobiasahlin/SpinKit project.

Qute is a **reactive component model** designed for **plain old javascript** lovers.

# Getting Started

Use the Qute project generator to create a new Qute application or component project:

```
npm init @qutejs
```

# Installing

```
npm install @qutejs/spinner
```

# Usage

```javascript
import qSpinner from '@qutejs/spinner-2dots';
```
then to use the spinner

```xml
<q:spinner type='2dots' />
```
or

```xml
<q:spinner size='32px' color='green' />
```

if this spinner is the only (or default) spinner implementation included in your Qute app.

The spinner supports the following attributes: `style`, `class`, `size`, `center`, `color`, `color1` and `color2`.

Go to the **[Qute Spinner Component documentation](https://qutejs.org/doc/#/components/spinner)** for more information about spinner components.

# Building

Qute packages are built from the Qute multi-package repository root.
See [github](https://github.com/bstefanescu/qutejs).

# Authors

**[Bogdan Stefanescu](mailto:bogdan@quandora.com)** - *Intial Work* - [Quandora](https://quandora.com)

# License

[MIT](LICENSE)

