Primitives are basic values. When you assign a primitive to a variable, the variable actually contains the value.
Eg. Types: String, Number, Boolean, Null, Undefined, Symbol, BigInt.




Reference types are objects. When you assign an object to a variable, the variable does not hold the object itself; it holds a reference (a memory address/pointer) to where that object lives in the computer's memory (the Heap).
Types: Object, Array, Function.



let user = { name: "Odin" };
let admin = user; // They share the same address!
admin.name = "Thor"; 
console.log(user.name); // Thor (The original changed!)
Remember that [] === [] is false because they are different addresses.
