import React, { useState } from "react";
import About from "./About";
import Hero from "./Hero";

const Layout = (props) => {
  console.log(props);

  const [count, setCount] = useState(55);
  const [bgColor, setBgColor] = useState("bg-gray-400");
  function recolorLayoutBlue() {
    setBgColor("bg-sky-200");
  }

  return (
    <div className={`p-[2rem] ${bgcolor}`}>
      Layout
      <Hero data={props.data} count={count} func={recolorLayoutBlue()} />
      <About data={props.data} count={count} />
    </div>
  );
};

export default Layout;
