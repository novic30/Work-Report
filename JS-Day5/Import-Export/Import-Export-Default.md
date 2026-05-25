Default exports are not as flexible as named imports and can only iport one thing.
Let’s default export our greeting string from one.js.
```js
// one.js
export default "Hello, Odinite!";
```
Or on a separate line:
```js
// one.js
const greeting = "Hello, Odinite!";
export default greeting;
```
When importing the default export from one.js, in two.js, we can change the name:
```js
// two.js
import helloOdinite from "./one.js";

console.log(helloOdinite); // "Hello, Odinite!"
```

