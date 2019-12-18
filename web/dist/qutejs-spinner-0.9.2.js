var QutejsSpinner = (function (window, Qute) {
  'use strict';

  Qute = Qute && Qute.hasOwnProperty('default') ? Qute['default'] : Qute;

  var css = ".spinner {\n  margin: 0 auto;\n  text-align: center;\n}\n\n.spinner > div {\n  width: 18px;\n  height: 18px;\n  background-color: #333;\n\n  border-radius: 100%;\n  display: inline-block;\n  -webkit-animation: sk-bouncedelay 1.4s infinite ease-in-out both;\n  animation: sk-bouncedelay 1.4s infinite ease-in-out both;\n}\n\n.spinner .bounce1 {\n  -webkit-animation-delay: -0.32s;\n  animation-delay: -0.32s;\n}\n\n.spinner .bounce2 {\n  -webkit-animation-delay: -0.16s;\n  animation-delay: -0.16s;\n}\n\n@-webkit-keyframes sk-bouncedelay {\n  0%, 80%, 100% { -webkit-transform: scale(0) }\n  40% { -webkit-transform: scale(1.0) }\n}\n\n@keyframes sk-bouncedelay {\n  0%, 80%, 100% {\n    -webkit-transform: scale(0);\n    transform: scale(0);\n  } 40% {\n    -webkit-transform: scale(1.0);\n    transform: scale(1.0);\n  }\n}";

  Qute.css(css);

  /*
  Qute.register("loader-ellipsis", function($){return $.h("div",{"class":"spinner"},[$.t(" "),$.h("div",{"class":"bounce1"},null),$.t(" "),$.h("div",{"class":"bounce2"},null),$.t(" "),$.h("div",{"class":"bounce3"},null),$.t(" ")]);}, true);






  */

  function updateStyle(div, color, size) {
  	var style = div.style;
  	if (color) { style.backgroundColor = color; }
  	if (size) {
  		style.width = size;
  		style.height = size;
  	}
  }

  var ellipsis = Qute('spinner', function(r, xattrs) {
  	var color = xattrs && xattrs.color;
  	var size = xattrs && xattrs.size;

  	var loader = window.document.createElement('DIV');
  	loader.className = 'spinner';

  	var div = window.document.createElement('DIV');
  	updateStyle(div, color, size);
  	div.className = 'bounce1';
  	loader.appendChild(div);

  	div = window.document.createElement('DIV');
  	updateStyle(div, color, size);
  	div.className = 'bounce2';
  	loader.appendChild(div);

  	div = window.document.createElement('DIV');
      updateStyle(div, color, size);
  	div.className = 'bounce3';
  	loader.appendChild(div);

  	return loader;
  });

  return ellipsis;

}(window, Qute));
//# sourceMappingURL=qutejs-spinner-0.9.2.js.map
