JSX(Javascript XML) is HTML and javascript mixture. It lets you write HTML code inside Javascript. In here, you would have functions returning HTML code.
JSX is syntactic sugar for React.createElement(type, prop, child)

To run javascript inside the HTML return code, the javascript must be inside {} as shown below. Inside {}, you can have variables, function calls which return string etc., ternary operators, and mathematical operations.

Eg.
```jsx
import './App.css'

function App() {

  return (
    <div>
      <div>
	<Navbar />
	<p>Some random text underneath wutever Navbar we would have created in another place(Navbar.jsx)
	{2+2} //Here it will say 4 because inside {} js runs instead of 2+2.	
	</p></div>
    </div>
  )
}

export default App
```

Restrictions: 
- functions must start with capital. Random is alright but random isn't acceptable
- When calling a component with a number parameter, we must write <Component number={2}/> as normal number=2 is not valid and we need {} js to tell the number.
- The functions can only return a single element. Thus, all the elements which we wish to return should be wrapped inside div elements
- These javascript stuff can't be run in components like if-else statements, for loop. This is because {} can only have expressions inside it not statements.
- When embedding css properties in html, you need to wrap it in {} like: <h1 style={{"background-color":"red",fontSize:'60px'}}> where outer {} is for javascript and inner {} is for object. Here, in key:value pair, value must be a string and thus be wrapped in "" or ''. For keys with - inside it, they also need to be strings. Camel case over string wrapping is recommended for key.
- Use className prop for class html attribute
- All elements like img, br must be self-closing
