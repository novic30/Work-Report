import React, { useState } from "react";
import About from "./About";
import Hero from "./Hero";

const Layout = (props) => {
  console.log(props);

  const [count, setCount] = useState(55);

  const [bgColor, setBgColor] = useState("bg-gray-400");
  function recolorLayoutColor(colorData) {
    setBgColor(colorData);
  }

  return (
    <div className={`p-[2rem] ${bgColor}`}>
      Layout
      <Hero data={props.data} count={count} func={recolorLayoutColor} />
      <About data={props.data} count={count} />
    </div>
  );
};

export default Layout;
