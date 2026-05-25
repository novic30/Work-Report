Primitives are basic values. When you assign a primitive to a variable, the variable actually contains the value.
Eg. Types: String, Number, Boolean, Null, Undefined, Symbol, BigInt.




Reference types are objects. When you assign an object to a variable, the variable does not hold the object itself; it holds a reference (a memory address/pointer) to where that object lives in the computer's memory (the Heap).
Types: Object, Array, Function.


```js
let user = { name: "Odin" };
let admin = user; // They share the same address!
admin.name = "Thor"; 
console.log(user.name); // Thor (The original changed!)
Remember that [] === [] is false because they are different addresses.


//Also, Object is reference not primitive bc:
// obj contains a reference to the object we defined on the right side
const obj = { data: 42 };
// objCopy will contain a reference to the object referenced by obj
const objCopy = obj;

// making changes to objCopy will make changes to the object that it refers to
objCopy.data = 43;

console.log(obj); // { data: 43 }
console.log(objCopy); // { data: 43 }
```
