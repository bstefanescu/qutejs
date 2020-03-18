# The q:on attribute

This attribute is an alternative notation for **event attributes**.  \
See the **[Templates](#/templates)** section for more details.

## Example

```jsq
<x-tag name='root'>
  <div>
    <button @click='handleClick'>Click me: using @</button>
    <button q:onclick='handleClick'>Click me: using q:on</button>
  </div>
</x-tag>

export default Qute('root', {
	handleClick() {
		alert('hello!');
	}
});
```
