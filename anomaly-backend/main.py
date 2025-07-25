# import FastAPI to build the web api
from fastapi import FastAPI, Query

# cors middleware is needed so a frontend app (react rn) on another port (3000) can request data from this api (port 8000)
from fastapi.middleware.cors import CORSMiddleware

import pandas as pd
import numpy as np

# isolation forrest!!
from sklearn.ensemble import IsolationForest

# create instance of the fastapi app which is basically the "server" that will listen for requests
app = FastAPI()

# allow cross-origin requests (cors) so the frontend (on a different port or domain) can access this API
app.add_middleware(
    CORSMiddleware,
    # unlock everything!!!
    allow_origins=["*"],        # allow all domains to connect
    allow_methods=["*"],        # allow all types of http methods (GET, POST, etc.....)
    allow_headers=["*"],        # allow all custom headers
)

# create a route (URL endpoint) for GET requests at /data 
# when user visits http://localhost:8000/data, this function will run
@app.get("/data")
def get_anomaly_data(
    visits_spikes: int = Query(1, ge=0),
    visits_drops: int = Query(1, ge=0),
    withdrawals_spikes: int = Query(1, ge=0),
    withdrawals_drops: int = Query(1, ge=0),
    deposits_spikes: int = Query(1, ge=0),
    deposits_drops: int = Query(1, ge=0),
    checkbalance_spikes: int = Query(1, ge=0),
    checkbalance_drops: int = Query(1, ge=0),
):
    np.random.seed(69)
    timestamps = pd.date_range("2025-01-01", periods=24, freq='h')
    metric_seeds = {"visits": 0, "withdrawals": 1, "deposits": 2, "checkbalance": 3}
    metrics = {
        "visits": {
            "data": np.random.normal(150, 20, 24).astype(int),
            "spikes": visits_spikes,
            "drops": visits_drops,
        },
        "withdrawals": {
            "data": np.random.normal(150, 20, 24).astype(int),
            "spikes": withdrawals_spikes,
            "drops": withdrawals_drops,
        },
        "deposits": {
            "data": np.random.normal(150, 20, 24).astype(int),
            "spikes": deposits_spikes,
            "drops": deposits_drops,
        },
        "checkbalance": {
            "data": np.random.normal(150, 20, 24).astype(int),
            "spikes": checkbalance_spikes,
            "drops": checkbalance_drops,
        },
    }

    # Inject anomalies for each metric
    for metric, info in metrics.items():
        np.random.seed(69 + metric_seeds[metric] * 1000 + info["spikes"] * 100 + info["drops"])
        all_indices = np.arange(24)
        total_anomalies = info["spikes"] + info["drops"]
        if total_anomalies > 0:
            chosen_indices = np.random.choice(all_indices, size=total_anomalies, replace=False)
            spike_indices = chosen_indices[:info["spikes"]]
            drop_indices = chosen_indices[info["spikes"]:info["spikes"] + info["drops"]]
            for idx in spike_indices:
                info["data"][idx] = np.random.randint(270, 350)  # Slightly variable high spike
            for idx in drop_indices:
                info["data"][idx] = np.random.randint(10, 60)    # Slightly variable low drop

    # Prepare output records
    records = []

    # For each metric, fit the model ONCE and get anomaly labels for all hours
    metric_results = {}

    # helper function to estimate contamination dynamically based on IQR
    def estimate_contamination(values):
        q1 = np.percentile(values, 25)
        q3 = np.percentile(values, 75)
        iqr = q3 - q1
        lower_bound = q1 - 1.5 * iqr
        upper_bound = q3 + 1.5 * iqr
        # initially returns boolean array and .sum counts number of true
        outliers = ((values < lower_bound) | (values > upper_bound)).sum()
        return min(max(outliers / len(values), 0.01), 0.5)  # enforce contamination between [0.01, 0.5]

    for metric, info in metrics.items():
        df = pd.DataFrame({"value": info["data"]})
        contamination = estimate_contamination(df["value"].values)  # dynamically calculated contamination
        model = IsolationForest(contamination=contamination)
        df["anomaly"] = model.fit_predict(df[["value"]]) == -1

        masked = df["value"].mask(df["anomaly"])
        interpolated = masked.interpolate(method="linear")
        df["mean"] = interpolated.rolling(3, center=True).mean()
        df["std"] = interpolated.rolling(3, center=True).std()
        df["upper"] = df["mean"] + 2 * df["std"]
        df["lower"] = df["mean"] - 2 * df["std"]
        df.fillna(0, inplace=True)
        metric_results[metric] = df

    for i in range(24):
        record = {"timestamp": str(timestamps[i]), "metrics": {}}
        for metric in metrics.keys():
            df = metric_results[metric]
            record["metrics"][metric] = {
                "value": int(df.loc[i, "value"]),
                "anomaly": bool(df.loc[i, "anomaly"]),
                "mean": float(df.loc[i, "mean"]),
                "std": float(df.loc[i, "std"]),
                "upper": float(df.loc[i, "upper"]),
                "lower": float(df.loc[i, "lower"]),
            }
        records.append(record)

    return records
