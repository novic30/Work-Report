When writing in html, based on the examples, we only have to write:
```js
<script src="two.js" type="module"></script>
```

This is because two.js is dependent on one.js since it imports from one.js and thus, one.js will also be loaded.
