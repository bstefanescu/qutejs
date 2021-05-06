export default function InlineStyles() {
    this.styles = new Map();
    this.counter = 0;
}
InlineStyles.prototype = {
    add(text, importer) {
        const key = '#qutejs-istyle-'+(++this.counter)+'.css';
        this.styles.set(key, {id: key, css: text, importer: importer});
        return key;
    },
    get(key) {
        return this.styles.get(key);
    },
    css(key) {
        const style = this.get(key);
        return style ? style.css : null;
    },
    forEach(fn) {
        this.styles.forEach(fn);
    }
}
InlineStyles.isStyleId = function(id) {
    return id.startsWith('#qutejs-istyle-') && id.endsWith('.css');
}
