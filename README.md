# Anomaly Detection App

A simple web app for detecting and visualizing anomalies (spikes and drops) in hourly traffic data using an Isolation Forest algorithm.

- **Backend:** FastAPI + scikit-learn  
- **Frontend:** React.js

---

## Features

- Detects anomalies (spikes and drops) using Isolation Forest
- REST API endpoint with configurable parameters (`spikes`, `drops`, `contamination`)
- React frontend to visualize results
- CORS enabled for seamless frontend-backend interaction

---

## Project Structure
```
.
├── backend/               # FastAPI server
│   ├── main.py
│   └── venv/              # Python virtual environment (ignored)
│
└── anomaly-frontend/      # React app
├── public/
└── src/
```

---

## Backend Setup (FastAPI)

### Requirements

- Python 3.7+
- pip (Python package installer)

### Windows Instructions

1. Open **Command Prompt** or **PowerShell**

2. Navigate to the backend folder:
   ```bash
   cd backend

3. Create and activate a virtual environment:

   ```bash
   python -m venv venv
   venv\Scripts\activate
   ```

4. Install dependencies:

   ```bash
   pip install fastapi uvicorn pandas numpy scikit-learn
   ```

5. Run the server:

   ```bash
   uvicorn main:app --reload
   ```

### Linux/macOS Instructions

1. Open a terminal

2. Navigate to the backend folder:

   ```bash
   cd backend
   ```

3. Create and activate a virtual environment:

   ```bash
   python3 -m venv venv
   source venv/bin/activate
   ```

4. Install dependencies:

   ```bash
   pip install fastapi uvicorn pandas numpy scikit-learn
   ```

5. Run the server:

   ```bash
   uvicorn main:app --reload
   ```

### API Endpoint

Your backend will be running at:

```
http://localhost:8000/data
```

Example request:

```
http://localhost:8000/data?spikes=2&drops=1&contamination=0.1
```

---

## Frontend Setup (React)

### Requirements

* Node.js and npm installed

### Instructions (Windows & Linux/macOS)

1. Open a new terminal

2. Navigate to the frontend folder:

   ```bash
   cd anomaly-frontend
   ```

3. Install dependencies:

   ```bash
   npm install
   ```

4. Start the frontend:

   ```bash
   npm start
   ```

React will launch in your browser at:

```
http://localhost:3000
```
