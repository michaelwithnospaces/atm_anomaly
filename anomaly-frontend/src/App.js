import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ReferenceDot } from 'recharts';

function App() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const interval = setInterval(fetchData, 1000);
    return () => clearInterval(interval);
  }, []);

  const randomDeposit = () => {
    let deposit = Math.round((Math.random() * 100 - 50) + 500); // mean 500 +-50
    if (Math.random() < 0.1) {
      deposit = Math.round(deposit * (Math.random() < 0.5 ? 0.2 : 3)); // simulate anomaly
    }
    return deposit;
  };

  const fetchData = async () => {
    try {
      const deposit = randomDeposit();
      const res = await axios.post('http://localhost:8000/live', { deposit });
      const { timestamp, deposit: dep, anomaly, mean, upper, lower } = res.data;
      setData((prev) => [...prev.slice(-30), { timestamp, deposit: dep, anomaly, mean, upper, lower }]);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ padding: 40 }}>
      <h2>ATM Deposit Anomaly Detection</h2>
      <LineChart width={900} height={400} data={data}>
        <XAxis dataKey="timestamp" tick={false} />
        <YAxis />
        <CartesianGrid strokeDasharray="3 3" />
        <Tooltip />
        <Line type="monotone" dataKey="deposit" stroke="#8884d8" dot={false} />
        <Line type="monotone" dataKey="mean" stroke="#82ca9d" dot={false} />
        <Line type="monotone" dataKey="upper" stroke="#ff7300" dot={false} />
        <Line type="monotone" dataKey="lower" stroke="#ff7300" dot={false} />
        {data.map((entry, index) =>
          entry.anomaly ? (
            <ReferenceDot
              key={index}
              x={entry.timestamp}
              y={entry.deposit}
              r={6}
              stroke="red"
              fill="red"
              label="Anomaly"
            />
          ) : null
        )}
      </LineChart>
    </div>
  );
}

export default App;
