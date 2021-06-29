export default function Link(target, key, propName) {
    Object.defineProperty(target, key, target.$app.prop(propName).bindVM(target, key));
}