# Qute Items Group  (@qutejs/i18n)

A **Qute** internationalization plugin based on [polyglot](https://airbnb.io/polyglot.js/).

**[Qute](https://qutejs.org)** is a **reactive component model** designed for **plain old javascript** lovers.

# Getting Started

Use the Qute project generator to create a new Qute application or component project:

```
npm init @qutejs
```

Go here for the **[Qute i18n documentation](https://qutejs.org#/plugins/i18n)**.

# Installing

```
npm install @qutejs/i18n
```

# Usage

```javascript
import Qute from '@qutejs/runtime';
import '@qutejs/i18n';

var i18n = new Qute.Intl({
	resources: {
		en: {
			hello: 'Hello World!'
		},
		fr: {
			hello: 'Bonjour monde!'
		},
		ro: 'remote/messages-ro.json'
	}
});
i18n.load('en').then(function() {
	// phrases loaded -> ready to translate
	// you can mount your application now
})
```

Then you can use the translate method `t()` from a Qute component template:

```xml
<div>{{t('hello')}}</div>
```

# Building

Qute packages are built from the Qute multi-package repository root.
See [github](https://github.com/bstefanescu/qutejs).

# Authors

**[Bogdan Stefanescu](mailto:bogdan@quandora.com)** - *Intial Work* - [Quandora](https://quandora.com)

# License

[MIT](LICENSE)

