LET
After declarationm, you can reassign variables without using let keyword again.
```bash
let firstname = "Hoho";
firstname = "First"
console.log(firstname); //Will print First in the console
```


CONST
However, when we don't want any reassignment, we use const keyword:
```bash
const pi = 3.14;
pi = 043853405;//Throws error
console.log(pi);//Doesn't even run
```
Here, an error will be thrown since a const variable isn't allowed to be re-assigned at all. No console.log will even happen.


VAR
Old version of let which also reassigned but isn't really used anymore. It's different from let bc it's function scoped and allows for redeclaration like var x = 5; var x = 7; this would work but wouldn't work for let which doesn't allow redeclaration and also isn't global scoped but is block scoped.
