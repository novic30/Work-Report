```js
 let person = {
     name: 'Manas Kumar Lal',
     streetAddress: 'tanti bazar road',
     isMarried: false,
     address:{
         city:'bhagalpur',
         pincode: 812004,
     }
```
Here, to access values from this object:
```js
console.log(person.name);
console.log(person.address.pincode);
```

INSTEAD, you can:
```js
let { isMarried, name, streetAddress, address: {pincode} } = person;
console.log(name);
console.log(pincode);

let arr = [1,2,3];
let [first,second,third] = arr;
console.log(a,b,c);//1 2 3
//Instead of:
console.log(arr[0],arr[1],arr[2]);

let [first, ...rest] = arr;
console.log(rest); //[2,3]
```

You could make use of default values incase of unexpected lack of output:
```js
let [a=0,b=0,c=0] = arr;
```
Easy swapping of vals:
```js
let [a,b]=[1,2]
[a,b]=[b,a]
//a=2,b=1
```
