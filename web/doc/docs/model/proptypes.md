# Property Types

Property types gives you more control over the reactive properties. Types are specified by passing a type object as the argument of the `@Property()` decorator.

Here is the list of built-in property types:

+ String
+ Number
+ Boolean
+ Date
+ Array
+ Object
+ Function
+ List
+ Link

When specifying default primitive values (i.e. String, Boolean and Number) on a property you don't need to declare a type since primitive types are autmatically inferred from defualt value types.

A property type can be used to control the following aspects:

1. Check the input value and transform it (if possible) to the expected type. May thrown an error if the value is not accepted.
2. Control how the property is bound in the component instance. This can be used to bind external data models as component properties. See *_Link** property type.

You can also define your own custom property types. We will see how at the bottom of this page.

## Built-in property types

### `String`

A string property will transform any input value that is not `null` or `undefined` to a string using the `String()` function.

**Example**

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

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

@Template(MyElementTemplate)
class MyElement extends ViewModel {
    @Property(String) theString;
}

@Template(RootTemplate)
class RootComponent extends ViewModel {
  now() {
    return new Date();
  }
}

export default RootComponent;
```


### `Number`

A number property that will transform any input value that is not `null` or `undefined` to a number using the `Number()` function. It will thrown an exception if the tranformed value is `NaN`.

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

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

@Template(MyElementTemplate)
class MyElement extends ViewModel {
    @Property(Number) theNumber = 0;
}

@Template(RootTemplate)
class RootComponent extends ViewModel {
  now() {
    return new Date();
  }
}

export default RootComponent;
```

### `Boolean`

A boolean property that will transform any input value that is not `null` or `undefined` to a boolean using the `Boolean()` function.

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

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

@Template(MyElementTemplate)
class MyElement extends ViewModel {
    @Property(Boolean) theBoolean = true;
}

@Template(RootTemplate)
class RootComponent extends ViewModel {
  now() {
    return new Date();
  }
}

export default RootComponent;
```

### `Date`

A date property that will transform any input value that is not `null` or `undefined` or already a `Date` object to a date  using `new Date(inputValue)` function. It will throw an exception if the input value cannot be transformed to a date.

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

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

@Template(MyElementTemplate)
class MyElement extends ViewModel {
    @Property(Date) theDate;
}

@Template(RootTemplate)
class RootComponent extends ViewModel {
  now() {
    return new Date();
  }
}

export default RootComponent;
```

### `Array`

An array property that will throw an exception if the input value is defined (`inputValue != null`) and it is not an array.

**Usage:**

```javascript
import Qute from '@qutejs/runtie';
const { ViewModel, Template, Property } = Qute;

class MyElement extends ViewModel {
    @Property(Array) items = [ 1, 2, 3 ];
}
```


### `Object`

A property that will only accept objects as values. If the input value is defined (i.e. not null and not undefined) and is not of type 'object' then an exeption will be thrown.

**Usage:**

```javascript
import Qute from '@qutejs/runtie';
const { ViewModel, Template, Property } = Qute;

class MyElement extends ViewModel {
    @Property(Object) name = {
        firstName: 'Foo',
        lastName: 'Bar'
    };
    @Property(Object) items = new Map());
}
```

### `Function`

A property that will only accept `function` as values. If the input value is defined and is not a function then an exeption will be thrown.

**Usage:**

```javascript
import Qute from '@qutejs/runtie';
const { ViewModel, Template, Property } = Qute;

class MyElement extends ViewModel {
    @Property(Function) hello = () => window.alert('Hello!');
}
```

### `List`

