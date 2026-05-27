Components are reusable piece of UI.
Additionally, a component can contain many other components.
Eg. Shop listings where the only difference is the items and ratings, images and name and cost (which is provided by Props or Properties). Neverthless, the structure which all the info is presented is the same as if they are the same component reused.


It's written as a function which returns html generally:
```js
function App() {
	return (
		<div>
		<Component/> // There's another component called function Component
		</div>
	)

}


```
