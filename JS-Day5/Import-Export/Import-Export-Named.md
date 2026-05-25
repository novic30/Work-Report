We have two types of importing and exporting: default and named

Named exports could either stick the export keyword in front of its declaration, or add an export { } somewhere in the file (typically the end):
```js
export const greeting = "Hello, Odinite!";
export const farewell = "Bye bye, Odinite!";
```
OR
```js
const greeting = "Hello, Odinite!";
const farewell = "Bye bye, Odinite!";
export { greeting, farewell };
```

Suppose the above is in one.js and the one which is going to import is two.js which is a sibling js file.
In two.js,  we can import greeting, farewell or both.
```js
import { greeting, farewell } from "./one.js";

// two.js
import { greeting, farewell } from "./one.js";

console.log(greeting); // "Hello, Odinite!"
console.log(farewell); // "Bye bye, Odinite!"

```


