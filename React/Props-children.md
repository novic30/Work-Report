Props to components are what parameters are to functions. Props are what make the reusable components dynamic. However, these props are immutable meaning that we can't just do obj.name = "Bla" inside Comp function below.
When recieving properties, we would be recieving them as an object. This means that the props calling and using will look something like this:
```jsx
<Comp name="Some Random NAMEEE" age={21} isStudent={true}/> //String, number, boolean


In Comp.jsx
function Comp (obj) {
	return (
		<div>
			<h1> I am {obj.name}</h1>
			<p>I am {obj.age} years old and {obj.isStudent?"I am a Student":"I am not a student"}</p>
		</div>
	)

}
```
Comp could be rewritten in multiple ways like const Comp = (props) => {return()}

Destructuring:
```jsx
function Comp ({name, age, isStudent}) {

	return (
                <div>
                        <h1> I am {name}</h1>
                        <p>I am {age} years old and {isStudent?"I am a Student":"I am not a student"}</p>
                </div>
        )
}
```
Sending object as a prop:
```jsx
<Card data={name:"J",age:20} isStudent={true}>

function Card ({obj, isStudent}) where obj is an object while isStudent is a boolean
const {name,age} = obj;
```


Prop Arrays
function List({items}) {
	return (
	<ul>
	{items.map((item,i)=>(<li key={i}>{item}</li>) )}
	</ul>
	)
}

Props functions
function rando() {
	console.log("fijnrjen");
}
<Something func={rando}/>
In another file component:
function Something({func})



CHILD PROPERTY:
<Comp randomProperty="Secret">
	<h1>HELLO!!!</h1>
</Comp>

now prop would be {randomProperty:'Secret',children:{The entire h1 thingy in a somewhat convoluted way}}

In Comp, it would be accessed by:
props.children when prop is just (props) as input to Comp
