```js
// one.js
export default "Hello, Odinite!";
export const farewell = "Bye bye, Odinite!";
```

```js
// two.js
import greeting, { farewell } from "./one.js";

console.log(greeting); // "Hello, Odinite!"
console.log(farewell); // "Bye bye, Odinite!"
```
