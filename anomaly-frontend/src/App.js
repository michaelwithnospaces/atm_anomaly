import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, Dot
} from "recharts";

const METRICS = [
  { key: "visits", label: "Visits", color: "#8884d8" },
  { key: "withdrawals", label: "Withdrawals", color: "#82ca9d" },
  { key: "deposits", label: "Deposits", color: "#ffc658" },
  { key: "checkbalance", label: "Check Balance", color: "#ff7300" },
];

function App() {
  const [data, setData] = useState([]);
  // Controls for each metric
  const [params, setParams] = useState({
    visits_spikes: 1,
    visits_drops: 1,
    visits_contamination: 0.1,
    withdrawals_spikes: 1,
    withdrawals_drops: 1,
    withdrawals_contamination: 0.1,
    deposits_spikes: 1,
    deposits_drops: 1,
    deposits_contamination: 0.1,
    checkbalance_spikes: 1,
    checkbalance_drops: 1,
    checkbalance_contamination: 0.1,
  });

  const fetchData = () => {
    // Ensure all contamination values are valid before making the request
    const safeParams = { ...params };
    for (const m of METRICS) {
      const key = `${m.key}_contamination`;
      let val = safeParams[key];
      if (val === "" || val === undefined || val === null || isNaN(Number(val)) || Number(val) <= 0) {
        safeParams[key] = 0.01;
      } else {
        safeParams[key] = Number(val);
      }
    }
    // Build query string
    const query = Object.entries(safeParams)
      .map(([k, v]) => `${k}=${v}`)
      .join("&");
    axios
      .get(`http://localhost:8000/data?${query}`)
      .then((res) => setData(res.data))
      .catch(() => {}); // Silently ignore errors
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line
  }, [params]);

  // Transform data for each metric for recharts
  const getChartData = (metricKey) =>
    data.map((row) => ({
      timestamp: row.timestamp,
      value: row.metrics[metricKey].value,
      anomaly: row.metrics[metricKey].anomaly,
      mean: row.metrics[metricKey].mean,
      std: row.metrics[metricKey].std,
      upper: row.metrics[metricKey].upper,
      lower: row.metrics[metricKey].lower,
    }));

  // Handler for input changes
  const handleParamChange = (metric, field, value) => {
    setParams((prev) => ({
      ...prev,
      [`${metric}_${field}`]: value,
    }));
  };

  // Handler for contamination blur (when input loses focus)
  const handleContaminationBlur = (metric, value) => {
    if (isNaN(value) || value <= 0 || value === "" || value === undefined || value === null) {
      setParams((prev) => ({
        ...prev,
        [`${metric}_contamination`]: 0.01,
      }));
    }
  };

  return (
    <div style={{ padding: 20 }}>
      <h2>ATM Anomaly Detection (Isolation Forest)</h2>
      <div>
        {METRICS.map((m) => (
          <div key={m.key} style={{ marginBottom: 48, display: 'flex', alignItems: 'flex-start', gap: 32 }}>
            <div style={{ minWidth: 220, background: "#f7f7f7", padding: 16, borderRadius: 8 }}>
              <h4 style={{ margin: 0 }}>{m.label} Controls</h4>
              <label>
                Spikes: <input type="number" min={0} max={10} value={params[`${m.key}_spikes`]} onChange={e => handleParamChange(m.key, "spikes", Number(e.target.value))} />
              </label>
              <br />
              <label>
                Drops: <input type="number" min={0} max={10} value={params[`${m.key}_drops`]} onChange={e => handleParamChange(m.key, "drops", Number(e.target.value))} />
              </label>
              <br />
              <label>
                Contamination: <input
                  type="number"
                  min={0.01}
                  max={1}
                  step={0.01}
                  value={params[`${m.key}_contamination`]}
                  onChange={e => handleParamChange(m.key, "contamination", e.target.value)}
                  onBlur={e => handleContaminationBlur(m.key, parseFloat(e.target.value))}
                />
              </label>
            </div>
            <div>
              <h3>{m.label} Over Time</h3>
              <LineChart width={800} height={350} data={getChartData(m.key)}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="timestamp" angle={-45} textAnchor="end" height={80} />
                <YAxis tickCount={Math.ceil((400-0)/50)+1} domain={[0, 400]} interval={0} tickFormatter={v => v} ticks={[0,50,100,150,200,250,300,350,400]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="value" stroke={m.color} name={m.label} />
                <Line type="monotone" dataKey="upper" stroke="#00c49f" strokeDasharray="5 5" name="Upper Bound" />
                <Line type="monotone" dataKey="lower" stroke="#ff0000" strokeDasharray="5 5" name="Lower Bound" />
                <Line
                  type="monotone"
                  dataKey="value"
                  dot={(props) =>
                    props.payload.anomaly ? (
                      <Dot {...props} r={5} fill="red" />
                    ) : null
                  }
                  strokeOpacity={0}
                  legendType="none"
                />
              </LineChart>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
