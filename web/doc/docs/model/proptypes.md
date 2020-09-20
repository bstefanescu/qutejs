# Property Types

Property types allows gives you more control over the reactive properties. You can create your own types if needed, so you can control the property binding process and install custom value checkers.

This feature is provided by the `@qutejs/types` package.

## Built-in property types

By convention, property type names are starting with an underscore followed by a uppercase letter.  \
The built-in property types are:

1. **_String** - transform the input value to a string using `String(inputValue)`.
2. **_Number** - transform the input value to a nuber using `Number(inputValue)`.
3. **_Boolean** - transform the input value to a boolean using `Boolean(inputValue)`.
4. **_Date** - transform the input value in a date using new `new Date(inputValue)`.
5. **_Link** - link the property to an **[Application Model Property](app/data)**.
6. **_Array** - accept only array instances as input values.
7. **_Iterable** - accept only iterable objects as input values (or array like values on browsers not supporting iterables)
8. **_Function** - accept only functions as input value
9. **_Object** - accept any input value. Don't perform any transformation
10. **_Any** -  an alias for **_Object**

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

Here, you can find more information on **[Application Model Properties](app/data)**

### _Array

An array property that will throw an exception if the input value is defined (`inputValue != null`) and it is not an array.

### _Iterable

An iterable property will throw an exception if the input value is defined (`inputValue != null`) and it is not iterable.
On browsers where Iterable objects are supported a simple check to test if the value is an array like object is done.

### _Function

A property that will only accept `function` as values. If the input value is defined and is not a function then an exeption will be thrown.

### _Object

Same as **_Any**. Doesn't do type checks and neither transforms on the input value. It keeps the input value as is.

### _Any -  an alias for **_Object**

An alias to **_Object**.

It is usefull when you don't want to use type constraints on a property bu you need to specify a `factory fucntion` that will create the default property value:

```javascript
Qute(SomeTemplate).properties({
    user: _Any.factory(app => [1,2,3])
});
```

In the example bellow we create a factory based property that will get [1,2,3] as the default value each time a new instance of nthe ViewModel is created.

## Factory based properties

There are cases when you want to generate the default value of a property each time a new `ViewModel` instance is created.

Let's look at the following example:

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

The same [1,2,3] array will be shared by the 2 properties. In order to avoid this you need to create the [1,2,3] array at the time of the component instantiation so that each instance will end up with different array instances.

There are two ways to do this:

1. Either you define all properties inside a function that returns the properties map. **Example:**

```javascript
properties(app => ({
    myValue: [1,2,3],
}))
```

This will work since Qute will only call the function to get the property map each time an instancew is created.

2. Either you use the `factory()` method of the property type. All property types but `_Link` provide a factory method. **Example:**

```javascript
properties({
    myValue: _Any.factory(app => [1,2,3])
})
```

Which technique to use is up to you. The first one will create all the properties default values at component instantiation time (by calling the factory function), while the second one will only call the factory function for the properties you want to.

Let's rewrite the example above using the second technique:

```jsq
import Qute from '@qutejs/runtime';
import { _Any } from '@qutejs/types';

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
    myValue: _Any.factory(app => [1,2,3]),
});
export default Qute(RootTemplate, {
  updateKids() {
    this.first.update();
    this.second.update();
  }
});
```

As you can see, now the property are no more sharing the same value.

