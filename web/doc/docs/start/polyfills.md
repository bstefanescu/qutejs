## Browser Support and Polyfills

Qute works on any modern browser. On Internet Explorer browsers you need to load the polyfills described below:

* **[Element.classList](https://developer.mozilla.org/en-US/docs/Web/API/Element/classList)** - partially supported on IE10
* **[Object.assign](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Object/assign)** - Not supported on IE.
* **[String.startsWith](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/String/startsWith)** - Not supported on IE.
* **[CustomEvent](https://developer.mozilla.org/en-US/docs/Web/API/CustomEvent/CustomEvent)** - Not supported on IE.
* **[Element.matches](https://developer.mozilla.org/en-US/docs/Web/API/Element/matches)** - IE uses the non standard name: `msMatchesSelector`.
* **[Element.closest](https://developer.mozilla.org/en-US/docs/Web/API/Element/closest)** - Not supported on IE.
* **[requestAnimationFrame](https://developer.mozilla.org/en-US/docs/Web/API/window/requestAnimationFrame)** - On some older browsers requires a vendor prefix. Not supported on IE9.

Or you can just load the `@qutejs/polyfill` library, which also provides a **Promise** polyfill which is, in my opinion, mandatory for modern applications.

To load the polyfill just add this line on the main file of your application before using using `Qute`:

```javascript
import "@qutejs/polyfill";

/* ... your app code follows here ... */

```

Using these polyfills Qute will run on any IE9+ browsers.
