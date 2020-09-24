# Property Types

Property types gives you more control over the reactive properties. You can create your own types if needed, so you can control the property binding process and install custom value checkers.

This feature is provided by the `@qutejs/types` package.

## Built-in property types

By default, `Qute` is automatically checking and converting property values for properties initialized with string, nummber or boolean values. Let's look at the following example:

```jsq

<q:template name='SumTemplate'>
    Sum is {{x+y}}
</q:template>

<q:template name='RootTemplate'>
    <Sum x='18' y={2} />
</q:template>

const Sum = Qute(SumTemplate).properties({
    x: 0, y: 0
});

export default Qute(RootTemplate);
```

The `Sum` component is defining 2 properties: `x` and `y`.

When we use the `Sum` component we pass a string value (i.e. `"18"`) for `x` and an integer value (i.e. `2`) for `y`. In javascript the outcome of the `"18"+2` expression is `"182"` and not `20`.

In our example the outcome is `20`. This happens because the `x` and `y` properties are initialized using integer literals and `Qute` will expect these properties to hold numbers. It will automatically convert any input value to a number.
If the conversion fails and error will be thrown.

This kind of conversion is automatically done when initializing properties with a **string**, a **number** or a **boolean** literal.

**Note** that `null` and `undefined` values are never converted to the type of the property - to avoid errors like converting a `null` string to the string `"null"`. In Qute a null or undefined value means the property is not initialized so no conversion is done.

For more control, you can also explicitly use property types. Here is the list of all built-in property types:

* **_String** - transform the input value to a string using `String(inputValue)`.
* **_Number** - transform the input value to a number using `Number(inputValue)`.
* **_Boolean** - transform the input value to a boolean using `Boolean(inputValue)`.
* **_Date** - transform the input value in a date using `new Date(inputValue)`.
* **_Function** - accept only functions as input value
* **_Array** - accept only array instances as input values.
* **_Object** - accept only objects as input value.
* **_Link** - link the property to an **[Application Model Property](app/data)**.
* **_Any** -  accept any value **but** functions. Can be used to create custom property types.

**By convention**, property type names are starting with an **underscore followed by a uppercase letter**.

Usually a property type can be used to control the following aspects:

1. Check the input value and transform it (if possible) to the expected type. May thrown an error if the value is not accepted.
2. Avoid sharing default values by cloning default values, each time a new component isnatnce is created. We will see later an example on this.
3. Control how the property is bound in the component instance. This can be used to bind external data models as component properties. See *_Link** property type.

You can also define your own custom property types. We will see how at the bottom of this page.


### _String

A string property that will transform any input value that is not `null` or `undefined` to a string using the `String()` function.

**Example**

```jsq
import Qute from '@qutejs/runtime';
import { _String } from '@qutejs/types';

<q:template name='MyElementTemplate'>
    <div>{{typeof theString}}: {{theString}}</div>
</q:template>

<q:template name='RootTemplate'>
    <div>
    <my-element />
    <my-element the-string="a string value" />
    <my-element the-string={46} />
    <my-element the-string={true} />
    <my-element the-string={[1,2,3]} />
    <my-element the-string={now()} />
    </div>
</q:template>

const MyElement = Qute(MyElementTemplate).properties({
    theString: _String('default value')
});
export default Qute(RootTemplate, {
  now() {
    return new Date();
  }
});
```

### _Number

A number property that will transform any input value that is not `null` or `undefined` to a number using the `Number()` function. It will thrown an exception if the tranformed value is `NaN`.

```jsq
import Qute from '@qutejs/runtime';
import { _Number } from '@qutejs/types';

<q:template name='MyElementTemplate'>
    <div>{{typeof theNumber}}: {{theNumber}}</div>
</q:template>

<q:template name='RootTemplate'>
    <div>
    <my-element />
    <my-element the-number="23" />
    <my-element the-number={46} />
    <my-element the-number={true} />
    <my-element the-number={now()} />
    </div>
</q:template>

const MyElement = Qute(MyElementTemplate).properties({
    theNumber: _Number(0)
});
export default Qute(RootTemplate, {
  now() {
    return new Date();
  }
});
```

### _Boolean

A boolean property that will transform any input value that is not `null` or `undefined` to a boolean using the `Boolean()` function.

```jsq
import Qute from '@qutejs/runtime';
import { _Boolean } from '@qutejs/types';

<q:template name='MyElementTemplate'>
    <div>{{typeof theBoolean}}: {{theBoolean}}</div>
</q:template>

<q:template name='RootTemplate'>
    <div>
    <my-element />
    <my-element the-boolean="" />
    <my-element the-boolean={0} />
    <my-element the-boolean={1} />
    <my-element the-boolean={true} />
    <my-element the-boolean={now()} />
    </div>
</q:template>

const MyElement = Qute(MyElementTemplate).properties({
    theBoolean: _Boolean(true)
});
export default Qute(RootTemplate, {
  now() {
    return new Date();
  }
});
```

### _Date

