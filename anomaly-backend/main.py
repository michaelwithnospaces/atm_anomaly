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
# https://example.com/search?term=python&limit=10
def get_anomaly_data(spikes: int = Query(1, ge=0), drops: int = Query(1, ge=0), contamination: float = Query(1, ge=0)):
    # for testing consistency
    np.random.seed(69)

    # 24 "visits" (one per hour)
    # centered around 150 with a standard deviation of 20.
    visits = np.random.normal(150, 20, 24).astype(int) # normal gaussian distribution

    # inject a couple of anomalies
    # visits[8] = 300   # spike
    # visits[20] = 30   # drop

    timestamps = pd.date_range("2025-01-01", periods=24, freq='h')

    all_indices = np.arange(24)
    # array([ 0, 1, 2, 3, ..., 23 ])
    # this array represents the indices of the 24 data points.
    # indices are later used to randomly choose which data points will have spikes or drops injected

    # choses spikes+drops indices from all_indices
    chosen_indices = np.random.choice(all_indices, size=spikes + drops, replace=False)
    # if size is 5: array([4, 17, 8, 21, 13])

    spike_indices = chosen_indices[:spikes] # spikes non-inclusive
    drop_indices = chosen_indices[spikes:spikes + drops]

    for idx in spike_indices:
        visits[idx] = 300  # High spike
    for idx in drop_indices:
        visits[idx] = 30   # Low drop

    # a pandas DataFrame with the timestamps and visit counts
    df = pd.DataFrame({"timestamp": timestamps, "visits": visits})
    #             timestamp  visits
    # 0 2025-01-01 00:00:00     160
    # 1 2025-01-01 01:00:00     154
    # 2 2025-01-01 02:00:00     165
    # 3 2025-01-01 03:00:00     183
    # 4 2025-01-01 04:00:00     152


    # [100, 102, 98, 101, 99, 300]
    # picks a random number between the min and max (98 to 300) to split on
    #
    #    first split: pick 150
    #    [100, 102, 98, 101, 99] (go left)
    #    [300] (go right)
    #
    # 300 is isolated in just 1 step
    # keep building trees like this multiple times (each tree uses different random splits).

    # an isolation forest model on the visit data to find anomalies
    # unsupervised ML model learns the "normal pattern" and flags unusual data points or what we call anomolies
    # i think about X% of this data is weird. go find that much. isolation forest doesnt actually know how many points are weird
    # patterns from data without being told what the right answer is.
    model = IsolationForest(contamination=contamination)  # 10% of the data is weird

    # apply model: it returns -1 for anomaly, 1 for normal
    # give the model df[["visits"]] which is just the visit column, but fit_predict expects 2d input
    # [ 1,  1, -1,  1, -1 ] == -1 -> [False, False, True, False, True]
    # adds a new column called anomaly to the DataFrame
    df["anomaly"] = model.fit_predict(df[["visits"]]) == -1

    # anomalies become nan
    # df["visits"] is the original series of visit numbers
    # df["anomaly"] is a boolean Series
    masked_visits = df["visits"].mask(df["anomaly"])
    # [150, NaN, 140, NaN]

    # fills in the nan using linear interpolation
    interpolated_visits = masked_visits.interpolate(method="linear")

    # create 2 new columns
    # 3-hour rolling average and standard deviation
    # visualize what the "normal range" of traffic should look like
    # this is a moving window of size 3. it slides through the "visits" column, looking at 3 rows at a time.
    # first and last position nan
    df["mean"] = interpolated_visits.rolling(3, center=True).mean()
    df["std"] = interpolated_visits.rolling(3, center=True).std()

    # define the upper and lower bounds using 2 standard deviations from the mean
    # outside these bounds are considered unusual
    df["upper"] = df["mean"] + 2 * df["std"] # average value of visits near that hour
    df["lower"] = df["mean"] - 2 * df["std"] # how much visit numbers normally vary near that hour
 

    # replace nan with 0
    df.fillna(0, inplace=True)

    # convert timestamp to string for our friend json
    df["timestamp"] = df["timestamp"].astype(str)

    # convert the df into a list of dictionaries so it can be returned as json
    # orient="records" = “make each row a dictionary”
    return df.to_dict(orient="records")
