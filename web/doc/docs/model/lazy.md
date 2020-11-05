# Lazy Component Loading

This Qute feature is enabling applications to load referenced components at demand.

In larger applications requiring many optional components you can avoid packaging all the components inside the application, but still reference the components in application templates. When such a component is rendered, the component code is downloaded from a remote location yopu specify when declaring the lazy component.

This let's you reduce the size of your application and also to replace component implementations at runtime without re-building and re-deploying the application.

To learn more about using **lazy components** see the **[Importer Plugin](#/plugins/importer)** documentation.