A date property that will transform any input value that is not `null` or `undefined` or already a `Date` object to a date  using `new Date(inputValue)` function. It will throw an exception if the input value cannot be transformed to a date.

```jsq
import Qute from '@qutejs/runtime';
import { _Date } from '@qutejs/types';

<q:template name='MyElementTemplate'>
    <div>{{typeof theDate}}: {{theDate}}</div>
</q:template>

<q:template name='RootTemplate'>
    <div>
    <my-element />
    <my-element the-date={0} />
    <my-element the-date={100000} />
    <my-element the-date={"2020-01-23"} />
    <my-element the-date={now()} />
    </div>
</q:template>

const MyElement = Qute(MyElementTemplate).properties({
    theDate: _Date()
});
export default Qute(RootTemplate, {
  now() {
    return new Date();
  }
});
```
### _Array

An array property that will throw an exception if the input value is defined (`inputValue != null`) and it is not an array.

The default values of array properties are cloned each time a new component instance is created to avoid sharing the same array value between component instances. The clone is created using `Array.slice()`.

**Usage:**

```javascript
import Qute from '@qutejs/runtie';
import { _Array } from '@qutejs/types';

Qute(ComponentTemplate).properties({
    items: _Array([1,2,3])
});
```

### _Function

A property that will only accept `function` as values. If the input value is defined and is not a function then an exeption will be thrown.

**Usage:**

```javascript
import Qute from '@qutejs/runtie';
import { _Function } from '@qutejs/types';

Qute(ComponentTemplate).properties({
    hello: _Function(() => window.alert('Hello!'))
});
```

### _Object

A property that will only accept `function` as values. If the input value is definedn (i.e. not null and not undefined) and is not of type 'object' then an exeption will be thrown.

If the default value is a plain object (i.e. object literal) then it will be cloned using `Object.assign()` each time a new component instance is created.

If the default value is a function then it will be used as a factory for the default value and will be invoked each time a new component instance is created to get the actual default value.

You should never directly pass object instances (apart plain objects) as defauilt values, since they will be shared by all the component instances.

**Usage:**

```javascript
import Qute from '@qutejs/runtie';
import { _Object } from '@qutejs/types';

Qute(ComponentTemplate).properties({
    name: _Object({
        firstName: 'Foo',
        lastName: 'Bar'
    }),
    items: _Object(() => new Map()),
    notOk: _Object(new Map()) // <----- this is not OK
});
```

In the example above the `notOk` property default value will be shared by all component instances - so if you put something inside the map all the component instances will have the property udpated! This is why you should always use a factory function to specify default values for obejct properties.

Alsoi, the _Object property is providing a function `assign(assignFunction)` to specify a custom property assign function.
Assign functions are called when a new value is assigned to a property and can be used to check or convert the input value.

In the following example we define an `assign` function to check if the input value is a map:

```javascript
Qute(ComponentTemplate).properties({
    items: _Object(() => new Map()).assign(value => {
        if (value != null && !(value instanceof Map)) {
            throw new Error('Expecting a Map value. Got: '+value);
        }
        return value; // return back the input value to be set to the property
    });
});
```

### _Any

This property type is usefull when you don't want to use predefined type constraints on a property bu you need to specify a `factory function` that will create the default property value:

```javascript
Qute(SomeTemplate).properties({
    user: _Any.factory(() => [1,2,3])
});
```

In the example bellow we create a factory based property that will get [1,2,3] as the default value each time a new instance of the ViewModel is created.

The `_Any` property will also let you specify a custom `assign` function so that you can check constraints or make conversions before a new value is set to the property:

```javascript
Qute(SomeTemplate).properties({
    user: _Any.factory(() => new Map()).assign(value => {
        if (value != null && !(value instanceof Map)) {
            throw new Error('Expecting a Map value. Got: '+value);
        }
        return value; // return back the input value to be set to the property
    });
});
```

You can also use the _Any property to easily define custom properties. See **Creating custom property types** below for an example.

### _List

A property type providing a custom array like structure that helps working with reactive lists.

