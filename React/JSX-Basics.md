JSX is HTML inside javascript. In here, you would have functions returning HTML code.

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

Restrictions: functions must start with capital. Random is alright but random isn't acceptable
