# Qute Decorators  (@qutejs/decorators)

Provides class decorators for Qute `ViewModel` components.

**[Qute](https://qutejs.org)** is a **reactive component model** designed for **plain old javascript** lovers.

# Getting Started

Use the Qute project generator to create a new Qute application or component project:

```
npm init @qutejs
```

Go here for the **[Qute Decorators documentation](https://qutejs.org#/model/class)**.

# Installing

```
npm install @qutejs/decorators
```

# Usage

```javascript
import Qute from '@qutejs/runtime';
import { Template } from '@qutejs/importer';
import MyTemplate from './my-template.jsq';

@Template(MyTemplate)
class MyViewModel extends Qute.ViewModel {
    ...
}
```

# Building

Qute packages are built from the Qute multi-package repository root.
See [github](https://github.com/bstefanescu/qutejs).

# Authors

**[Bogdan Stefanescu](mailto:bogdan@quandora.com)** - *Intial Work* - [Quandora](https://quandora.com)

# License

[MIT](LICENSE)

