
export default function isClasses($attrs, baseClasses) {
    const result = baseClasses || [];
    if ($attrs.is) {
        $attrs.is.split(/\s+/).forEach(item => {
            result.push('is-'+item);
        });
    }
    return result;
}
