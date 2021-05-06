const assert = require('assert');
const MagicString = require('magic-string');

const code0 = `import Qute from '@qutejs/runtime';
import {mButton} from '@qutejs/material/button';

<q:style>
.error {
  background: red;
}
</q:style>

<q:template name='MyTemplate'>
  <div class='error'>
    <slot/>
    <m:button>Click me</m:button>
  </div>
</q:template>

@Qute.Template(MyTemplate)
class MyComponent extends Qute.ViewModel {

}

export default MyComponent;
`;

function transformStyle(code, ms) {
    let i = code.indexOf('<q:style>');
    if (i > -1) {
      let j = code.indexOf('</q:style>', i);
      ms.overwrite(i, j+'</q:style>'.length,
        "import '#qute-istyle.css';");
      return true;
    }
  }
  function transformTemplate(code, ms) {
    let i = code.indexOf('<q:template');
    if (i > -1) {
      let j = code.indexOf('</q:template>', i);
      ms.overwrite(i, j+'</q:template>'.length,
        "var templateFn = function() {};\ntemplateFn.$compiled=true;");
      return true;
    }
  }
  function transformTemplateDecorator(code, ms) {
    let i = code.indexOf('@Qute.Template');
    if (i > -1) {
      let j = code.indexOf('\n', i);
      ms.remove(i, j+1);
      //ms.prepend("//some comment\n");
      ms.prepend("import 'some-lib';\n");
      ms.append("Qute.Template();")
      return true;
    }
  }

let code = code0;
let ms = new MagicString(code);
transformStyle(code, ms);
const tr1 = {
    code: ms.toString(),
    input: code,
    map: ms.generateMap({
        hires: false,
        source: 'source.js',
        file: 'source.js',
        includeContent: true
    })
}

code = ms.toString()
ms = new MagicString(code);
transformTemplate(code, ms);
const tr2 = {
    code: ms.toString(),
    input: code,
    map: ms.generateMap({
        hires: false,
        source: 'source.js',
        file: 'source.js',
        includeContent: true
    })
}

code = ms.toString();
ms = new MagicString(code);
transformTemplateDecorator(code, ms);
const tr3 = {
    code: ms.toString(),
    input: code,
    map: ms.generateMap({
        hires: false,
        source: 'source.js',
        file: 'source.js',
        includeContent: true
    })
}

// all transforms at once
code = code0;
ms = new MagicString(code);
transformStyle(code, ms);
transformTemplate(code, ms);
transformTemplateDecorator(code, ms);
const tr = {
    input: code,
    code: ms.toString(),
    map: ms.generateMap({
        hires: false,
        source: 'source.js',
        file: 'source.js',
        includeContent: true
    })
}

assert.strictEqual(tr.code, tr3.code);

module.exports = {
    tr1, tr2, tr3, tr,
    code: code0
}
