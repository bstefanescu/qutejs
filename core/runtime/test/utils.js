import window from '@qutejs/window';
import Qute from '..';

var document = window.document;
var MouseEvent = window.MouseEvent;

export function createMountPoint(id) {
	var div = document.createElement('DIV');
	div.id = id;
	document.body.appendChild(div);
	return div;
}

export function mountTest(TestVM) {
	var mountPoint = createMountPoint(TestVM.prototype.$tag);
	var vm = new TestVM().mount(mountPoint);
	mountPoint.$vm = vm;
	return mountPoint;
}

export function removeContent(el) {
	while (el.firstChild) el.removeChild(el.firstChild);
}


export function mouseEvent(element, eventName, data) {
	var event = new MouseEvent(eventName, data || {});
	element.dispatchEvent(event);
	return event;
}

export function click(element) {
	var event = new MouseEvent('click');
	element.dispatchEvent(event);
	return event;
}

export function runAfter(cb) {
	Qute.UpdateQueue.runAfter(cb);
}
