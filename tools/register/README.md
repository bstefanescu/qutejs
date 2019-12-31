# Qute: A Javascript Component Model for the DOM.

Qute is a **reactive component model** designed for **plain old javascript** lovers.

## @qutejs/register

Hook the Qute compiler into node `require` to automatically compile `.jsq` files.

The `pirates` module is used to correctly integrate with other hooks like @babel/register.

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
npm install @qutejs/register
```

# Usage

```
import '@qutejs/register';
```

or

```
require('@qutejs/register');
```

or

```
node -r @qutejs/register ...
```

# Building

Qute packages are built from the Qute multi-package repository root.
See [github](https://github.com/bstefanescu/qutejs).

# Authors

**[Bogdan Stefanescu](mailto:bogdan@quandora.com)** - *Intial Work* - [Quandora](https://quandora.com)

# License

[MIT](LICENSE)

