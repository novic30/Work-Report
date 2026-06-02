import React from "react";

const Hero = (props) => {
  console.log(props);

  function makeLayoutBlue() {
    props.func("bg-sky-200");
  }
  return (
    <div className="bg-amber-700">
      <button
        onClick={makeLayoutBlue}
        className="rounded-xl border border-gray-100 bg-gray-500 px-6 py-3 text-sm font-semibold text-gray-700 shadow-sm transition-all duration-200 hover:border-gray-300 hover:bg-gray-50 hover:shadow-md active:scale-95 active:bg-gray-100"
      >
        Make Layout Blue
      </button>
    </div>
  );
};

export default Hero;
