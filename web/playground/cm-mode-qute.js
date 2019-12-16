CodeMirror.defineMode("qute", function(config, parserConfig) {
  var mustacheOverlay = {
    token: function(stream, state) {
      var ch;
      if (stream.match("{{")) {
        while ((ch = stream.next()) != null)
          if (ch == "}" && stream.next() == "}") {
            stream.eat("}");
            return "string-2"; // mustache expression
          }
      }
      while (stream.next() != null && !stream.match("{{", false)) {}
      return null;
    }
  };
  return CodeMirror.overlayMode(CodeMirror.getMode(config, "text/xml"), mustacheOverlay);
});

CodeMirror.defineMode("jsq", function(config) {
  return CodeMirror.multiplexingMode(
    CodeMirror.getMode(config, "text/javascript"), {
      open: "<x-tag",
      close: "\n",
      mode: CodeMirror.getMode(config, "qute"),
      parseDelimiters: true
    }, {
      open: "<x-style",
      close: "\n",
      mode: CodeMirror.getMode(config, "css"),
      parseDelimiters: true
    }
  );
});

