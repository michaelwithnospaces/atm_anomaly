import time
import requests
import random

while True:
    deposit = round(random.gauss(500, 50), 2)
    if random.random() < 0.1:
        deposit = round(deposit * random.choice([0.2, 3]), 2)

    try:
        response = requests.post("http://localhost:8000/live", json={"deposit": deposit})
        print(response.json())
    except:
        print("API not reachable")
    time.sleep(1)
