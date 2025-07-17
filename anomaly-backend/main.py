from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from collections import deque
from sklearn.ensemble import IsolationForest
import pandas as pd
import numpy as np
import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# live buffer for incoming deposits (simulate streaming)
buffer_size = 24  # sliding window of last 24 data points
deposit_buffer = deque(maxlen=buffer_size)
timestamp_buffer = deque(maxlen=buffer_size)

# Input model
class DepositInput(BaseModel):
    deposit: float

# live anomaly detection endpoint
@app.post("/live")
def detect_live_anomaly(data: DepositInput):
    deposit = data.deposit
    timestamp = datetime.datetime.now()

    deposit_buffer.append(deposit)
    timestamp_buffer.append(timestamp)

    if len(deposit_buffer) < 6:
        return {
            "timestamp": str(timestamp),
            "deposit": deposit,
            "anomaly": False,
            "reason": "waiting for more data"
        }

    # create df from buffer
    df = pd.DataFrame({
        "timestamp": list(timestamp_buffer),
        "deposit": list(deposit_buffer)
    })

    # run Isolation Forest on buffer
    model = IsolationForest(contamination=0.1, random_state=42)
    df["anomaly"] = model.fit_predict(df[["deposit"]]) == -1

    # mask and interpolate to calculate rolling stats
    masked = df["deposit"].mask(df["anomaly"])
    interpolated = masked.interpolate(method="linear")
    # df["mean"] = interpolated.rolling(3, center=True).mean()
    # df["std"] = interpolated.rolling(3, center=True).std()
    df["mean"] = interpolated.ewm(span=6, adjust=False).mean()
    df["std"] = interpolated.ewm(span=6, adjust=False).std()
    df["upper"] = df["mean"] + 2 * df["std"]
    df["lower"] = df["mean"] - 2 * df["std"]

    df.fillna(0, inplace=True)
    df["timestamp"] = df["timestamp"].astype(str)

    latest = df.iloc[-1]

    return {
        "timestamp": latest["timestamp"],
        "deposit": latest["deposit"],
        "anomaly": bool(latest["anomaly"]),
        "mean": latest["mean"],
        "upper": latest["upper"],
        "lower": latest["lower"],
        "history": df.to_dict(orient="records")  # optional for visualization
    }
