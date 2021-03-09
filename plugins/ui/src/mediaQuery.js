export default function addMediaQueryListener(mq, listener) {
    if ('addEventListener' in mq) {
        mq.addEventListener('change', listener);
    } else {
        mq.addListener(listener);
    }
}
