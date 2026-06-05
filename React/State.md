State changes the UI dynamically. Suppose you click a button, the UI will change immediately without reloadignt he entire page.
State is like the internal data while props is external data.

useState is used for States.

```jsx
const [someState, funcForStateChanges] = useState("Initial value which could be 0 or wuteber datatype");

function changeState() {
	funForStateChanges("New Value to replace old and could do things like count+1 for incrementing");
}
```
Here, no let is used to make sure that there's no accidental changes.

Initial state could be number, String, Object, Array.

```jsx
let [userData, setUserData] = useState({name:'Rando', age: 21, passion: 'Something Random'});
```

Ways of updating state:
```jsx
Direct Update:
setCount(count+1)
Function update:
setCount(prev => prev+1)
```
