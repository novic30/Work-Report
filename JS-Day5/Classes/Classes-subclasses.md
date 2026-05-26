```js
class ChildClass extends ParentClass { /* … */ }
```

The extends keyword can be used to subclass custom classes as well as built-in objects.
Any constructor that can be called with new and has the prototype property can be the candidate for the parent class. The two conditions must both hold — for example, bound functions and Proxy can be constructed, but they don't have a prototype property, so they cannot be subclassed.

```js
class ParentClass {
  constructor() {
    return 1;
  }
}

console.log(new ParentClass()); // ParentClass {}
// The return value is ignored because it's not an object
// This is consistent with function constructors

class ChildClass extends ParentClass {
  constructor() {
    super();
    return 1;
  }
}

console.log(new ChildClass()); // TypeError: Derived constructors may only return object or undefined
```