When you are using the **[q:for](#/attributes/q-for)** directive to render reactive lists we recommend to use a `_List` property to hold the reactive array instead of an array property. This is because the _List property is providing an straightforward way to modify lists and updating the rendering.
The List property type is designed to work with  directive to render reactive lists. When using `List` properties you must define a list **key** as the second argument of the `@Property` decorator. The list key must provide an unique identifier of type `String` for the list items. It should be either the name of a item property to be used as the item ID, either a function which takes an item and return an ID.

The list `key` will be used by the `q:for` directive so we will not have to define one using `q:key` attribute.

The property accepts either `null` or `undefined` values either `arrays`. If an invalid value is set an exception is thrown.

**Example**

```javascript
import Qute from '@qutejs/runtie';
const { ViewModel, Template, Property, List } = Qute;

class MyElement extends ViewModel {
    @Property(List, 'id') items = [{id: 1, text: 'item1'}, {id: 2, text: 'item1'}];
}
```

See the **[q:for](#/attributes/q-for)** directive for more on the `List` API and the **[Todo List](#/examples/todo)** page for a complete example using `List`.

### `Link`

This is a special property type that can be used to bind the `ViewModel` property to an application model property.

**Example**

```javascript
import Qute from '@qutejs/runtie';
const { ViewModel, Template, Property, Link } = Qute;

class MyElement extends ViewModel {
    @Property(Link, 'UserSession/user') user;
}
```

In this example the application data model property identified by `UserSession/user` is bound to the `user` property of the `MyElement` component. If the application property changes the reactive user property will change too and component DOM will be updated. Also, if you set the `user` property the application property bound to it will change too.

The `Link` object can also be used as a standalone decorator - that works as a shortcut to `@Property(Link, key)`:

```javascript
import Qute from '@qutejs/runtie';
const { ViewModel, Template, Property, Link } = Qute;

class MyElement extends ViewModel {
    @Link('UserSession/user') user;
}
```

The above two examples are equivalent.

**Note** that the `Link` property cannot take a defsault value. If you specify one it will be ignored.

You can find here more informations about **[Application Model Properties](#/app/data)**.  \
Here is a **[complete example](#/app/example)** on using the `Link` property type.


## Registering custom property types

To tegister a custom property type you must use the `Property.registerType(Type, typeDef)` where the Type is a constructor for the property value and typeDef an object providing one or more methods as follows:

- `createProp(viewModel, key, value, arg)` - initializwe the property and create the property descriptor to be used with `Object.defineProperty()`. `arg` is the second argument of the @Property decorator if any.
- `checkArgs(key, value, arg)` - validate `createProp` arguments. This method is called in the ViewModel instance context (i.e. `this` points to the Viewmodel instance).
- `init(key, value, arg, setter)` - initialize the default value of the `key` property. This method is called in the ViewModel instance context (i.e. `this` points to the Viewmodel instance).
- `descriptor(key, arg, setter)` - create the property descriptor to be used with `Object.defineProperty()`.  This method is called in the ViewModel instance context (i.e. `this` points to the Viewmodel instance).
- `setter(value, arg)` - a function to be called when a value is set to the property. he function should return the value to be set (converting it if needed) or should thrown an exception if the value is not supported. The `arg` argument represent the second argument used for the `@Property` decorator.

The type definition must define either the `createProp` method, either one or more of the other methods.

Here is an example of creating a new property type that accepts `Map` instances as values:

```jsq
import Qute from '@qutejs/runtime';
const { ViewModel, Template, Property } = Qute;

// only accepts undefined, null or `Map` values.
Property.registerType(Map, {
    setter(value, arg) {
        if (value != null && !(value instanceof Map)) {
            throw new Error('Unsupported value for Map property: '+value);
        }
        return value;
    }
});

<q:template name='MyTemplate'>
    <for value='key in map'>
        <div>{{key}} = {{map[key]}}</div>
    </for>
</q:template>
<q:template name='RootTemplate'>
    <MyComponent map={map}/>
</q:template>

@Template(MyTemplate)
class MyComponent extends ViewModel {
    @Property(Map) map;
}

@Template(RootTemplate)
class RootComponent extends ViewModel {
    get map() {
        let map = new Map();
        map['key1'] = 'val1';
        map['key2'] = 'val2';
        return map;
    }
}

export default RootComponent;
```