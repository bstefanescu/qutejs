# Form Support

Qute is providing 2 custom attribute directives to ease working with forms.

## Form Validation Directive

**Usage: `<form x-use:validation>`**

## Select Value Directive

**Usage: `<select x-use:select-value={expr}>`**

### Example

Here is the implementation of a more usefull custom directive: `select`. The directive let you use a `value` attribute on a `select` element to change the selected option. In HTML when dealing with select boxes you should specify a `selected` attribute the selected option, which is not very convenient to change the select value based on a component property.

In this example we will synchronize the select box on the right with the one on the left: when selecting a value on the left, the right slect. box will be updated too.

```jsq
<x-tag name='root'>
    <div>
    <select @change='e => { selectedValue = e.target.value }'>
        <option value='one'>One</option>
        <option value='two'>Two</option>
        <option value='three'>Three</option>
    </select>

    <select x-use:value={selectedValue}>
        <option value='one'>One</option>
        <option value='two'>Two</option>
        <option value='three'>Three</option>
    </select>
    </div>
</x-tag>

Qute.registerDirective('select', 'value', function(xattrs, valueExpr) {
    var rendering = this, value, boundProp = (typeof valueExpr === 'string') ? valueExpr : null;

    if (boundProp && !rendering.vm.__VM__) {
        // current component not a ViewModel - throw an error
        throw new Error('x-use:value bound to "'+valueExpr+'" property but the current component is not a ViewModel component!');
    }

    function updateSelectedValue(el) {
        var newValue = boundProp ? rendering.vm[boundProp] : rendering.eval(valueExpr);
        if (newValue !== value) {
            var opts = el.options;
            for (var i=0,l=opts.length; i<l; i++) {
                var opt = opts[i];
                if (opt.value === newValue) {
                    opt.selected = true;
                } else if (opt.selected) {
                    opt.selected = false;
                }
            }
        }
    }

    return function(el) {
        if (boundProp) {
            // then automatically update prop when changed
            el.addEventListener('change', function(e) {
                rendering.vm[boundProp] = el.selectedIndex > -1 ? el.options[el.selectedIndex].value : undefined;
            });
        }
        rendering.up(function() { updateSelectedValue(el) });
        updateSelectedValue(el);
    }
});

export default Qute('root', {
    init() {
        return {
            selectedValue: null
        }
    }
});
```


# Item Group or Group List
```jsq
<x-style>
ul.group {
  list-style-type: none;
  padding: 0;
  margin: 0;
  margin-bottom: 10px;
}

ul.group > li {
  display: inline-block;
  margin-right: 8px;
  padding: 4px 0;
  border-bottom: 1px solid transparent;
}

ul.group > li.active {
    border-bottom: 1px solid green;
}

ul.group a, ul.group a:hover, ul.group a:active {
    text-decoration:none;
}

</x-style>

<x-tag name='root'>
    <div>
        <ul class='group' x-use:value={selectedValue} @change='e => selectedValue = e.detail'>
            <li data-value='item1'><a href='#'>Item 1</a></li>
            <li data-value='item2'><a href='#'>Item 2</a></li>
            <li data-value='item3'><a href='#'>Item 3</a></li>
        </ul>
        <hr>
        <ul class='group' x-use:value='selectedValue'>
            <li data-value='item1'><a href='#'>Item 1</a></li>
            <li data-value='item2'><a href='#'>Item 2</a></li>
            <li data-value='item3'><a href='#'>Item 3</a></li>
        </ul>

        <div>
        Selected value is: {{selectedValue}}
        <hr>
        <button @click='selectedValue = "item3"'>Select 3</button>
        </div>
    </div>
</x-tag>

var groupDirective = function(xattrs, valueExpr) {
    var rendering = this, value, boundProp = (typeof valueExpr === 'string') ? valueExpr : null;

    if (boundProp && !rendering.vm.__VM__) {
        // current component not a ViewModel - throw an error
        throw new Error('x-use:value bound to "'+valueExpr+'" property but the current component is not a ViewModel component!');
    }

    function setValue(el, newValue) {
        if (value !== newValue) {
            var children = el.children;
            for (var i=0,l=children.length; i<l; i++) {
                var child = children[i];
                if (child.tagName === 'LI') {
                    var liVal = child.getAttribute('data-value');
                    if (liVal === newValue) {
                        child.classList.add('active');
                    } else {
                        child.classList.remove('active');
                    }
                }
            }
        }
    }

    function evalValueExpr() {
        return boundProp ? rendering.vm[boundProp] : rendering.eval(valueExpr);
    }

    return function(el) {
        el.addEventListener('click', function(e) {
            var li = e.target.closest('li');
            if (li) {
                var liVal = li.getAttribute('data-value');
                if (liVal && !li.classList.contains('active')) {
                    e.preventDefault();
                    e.stopPropagation();
                    setValue(el, liVal);
                    window.setTimeout(function() {
                        if (boundProp) rendering.vm[boundProp] = liVal;
                        el.dispatchEvent(new window.CustomEvent("change",
                            {bubbles: true, detail: liVal }));
                    }, 0);
                }
            }
        });
        rendering.up(function() {
            setValue(el, evalValueExpr());
        });
        setValue(el, evalValueExpr());
    }
}


Qute.registerDirective('ul', 'value', groupDirective);
Qute.registerDirective('ol', 'value', groupDirective);

export default Qute('root', {
    init() {
        return {
            selectedValue: null
        }
    }
});
```
