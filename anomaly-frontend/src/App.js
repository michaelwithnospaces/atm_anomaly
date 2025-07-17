import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Dot
} from "recharts";
// recharts gives you a props object for each data point

function App() {
  // const [name, setName] = useState("Alice");
  // console.log(name);  // "Alice"
  // setName("Bob");     // Updates the state

  // react sees that name changed from "Alice" to "Bob"
  // updates anything on screen using name
  // useState sets the initial value, but it continues to manage and track changes to that value over time
  const [data, setData] = useState([]);
  const [spikes, setSpikes] = useState(1);
  const [drops, setDrops] = useState(1);
  const [contamination, setContamination] = useState(0.1);

  const fetchData = (spikes, drops, contamination) => {
    axios
      .get(`http://localhost:8000/data?spikes=${spikes}&drops=${drops}&contamination=${contamination}`)
      .then((res) => setData(res.data)); // after backend responds
  };

  // [
  //   {
  //     "timestamp": "2025-01-01 00:00:00",
  //     "visits": 150,
  //     "anomaly": false,
  //     "mean": 145.0,
  //     "std": 5.0,
  //     "upper": 155.0,
  //     "lower": 135.0
  //   },
  //   ...
  // ]

  // res.status (e.g., 200)
  // res.headers
  // res.data the actual data asked for


  // useEffect(...)
  //     React hook used to run side effects
  //     runs after the component renders
  //
  // fetchData(spikes, drops, contamination)
  //     calls your backend API using those 3 values as query parameters
  //     updates the data in your component when the backend responds
  //
  // [spikes, drops, contamination]
  //     this is the dependency array
  //     react watches these 3 variables
  //     if any of them changes, React runs the useEffect again
  //     it also runs once on initial mount, even if nothing changed yet
  useEffect(() => {
    fetchData(spikes, drops, contamination);
  }, [spikes, drops, contamination]); // runs on initial load and when spikes or drops update

  // idk
  return (
    <div style={{ padding: 20 }}>
      <h2>Isolation Forest</h2>

      <div style={{ marginBottom: 20 }}>
        <label>
          Spikes:{" "}
          <input
            type="number"
            value={spikes}
            onChange={(e) => setSpikes(Number(e.target.value))}
            min={0}
            max={10}
          />
        </label>
        {"  "}
        <label>
          Drops:{" "}
          <input
            type="number"
            value={drops}
            onChange={(e) => setDrops(Number(e.target.value))}
            min={0}
            max={10}
          />
        </label>
        <label>
          Contamination:{" "}
          <input
            type="number"
            value={contamination}
            onChange={(e) => setContamination(parseFloat(e.target.value))}
            min={0}
            max={1}
            step={0.01}
          />
        </label>
      </div>

      <LineChart width={800} height={400} data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="timestamp" angle={-45} textAnchor="end" height={80} />
        <YAxis />
        <Tooltip />
        <Legend />
        <Line type="monotone" dataKey="visits" stroke="#8884d8" />
        <Line type="monotone" dataKey="upper" stroke="#00c49f" strokeDasharray="5 5" />
        <Line type="monotone" dataKey="lower" stroke="#ff0000" strokeDasharray="5 5" />
        <Line
          type="monotone"
          dataKey="visits"
          dot={(props) =>
            props.payload.anomaly ? (
              <Dot {...props} r={5} fill="red" />
            ) : null
          }
        />
      </LineChart>
    </div>
  );
}

export default App;

// props.payload is the actual data row for that point.

// if backend sends this for one hour
//
// {
//   "timestamp": "2023-01-01 08:00:00",
//   "visits": 300,
//   "anomaly": true,
//   "upper": 180,
//   "lower": 120
// }
//
// Then
//
// props.payload = {
//   timestamp: "2023-01-01 08:00:00",
//   visits: 300,
//   anomaly: true,
//   upper: 180,
//   lower: 120
// }
