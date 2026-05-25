Normally, a function is:
```js
	function randomFunction(someParameter = "Default Value to Return if no input") {
		alert(someParameter);
	}
```
and it's called by:
randomFunction();
randomFunction("Hello World!");


However, there are anonymous functions which don't have function names. These are used as input to other named functions normally:
```js
(function () {
  alert("hello");
});
```

Eg:
```js
function logKey(event) {
  console.log(`You pressed "${event.key}".`);
}

textBox.addEventListener("keydown", logKey);
```
IS THE SAME AS
```js
textBox.addEventListener("keydown", function (event) {
  console.log(`You pressed "${event.key}".`);
});
```



ARROW FUNCTIONS are another way of doing anonymous functions.
Eg. The above example could be rewritten using arrow functions:
```js
textBox.addEventListener("keydown", (event) => {
  console.log(`You pressed "${event.key}".`);
});
```

Additionally, if the arrow function only contains a line returning a modified value, it can be written simply like:
```js
const originals = [1, 2, 3];
const doubled = originals.map(item => item * 2); //SIMPLE without all the wording
console.log(doubled); // [2, 4, 6]
```

Another example:
```js
const textBox = document.querySelector("#textBox");
const output = document.querySelector("#output");

textBox.addEventListener("keydown", (event) => {
  output.textContent = `You pressed "${event.key}".`;
});
```

```js
let double = n => n * 2;
// roughly the same as: let double = function(n) { return n * 2 }

alert( double(3) ); // 6
```

```js
let age = prompt("What is your age?", 18);

let welcome = (age < 18) ?
  () => alert('Hello!') :
  () => alert("Greetings!");

welcome();

```
