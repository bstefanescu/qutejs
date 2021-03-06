# Qute: A JavaScript Component Model for the DOM

Qute is a **modern component model** designed for **plain old javascript** lovers.  \
It is a clean and concise implementation of the **MVVM** pattern.

Qute can either be used as a component model to build plain javascript UI components, either as a framework to build modern javascript applications.

Qute is an alternative to the well known **react** and **vue.js** frameworks. It is not another rewrite of a Virtual DOM framework. In fact, it doesn't use a Virtual DOM, it is just using the real DOM. And it has its own personality and strengths, and may be some bugs ;-)

I was puzzled about the success of **Virtual DOM** frameworks. Such frameworks consume more resources than really needed.

Why not just use the **DOM**? Why not just remain in the real world and face the DOM to make good profit of it?  \
The DOM is not as evil as it seems. It is just not so friendly.

So, my personal feelings and experience rejected the Virtual DOM. But wait, Virtual DOM frameworks provide a modern programming experience. It's not just about the Virtual DOM. It's about the programming experience too.

This is why I started **Qute**. To provide the same experience (or may be a better one? - you be the judge), and similar features, but remaining in the realm of the true DOM and without making a rupture with plain old javascript sites!

We dream of an eco-friendly world, so let's forget Virtual DOM frameworks.  \
It's time to adopt the **green programming**!

Some quick facts:

* Small and fast **MVVM** framework for building modern javascript applications or UI components.  \
About **10K** gzipped.
* Resource friendly: No Virtual DOM. It's **green software**!
* Friendly and concise API: uses JavaScript **[classes](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Classes)** and **[decorators](https://github.com/tc39/proposal-decorators)** to define components.
* **Quickly design components** using the playground.
* Provides a **project generator** tool for a modern development experience.
* Development extension for **Visual Studio Code**: **[vscode-qutejs](https://marketplace.visualstudio.com/items?itemName=quandora.vscode-qutejs)**.
* You can reuse any plain javascript UI component (e.g. jQuey UI etc.).
* Provides a concise **Application Data Model** which replace the verbose state management frameworks like **redux**. You write less code and focus on business logic.
* Provides a message bus between components: solve edge case problems like communicating between components in different roots.
* **Lazy component loading**: enables you to load optional components on demand reducing thus the application size.
* Accepts both xml and jsx like element names an attribute binding notations.
* DOM updates are optimized. Updates are very fast - no reconciliation is needed. Only nodes listening for changes are updated.
* **ES6** compliant.
* **MIT** License.

## Example

```jsq
import Qute from '@qutejs/runtime';

const {ViewModel, Template, Required, Property} = Qute;

<q:template name='MyButtonTemplate'>
    <button @click='handleClick'>{{label}}</button>
</q:template>

@Template(MyButtonTemplate)
class MyButton extends ViewModel {
    @Required @Property(String) label;

    handleClick() {
        alert('Hello World!');
    }
}

// the root component
<q:template export>
    <MyButton label='Click me!' />
</q:template>
```

Want more? Go to **[Overview](#/overview)** section!
