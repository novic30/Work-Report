Arrays are an ordered list of elements.

Declaration is done by:
```js
let arr = new Array();
```
OR
```js
let arr = [];
```
Second way is the general way though.

Example:
```js
let fruits = ["Apple", "Orange", "Plum"];

alert( fruits[0] ); // Apple
alert( fruits[1] ); // Orange
alert( fruits[2] ); // Plum
fruits[2] = 'Pear'; 
fruits[3] = 'Lemon';
//RESULT IS ["Apple", "Orange", "Pear", "Lemon"]
alert( fruits.length ); // 4
alert( fruits ); // Apple,Orange,Pear,Lemon
```

Additionally, Arrays in javascript can store data of any type in a single array:
```js
let arr = [ 'Apple', { name: 'John' }, true, function() { alert('hello'); } ];

// get the object at index 1 and then show its name
alert( arr[1].name ); // John

// get the function at index 3 and run it
arr[3](); // hello

alert( fruits[fruits.length-1] ); // GIVES LAST ELEMENT which is Lemon from above
//OR BETTER WAY IS
alert( fruits.at(-1) ); // Lemon
```


Multidimensional arrays
Arrays can have items that are also arrays. We can use it for multidimensional arrays, for example to store matrices:
```js
let matrix = [
  [1, 2, 3],
  [4, 5, 6],
  [7, 8, 9]
];

alert( matrix[0][1] ); // 2, the second value of the first inner array
```
