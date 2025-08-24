import { useState } from "react";
import "./App.css";
import MainFile from "./mainfile";

function App() {
  const [count, setCount] = useState(0);

  return (
    <>
      <MainFile />
    </>
  );
}

export default App;
