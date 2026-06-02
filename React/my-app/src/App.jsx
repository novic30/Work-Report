import { useState } from "react";
import reactLogo from "./assets/react.svg";
import viteLogo from "./assets/vite.svg";
import heroImg from "./assets/hero.png";
import "./App.css";
import Footer from "./components/Footer";
import Header from "./components/Header";
import Layout from "./components/Layout";

function App() {
  const [data, setData] = useState(0);
  return (
    <>
      <Header data={data} />
      <Layout data={data} />
      <Footer data={data} />
    </>
  );
}

export default App;
