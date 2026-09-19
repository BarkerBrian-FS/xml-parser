import "./App.css";
import { useEffect } from "react";

function App() {
  const xmlData = `<employee>
      <name>Brian</name>
      <department>Engineering</department>
    </employee>
  `;
  useEffect(() => {
    fetch("http://localhost:5000/api/xml/analyze", {
      method: "POST",
      headers: {
        "Content-type": "application/xml",
      },
      body: xmlData,
    })
      .then((response) => response.json())
      .then((data) => console.log(data));
  }, []);
  return (
    <>
      <h1></h1>
    </>
  );
}

export default App;
