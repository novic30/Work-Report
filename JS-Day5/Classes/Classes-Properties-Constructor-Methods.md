In constructors, we make up variables which will be used by the class instance by doing this.variableName;

Eg:
```js
class User {
	constructor(name, age) {
		this.name = name;
		this.age = age;	
	}

}
```
For class methods, you would modify values of the instance by using this.variableName as well:
```js
	get name() {
		return this._name;
	}
	set name(name) {
		this._name = name;
	}
```
You could also do name="John" in same indentation as methods similar to java.


In conclusion:
```js
The basic class syntax looks like this:

class MyClass {
  prop = value; // property

  constructor(...) { // constructor
    // ...
  }

  method(...) {} // method

  get something(...) {} // getter method
  set something(...) {} // setter method

  [Symbol.iterator]() {} // method with computed name (symbol here)
  // ...
}
```
