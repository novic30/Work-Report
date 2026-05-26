Both use ... syntax.
Spread operator expands/unpacks values.
````js
let arr = [1,2,3,4,5];
console.log(...arr); // Output is 1 2 3 4 5

let newArr = [...arr,6,7]; //[1,2,3,4,5,6,7]

let oneThroughSevenArr = [...arr,...newArr];
let str = "Bob";
console.log(...str); // B o b

let bobArr = [...str]; // ['B','o','b']

//Can pass array as function parameter:
print7(...newArr);
//same as
print7(1,2,3,4,5,6,7)l


//Also spread works sane for object like array
```
The above actually copies the array instead of referencing.




Rest Operator collects/packs values.
```js
function sumOfAllInputs(...arr) {
	let sumR = arr.reduce((acc,prev)=> acc+prev,0);
	return sumR;
	}
let sumOfRandomNum = sum(1,2,5443,435,5,654,64)
```

Rest in destructuring:
```js
let arr = ["a","b","c"];
let [user1, user2] = arr; //["a","b"]
let [u1,u2,u3]=arr;//["a","b","c"]
let [u1, ...restU] = arr;
console.log(u1); //a is output
onsole.log(restU); // ['b','c'] is output
```
