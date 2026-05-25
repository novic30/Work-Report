Unlike primitives, objects are used to store keyed collections of various data and more complex entities.

An object can be created with curly braces {…} with an optional list of properties. A property is a “key: value” pair, where key is a string (also called a “property name”), and value can be anything.
```js
let user = new Object(); // "object constructor" syntax
//OR
let user = {};  // "object literal" syntax
//for making an object

//Object with details
let user = {     // an object
  name: "John",  // by key "name" store value "John"
  age: 30,        // by key "age" store value 30
};
```

Access values and get property values of the object:
```js
alert( user.name ); // John
alert( user.age ); // 30
```
Create and remove values:
```js
The value can be of any type. Let’s add a boolean one:
user.isAdmin = true;
delete user.age;
This resulted in user being {name:"John", isAdmin:true}

"likes birds": true  // multiword property name is also possible
user["likes birds"] = true; // To change multi word value

//ALTERNATIVELY
let key = "likes birds";
// same as user["likes birds"] = true;
user[key] = true;

let key = prompt("What do you want to know about the user?", "name");

// access by variable
alert( user[key] ); // John (if enter "name")
alert(user.key) DOESNT WORK EVEN WITH ONE WORD PROPERTY
```

Using User input to instantiate an Object:
```js
let fruit = prompt("Which fruit to buy?", "apple");

let bag = {
  [fruit]: 5, // the name of the property is taken from the variable fruit
};

alert( bag.apple ); // 5 if fruit="apple"
```

```js
bag[fruit] = 5; // Create fruit key as well with value 5

let fruit = 'apple';
let bag = {
  [fruit + 'Computers']: 5 // bag.appleComputers = 5
};
```