When you are using the **[q:for](#/attributes/q-for)** directive to render reactive lists we recommend to use a `_List` property to hold the reactive array instead of an array property. This is because the _List property is providing an straightforward way to modify lists and updating the rendering.

When using `_List` properties you must specify the field name of an list item that will uniquely identify the item in the list. We are naming this field the list **key**.  \
Because of this you don't need to specify the `key` attribute along with the `q:for` attribute since the key is already known when the `q:for` iterates over a `_List` property.

**Example**

```javascript
Qute(ComponentTemplate).properties({
    itemsWithDefaultValue: _List('id', [1,2,3]), // <--- the list key is 'id' and the default value [1,2,3]
    items: _List('id') // <--- the list key is 'id' and the default value is an empty array.
});
```

The `_List` property type will take care of cloning default values if any to avoid sharing the lists between component instances.

See the **[q:for](#/attributes/q-for)** directive for more on the `List` API and the **[Todo List](#/examples/todo)** page for a complete example using `_List`.

### _Link

This is a special property type that will link the `ViewModel` property to an application model property.  \
The following are equivalent:

```javascript
Qute(SomeTemplate).properties(app => ({
    user: app.prop('UserSession/user')
}));
```

```javascript
Qute(SomeTemplate).properties({
    user: _Link('UserSession/user')
});
```

It is just syntactic sugar to be consistent with other property types.

You can find here more informations about **[Application Model Properties](#/app/data)**.  \
Here is a **[complete example](#/app/example)** on using the `_Link` property type.


## Default value factories

A property is defined when you define the ViewModel component. The defualt value of a property is defined at the same time. But usually you want to have the default value instantiated each time a new component instance is created. This is especially true for array or object values. Otherwise your default value (array or object) will be shared between component instances and this may generate unexpected issues.

To illustrate this let's look at the following example:

```jsq
import Qute from '@qutejs/runtime';

<q:template name='MyElementTemplate'>
    <div>{{label}}: {{myValue}} <button @click='changeValue'>Update value</button></div>
</q:template>

<q:template name='RootTemplate'>
    <div>
    <my-element parent={this} q:ref='first' label='The first instance'/>
    <my-element parent={this} q:ref='second' label='The second instance'/>
    </div>
</q:template>

const MyElement = Qute(MyElementTemplate, {
    changeValue() {
        this.myValue.push('X');
		this.$attrs.parent.updateKids();
    }
}).properties({
    myValue: [1,2,3],
});
export default Qute(RootTemplate, {
  updateKids() {
    this.first.update();
    this.second.update();
  }
});
```

In this example we created 2 components of type `MyElement` that will have a `myValue` property that **will share** the default value (i.e. the array: `[1,2,3]`). If you click on `Update value` button for the first component it will push `'X'` in the array then force an update on the two components. You can notice that **both component instances** will have the `myValue` property updated!

This is normal since you defined the property using:

```javascript
properties({
    myValue: [1,2,3],
})
```

The same [1,2,3] array will be shared by the properties on all component instances. In order to avoid this you need to create the [1,2,3] array at the time of the component instantiation so that each instance will end up with a different array instance.

There are three ways to achieve this:

1. Either you define all properties inside a function that returns the properties map. **Example:**

```javascript
properties(app => ({
    myValue: [1,2,3],
}))
```

This is working since Qute will only call the function to get the property map each time an instancew is created.

2. Either you use the `_Array` property type which will make a copy of the default value each time a new component instance is created:

```javascript
properties({
    myValue: _Array([1,2,3])
})
```

3. Another way is to use the `_Any` property type since it provides a way to define default value factories:

```javascript
properties({
    myValue: _Any(app => [1,2,3])
})
```

Which technique to use is up to you and to your needs. The `_Array` solution has the benefit of rejecting input values that are not arrays by throwing an error.

Let's rewrite the example above using the second technique:

```jsq
import Qute from '@qutejs/runtime';
import { _Array } from '@qutejs/types';

<q:template name='MyElementTemplate'>
    <div>{{label}}: {{myValue}} <button @click='changeValue'>Change value</button></div>
</q:template>

<q:template name='RootTemplate'>
    <div>
    <my-element parent={this} q:ref='first' label='The first instance'/>
    <my-element parent={this} q:ref='second' label='The second instance'/>
    </div>
</q:template>

const MyElement = Qute(MyElementTemplate, {
    changeValue() {
        this.myValue.push('X');
		this.$attrs.parent.updateKids();
    }
}).properties({
    myValue: _Array([1,2,3]),
});
export default Qute(RootTemplate, {
  updateKids() {
    this.first.update();
    this.second.update();
  }
});
```

As you can see, now the property are no more sharing the same value.

## Creating custom property types

The simplest way to create new property types is to use the `_Any` property type.

Let's create a `_Position` property type which will only accept values in the set: `['left', 'top', 'right', 'bottom']`.

```jsq
import Qute from '@qutejs/runtime';
import { _Any } from '@qutejs/types';

const POSITION_VALUES = ['left', 'top', 'right', 'bottom'];
function checkPosition(value) {
    if (POSITION_VALUES.indexOf(value) === -1) throw new Error('Invalid position: '+value);
    return value;
}
const _Position = function(value) {
    return _Any(checkPosition(value)).assign(checkPosition);
}

<q:template name='MyElementTemplate'>
    <div>Position: {{position}}</div>
</q:template>

<q:template name='RootTemplate'>
    <my-element position='top' />
</q:template>

const MyElement = Qute(MyElementTemplate).properties({
    position: _Position('left'),
});
export default Qute(RootTemplate);

```

Try to change the `position` attribute to some invalid value - you will get an error.

If you want to control how the binding is done you need to implement your own property from scratch. A property object mjust provide a `__qute_prop(vm, key)` method which is doing the binding and is returning a property definition as accepted by `Object.createProperty()`. You can also implemnent an optional methjod `_assign(value, oldValue)` that will be called when a new value is set to the property so you can perform value checks or conversions, then return the value to set. Check the sources for examples.