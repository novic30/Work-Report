Private fields are done through #.

Eg
```js
class ClassWithPrivate {
  #privateField;
  #privateFieldWithInitializer = 42;

  constructor(x) {
    this.#privateField = x;
  }


  #privateMethod() {
    // …
  }

  static #privateStaticField;
  static #privateStaticFieldWithInitializer = 42;

  static #privateStaticMethod() {
    // …
  }
}
```
