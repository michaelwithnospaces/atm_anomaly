import { useEffect, useState } from "react";
import axios from "axios";
import { ModeToggle } from "@/components/ModeToggle";
import { Legend } from "@/components/Legend";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Dot } from "recharts";
import { MetricControls } from "@/components/MetricControls";
import { BarChart, Bar, Cell, XAxis as BarXAxis, YAxis as BarYAxis, Tooltip as BarTooltip, ResponsiveContainer as BarResponsiveContainer } from "recharts";

const METRICS = [
  { key: "visits", label: "Visits", color: "hsl(var(--chart-1))" },
  { key: "withdrawals", label: "Withdrawals", color: "hsl(var(--chart-2))" },
  { key: "deposits", label: "Deposits", color: "hsl(var(--chart-3))" },
  { key: "checkbalance", label: "Check Balance", color: "hsl(var(--chart-4))" },
];

const Index = () => {
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

  // Helper to get all alerts (anomalies) from the data
  const getAllAlerts = () => {
    const alerts = [];
    data.forEach((row) => {
      for (const m of METRICS) {
        if (row.metrics[m.key].anomaly) {
          alerts.push({
            category: m.label,
            key: m.key,
            color: m.color,
            value: row.metrics[m.key].value,
            timestamp: row.timestamp,
          });
        }
      }
    });
    return alerts;
  };

  // Helper to count alerts per category
  const getAlertCount = (metricKey: string) =>
    data.filter((row) => row.metrics[metricKey].anomaly).length;

  // Helper to compute severity buckets for a given metric
  const getSeverityBucketsForMetric = (metricKey) => {
    const buckets = { Low: 0, Medium: 0, High: 0 };
    data.forEach((row) => {
      const metric = row.metrics[metricKey];
      if (metric.anomaly) {
        const std = metric.std || 1; // avoid div by zero
        const z = Math.abs((metric.value - metric.mean) / std);
        if (z < 2) buckets.Low++;
        else if (z < 4) buckets.Medium++;
        else buckets.High++;
      }
    });
    return [
      { name: "Low", count: buckets.Low },
      { name: "Medium", count: buckets.Medium },
      { name: "High", count: buckets.High },
    ];
  };

  // Helper to compute total severity buckets across all metrics
  const getTotalSeverityBuckets = () => {
    const buckets = { Low: 0, Medium: 0, High: 0 };
    data.forEach((row) => {
      for (const m of METRICS) {
        const metric = row.metrics[m.key];
        if (metric.anomaly) {
          const std = metric.std || 1;
          const z = Math.abs((metric.value - metric.mean) / std);
          if (z < 2) buckets.Low++;
          else if (z < 4) buckets.Medium++;
          else buckets.High++;
        }
      }
    });
    return [
      { name: "Low", count: buckets.Low },
      { name: "Medium", count: buckets.Medium },
      { name: "High", count: buckets.High },
    ];
  };

  return (
    <div className="min-h-screen bg-background p-6">
      {/* Header */}
      <header className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
            ATM Anomaly Detection
          </h1>
          <p className="text-muted-foreground">Isolation Forest Analysis Dashboard</p>
        </div>
        <ModeToggle />
      </header>

      {/* Global Legend */}
      <Legend />

      {/* Dashboard banners */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {METRICS.map((m) => (
          <div key={m.key} className="flex flex-col items-center justify-center p-4 rounded-lg border-2 font-semibold text-lg" style={{ borderColor: m.color, background: m.color + '22', color: m.color }}>
            {m.label} Alerts: <span className="font-bold" style={{ color: m.color }}>{getAlertCount(m.key)}</span>
          </div>
        ))}
      </div>

      {/* Active Alerts and Total Severity Row */}
      <div className="w-full flex flex-col lg:flex-row gap-8 mb-8 items-stretch">
        {/* Active Alerts */}
        <div className="flex-1 w-full p-4 rounded-lg border-2 bg-card border-border shadow">
          <h4 className="mb-2 font-semibold text-foreground">Active Alerts</h4>
          {getAllAlerts().length === 0 ? (
            <div className="text-muted-foreground">No active alerts</div>
          ) : (
            <ul className="list-none p-0 m-0">
              {getAllAlerts().map((alert, idx) => (
                <li key={idx} className="flex items-center gap-6 mb-2 p-2 rounded bg-muted" style={{ borderLeft: `6px solid ${alert.color}` }}>
                  <span className="font-bold" style={{ color: alert.color }}>
                    Category: {alert.category}
                  </span>
                  <span className="font-mono text-foreground">
                    Value: {alert.value}
                  </span>
                  <span className="text-muted-foreground">
                    Time: {alert.timestamp}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
        {/* Total Anomaly Severity Chart */}
        <div className="flex-1 w-full p-4 rounded-lg border-2 bg-card border-border shadow flex flex-col items-center justify-center">
          <h4 className="mb-2 font-semibold text-foreground">Total Anomaly Severity</h4>
          <BarResponsiveContainer width="100%" height={220}>
            <BarChart data={getTotalSeverityBuckets()}>
              <BarXAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 18, fontWeight: 600 }} />
              <BarYAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 18, fontWeight: 600 }} />
              <BarTooltip cursor={{ fill: "hsl(var(--muted))" }} />
              <Bar dataKey="count">
                {getTotalSeverityBuckets().map((entry, idx) => (
                  <Cell key={`cell-${idx}`} fill={
                    entry.name === "Low"
                      ? "hsl(var(--success))"
                      : entry.name === "Medium"
                      ? "hsl(var(--warning))"
                      : "hsl(var(--error))"
                  } />
                ))}
              </Bar>
            </BarChart>
          </BarResponsiveContainer>
          <div className="mt-3 text-base text-muted-foreground text-center">
            Severity is based on z-score: |value - mean| / std<br />
            Low: &lt;2, Medium: 2-4, High: &gt;=4
          </div>
        </div>
      </div>

      {/* Severity Charts for Each Metric in a horizontal row below Active Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-8 w-full">
        {METRICS.map((metric, idx) => (
          <div key={metric.key} className="p-4 rounded-lg border-2 bg-card border-border shadow flex flex-col">
            <div className="font-semibold text-lg text-foreground text-center mb-3">{metric.label} Anomaly Severity</div>
            <BarResponsiveContainer width="100%" height={220}>
              <BarChart data={getSeverityBucketsForMetric(metric.key)}>
                <BarXAxis dataKey="name" tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 18, fontWeight: 600 }} />
                <BarYAxis allowDecimals={false} tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 18, fontWeight: 600 }} />
                <BarTooltip cursor={{ fill: "hsl(var(--muted))" }} />
                <Bar dataKey="count">
                  {getSeverityBucketsForMetric(metric.key).map((entry, idx2) => (
                    <Cell key={`cell-${idx2}`} fill={
                      entry.name === "Low"
                        ? "hsl(var(--success))"
                        : entry.name === "Medium"
                        ? "hsl(var(--warning))"
                        : "hsl(var(--error))"
                    } />
                  ))}
                </Bar>
              </BarChart>
            </BarResponsiveContainer>
            <div className="mt-3 text-base text-muted-foreground text-center">
              Severity is based on z-score: |value - mean| / std<br />
              Low: &lt;2, Medium: 2-4, High: &gt;=4
            </div>
          </div>
        ))}
      </div>

      {/* 2x2 Grid Layout */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {METRICS.map((metric) => (
          <div key={metric.key} className="flex flex-col space-y-4">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Metric Chart */}
              <div className="flex-1">
                <div className="bg-card border border-border rounded-lg shadow-sm p-4">
                  <h3 className="text-lg font-semibold mb-4">{metric.label}</h3>
                  <div className="w-full overflow-x-auto">
                    <ResponsiveContainer width="100%" height={300}>
                      <LineChart 
                        data={getChartData(metric.key)} 
                        margin={{ top: 5, right: 20, left: 20, bottom: 60 }}
                      >
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                        <XAxis 
                          dataKey="timestamp" 
                          angle={-45} 
                          textAnchor="end" 
                          height={80}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          stroke="hsl(var(--border))"
                        />
                        <YAxis 
                          tickCount={9}
                          domain={[0, 400]} 
                          interval={0} 
                          tickFormatter={(v) => v.toString()}
                          ticks={[0, 50, 100, 150, 200, 250, 300, 350, 400]}
                          tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }}
                          stroke="hsl(var(--border))"
                        />
                        <Tooltip 
                          contentStyle={{
                            backgroundColor: "hsl(var(--popover))",
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "var(--radius)",
                            color: "hsl(var(--popover-foreground))"
                          }}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="value" 
                          stroke={metric.color} 
                          strokeWidth={2}
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="upper" 
                          stroke="hsl(var(--success))" 
                          strokeDasharray="5 5" 
                          strokeWidth={1.5}
                          dot={false}
                        />
                        <Line 
                          type="monotone" 
                          dataKey="lower" 
                          stroke="hsl(var(--error))" 
                          strokeDasharray="5 5" 
                          strokeWidth={1.5}
                          dot={false}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          dot={(props: any) =>
                            props.payload.anomaly ? (
                              <Dot {...props} r={4} fill="hsl(var(--error))" stroke="hsl(var(--background))" strokeWidth={1} />
                            ) : null
                          }
                          strokeOpacity={0}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
              
              {/* Controls */}
              <div className="lg:w-48">
                <MetricControls
                  metric={metric}
                  params={params}
                  onParamChange={handleParamChange}
                  onContaminationBlur={handleContaminationBlur}
                />
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Index;
