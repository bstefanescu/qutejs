# Qute: A JavaScript Component Model

Qute is a **reactive component model** designed for **plain old javascript** lovers.

It is **not intrusive**. It is **not another framework**. \
It just provides a **modern component model** to facilitate working with the **DOM**.

I was puzzled about the success of **Virtual DOM** frameworks. Such frameworks consume more resources than really needed.

Why not just use the **DOM**? Why not just remain in the real world and face the DOM to make good profit of it?  \
The DOM is not as evil as it seems. It is just not so friendly.

So, my personal feelings and experience rejected the Virtual DOM. But wait, Virtual DOM frameworks provide a modern programming experience. It's not just about the Virtual DOM. It's about the programming experience too.

This is why I started **Qute**. To provide the same experience (or may be a better one? - you be the judge), and similar features, but remaining in the realm of the true DOM and leveraging plain old javascript sites!

We dream of an eco-friendly world, so let's forget Virtual DOM frameworks.  \
It's time to adopt the **green programming**!

Some quick facts:

* **Quickly design components** using the playground or browser inlined components.
* Provides a **project generator** tool for a modern development experience.
* Accepts both xml and jsx like attribute binding notations.
* You are free to design your application how it's better suits you.  \
Remember **Qute** is not a constraining framework. It just provides a component model.
* You can use any traditional javascript library inside a Qute component (e.g. JQuery, jQuey UI etc.).
* Components can work in traditional javascript sites, no need to code the entire application as a Qute component (although you can).
* Qute is providing a message bus between components: components can interact with each other even if they are belonging to different component trees.
* DOM updates are optimized. In theory, updates should be very fast - no reconciliation is needed. Only nodes listening for changes are updated.  \
Though, no benchmarks are available yet.
* **ES6** compliant.
* **MIT** License.
* Qute Runtime gziped: **6 KB**.

Want more? Go to **[Getting Started](https://qutejs.org/#/getting-started)** section!


