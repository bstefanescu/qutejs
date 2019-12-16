# The x-on attribute

This attribute is an alternative notation for **event attributes**.  \
See the **[Templates]()** section for more details.

## Example

```jsq
<x-tag name='root'>
  <div>
    <button @click='handleClick'>Click me: using @</button>
    <button x-on:click='handleClick'>Click me: using x-on</button>
  </div>
</x-tag>

export default Qute('root', {
	handleClick() {
		alert('hello!');
	}
});
```
