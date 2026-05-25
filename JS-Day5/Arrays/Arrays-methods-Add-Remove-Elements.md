Array Methods are methods which are built-in for Arrays which provides a lot of functionility.

Firstly, Arrays are often made to function like a queue which is FIFO(First in, First Out).
Relevant methods for queue and methods for adding removing elements from the array are:
arr.push(...items) – adds items to the end,
arr.unshift(...items) – adds items to the beginning,
arr.pop() – extracts/removes an item from the end(second-last element becomes last element and the last element is returned),
arr.shift() – extracts/removes an item from the beginning (2nd element becomes 1st and return 1st element).
```js
delete arr[1]; // Delete a value of an array by making it undefined while the arr.length remains same
//Result for ["I", "go", "home"] is ["I",  , "home"]
```

Splice method:
```js
let arr = ["I", "study", "JavaScript"];
arr.splice(1, 1); // from index 1 remove 1 element
alert( arr ); // ["I", "JavaScript"]



In the next example, we remove 3 elements and replace them with the other two:

let arr = ["I", "study", "JavaScript", "right", "now"];
// remove 3 first elements and replace them with another
arr.splice(0, 3, "Let's", "dance");
alert( arr ) // now ["Let's", "dance", "right", "now"]

let removed = arr.splice(0, 2);
alert( removed ); // "Let's", "dance" <-- array of removed elements

// from index 2
// delete 0
// then insert "complex" and "language"
arr.splice(2, 0, "complex", "language");
// ["I", "study", "JavaScript"] -> ["I", "study", "complex", "language", "JavaScript"]


```
